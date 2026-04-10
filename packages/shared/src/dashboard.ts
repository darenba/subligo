export type DashboardSalesMetric = {
  label: string;
  totalSales: number;
  orderCount: number;
  averageTicket: number;
};

export type DashboardSnapshot = {
  salesByPeriod: DashboardSalesMetric[];
  lowMarginProducts: Array<{
    productId: string;
    name: string;
    estimatedMargin: number;
  }>;
  delayedOrders: number;
  openLeads: number;
};

