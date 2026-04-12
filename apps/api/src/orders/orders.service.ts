import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ArtworkStatus,
  DesignSessionStatus,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  ShipmentStatus,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';
import { buildProductionSku, summarizeCheckout } from '@printos/shared';

import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../common/prisma.service.js';
import type { CheckoutDto } from './dto/order.dto.js';
import { renderArtworkFiles } from './artwork-renderer.js';

function isOpenTaskStatus(status: TaskStatus) {
  return (
    status === TaskStatus.TODO ||
    status === TaskStatus.IN_PROGRESS ||
    status === TaskStatus.BLOCKED
  );
}

function isHighPriorityTask(priority: TaskPriority) {
  return priority === TaskPriority.HIGH || priority === TaskPriority.CRITICAL;
}

function isQuantityRuleMatch(
  quantity: number,
  minQuantity: number | null | undefined,
  maxQuantity: number | null | undefined,
) {
  const matchesMin = minQuantity == null || quantity >= minQuantity;
  const matchesMax = maxQuantity == null || quantity <= maxQuantity;
  return matchesMin && matchesMax;
}

export interface CreateOrderDto {
  customerId?: string;
  shippingMethod: string;
  shippingAddress?: Record<string, unknown>;
  customerNotes?: string;
  items: Array<{
    productId: string;
    variantId?: string;
    designSessionId?: string;
    quantity: number;
    unitPrice: number;
    areaWidthCm?: number;
    areaHeightCm?: number;
    areaSquareMeters?: number;
    personalizationMultiplier?: number;
    configuration?: Record<string, unknown>;
  }>;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateOrderDto) {
    if (!dto.items?.length) {
      throw new BadRequestException('El pedido debe tener al menos un item');
    }

    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sku: true, name: true },
    });
    const productsById = new Map(products.map((p) => [p.id, p]));

    for (const productId of productIds) {
      if (!productsById.has(productId)) {
        throw new NotFoundException(`Producto ${productId} no encontrado`);
      }
    }

    const lineTotals = dto.items.map((item) => item.unitPrice * item.quantity);
    const { subtotal, tax, total } = summarizeCheckout(lineTotals);
    const now = new Date();
    const orderNumber = `PED-${now.getFullYear()}-${String(Date.now()).slice(-6)}`;

    const order = await this.prisma.order.create({
      data: {
        customerId: dto.customerId ?? null,
        orderNumber,
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        subtotal,
        tax,
        total,
        shippingMethod: dto.shippingMethod,
        shippingAddress: (dto.shippingAddress ?? {}) as any,
        customerNotes: dto.customerNotes ?? null,
        placedAt: now,
        checkoutSnapshot: { items: dto.items } as any,
        items: {
          create: dto.items.map((item, index) => {
            const product = productsById.get(item.productId)!;
            return {
              productId: item.productId,
              variantId: item.variantId ?? null,
              designSessionId: item.designSessionId ?? null,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              areaWidthCm: item.areaWidthCm ?? null,
              areaHeightCm: item.areaHeightCm ?? null,
              areaSquareMeters: item.areaSquareMeters ?? null,
              personalizationMultiplier: item.personalizationMultiplier ?? null,
              productionSku: buildProductionSku(product.sku, index, now),
              configuration: (item.configuration ?? {}) as any,
              lineTotal: item.unitPrice * item.quantity,
            };
          }),
        },
      },
      include: { items: true },
    });

    // Generate artwork files for design sessions
    for (const item of order.items) {
      if (!item.designSessionId) continue;

      const session = await this.prisma.designSession.findUnique({
        where: { id: item.designSessionId },
        select: { id: true, canvasJson: true },
      });
      const product = productsById.get(item.productId);
      if (!session || !product) continue;

      try {
        const artworkFiles = await renderArtworkFiles({
          productionSku: item.productionSku,
          orderNumber,
          productName: product.name,
          canvasJson: session.canvasJson,
        });

        await this.prisma.artwork.create({
          data: {
            productId: item.productId,
            designSessionId: item.designSessionId,
            orderItemId: item.id,
            status: ArtworkStatus.READY,
            fileUrl: artworkFiles.fileUrl,
            thumbnailUrl: artworkFiles.thumbnailUrl,
            outputFormat: artworkFiles.outputFormat,
            widthPx: artworkFiles.widthPx,
            heightPx: artworkFiles.heightPx,
            dpi: artworkFiles.dpi,
            productionNotes: `Orden ${orderNumber}`,
            metadata: { productionSku: item.productionSku } as any,
          },
        });

        await this.prisma.designSession.update({
          where: { id: item.designSessionId },
          data: { status: DesignSessionStatus.ORDERED },
        });
      } catch (err) {
        console.error(`Error generating artwork for item ${item.id}:`, err);
      }
    }

    await this.audit.log({
      actorUserId: dto.customerId,
      entityType: 'Order',
      entityId: order.id,
      action: 'order.created',
      orderId: order.id,
      metadata: { orderNumber, total },
    });

    return order;
  }

  async checkout(dto: CheckoutDto) {
    const order = await this.create({
      customerId: dto.customerId,
      shippingMethod: dto.shippingMethod ?? 'pickup',
      shippingAddress: (dto.shippingAddress ?? dto.billingAddress ?? {}) as Record<
        string,
        unknown
      >,
      customerNotes: dto.customerNotes,
      items: dto.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        designSessionId: item.designSessionId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        areaWidthCm: item.widthMeters ? Math.round(item.widthMeters * 100) : undefined,
        areaHeightCm: item.heightMeters ? Math.round(item.heightMeters * 100) : undefined,
        areaSquareMeters:
          item.widthMeters && item.heightMeters
            ? Number((item.widthMeters * item.heightMeters).toFixed(2))
            : undefined,
        configuration: {
          ...(item.configuration ?? {}),
          surfaces: item.surfaces ?? null,
          paymentProvider: dto.paymentProvider,
        },
      })),
    });

    return this.confirmPayment(order.id);
  }

  async findAll(customerId?: string) {
    return this.prisma.order.findMany({
      where: customerId ? { customerId } : undefined,
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        items: { select: { productionSku: true, quantity: true, lineTotal: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } },
            artwork: true,
          },
        },
        payments: true,
        shipment: true,
      },
    });
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async getProductionQueue() {
    const now = new Date();
    const orders = await this.prisma.order.findMany({
      where: {
        status: {
          in: [
            OrderStatus.PAID,
            OrderStatus.IN_PRODUCTION,
            OrderStatus.READY,
            OrderStatus.SHIPPED,
            OrderStatus.INCIDENT,
          ],
        },
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        shipment: true,
        tasks: {
          include: {
            assignedTo: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        },
        items: {
          include: {
            product: {
              include: {
                pricingRules: {
                  where: { active: true },
                  orderBy: [{ minQuantity: 'asc' }, { createdAt: 'asc' }],
                },
              },
            },
            artwork: {
              select: {
                fileUrl: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    type ProductionQueueOrder = (typeof orders)[number];
    type ProductionQueueItem = ProductionQueueOrder['items'][number];

    const estimateItemCost = (item: ProductionQueueItem) => {
      const matchingRule = item.product.pricingRules.find((rule) =>
        isQuantityRuleMatch(item.quantity, rule.minQuantity, rule.maxQuantity),
      );

      if (!matchingRule) return 0;

      if (matchingRule.pricingModel === 'UNIT' && matchingRule.estimatedUnitCost) {
        return this.toNumber(matchingRule.estimatedUnitCost) * item.quantity;
      }

      if (
        matchingRule.pricingModel === 'AREA' &&
        matchingRule.estimatedCostPerSquareMeter &&
        item.areaSquareMeters
      ) {
        return this.toNumber(matchingRule.estimatedCostPerSquareMeter) * this.toNumber(item.areaSquareMeters);
      }

      return 0;
    };

    return orders.map((order: ProductionQueueOrder) => {
      const baseDate = order.paidAt ?? order.placedAt ?? order.createdAt;
      const ageHours = Math.max(
        1,
        Math.round((now.getTime() - baseDate.getTime()) / (1000 * 60 * 60)),
      );
      const openTasks = order.tasks.filter((task) => isOpenTaskStatus(task.status));
      const blockedTasks = openTasks.filter((task) => task.status === TaskStatus.BLOCKED).length;
      const overdueTasks = openTasks.filter(
        (task) => task.dueDate && task.dueDate.getTime() < now.getTime(),
      ).length;
      const highPriorityTasks = openTasks.filter((task) => isHighPriorityTask(task.priority)).length;
      const artworkReady = order.items.filter(
        (item) => item.artwork?.status === ArtworkStatus.READY,
      ).length;
      const artworkMissing = order.items.filter((item) => !item.artwork?.fileUrl).length;
      const shipmentStatus =
        order.shipment?.status ??
        (order.shippingMethod?.toLowerCase().includes('retiro') ? 'PICKUP' : 'PENDING');
      const storedActualCost = this.readOrderNumericField(order, 'actualCost');
      const fallbackActualCost =
        this.readOrderNumericField(order, 'materialCost') +
        this.readOrderNumericField(order, 'laborCost') +
        this.readOrderNumericField(order, 'shippingCost') +
        this.readOrderNumericField(order, 'overheadCost');
      const estimatedItemCost = order.items.reduce((sum, item) => sum + estimateItemCost(item), 0);
      const actualCost =
        storedActualCost > 0
          ? storedActualCost
          : fallbackActualCost > 0
            ? fallbackActualCost
            : Number(estimatedItemCost.toFixed(2));
      const revenue = this.toNumber(order.total);
      const grossProfit = Number((revenue - actualCost).toFixed(2));
      const marginPct = revenue > 0 ? Number((((revenue - actualCost) / revenue) * 100).toFixed(1)) : 0;
      const dispatchReady =
        order.status === OrderStatus.READY &&
        blockedTasks === 0 &&
        artworkMissing === 0 &&
        shipmentStatus !== ShipmentStatus.DISPATCHED &&
        shipmentStatus !== ShipmentStatus.DELIVERED;

      const operationalRisk =
        order.status === OrderStatus.INCIDENT ||
        shipmentStatus === ShipmentStatus.INCIDENT ||
        blockedTasks > 0 ||
        overdueTasks > 0
          ? 'HIGH'
          : artworkMissing > 0 ||
              (order.status === OrderStatus.IN_PRODUCTION && ageHours >= 48) ||
              (order.status === OrderStatus.READY &&
                shipmentStatus !== 'PICKUP' &&
                shipmentStatus !== ShipmentStatus.DISPATCHED &&
                shipmentStatus !== ShipmentStatus.DELIVERED)
            ? 'MEDIUM'
            : 'LOW';

      const nextAction =
        blockedTasks > 0
          ? 'Resolver tarea bloqueada'
          : artworkMissing > 0
            ? 'Completar arte faltante'
            : order.status === OrderStatus.READY && shipmentStatus === ShipmentStatus.PENDING
              ? 'Despachar pedido'
              : order.status === OrderStatus.SHIPPED &&
                  order.shipment &&
                  !order.shipment.trackingNumber
                ? 'Registrar tracking'
                : order.status === OrderStatus.PAID
                  ? 'Iniciar produccion'
                  : 'Monitoreo operativo';

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        operationalRisk,
        nextAction,
        placedAt: order.placedAt?.toISOString() ?? null,
        paidAt: order.paidAt?.toISOString() ?? null,
        ageHours,
        shippingMethod: order.shippingMethod ?? null,
        customer: order.customer
          ? `${order.customer.firstName} ${order.customer.lastName}`
          : 'Cliente sin perfil',
        shipment: order.shipment
          ? {
              status: order.shipment.status,
              carrier: order.shipment.carrier,
              trackingNumber: order.shipment.trackingNumber,
              estimatedDelivery: order.shipment.estimatedDelivery?.toISOString() ?? null,
              shippedAt: order.shipment.shippedAt?.toISOString() ?? null,
            }
          : null,
        financials: {
          revenue,
          actualCost,
          grossProfit,
          marginPct,
          materialCost: this.readOrderNumericField(order, 'materialCost'),
          laborCost: this.readOrderNumericField(order, 'laborCost'),
          shippingCost: this.readOrderNumericField(order, 'shippingCost'),
          overheadCost: this.readOrderNumericField(order, 'overheadCost'),
        },
        dispatch: {
          ready: dispatchReady,
          hasTracking: Boolean(order.shipment?.trackingNumber),
          status: shipmentStatus,
        },
        tasksSummary: {
          total: openTasks.length,
          blocked: blockedTasks,
          overdue: overdueTasks,
          highPriority: highPriorityTasks,
        },
        recentTasks: order.tasks.slice(0, 3).map((task) => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate?.toISOString() ?? null,
          assignedTo: task.assignedTo
            ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
            : null,
        })),
        artworkSummary: {
          total: order.items.length,
          ready: artworkReady,
          missing: artworkMissing,
        },
        items: order.items.map((item: ProductionQueueItem) => ({
          id: item.id,
          productName: item.product.name,
          productionSku: item.productionSku,
          quantity: item.quantity,
          lineTotal: Number(item.lineTotal),
          artworkUrl: item.artwork?.fileUrl ?? null,
          artworkStatus: item.artwork?.status ?? null,
        })),
      };
    });
  }

  async updateStatus(id: string, status: string, actorId?: string) {
    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: status as any },
    });

    await this.audit.log({
      actorUserId: actorId,
      entityType: 'Order',
      entityId: id,
      action: 'order.status_updated',
      orderId: id,
      metadata: { newStatus: status },
    });

    return updated;
  }

  async confirmPayment(id: string, actorId?: string) {
    const order = await this.prisma.order.findUniqueOrThrow({ where: { id } });

    await this.prisma.payment.create({
      data: {
        orderId: id,
        amount: order.total,
        provider: PaymentProvider.MANUAL,
        method: 'manual',
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      },
    });

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.IN_PRODUCTION, paymentStatus: PaymentStatus.PAID },
    });

    await this.audit.log({
      actorUserId: actorId,
      entityType: 'Order',
      entityId: id,
      action: 'order.payment_confirmed',
      orderId: id,
    });

    return updated;
  }

  private readOrderNumericField(
    order: unknown,
    field: 'actualCost' | 'materialCost' | 'laborCost' | 'shippingCost' | 'overheadCost',
  ) {
    if (!order || typeof order !== 'object') {
      return 0;
    }

    return this.toNumber((order as Record<string, unknown>)[field]);
  }

  private toNumber(value: unknown) {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value) || 0;
    if (typeof value === 'object' && 'toString' in value && typeof value.toString === 'function') {
      return Number(value.toString()) || 0;
    }

    return 0;
  }
}
