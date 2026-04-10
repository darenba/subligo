import { resolveApiBase } from './api-base';

const API_BASE = resolveApiBase();

export type DashboardSnapshot = {
  metrics: Array<{
    label: string;
    value: string;
    hint: string;
  }>;
  leadBoard: Array<{
    stage: string;
    count: number;
  }>;
  productionOrders: Array<{
    orderNumber: string;
    customer: string;
    status: string;
    sku: string;
    artworkUrl?: string | null;
  }>;
  commercialMetrics: Array<{
    label: string;
    value: string;
    hint: string;
  }>;
  campaignHighlights: CampaignHighlight[];
  automationSummary: AutomationSummary[];
  contentCalendar: ContentCalendarEntry[];
  omnichannelSummary: OmnichannelSummary;
};

export type CampaignHighlight = {
  id: string;
  name: string;
  channel: string;
  status: string;
  budget: number;
  spent: number;
  roas: number;
  ctr: number;
  leads: number;
  revenue: number;
  recommendation: string;
};

export type AutomationSummary = {
  id: string;
  name: string;
  status: string;
  triggerType: string;
  riskLevel?: string | null;
  lastRunAt?: string | null;
  tasksCount: number;
};

export type ContentCalendarEntry = {
  id: string;
  channel: string;
  topic: string;
  status: string;
  publishAt?: string | null;
  campaignName?: string | null;
};

export type OmnichannelSummary = {
  isReady: boolean;
  totalConversations: number;
  channels: Array<{
    channel: string;
    count: number;
  }>;
};

export type DashboardCommercialIntelligence = {
  metrics: Array<{
    label: string;
    value: string;
    hint: string;
  }>;
  campaignHighlights: CampaignHighlight[];
  automationSummary: AutomationSummary[];
  contentCalendar: ContentCalendarEntry[];
  omnichannelSummary: OmnichannelSummary;
};

export type CatalogAdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  pricingModel: 'UNIT' | 'AREA';
  active: boolean;
  featured: boolean;
  baseColorOptions?: string[] | null;
  printableSurfaces?: string[] | null;
  metadata?: {
    imageUrl?: string | null;
    marketingTitle?: string | null;
    marketingDescription?: string | null;
    heroCopy?: string | null;
    proofPoints?: string[] | null;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  pricingRules: Array<{
    id: string;
    minQuantity?: number | null;
    maxQuantity?: number | null;
    baseUnitPrice?: number | null;
    estimatedUnitCost?: number | null;
    pricePerSquareMeter?: number | null;
    estimatedCostPerSquareMeter?: number | null;
    personalizationMultiplier?: number | null;
    setupFee?: number | null;
    active?: boolean | null;
  }>;
  variants: Array<{
    id: string;
    sku: string;
    name: string;
    stock: number;
    color?: string | null;
    size?: string | null;
    isDefault?: boolean | null;
    metadata?: Record<string, unknown> | null;
  }>;
  _count?: {
    orderItems?: number;
    designSessions?: number;
    artworks?: number;
  };
};

export type CatalogAdminCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  active: boolean;
  _count: {
    products: number;
  };
};

export type CrmLead = {
  id: string;
  source: string;
  channel: string;
  stage: string;
  score: number;
  contactName: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  quotedValue?: number | null;
  notes?: string | null;
};

export type CrmPipelineStat = {
  stage: string;
  count: number;
  totalValue?: number | null;
};

export type CrmConversation = {
  id: string;
  channel: string;
  subject?: string | null;
  updatedAt: string;
  lead?: {
    contactName?: string;
    stage?: string;
  } | null;
  messages?: Array<{
    content: string;
    senderName?: string | null;
  }>;
};

