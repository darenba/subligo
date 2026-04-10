import { Injectable } from '@nestjs/common';
import {
  InvoiceStatus,
  LeadStage,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  TaskStatus,
  PricingModel,
  type CampaignChannel,
  type Prisma,
} from '@prisma/client';

import { PrismaService } from '../common/prisma.service.js';
import { OrdersService } from '../orders/orders.service.js';

type SalesTimelinePoint = {
  date: string;
  sales: number;
  orders: number;
};

type ProductFinanceSummary = {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  orders: number;
  revenue: number;
  actualCost: number;
  grossProfit: number;
  marginPct: number;
};

type AccountingTimelinePoint = {
  date: string;
  collected: number;
  pending: number;
  refunded: number;
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: OrdersService,
  ) {}

  async getSnapshot() {
    const [
      paidPayments,
      openLeads,
      delayedOrders,
      pricingRules,
      leadBoard,
      productionOrders,
      commercialIntelligence,
    ] = await Promise.all([
      this.prisma.payment.findMany({
        where: { status: PaymentStatus.PAID },
        select: { amount: true, paidAt: true, createdAt: true },
      }),
      this.prisma.lead.findMany({
        where: {
          stage: {
            notIn: [LeadStage.CLOSED_WON, LeadStage.CLOSED_LOST],
          },
        },
        select: { id: true },
      }),
      this.prisma.order.findMany({
        where: {
          status: {
            in: [OrderStatus.PAID, OrderStatus.IN_PRODUCTION, OrderStatus.INCIDENT],
          },
        },
        select: { id: true },
      }),
      this.prisma.productPricingRule.findMany({
        where: { active: true },
        select: {
          estimatedUnitCost: true,
          baseUnitPrice: true,
          estimatedCostPerSquareMeter: true,
          pricePerSquareMeter: true,
        },
      }),
      this.buildLeadBoard(),
      this.buildProductionOrders(),
      this.getCommercialIntelligence(),
    ]);

    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);

    const todayPayments = paidPayments.filter((payment) => {
      const paidAt = payment.paidAt ?? payment.createdAt;
      return paidAt >= startOfToday;
    });

    const salesToday = todayPayments.reduce((sum, payment) => sum + this.toNumber(payment.amount), 0);
    const lowestMarginRule = pricingRules
      .map((rule) => {
        if (rule.baseUnitPrice && rule.estimatedUnitCost) {
          const revenue = this.toNumber(rule.baseUnitPrice);
          const cost = this.toNumber(rule.estimatedUnitCost);
          return revenue > 0 ? ((revenue - cost) / revenue) * 100 : null;
        }

        if (rule.pricePerSquareMeter && rule.estimatedCostPerSquareMeter) {
          const revenue = this.toNumber(rule.pricePerSquareMeter);
          const cost = this.toNumber(rule.estimatedCostPerSquareMeter);
          return revenue > 0 ? ((revenue - cost) / revenue) * 100 : null;
        }

        return null;
      })
      .filter((value): value is number => typeof value === 'number')
      .sort((left, right) => left - right)[0];

    return {
      metrics: [
        {
          label: 'Ventas del dia',
          value: `L ${salesToday.toFixed(2)}`,
          hint: `${todayPayments.length} pago(s) confirmados hoy`,
        },
        {
          label: 'Leads abiertos',
          value: String(openLeads.length),
          hint: 'Leads sin cierre todavia',
        },
        {
          label: 'Pedidos retrasados',
          value: String(delayedOrders.length),
          hint: 'Pagados o en produccion que siguen abiertos',
        },
        {
          label: 'Margen mas bajo',
          value:
            typeof lowestMarginRule === 'number'
              ? `${lowestMarginRule.toFixed(1)}%`
              : 'Sin datos',
          hint: 'Referencia de pricing activa',
        },
      ],
      leadBoard,
      productionOrders,
      commercialMetrics: commercialIntelligence.metrics,
      campaignHighlights: commercialIntelligence.campaignHighlights,
      automationSummary: commercialIntelligence.automationSummary,
      contentCalendar: commercialIntelligence.contentCalendar,
      omnichannelSummary: commercialIntelligence.omnichannelSummary,
    };
  }

  async getCommercialIntelligence() {
    const [campaigns, automations, conversations, leads, paidOrders, calendarEntries] = await Promise.all([
      this.prisma.campaign.findMany({
        include: {
          performances: {
            orderBy: { date: 'desc' },
            take: 30,
          },
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: 8,
      }),
      this.prisma.automation.findMany({
        include: {
          _count: {
            select: { tasks: true },
          },
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: 8,
      }),
      this.prisma.conversation.findMany({
        select: { channel: true },
      }),
      this.prisma.lead.findMany({
        select: { stage: true, createdAt: true, convertedAt: true, quotedValue: true },
      }),
      this.prisma.order.findMany({
        where: { paymentStatus: PaymentStatus.PAID },
        select: { total: true, createdAt: true },
      }),
      this.prisma.contentCalendar.findMany({
        include: {
          campaign: {
            select: { name: true },
          },
        },
        orderBy: [{ publishAt: 'asc' }],
        take: 8,
      }),
    ]);

    const aggregatedCampaigns = campaigns.map((campaign) => {
      const metrics = campaign.performances.reduce(
        (acc, performance) => {
          acc.impressions += performance.impressions;
          acc.clicks += performance.clicks;
          acc.conversions += performance.conversions;
          acc.leads += performance.leads;
          acc.spend += this.toNumber(performance.spend);
          acc.revenue += this.toNumber(performance.revenue);
          return acc;
        },
        {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          leads: 0,
          spend: 0,
          revenue: 0,
        },
      );

      const ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
      const roas = metrics.spend > 0 ? metrics.revenue / metrics.spend : 0;
      const cpl = metrics.leads > 0 ? metrics.spend / metrics.leads : metrics.spend;

      return {
        id: campaign.id,
        name: campaign.name,
        channel: campaign.channel,
        status: campaign.status,
        budget: this.toNumber(campaign.budget),
        spent: this.toNumber(campaign.spent),
        roas,
        ctr,
        leads: metrics.leads,
        revenue: metrics.revenue,
        recommendation: this.recommendCampaign(campaign.channel, { ...metrics, ctr, roas, cpl }),
      };
    });

    const totalCampaignSpend = aggregatedCampaigns.reduce((sum, campaign) => sum + campaign.spent, 0);
    const totalCampaignRevenue = aggregatedCampaigns.reduce((sum, campaign) => sum + campaign.revenue, 0);
    const totalCampaignLeads = aggregatedCampaigns.reduce((sum, campaign) => sum + campaign.leads, 0);
    const paidOrdersCount = paidOrders.length;
    const totalPaidRevenue = paidOrders.reduce((sum, order) => sum + this.toNumber(order.total), 0);
    const closedWonCount = leads.filter((lead) => lead.stage === LeadStage.CLOSED_WON).length;
    const closeRate = leads.length > 0 ? (closedWonCount / leads.length) * 100 : 0;
    const cpl = totalCampaignLeads > 0 ? totalCampaignSpend / totalCampaignLeads : 0;
    const cac = paidOrdersCount > 0 ? totalCampaignSpend / paidOrdersCount : 0;
    const averageTicket = paidOrdersCount > 0 ? totalPaidRevenue / paidOrdersCount : 0;
    const roas = totalCampaignSpend > 0 ? totalCampaignRevenue / totalCampaignSpend : 0;

    const channelCounts = conversations.reduce<Record<string, number>>((acc, conversation) => {
      acc[conversation.channel] = (acc[conversation.channel] ?? 0) + 1;
      return acc;
    }, {});

    const channelSummary = Object.entries(channelCounts)
      .map(([channel, count]) => ({ channel, count }))
      .sort((left, right) => left.channel.localeCompare(right.channel));

    return {
      metrics: [
        {
          label: 'ROAS promedio',
          value: `${roas.toFixed(2)}x`,
          hint: 'Retorno de campanas activas e historicas',
        },
        {
          label: 'CPL estimado',
          value: totalCampaignLeads > 0 ? `L ${cpl.toFixed(2)}` : 'Sin leads',
          hint: `${totalCampaignLeads} lead(s) atribuidos a campanas`,
        },
        {
          label: 'CAC estimado',
          value: paidOrdersCount > 0 ? `L ${cac.toFixed(2)}` : 'Sin ordenes',
          hint: `${paidOrdersCount} orden(es) pagadas`,
        },
        {
          label: 'Tasa de cierre',
          value: `${closeRate.toFixed(1)}%`,
          hint: `${closedWonCount} lead(s) CLOSED_WON`,
        },
        {
          label: 'Ticket promedio',
          value: paidOrdersCount > 0 ? `L ${averageTicket.toFixed(2)}` : 'Sin tickets',
          hint: 'Promedio sobre ordenes pagadas',
        },
      ],
      campaignHighlights: aggregatedCampaigns,
      automationSummary: automations.map((automation) => ({
        id: automation.id,
        name: automation.name,
        status: automation.status,
        triggerType: automation.triggerType,
        riskLevel: automation.riskLevel,
        lastRunAt: automation.lastRunAt,
        tasksCount: automation._count.tasks,
      })),
      contentCalendar: calendarEntries.map((entry) => ({
        id: entry.id,
        channel: entry.channel,
        topic: entry.topic,
        status: entry.status,
        publishAt: entry.publishAt,
        campaignName: entry.campaign?.name ?? null,
      })),
      omnichannelSummary: {
        isReady: channelSummary.length >= 2,
        totalConversations: conversations.length,
        channels: channelSummary,
      },
    };
  }

  async getRecentActivity(limit = 20) {
    const take = this.normalizeLimit(limit, 50);
    const [auditLogs, tasks, runs] = await Promise.all([
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          createdAt: true,
          metadata: true,
        },
      }),
      this.prisma.task.findMany({
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      }),
      this.prisma.agentRun.findMany({
        orderBy: { createdAt: 'desc' },
        take,
        select: {
          id: true,
          agentName: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return [
      ...auditLogs.map((log) => ({
        id: `audit-${log.id}`,
        type: 'audit',
        title: log.action,
        subtitle: `${log.entityType} ${log.entityId}`,
        createdAt: log.createdAt,
        metadata: log.metadata,
      })),
      ...tasks.map((task) => ({
        id: `task-${task.id}`,
        type: 'task',
        title: task.title,
        subtitle: `${task.priority} - ${task.status}`,
        createdAt: task.createdAt,
      })),
      ...runs.map((run) => ({
        id: `run-${run.id}`,
        type: 'agent-run',
        title: run.agentName,
        subtitle: run.status,
        createdAt: run.createdAt,
      })),
    ]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, take);
  }

  async getSalesTimeline(days = 7): Promise<SalesTimelinePoint[]> {
    const safeDays = this.normalizeLimit(days, 90);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (safeDays - 1));

    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PAID,
        OR: [{ paidAt: { gte: start } }, { createdAt: { gte: start } }],
      },
      select: {
        amount: true,
        paidAt: true,
        createdAt: true,
      },
    });

    const buckets = new Map<string, SalesTimelinePoint>();
    for (let index = 0; index < safeDays; index += 1) {
      const bucketDate = new Date(start);
      bucketDate.setDate(start.getDate() + index);
      const key = this.toDateKey(bucketDate);
      buckets.set(key, { date: key, sales: 0, orders: 0 });
    }

    for (const payment of payments) {
      const date = payment.paidAt ?? payment.createdAt;
      const key = this.toDateKey(date);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.sales += this.toNumber(payment.amount);
      bucket.orders += 1;
    }

    return Array.from(buckets.values());
  }

  async getOperationsFinance(days = 30) {
    const safeDays = this.normalizeLimit(days, 90);
    const periodStart = new Date();
    periodStart.setHours(0, 0, 0, 0);
    periodStart.setDate(periodStart.getDate() - (safeDays - 1));

    const [orders, productionQueue] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          paymentStatus: PaymentStatus.PAID,
          OR: [{ paidAt: { gte: periodStart } }, { createdAt: { gte: periodStart } }],
        },
        include: {
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
            },
          },
          shipment: true,
        },
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.orders.getProductionQueue(),
    ]);

    const summary = orders.reduce(
      (acc, order) => {
        const revenue = this.toNumber(order.total);
        const actualCost = this.resolveOrderActualCost(order);
        acc.revenue += revenue;
        acc.actualCost += actualCost;
        acc.materialCost += this.readOrderNumericField(order, 'materialCost');
        acc.laborCost += this.readOrderNumericField(order, 'laborCost');
        acc.shippingCost += this.readOrderNumericField(order, 'shippingCost');
        acc.overheadCost += this.readOrderNumericField(order, 'overheadCost');
        acc.orders += 1;
        return acc;
      },
      {
        revenue: 0,
        actualCost: 0,
        materialCost: 0,
        laborCost: 0,
        shippingCost: 0,
        overheadCost: 0,
        orders: 0,
      },
    );

    const grossProfit = Number((summary.revenue - summary.actualCost).toFixed(2));
    const marginPct =
      summary.revenue > 0 ? Number((((summary.revenue - summary.actualCost) / summary.revenue) * 100).toFixed(1)) : 0;

    const byProductMap = new Map<string, ProductFinanceSummary>();
    for (const order of orders) {
      const orderRevenue = this.toNumber(order.total);
      const orderActualCost = this.resolveOrderActualCost(order);
      const itemsRevenue = order.items.reduce(
        (sum: number, item) => sum + this.toNumber(item.lineTotal),
        0,
      );

      for (const item of order.items) {
        const itemRevenue = this.toNumber(item.lineTotal);
        const fallbackCost = this.estimateOrderItemCost(item);
        const allocatedCost =
          orderActualCost > 0 && orderRevenue > 0
            ? Number(((itemRevenue / Math.max(itemsRevenue || orderRevenue, 1)) * orderActualCost).toFixed(2))
            : Number(fallbackCost.toFixed(2));

        const current =
          byProductMap.get(item.productId) ??
          {
            productId: item.productId,
            productName: item.product.name,
            sku: item.product.sku,
            quantity: 0,
            orders: 0,
            revenue: 0,
            actualCost: 0,
            grossProfit: 0,
            marginPct: 0,
          };

        current.quantity += item.quantity;
        current.orders += 1;
        current.revenue += itemRevenue;
        current.actualCost += allocatedCost;
        current.grossProfit += itemRevenue - allocatedCost;
        current.marginPct =
          current.revenue > 0
            ? Number((((current.revenue - current.actualCost) / current.revenue) * 100).toFixed(1))
            : 0;
        byProductMap.set(item.productId, current);
      }
    }

    const timeline = this.buildRevenueTimeline(orders, periodStart, safeDays);
    const recentWindow = timeline.slice(-Math.min(7, timeline.length));
    const avgRevenue =
      recentWindow.length > 0
        ? recentWindow.reduce((sum: number, point) => sum + point.sales, 0) / recentWindow.length
        : 0;
    const avgOrders =
      recentWindow.length > 0
        ? recentWindow.reduce((sum: number, point) => sum + point.orders, 0) / recentWindow.length
        : 0;

    const forecast = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + index + 1);
      return {
        date: this.toDateKey(date),
        projectedRevenue: Number(avgRevenue.toFixed(2)),
        projectedOrders: Number(avgOrders.toFixed(1)),
      };
    });

    const dispatchSummary = {
      operationalOrders: productionQueue.length,
      readyToDispatch: productionQueue.filter((order) => order.dispatch.ready).length,
      withTracking: productionQueue.filter((order) => order.dispatch.hasTracking).length,
      highRisk: productionQueue.filter((order) => order.operationalRisk === 'HIGH').length,
    };

    return {
      summary: {
        revenue: Number(summary.revenue.toFixed(2)),
        actualCost: Number(summary.actualCost.toFixed(2)),
        grossProfit,
        marginPct,
        materialCost: Number(summary.materialCost.toFixed(2)),
        laborCost: Number(summary.laborCost.toFixed(2)),
        shippingCost: Number(summary.shippingCost.toFixed(2)),
        overheadCost: Number(summary.overheadCost.toFixed(2)),
        orders: summary.orders,
      },
      byProduct: Array.from(byProductMap.values()).sort((left, right) => right.revenue - left.revenue),
      timeline,
      forecast,
      dispatchSummary,
    };
  }

  async getAccountingOverview(days = 30) {
    const safeDays = this.normalizeLimit(days, 90);
    const periodStart = new Date();
    periodStart.setHours(0, 0, 0, 0);
    periodStart.setDate(periodStart.getDate() - (safeDays - 1));

    const [payments, paidOrders] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          OR: [{ paidAt: { gte: periodStart } }, { createdAt: { gte: periodStart } }],
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              total: true,
              paymentStatus: true,
              billingAddress: true,
              paidAt: true,
              createdAt: true,
              customer: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.order.findMany({
        where: {
          paymentStatus: PaymentStatus.PAID,
          OR: [{ paidAt: { gte: periodStart } }, { createdAt: { gte: periodStart } }],
        },
        include: {
          payments: {
            orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
          },
          customer: {
            select: {
              billingAddress: true,
              firstName: true,
              lastName: true,
            },
          },
          invoices: true,
        },
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    const providerMap = new Map<
      string,
      {
        provider: string;
        payments: number;
        collected: number;
        pending: number;
        refunded: number;
        reconciliationNeeded: number;
      }
    >();

    const summary = {
      collectedPaid: 0,
      pendingCollection: 0,
      refundedAmount: 0,
      reconciliationNeeded: 0,
      invoiceReady: 0,
      autoReconciled: 0,
    };

    const reconciliationQueue = payments
      .map((payment) => {
        const amount = this.toNumber(payment.amount);
        const provider = payment.provider;
        const status = payment.status;

        if (status === PaymentStatus.PAID) {
          summary.collectedPaid += amount;
        } else if (status === PaymentStatus.PENDING || status === PaymentStatus.AUTHORIZED) {
          summary.pendingCollection += amount;
        } else if (status === PaymentStatus.REFUNDED) {
          summary.refundedAmount += amount;
        }

        const requiresReconciliation =
          status !== PaymentStatus.PAID ||
          provider === PaymentProvider.MANUAL ||
          provider === PaymentProvider.BANK_TRANSFER ||
          provider === PaymentProvider.CASH ||
          !payment.transactionId;

        if (requiresReconciliation) {
          summary.reconciliationNeeded += 1;
        } else {
          summary.autoReconciled += 1;
        }

        const providerBucket =
          providerMap.get(provider) ??
          {
            provider,
            payments: 0,
            collected: 0,
            pending: 0,
            refunded: 0,
            reconciliationNeeded: 0,
          };

        providerBucket.payments += 1;
        if (status === PaymentStatus.PAID) {
          providerBucket.collected += amount;
        } else if (status === PaymentStatus.PENDING || status === PaymentStatus.AUTHORIZED) {
          providerBucket.pending += amount;
        } else if (status === PaymentStatus.REFUNDED) {
          providerBucket.refunded += amount;
        }
        if (requiresReconciliation) {
          providerBucket.reconciliationNeeded += 1;
        }
        providerMap.set(provider, providerBucket);

        if (!requiresReconciliation) {
          return null;
        }

        return {
          paymentId: payment.id,
          orderId: payment.orderId,
          orderNumber: payment.order.orderNumber,
          customer: this.getCustomerDisplayName(payment.order.customer),
          provider,
          method: payment.method,
          status,
          amount,
          paidAt: payment.paidAt,
          transactionId: payment.transactionId,
          reason: this.describeReconciliationReason(payment.provider, payment.status, payment.transactionId),
          recommendedAction: this.describeReconciliationAction(
            payment.provider,
            payment.status,
            payment.transactionId,
          ),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .slice(0, 12);

    const invoiceQueue = paidOrders
      .filter((order) => !order.invoices.some((invoice) => invoice.status !== InvoiceStatus.CANCELLED))
      .slice(0, 12)
      .map((order) => {
      const billingReady =
        Boolean(order.billingAddress) || Boolean(order.customer?.billingAddress) || Boolean(order.customer);
      const latestPayment = order.payments[0] ?? null;

      if (billingReady) {
        summary.invoiceReady += 1;
      }

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customer: this.getCustomerDisplayName(order.customer),
        total: this.toNumber(order.total),
        paidAt: order.paidAt,
        paymentProvider: latestPayment?.provider ?? null,
        billingReady,
        reason: billingReady
          ? 'Lista para emitir documento comercial.'
          : 'Faltan datos de facturacion para emitir documento.',
      };
    });

    return {
      summary,
      byProvider: Array.from(providerMap.values()).sort((left, right) => right.collected - left.collected),
      reconciliationQueue,
      invoiceQueue,
      collectionTimeline: this.buildCollectionTimeline(payments, periodStart, safeDays),
    };
  }

  private async buildLeadBoard() {
    const stages = Object.values(LeadStage);
    const grouped = await Promise.all(
      stages.map(async (stage) => {
        const leads = await this.prisma.lead.findMany({
          where: { stage },
          select: { quotedValue: true },
        });

        return {
          stage,
          count: leads.length,
          totalValue: Number(
            leads
              .reduce((sum, lead) => sum + this.toNumber(lead.quotedValue), 0)
              .toFixed(2),
          ),
        };
      }),
    );

    return grouped;
  }

  private async buildProductionOrders() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: {
          in: [OrderStatus.PAID, OrderStatus.IN_PRODUCTION, OrderStatus.READY, OrderStatus.INCIDENT],
        },
      },
      include: {
        customer: {
          select: { firstName: true, lastName: true },
        },
        items: {
          include: {
            artwork: {
              select: { fileUrl: true },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: 6,
    });

    return orders.map((order) => {
      const firstItem = order.items[0];
      const customerName =
        [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ') || 'Cliente sin nombre';

      return {
        orderNumber: order.orderNumber,
        customer: customerName,
        status: order.status,
        sku: firstItem?.productionSku ?? 'Sin SKU',
        artworkUrl: firstItem?.artwork?.fileUrl ?? null,
      };
    });
  }

  private recommendCampaign(
    channel: CampaignChannel,
    metrics: {
      impressions: number;
      clicks: number;
      conversions: number;
      leads: number;
      spend: number;
      revenue: number;
      ctr: number;
      roas: number;
      cpl: number;
    },
  ) {
    const channelLabel = channel.toLowerCase();

    if (metrics.spend >= 1200 && metrics.conversions === 0) {
      return `Revisar oferta y creativo en ${channelLabel}; esta gastando sin convertir.`;
    }

    if (metrics.roas >= 3 && metrics.conversions >= 2) {
      return `Puede escalar presupuesto en ${channelLabel} de forma gradual.`;
    }

    if (metrics.impressions >= 2500 && metrics.ctr < 0.9) {
      return `Hay desgaste creativo en ${channelLabel}; conviene probar otra pieza.`;
    }

    return `Mantener monitoreo en ${channelLabel} y volver a medir con mas datos.`;
  }

  private normalizeLimit(value: unknown, max = 20) {
    const parsed = Number(value ?? 10);
    if (!Number.isFinite(parsed)) return 10;
    return Math.max(1, Math.min(max, Math.round(parsed)));
  }

  private toDateKey(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private buildCollectionTimeline(
    payments: Array<{
      amount: Prisma.Decimal;
      status: PaymentStatus;
      paidAt: Date | null;
      createdAt: Date;
    }>,
    start: Date,
    days: number,
  ) {
    const buckets = new Map<string, AccountingTimelinePoint>();
    for (let index = 0; index < days; index += 1) {
      const bucketDate = new Date(start);
      bucketDate.setDate(start.getDate() + index);
      const key = this.toDateKey(bucketDate);
      buckets.set(key, { date: key, collected: 0, pending: 0, refunded: 0 });
    }

    for (const payment of payments) {
      const date = payment.paidAt ?? payment.createdAt;
      const key = this.toDateKey(date);
      const bucket = buckets.get(key);
      if (!bucket) continue;

      const amount = this.toNumber(payment.amount);
      if (payment.status === PaymentStatus.PAID) {
        bucket.collected += amount;
      } else if (payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.AUTHORIZED) {
        bucket.pending += amount;
      } else if (payment.status === PaymentStatus.REFUNDED) {
        bucket.refunded += amount;
      }
    }

    return Array.from(buckets.values());
  }

  private buildRevenueTimeline(
    orders: Array<{
      total: Prisma.Decimal;
      paidAt: Date | null;
      createdAt: Date;
    }>,
    start: Date,
    days: number,
  ) {
    const buckets = new Map<string, SalesTimelinePoint>();
    for (let index = 0; index < days; index += 1) {
      const bucketDate = new Date(start);
      bucketDate.setDate(start.getDate() + index);
      const key = this.toDateKey(bucketDate);
      buckets.set(key, { date: key, sales: 0, orders: 0 });
    }

    for (const order of orders) {
      const date = order.paidAt ?? order.createdAt;
      const key = this.toDateKey(date);
      const bucket = buckets.get(key);
      if (!bucket) continue;
      bucket.sales += this.toNumber(order.total);
      bucket.orders += 1;
    }

    return Array.from(buckets.values());
  }

  private resolveOrderActualCost(order: {
    items: Array<{
      quantity: number;
      lineTotal: Prisma.Decimal;
      areaSquareMeters: Prisma.Decimal | null;
      product: {
        pricingRules: Array<{
          pricingModel: PricingModel;
          minQuantity: number | null;
          maxQuantity: number | null;
          estimatedUnitCost: Prisma.Decimal | null;
          estimatedCostPerSquareMeter: Prisma.Decimal | null;
        }>;
      };
    }>;
  }) {
    const explicitActualCost = this.readOrderNumericField(order, 'actualCost');
    if (explicitActualCost > 0) return explicitActualCost;

    const fallbackCost =
      this.readOrderNumericField(order, 'materialCost') +
      this.readOrderNumericField(order, 'laborCost') +
      this.readOrderNumericField(order, 'shippingCost') +
      this.readOrderNumericField(order, 'overheadCost');
    if (fallbackCost > 0) return fallbackCost;

    return Number(
      order.items.reduce((sum, item) => sum + this.estimateOrderItemCost(item), 0).toFixed(2),
    );
  }

  private estimateOrderItemCost(item: {
    quantity: number;
    areaSquareMeters: Prisma.Decimal | null;
    product: {
      pricingRules: Array<{
        pricingModel: PricingModel;
        minQuantity: number | null;
        maxQuantity: number | null;
        estimatedUnitCost: Prisma.Decimal | null;
        estimatedCostPerSquareMeter: Prisma.Decimal | null;
      }>;
    };
  }) {
    const rule = item.product.pricingRules.find((pricingRule) => {
      const matchesMin = pricingRule.minQuantity == null || item.quantity >= pricingRule.minQuantity;
      const matchesMax = pricingRule.maxQuantity == null || item.quantity <= pricingRule.maxQuantity;
      return matchesMin && matchesMax;
    });

    if (!rule) return 0;

    if (rule.pricingModel === PricingModel.UNIT && rule.estimatedUnitCost) {
      return this.toNumber(rule.estimatedUnitCost) * item.quantity;
    }

    if (
      rule.pricingModel === PricingModel.AREA &&
      rule.estimatedCostPerSquareMeter &&
      item.areaSquareMeters
    ) {
      return this.toNumber(rule.estimatedCostPerSquareMeter) * this.toNumber(item.areaSquareMeters);
    }

    return 0;
  }

  private toNumber(value: Prisma.Decimal | number | string | null | undefined) {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value) || 0;
    return Number(value.toString()) || 0;
  }

  private readOrderNumericField(
    order: unknown,
    field: 'actualCost' | 'materialCost' | 'laborCost' | 'shippingCost' | 'overheadCost',
  ) {
    if (!order || typeof order !== 'object') {
      return 0;
    }

    return this.toNumber((order as Record<string, Prisma.Decimal | number | string | null | undefined>)[field]);
  }

  private getCustomerDisplayName(customer: { firstName: string; lastName: string } | null) {
    return [customer?.firstName, customer?.lastName].filter(Boolean).join(' ') || 'Cliente sin nombre';
  }

  private describeReconciliationReason(
    provider: PaymentProvider,
    status: PaymentStatus,
    transactionId: string | null,
  ) {
    if (status === PaymentStatus.PENDING || status === PaymentStatus.AUTHORIZED) {
      return 'Pago pendiente de confirmacion o liberacion operativa.';
    }

    if (status === PaymentStatus.REFUNDED) {
      return 'Pago devuelto pendiente de conciliacion contable.';
    }

    if (!transactionId) {
      return 'Pago sin referencia externa registrada.';
    }

    if (provider === PaymentProvider.BANK_TRANSFER || provider === PaymentProvider.MANUAL) {
      return 'Transferencia o registro manual requiere validacion contra soporte.';
    }

    if (provider === PaymentProvider.CASH) {
      return 'Pago en caja requiere conciliacion con corte diario.';
    }

    return 'Pago requiere revision operativa.';
  }

  private describeReconciliationAction(
    provider: PaymentProvider,
    status: PaymentStatus,
    transactionId: string | null,
  ) {
    if (status === PaymentStatus.PENDING || status === PaymentStatus.AUTHORIZED) {
      return 'Confirmar recepcion del pago antes de avanzar la orden.';
    }

    if (status === PaymentStatus.REFUNDED) {
      return 'Registrar contrapartida y cerrar devolucion.';
    }

    if (!transactionId) {
      return 'Completar referencia o comprobante del pago.';
    }

    if (provider === PaymentProvider.BANK_TRANSFER || provider === PaymentProvider.MANUAL) {
      return 'Validar comprobante bancario y marcar como conciliado.';
    }

    if (provider === PaymentProvider.CASH) {
      return 'Cruzar con caja y bitacora del dia.';
    }

    return 'Revisar detalle de pago.';
  }
}
