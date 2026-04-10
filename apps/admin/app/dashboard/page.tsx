import { MetricCard, PageShell, SectionHeading } from '@printos/ui';

import { getDashboardSnapshot, getOperationsFinance } from '../../lib/backoffice';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [snapshot, operationsFinance] = await Promise.all([
    getDashboardSnapshot(),
    getOperationsFinance(30),
  ]);
  const metrics = snapshot.metrics ?? [];
  const omnichannel = snapshot.omnichannelSummary ?? {
    isReady: false,
    totalConversations: 0,
    channels: [],
  };
  const commercialMetrics = snapshot.commercialMetrics ?? [];
  const leadBoard = snapshot.leadBoard ?? [];
  const productionOrders = snapshot.productionOrders ?? [];
  const campaignHighlights = snapshot.campaignHighlights ?? [];
  const contentCalendar = snapshot.contentCalendar ?? [];
  const automationSummary = snapshot.automationSummary ?? [];

  return (
    <PageShell
      eyebrow="Backoffice"
      title="Dashboard gerencial"
      description="Vista conectada a la operacion real para ventas, pipeline, campanas y seguimiento comercial."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            hint={metric.hint}
            key={metric.label}
            label={metric.label}
            value={metric.value}
          />
        ))}
      </section>

      <section className="admin-card">
        <SectionHeading
          title="Inteligencia comercial"
          description="Metricas avanzadas para CAC, CPL, cierre, ticket promedio y salud comercial."
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {commercialMetrics.map((metric) => (
            <MetricCard
              hint={metric.hint}
              key={metric.label}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </div>
      </section>

      <section className="admin-card">
        <SectionHeading
          title="Operacion financiera"
          description="P&L operativo, readiness de despacho y forecast corto con datos reales del periodo."
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard
            label="Ingreso 30 dias"
            value={`L ${operationsFinance.summary.revenue.toFixed(2)}`}
            hint={`${operationsFinance.summary.orders} orden(es) pagadas`}
          />
          <MetricCard
            label="Costo real"
            value={`L ${operationsFinance.summary.actualCost.toFixed(2)}`}
            hint="Costo reconocido del periodo"
          />
          <MetricCard
            label="Utilidad bruta"
            value={`L ${operationsFinance.summary.grossProfit.toFixed(2)}`}
            hint="Ingresos menos costo real"
          />
          <MetricCard
            label="Margen bruto"
            value={`${operationsFinance.summary.marginPct.toFixed(1)}%`}
            hint="Margen consolidado"
          />
          <MetricCard
            label="Listas para despacho"
            value={String(operationsFinance.dispatchSummary.readyToDispatch)}
            hint={`${operationsFinance.dispatchSummary.operationalOrders} orden(es) operativas`}
          />
          <MetricCard
            label="Forecast 7 dias"
            value={
              operationsFinance.forecast.length
                ? `L ${operationsFinance.forecast[0]!.projectedRevenue.toFixed(2)}`
                : 'Sin datos'
            }
            hint="Promedio movil del comportamiento reciente"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="admin-card">
          <SectionHeading
            title="Pipeline"
            description="Distribucion actual de oportunidades por etapa."
          />
          <div className="mt-5 grid gap-3">
            {leadBoard.length ? (
              leadBoard.map((column) => (
                <div
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  key={column.stage}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{column.stage}</span>
                    <span className="text-2xl font-semibold text-slate-950">
                      {column.count}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No fue posible cargar el pipeline desde la API.
              </div>
            )}
          </div>
        </article>

        <article className="admin-card">
          <SectionHeading
            title="Ordenes de produccion"
            description="Pedidos reales listos para seguimiento operativo."
          />
          <div className="mt-5 space-y-3">
            {productionOrders.length ? (
              productionOrders.map((order) => (
                <div
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                  key={order.orderNumber}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{order.orderNumber}</p>
                      <p className="text-sm text-slate-600">{order.customer}</p>
                    </div>
                    <div className="text-sm text-slate-600">
                      {order.status} | {order.sku}
                      {order.artworkUrl ? ` | ${order.artworkUrl}` : ''}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay ordenes activas o la API no devolvio datos.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="admin-card">
          <SectionHeading
            title="Campanas y contenido"
            description="Resumen ejecutivo de performance y parrilla editorial conectada a datos reales."
          />
          <div className="mt-5 space-y-3">
            {campaignHighlights.length ? (
              campaignHighlights.slice(0, 4).map((campaign) => (
                <div
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  key={campaign.id}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{campaign.name}</p>
                      <p className="text-sm uppercase tracking-[0.16em] text-slate-500">
                        {campaign.channel} | {campaign.status}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p>ROAS {campaign.roas.toFixed(2)}x</p>
                      <p>CTR {campaign.ctr.toFixed(2)}%</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{campaign.recommendation}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay campanas con datos para mostrar.
              </div>
            )}
          </div>

          <div className="mt-6">
            <SectionHeading
              title="Calendario editorial"
              description="Piezas programadas por canal con estatus y campana asociada."
            />
            <div className="mt-4 space-y-3">
              {contentCalendar.length ? (
                contentCalendar.slice(0, 4).map((entry) => (
                  <div
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                    key={entry.id}
                  >
                    <p className="font-semibold text-slate-950">{entry.topic}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {entry.channel} | {entry.status}
                      {entry.campaignName ? ` | ${entry.campaignName}` : ''}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {entry.publishAt
                        ? new Date(entry.publishAt).toLocaleString('es-HN')
                        : 'Sin fecha programada'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                  No hay piezas editoriales cargadas desde la API.
                </div>
              )}
            </div>
          </div>
        </article>

        <article className="admin-card">
          <SectionHeading
            title="Omnicanal y automatizaciones"
            description="Estado del inbox multicanal y de los flujos comerciales activos."
          />
          <div
            className={`mt-5 rounded-2xl border px-4 py-4 text-sm ${
              omnichannel.isReady
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            <p className="font-medium">
              {omnichannel.isReady
                ? `Inbox omnicanal activo con ${omnichannel.channels.length} canales y ${omnichannel.totalConversations} conversaciones.`
                : 'Todavia falta un segundo canal real para declarar el inbox omnicanal como completo.'}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {omnichannel.channels.length ? (
              omnichannel.channels.map((channel) => (
                <span
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-600"
                  key={channel.channel}
                >
                  {channel.channel} - {channel.count}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Sin canales detectados
              </span>
            )}
          </div>

          <div className="mt-6 space-y-3">
            {automationSummary.length ? (
              automationSummary.map((automation) => (
                <div
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  key={automation.id}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{automation.name}</p>
                      <p className="text-sm text-slate-600">
                        {automation.triggerType} | {automation.status}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p>{automation.tasksCount} tarea(s)</p>
                      <p>{automation.riskLevel ?? 'Sin riesgo'}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {automation.lastRunAt
                      ? `Ultima corrida ${new Date(automation.lastRunAt).toLocaleString('es-HN')}`
                      : 'Sin corridas aun'}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay automatizaciones visibles desde la API.
              </div>
            )}
          </div>
        </article>
      </section>
    </PageShell>
  );
}