export type ProductionQueueOrder = {
  id: string;
  orderNumber: string;
  status: string;
  operationalRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  nextAction: string;
  placedAt?: string | null;
  paidAt?: string | null;
  ageHours: number;
  shippingMethod?: string | null;
  customer: string;
  shipment?: {
    status: string;
    carrier?: string | null;
    trackingNumber?: string | null;
    estimatedDelivery?: string | null;
    shippedAt?: string | null;
  } | null;
  financials: {
    revenue: number;
    actualCost: number;
    grossProfit: number;
    marginPct: number;
    materialCost: number;
    laborCost: number;
    shippingCost: number;
    overheadCost: number;
  };
  dispatch: {
    ready: boolean;
    hasTracking: boolean;
    status: string;
  };
  tasksSummary: {
    total: number;
    blocked: number;
    overdue: number;
    highPriority: number;
  };
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string | null;
    assignedTo?: string | null;
  }>;
  artworkSummary: {
    total: number;
    ready: number;
    missing: number;
  };
  items: Array<{
    id: string;
    productName: string;
    productionSku: string;
    quantity: number;
    lineTotal: number;
    artworkUrl?: string | null;
    artworkStatus?: string | null;
  }>;
};

export type OperationsFinanceSnapshot = {
  summary: {
    revenue: number;
    actualCost: number;
    grossProfit: number;
    marginPct: number;
    materialCost: number;
    laborCost: number;
    shippingCost: number;
    overheadCost: number;
    orders: number;
  };
  byProduct: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    orders: number;
    revenue: number;
    actualCost: number;
    grossProfit: number;
    marginPct: number;
  }>;
  timeline: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
  forecast: Array<{
    date: string;
    projectedRevenue: number;
    projectedOrders: number;
  }>;
  dispatchSummary: {
    operationalOrders: number;
    readyToDispatch: number;
    withTracking: number;
    highRisk: number;
  };
};

export type AccountingOverviewSnapshot = {
  summary: {
    collectedPaid: number;
    pendingCollection: number;
    refundedAmount: number;
    reconciliationNeeded: number;
    invoiceReady: number;
    autoReconciled: number;
  };
  byProvider: Array<{
    provider: string;
    payments: number;
    collected: number;
    pending: number;
    refunded: number;
    reconciliationNeeded: number;
  }>;
  reconciliationQueue: Array<{
    paymentId: string;
    orderId: string;
    orderNumber: string;
    customer: string;
    provider: string;
    method: string;
    status: string;
    amount: number;
    paidAt?: string | null;
    transactionId?: string | null;
    reason: string;
    recommendedAction: string;
  }>;
  invoiceQueue: Array<{
    orderId: string;
    orderNumber: string;
    customer: string;
    total: number;
    paidAt?: string | null;
    paymentProvider?: string | null;
    billingReady: boolean;
    reason: string;
  }>;
  collectionTimeline: Array<{
    date: string;
    collected: number;
    pending: number;
    refunded: number;
  }>;
};

export type BillingReadyOrderView = {
  orderId: string;
  orderNumber: string;
  customer: string;
  customerTaxId?: string | null;
  total: number;
  paidAt?: string | null;
  paymentProvider?: string | null;
  billingReady: boolean;
  reason: string;
};

export type BillingInvoiceView = {
  id: string;
  orderId: string;
  orderNumber: string;
  invoiceNumber: string;
  status: string;
  customer: string;
  customerTaxId?: string | null;
  total: number;
  issuedAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  paymentProvider?: string | null;
  authorizationCode?: string | null;
  xmlUrl?: string | null;
  pdfUrl?: string | null;
};

export type BillingOverviewSnapshot = {
  summary: {
    readyToIssue: number;
    issued: number;
    sent: number;
    paid: number;
    cancelled: number;
    billedTotal: number;
    electronicReady: number;
    pendingSend: number;
  };
  byStatus: Array<{
    status: string;
    count: number;
    total: number;
  }>;
  readyOrders: BillingReadyOrderView[];
  invoices: BillingInvoiceView[];
};

