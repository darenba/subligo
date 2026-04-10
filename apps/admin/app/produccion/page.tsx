import { PageShell, SectionHeading } from '@printos/ui';

import { getProductionQueue } from '../../lib/backoffice';

export const dynamic = 'force-dynamic';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-HN', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function riskStyles(risk: 'LOW' | 'MEDIUM' | 'HIGH') {
  if (risk === 'HIGH') {
    return 'border-rose-200 bg-rose-50 text-rose-800';
  }

  if (risk === 'MEDIUM') {
    return 'border-amber-200 bg-amber-50 text-amber-800';
  }

  return 'border-emerald-200 bg-emerald-50 text-emerald-800';
}

export default async function ProductionPage() {
  const orders = await getProductionQueue();
  const riskyOrders = orders.filter((order) => order.operationalRisk === 'HIGH').length;
  const readyToDispatch = orders.filter((order) => order.dispatch.ready).length;
  const withTracking = orders.filter((order) => order.dispatch.hasTracking).length;
  const marginUnderPressure = orders.filter((order) => order.financials.marginPct < 25).length;

  return (
    <PageShell
      eyebrow="Produccion"
      title="Operacion y despachos"
      description="Vista avanzada de produccion con riesgo operativo, tracking, tareas vivas, artes y margen real."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="admin-card">
          <p className="text-sm font-medium text-slate-500">Ordenes operativas</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{orders.length}</p>
          <p className="mt-2 text-sm text-slate-600">
            Pedidos en produccion, listos, enviados o con incidente.
          </p>
        </article>
        <article className="admin-card">
          <p className="text-sm font-medium text-slate-500">En riesgo alto</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{riskyOrders}</p>
          <p className="mt-2 text-sm text-slate-600">
            Pedidos con bloqueo, incidente o atraso operativo.
          </p>
        </article>
        <article className="admin-card">
          <p className="text-sm font-medium text-slate-500">Listas para despacho</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{readyToDispatch}</p>
          <p className="mt-2 text-sm text-slate-600">
            Arte completo, sin bloqueos y listas para tracking o entrega.
          </p>
        </article>
        <article className="admin-card">
          <p className="text-sm font-medium text-slate-500">Con tracking</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{withTracking}</p>
          <p className="mt-2 text-sm text-slate-600">
            Pedidos ya despachados con numero de seguimiento.
          </p>
        </article>
        <article className="admin-card">
          <p className="text-sm font-medium text-slate-500">Margen bajo presion</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">{marginUnderPressure}</p>
          <p className="mt-2 text-sm text-slate-600">
            Ordenes con margen estimado por debajo de 25%.
          </p>
        </article>
      </section>

      <section className="admin-card">
        <SectionHeading
          title="Cola operativa"
          description="Cada pedido muestra estado, SLA, tracking, tareas, readiness de arte y costo real para operar de punta a punta."
        />
        <div className="mt-5 space-y-4">
          {orders.length ? (
            orders.map((order) => (
              <article
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                key={order.id}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{order.orderNumber}</p>
                    <p className="text-sm text-slate-600">
                      {order.customer}
                      {order.shippingMethod ? ` | ${order.shippingMethod}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700">
                      {order.status}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 font-medium ${riskStyles(order.operationalRisk)}`}
                    >
                      Riesgo {order.operationalRisk}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700">
                      {order.dispatch.ready ? 'LISTA PARA DESPACHO' : 'AUN NO DESPACHABLE'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-5">
                  <div className="rounded-2xl border border-white bg-white px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      SLA
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {order.ageHours}h activas
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{order.nextAction}</p>
                  </div>
                  <div className="rounded-2xl border border-white bg-white px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Arte
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {order.artworkSummary.ready}/{order.artworkSummary.total} listo
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {order.artworkSummary.missing} pendiente(s)
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white bg-white px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Tareas
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {order.tasksSummary.total} abiertas
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {order.tasksSummary.blocked} bloqueada(s) | {order.tasksSummary.overdue}{' '}
                      vencida(s)
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white bg-white px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Despacho
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {order.shipment?.status ?? 'Sin envio'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {order.shipment?.trackingNumber
                        ? `Tracking ${order.shipment.trackingNumber}`
                        : 'Tracking pendiente'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white bg-white px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Margen
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {order.financials.marginPct.toFixed(1)}%
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Utilidad L {order.financials.grossProfit.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-white bg-white px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Ingreso
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      L {order.financials.revenue.toFixed(2)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">Total de la orden</p>
                  </div>
                  <div className="rounded-2xl border border-white bg-white px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Costo real
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      L {order.financials.actualCost.toFixed(2)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Material + mano de obra + envio + overhead
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white bg-white px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Costeo
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-950">
                      Material L {order.financials.materialCost.toFixed(2)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Mano de obra L {order.financials.laborCost.toFixed(2)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Envio L {order.financials.shippingCost.toFixed(2)} | Overhead L{' '}
                      {order.financials.overheadCost.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white bg-white px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Tracking listo
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {order.dispatch.hasTracking ? 'SI' : 'NO'}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {order.shipment?.carrier ?? 'Transportista pendiente'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {order.items.map((item) => (
                    <div
                      className="rounded-2xl border border-white bg-white px-4 py-4"
                      key={item.id}
                    >
                      <p className="font-medium text-slate-950">
                        {item.productName} | {item.productionSku}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Cantidad: {item.quantity} | Total linea: L {item.lineTotal.toFixed(2)}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.artworkUrl
                          ? `Arte ${item.artworkStatus ?? 'READY'} | ${item.artworkUrl}`
                          : 'Sin arte generado'}
                      </p>
                    </div>
                  ))}
                </div>

                {order.recentTasks.length ? (
                  <div className="mt-4 rounded-2xl border border-white bg-white px-4 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Tareas recientes
                    </p>
                    <div className="mt-3 space-y-3">
                      {order.recentTasks.map((task) => (
                        <div
                          className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between"
                          key={task.id}
                        >
                          <div>
                            <p className="font-medium text-slate-900">{task.title}</p>
                            <p className="text-sm text-slate-600">
                              {task.assignedTo ?? 'Sin asignar'}
                              {task.dueDate
                                ? ` | vence ${DATE_FORMATTER.format(new Date(task.dueDate))}`
                                : ''}
                            </p>
                          </div>
                          <p className="text-sm text-slate-600">
                            {task.priority} | {task.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
              No hay ordenes activas o la API no devolvio datos.
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
