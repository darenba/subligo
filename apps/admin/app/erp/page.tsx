import type { Route } from 'next';
import Link from 'next/link';
import { MetricCard, PageShell, SectionHeading } from '@printos/ui';

import {
  getAccountingOverview,
  getAgentReviewQueue,
  getBillingOverview,
  getCrmConversations,
  getDashboardSnapshot,
  getOperationsFinance,
  getProductionQueue,
} from '../../lib/backoffice';

export const dynamic = 'force-dynamic';

function formatCurrency(value: number) {
  return `L ${value.toFixed(2)}`;
}

const ERP_LINKS = [
  { href: '/dashboard', label: 'Dashboard', hint: 'Ventas, pipeline y salud comercial' },
  { href: '/crm', label: 'CRM', hint: 'Leads, conversaciones y canales' },
  { href: '/produccion', label: 'Produccion', hint: 'SLA, tracking y readiness operativa' },
  { href: '/finanzas', label: 'Finanzas', hint: 'P&L, margen y forecasting' },
  { href: '/contabilidad', label: 'Contabilidad', hint: 'Cobros, conciliacion y control' },
  { href: '/facturacion', label: 'Facturacion', hint: 'Emision y envio documental' },
  { href: '/agentes', label: 'Agentes IA', hint: 'Bandeja de hallazgos y aprobacion' },
] as const satisfies ReadonlyArray<{ href: Route; label: string; hint: string }>;

export default async function ErpPage() {
  const [dashboard, finance, accounting, billing, productionQueue, reviewQueue, conversations] =
    await Promise.all([
      getDashboardSnapshot(),
      getOperationsFinance(30),
      getAccountingOverview(30),
      getBillingOverview(30),
      getProductionQueue(),
      getAgentReviewQueue(8),
      getCrmConversations(),
    ]);

  return (
    <PageShell
      eyebrow="ERP"
      title="Panel unificado de control"
      description="Vista unica para leer comercio, operacion, finanzas, facturacion y aprobaciones sin salir del backoffice."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Ventas 30 dias"
          value={formatCurrency(finance.summary.revenue)}
          hint={`${finance.summary.orders} orden(es) pagadas`}
        />
        <MetricCard
          label="Utilidad bruta"
          value={formatCurrency(finance.summary.grossProfit)}
          hint={`${finance.summary.marginPct.toFixed(1)}% de margen`}
        />
        <MetricCard
          label="Por conciliar"
          value={String(accounting.summary.reconciliationNeeded)}
          hint="Pagos con revision humana"
        />
        <MetricCard
          label="Listas para facturar"
          value={String(billing.summary.readyToIssue)}
          hint="Ordenes pagadas sin factura activa"
        />
        <MetricCard
          label="Ordenes operativas"
          value={String(productionQueue.length)}
          hint={`${finance.dispatchSummary.highRisk} en riesgo alto`}
        />
        <MetricCard
          label="Aprobaciones IA"
          value={String(reviewQueue.length)}
          hint="Hallazgos pendientes de decision"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <article className="admin-card">
          <SectionHeading
            title="Centro maestro"
            description="Entradas rapidas a cada dominio critico del sistema ya conectado a datos reales."
          />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {ERP_LINKS.map((item) => (
              <Link
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-sky-300 hover:bg-white"
                href={item.href}
                key={item.href}
              >
                <p className="font-semibold text-slate-950">{item.label}</p>
                <p className="mt-2 text-sm text-slate-600">{item.hint}</p>
              </Link>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <SectionHeading
            title="Pulso del negocio"
            description="Lectura rapida de omnicanalidad, facturacion y despacho en una sola pantalla."
          />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-sm font-medium text-slate-500">Inbox omnicanal</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {dashboard.omnichannelSummary.channels.length}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {dashboard.omnichannelSummary.totalConversations} conversaciones consolidadas
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-sm font-medium text-slate-500">Facturas emitidas</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{billing.summary.issued}</p>
              <p className="mt-2 text-sm text-slate-600">
                {billing.summary.pendingSend} pendiente(s) de envio
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-sm font-medium text-slate-500">Con tracking</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {finance.dispatchSummary.withTracking}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {finance.dispatchSummary.readyToDispatch} listas para despacho
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-sm font-medium text-slate-500">Facturado 30 dias</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {formatCurrency(billing.summary.billedTotal)}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {billing.summary.electronicReady} electronica(s) lista(s)
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="admin-card">
          <SectionHeading
            title="Conversations y aprobaciones"
            description="Lo siguiente que necesita accion humana o seguimiento comercial."
          />
          <div className="mt-5 space-y-3">
            {conversations.slice(0, 4).map((conversation) => (
              <div
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                key={conversation.id}
              >
                <p className="font-semibold text-slate-950">
                  {conversation.lead?.contactName ?? 'Conversacion sin lead'}
                </p>
                <p className="text-sm text-slate-600">
                  {conversation.channel} | {conversation.subject ?? 'Sin asunto'}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {conversation.messages?.[0]?.content ?? 'Sin mensajes visibles'}
                </p>
              </div>
            ))}
            {conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay conversaciones disponibles.
              </div>
            ) : null}
          </div>
        </article>

        <article className="admin-card">
          <SectionHeading
            title="Pedidos y documentacion"
            description="Cruce rapido entre ejecucion operativa, margen y readiness documental."
          />
          <div className="mt-5 space-y-3">
            {productionQueue.slice(0, 4).map((order) => (
              <div
                className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                key={order.id}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{order.orderNumber}</p>
                    <p className="text-sm text-slate-600">
                      {order.customer} | {order.status} | {order.dispatch.status}
                    </p>
                  </div>
                  <div className="text-right text-sm text-slate-600">
                    <p>Margen {order.financials.marginPct.toFixed(1)}%</p>
                    <p>{order.dispatch.hasTracking ? 'Con tracking' : 'Sin tracking'}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700">{order.nextAction}</p>
              </div>
            ))}
            {productionQueue.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay pedidos operativos para mostrar.
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </PageShell>
  );
}