export type AgentDefinitionView = {
  id: string;
  name: string;
  objective: string;
  defaultMode: 'MANUAL' | 'SEMI_AUTOMATIC' | 'AUTOMATIC';
  humanApprovalRequired: boolean;
  dataSources: string[];
  promptKeys: string[];
  kpis: string[];
  traceability: {
    runTable: string;
    findingTable: string;
    signalTable?: string;
  };
};

export type AgentRunView = {
  id: string;
  agentName: string;
  mode: 'MANUAL' | 'SEMI_AUTOMATIC' | 'AUTOMATIC';
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'REQUIRES_REVIEW';
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  findings: Array<{
    id: string;
    title: string;
    priority: string;
    type: string;
    createdAt: string;
  }>;
};

export type AgentFindingView = {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  score?: number | null;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
  payload?: Record<string, unknown> | null;
  agentRun: {
    id: string;
    agentName: string;
    mode: string;
    status: string;
    createdAt: string;
  };
};

export type AgentPromptView = {
  key: string;
  agentId: string;
  version: string;
  baseVersion: string;
  purpose: string;
  systemPrompt: string;
  userPromptTemplate: string;
  requiresHumanApproval: boolean;
  updatedAt?: string | null;
  updatedById?: string | null;
  isCustomized: boolean;
  variables: Array<{
    name: string;
    description: string;
    required: boolean;
    example?: string;
  }>;
  history: Array<{
    version: string;
    purpose: string;
    updatedAt: string;
    updatedById?: string | null;
    note?: string | null;
  }>;
};

export type SocialSignalView = {
  id: string;
  source: string;
  channel: string;
  summary: string;
  location?: string | null;
  keywords?: unknown;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  valuePotential?: number | string | null;
  status?: string | null;
  detectedAt: string;
};

export type AutomationView = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  triggerType: string;
  approvalRequired: boolean;
  riskLevel?: string | null;
  lastRunAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tasksCount: number;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
};

async function fetchBackoffice<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Backoffice API responded with ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`Fallo al consultar ${path}:`, error);
    return fallback;
  }
}

export function emptyDashboardSnapshot(): DashboardSnapshot {
  const emptyCommercial = emptyCommercialIntelligence();

  return {
    metrics: [
      {
        label: 'Ventas del dia',
        value: 'L 0.00',
        hint: 'API no disponible',
      },
      {
        label: 'Leads abiertos',
        value: '0',
        hint: 'API no disponible',
      },
      {
        label: 'Pedidos retrasados',
        value: '0',
        hint: 'API no disponible',
      },
      {
        label: 'Margen mas bajo',
        value: 'Sin datos',
        hint: 'API no disponible',
      },
    ],
    leadBoard: [],
    productionOrders: [],
    commercialMetrics: emptyCommercial.metrics,
    campaignHighlights: emptyCommercial.campaignHighlights,
    automationSummary: emptyCommercial.automationSummary,
    contentCalendar: emptyCommercial.contentCalendar,
    omnichannelSummary: emptyCommercial.omnichannelSummary,
  };
}

export function emptyCommercialIntelligence(): DashboardCommercialIntelligence {
  return {
    metrics: [
      {
        label: 'ROAS promedio',
        value: 'Sin datos',
        hint: 'API no disponible',
      },
      {
        label: 'CPL estimado',
        value: 'Sin datos',
        hint: 'API no disponible',
      },
      {
        label: 'CAC estimado',
        value: 'Sin datos',
        hint: 'API no disponible',
      },
      {
        label: 'Tasa de cierre',
        value: '0.0%',
        hint: 'API no disponible',
      },
      {
        label: 'Ticket promedio',
        value: 'Sin datos',
        hint: 'API no disponible',
      },
    ],
    campaignHighlights: [],
    automationSummary: [],
    contentCalendar: [],
    omnichannelSummary: {
      isReady: false,
      totalConversations: 0,
      channels: [],
    },
  };
}

