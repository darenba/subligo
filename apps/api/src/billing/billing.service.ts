import { Injectable } from '@nestjs/common';
import { InvoiceStatus, PaymentStatus, type Prisma } from '@prisma/client';

import { AuditService } from '../audit/audit.service.js';
import { PrismaService } from '../common/prisma.service.js';

type BillingInvoiceRecord = Prisma.InvoiceGetPayload<{
  include: {
    order: {
      include: {
        customer: true;
        payments: true;
      };
    };
  };
}>;

type BillingReadyOrder = Prisma.OrderGetPayload<{
  include: {
    customer: true;
    payments: true;
    invoices: true;
  };
}>;

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getOverview(days = 30) {
    const safeDays = this.normalizeLimit(days, 180);
    const periodStart = new Date();
    periodStart.setHours(0, 0, 0, 0);
    periodStart.setDate(periodStart.getDate() - (safeDays - 1));

    const [recentInvoices, readyOrders] = await Promise.all([
      this.prisma.invoice.findMany({
        where: {
          OR: [{ issuedAt: { gte: periodStart } }, { createdAt: { gte: periodStart } }],
        },
        include: {
          order: {
            include: {
              customer: true,
              payments: {
                orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
              },
            },
          },
        },
        orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
        take: 40,
      }),
      this.findBillingReadyOrders(periodStart),
    ]);

    const summary = {
      readyToIssue: readyOrders.length,
      issued: 0,
      sent: 0,
      paid: 0,
      cancelled: 0,
      billedTotal: 0,
      electronicReady: 0,
      pendingSend: 0,
    };

    const byStatusMap = new Map<
      InvoiceStatus,
      {
        status: InvoiceStatus;
        count: number;
        total: number;
      }
    >();

    for (const invoice of recentInvoices) {
      const total = this.toNumber(invoice.total);
      const bucket = byStatusMap.get(invoice.status) ?? {
        status: invoice.status,
        count: 0,
        total: 0,
      };

      bucket.count += 1;
      bucket.total += total;
      byStatusMap.set(invoice.status, bucket);

      if (invoice.status !== InvoiceStatus.CANCELLED) {
        summary.billedTotal += total;
      }

      if (invoice.status === InvoiceStatus.ISSUED) {
        summary.issued += 1;
        summary.pendingSend += 1;
      } else if (invoice.status === InvoiceStatus.SENT) {
        summary.sent += 1;
      } else if (invoice.status === InvoiceStatus.PAID) {
        summary.paid += 1;
      } else if (invoice.status === InvoiceStatus.CANCELLED) {
        summary.cancelled += 1;
      }

      if (
        invoice.status !== InvoiceStatus.CANCELLED &&
        invoice.authorizationCode &&
        invoice.xmlUrl &&
        invoice.pdfUrl
      ) {
        summary.electronicReady += 1;
      }
    }

    return {
      summary: {
        ...summary,
        billedTotal: Number(summary.billedTotal.toFixed(2)),
      },
      byStatus: Array.from(byStatusMap.values())
        .map((item) => ({
          ...item,
          total: Number(item.total.toFixed(2)),
        }))
        .sort((left, right) => right.total - left.total),
      readyOrders: readyOrders.slice(0, 20).map((order) => this.toReadyOrderView(order)),
      invoices: recentInvoices.map((invoice) => this.toInvoiceView(invoice)),
    };
  }

  async listInvoices(limit = 30, status?: string) {
    const take = this.normalizeLimit(limit, 100);
    const invoiceStatus =
      status && Object.values(InvoiceStatus).includes(status as InvoiceStatus)
        ? (status as InvoiceStatus)
        : undefined;

    const invoices = await this.prisma.invoice.findMany({
      where: invoiceStatus ? { status: invoiceStatus } : undefined,
      include: {
        order: {
          include: {
            customer: true,
            payments: {
              orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
            },
          },
        },
      },
      orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
      take,
    });

    return invoices.map((invoice) => this.toInvoiceView(invoice));
  }

  async issueReadyInvoices(actorUserId?: string) {
    const readyOrders = await this.findBillingReadyOrders();
    const createdInvoices: Array<{
      id: string;
      invoiceNumber: string;
      orderNumber: string;
      status: InvoiceStatus;
    }> = [];

    for (const order of readyOrders) {
      const invoiceBaseDate = order.paidAt ?? order.createdAt;
      const invoiceNumber = await this.getNextInvoiceNumber(invoiceBaseDate);
      const billingSource = this.resolveBillingSource(order);
      const customerName = this.getCustomerName(order);
      const customerTaxId = this.readBillingValue(billingSource, ['taxId', 'rtn', 'idNumber']);
      const customerEmail =
        this.readBillingValue(billingSource, ['email']) ?? order.customer?.email ?? null;

      const created = await this.prisma.invoice.create({
        data: {
          tenantId: order.tenantId,
          orderId: order.id,
          invoiceNumber,
          status: InvoiceStatus.ISSUED,
          documentType: 'FACTURA_ELECTRONICA_HN',
          series: `SUB-${this.getInvoiceYear(invoiceBaseDate)}`,
          authorizationCode: `CAI-${invoiceNumber.replace('FE-', '')}`,
          customerName,
          customerEmail,
          customerTaxId,
          billingSnapshot: billingSource as Prisma.InputJsonValue,
          subtotal: order.subtotal,
          tax: order.tax,
          total: order.total,
          currency: 'HNL',
          issuedAt: new Date(),
          xmlUrl: `/files/invoices/${invoiceNumber}.xml`,
          pdfUrl: `/files/invoices/${invoiceNumber}.pdf`,
          notes: 'Emitida desde panel de facturacion.',
        },
      });

      await this.audit.log({
        actorUserId,
        entityType: 'Invoice',
        entityId: created.id,
        action: 'invoice.issued',
        orderId: order.id,
        metadata: {
          invoiceNumber,
          orderNumber: order.orderNumber,
          status: created.status,
        },
      });

      createdInvoices.push({
        id: created.id,
        invoiceNumber,
        orderNumber: order.orderNumber,
        status: created.status,
      });
    }

    return {
      issued: createdInvoices.length,
      createdInvoices,
      message:
        createdInvoices.length > 0
          ? `Se emitieron ${createdInvoices.length} factura(s).`
          : 'No habia ordenes listas para facturar.',
    };
  }

  async sendPendingInvoices(actorUserId?: string) {
    const pendingInvoices = await this.prisma.invoice.findMany({
      where: { status: InvoiceStatus.ISSUED },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
      },
      orderBy: [{ issuedAt: 'asc' }, { createdAt: 'asc' }],
    });

    const sentInvoices: Array<{
      id: string;
      invoiceNumber: string;
      orderNumber: string;
      status: InvoiceStatus;
    }> = [];

    for (const invoice of pendingInvoices) {
      const updated = await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.SENT,
          sentAt: new Date(),
          notes: invoice.notes
            ? `${invoice.notes} Enviada a cliente desde panel ERP.`
            : 'Enviada a cliente desde panel ERP.',
        },
      });

      await this.audit.log({
        actorUserId,
        entityType: 'Invoice',
        entityId: updated.id,
        action: 'invoice.sent',
        orderId: invoice.orderId,
        metadata: {
          invoiceNumber: updated.invoiceNumber,
          orderNumber: invoice.order.orderNumber,
          status: updated.status,
        },
      });

      sentInvoices.push({
        id: updated.id,
        invoiceNumber: updated.invoiceNumber,
        orderNumber: invoice.order.orderNumber,
        status: updated.status,
      });
    }

    return {
      sent: sentInvoices.length,
      invoices: sentInvoices,
      message:
        sentInvoices.length > 0
          ? `Se enviaron ${sentInvoices.length} factura(s) pendientes.`
          : 'No habia facturas pendientes de envio.',
    };
  }

  async findBillingReadyOrders(periodStart?: Date): Promise<BillingReadyOrder[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        paymentStatus: PaymentStatus.PAID,
        ...(periodStart
          ? {
              OR: [{ paidAt: { gte: periodStart } }, { createdAt: { gte: periodStart } }],
            }
          : {}),
      },
      include: {
        customer: true,
        payments: {
          orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
        },
        invoices: true,
      },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
    });

    return orders.filter((order) => {
      const hasActiveInvoice = order.invoices.some(
        (invoice) => invoice.status !== InvoiceStatus.CANCELLED,
      );
      return !hasActiveInvoice && this.isBillingReady(order);
    });
  }

  private isBillingReady(order: BillingReadyOrder): boolean {
    return Boolean(order.billingAddress) || Boolean(order.customer?.billingAddress) || Boolean(order.customer);
  }

  private resolveBillingSource(order: BillingReadyOrder): Prisma.JsonObject {
    const customerBilling = this.parseJsonObject(order.customer?.billingAddress);
    const orderBilling = this.parseJsonObject(order.billingAddress);
    const source: Prisma.JsonObject = {};

    if (customerBilling) {
      Object.assign(source, customerBilling);
    }

    if (orderBilling) {
      Object.assign(source, orderBilling);
    }

    source.customerName = this.getCustomerName(order);
    source.email =
      this.readBillingValue(orderBilling, ['email']) ??
      this.readBillingValue(customerBilling, ['email']) ??
      order.customer?.email ??
      null;

    return source;
  }

  private toReadyOrderView(order: BillingReadyOrder) {
    const latestPayment = order.payments[0] ?? null;
    const billingSource = this.resolveBillingSource(order);
    const customerTaxId = this.readBillingValue(billingSource, ['taxId', 'rtn', 'idNumber']);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customer: this.getCustomerName(order),
      customerTaxId,
      total: this.toNumber(order.total),
      paidAt: order.paidAt?.toISOString() ?? null,
      paymentProvider: latestPayment?.provider ?? null,
      billingReady: true,
      reason: customerTaxId
        ? 'Pago confirmado con datos listos para emision.'
        : 'Pago confirmado; usar datos del cliente para emitir y completar RTN si aplica.',
    };
  }

  private toInvoiceView(invoice: BillingInvoiceRecord) {
    const latestPayment = invoice.order.payments[0] ?? null;

    return {
      id: invoice.id,
      orderId: invoice.orderId,
      orderNumber: invoice.order.orderNumber,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      customer: invoice.customerName,
      customerTaxId: invoice.customerTaxId,
      total: this.toNumber(invoice.total),
      issuedAt: invoice.issuedAt?.toISOString() ?? null,
      sentAt: invoice.sentAt?.toISOString() ?? null,
      createdAt: invoice.createdAt.toISOString(),
      paymentProvider: latestPayment?.provider ?? null,
      authorizationCode: invoice.authorizationCode,
      xmlUrl: invoice.xmlUrl,
      pdfUrl: invoice.pdfUrl,
    };
  }

  private async getNextInvoiceNumber(baseDate: Date) {
    const year = this.getInvoiceYear(baseDate);
    const prefix = `FE-${year}-`;
    const latest = await this.prisma.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
      select: {
        invoiceNumber: true,
      },
    });

    const nextSequence = latest
      ? Number.parseInt(latest.invoiceNumber.slice(prefix.length), 10) + 1
      : 1;

    return `${prefix}${String(nextSequence).padStart(4, '0')}`;
  }

  private getInvoiceYear(baseDate: Date) {
    return baseDate.getFullYear();
  }

  private getCustomerName(order: BillingReadyOrder) {
    if (order.customer) {
      return `${order.customer.firstName} ${order.customer.lastName}`.trim();
    }

    return 'Cliente sin perfil';
  }

  private parseJsonObject(
    value: Prisma.JsonValue | Prisma.JsonObject | null | undefined,
  ): Prisma.JsonObject | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    return value as Prisma.JsonObject;
  }

  private readBillingValue(
    source: Prisma.JsonValue | Prisma.JsonObject | null | undefined,
    keys: string[],
  ): string | null {
    const object = this.parseJsonObject(source);

    if (!object) {
      return null;
    }

    for (const key of keys) {
      const value = object[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return null;
  }

  private normalizeLimit(value: number, max: number) {
    if (!Number.isFinite(value) || value <= 0) {
      return Math.min(30, max);
    }

    return Math.min(Math.floor(value), max);
  }

  private toNumber(value: Prisma.Decimal | number | null | undefined) {
    if (typeof value === 'number') {
      return value;
    }

    if (!value) {
      return 0;
    }

    return Number(value);
  }
}