export async function getDashboardSnapshot() {
  return fetchBackoffice('/dashboard', emptyDashboardSnapshot());
}

export async function getCommercialIntelligence() {
  return fetchBackoffice('/dashboard/commercial-intelligence', emptyCommercialIntelligence());
}

export async function getOperationsFinance(days = 30) {
  return fetchBackoffice<OperationsFinanceSnapshot>(`/dashboard/operations-finance?days=${days}`, {
    summary: {
      revenue: 0,
      actualCost: 0,
      grossProfit: 0,
      marginPct: 0,
      materialCost: 0,
      laborCost: 0,
      shippingCost: 0,
      overheadCost: 0,
      orders: 0,
    },
    byProduct: [],
    timeline: [],
    forecast: [],
    dispatchSummary: {
      operationalOrders: 0,
      readyToDispatch: 0,
      withTracking: 0,
      highRisk: 0,
    },
  });
}

export async function getAccountingOverview(days = 30) {
  return fetchBackoffice<AccountingOverviewSnapshot>(`/dashboard/accounting-overview?days=${days}`, {
    summary: {
      collectedPaid: 0,
      pendingCollection: 0,
      refundedAmount: 0,
      reconciliationNeeded: 0,
      invoiceReady: 0,
      autoReconciled: 0,
    },
    byProvider: [],
    reconciliationQueue: [],
    invoiceQueue: [],
    collectionTimeline: [],
  });
}

export async function getBillingOverview(days = 30) {
  return fetchBackoffice<BillingOverviewSnapshot>(`/billing/overview?days=${days}`, {
    summary: {
      readyToIssue: 0,
      issued: 0,
      sent: 0,
      paid: 0,
      cancelled: 0,
      billedTotal: 0,
      electronicReady: 0,
      pendingSend: 0,
    },
    byStatus: [],
    readyOrders: [],
    invoices: [],
  });
}

export async function getInvoices(limit = 30, status?: string) {
  const search = new URLSearchParams({ limit: String(limit) });
  if (status) {
    search.set('status', status);
  }

  return fetchBackoffice<BillingInvoiceView[]>(`/billing/invoices?${search.toString()}`, []);
}

export async function getProductionQueue() {
  return fetchBackoffice<ProductionQueueOrder[]>('/orders/production-queue', []);
}

export async function getCatalogAdminProducts() {
  return fetchBackoffice<CatalogAdminProduct[]>('/catalog/admin/products', []);
}

export async function getCatalogAdminCategories() {
  return fetchBackoffice<CatalogAdminCategory[]>('/catalog/admin/categories', []);
}

export async function getCrmLeads() {
  return fetchBackoffice<CrmLead[]>('/crm/leads', []);
}

export async function getCrmPipeline() {
  return fetchBackoffice<CrmPipelineStat[]>('/crm/pipeline', []);
}

export async function getCrmConversations() {
  return fetchBackoffice<CrmConversation[]>('/crm/conversations', []);
}

export async function getAgentDefinitions() {
  return fetchBackoffice<AgentDefinitionView[]>('/agents/definitions', []);
}

export async function getAgentRuns(limit = 12) {
  return fetchBackoffice<AgentRunView[]>(`/agents/runs?limit=${limit}`, []);
}

export async function getAgentFindings(limit = 12) {
  return fetchBackoffice<AgentFindingView[]>(`/agents/findings?limit=${limit}`, []);
}

export async function getAgentReviewQueue(limit = 12) {
  return fetchBackoffice<AgentFindingView[]>(`/agents/review-queue?limit=${limit}`, []);
}

export async function getAgentPrompts() {
  return fetchBackoffice<AgentPromptView[]>('/agents/prompts', []);
}

export async function getSocialSignals(limit = 12) {
  return fetchBackoffice<SocialSignalView[]>(`/agents/social-signals?limit=${limit}`, []);
}

export async function getAutomations() {
  return fetchBackoffice<AutomationView[]>('/automations', []);
}
