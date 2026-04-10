import { MetricCard, PageShell, SectionHeading } from '@printos/ui';

import { getOperationsFinance } from '../../lib/backoffice';

export const dynamic = 'force-dynamic';

function formatCurrency(value: number) {
  return `L ${value.toFixed(2)}`;
}

export default async function FinancePage() {
  const finance = await getOperationsFinance(30);

  return (
    <PageShell
      eyebrow="Finanzas"
      title="P&L operativo y forecasting"
      description="Rentabilidad real por periodo, mezcla de costos, readiness de despacho y proyeccion basica de ingresos."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Ingresos 30 dias"
          value={formatCurrency(finance.summary.revenue)}
          hint={`${finance.summary.orders} orden(es) pagadas en el periodo`}
        />
        <MetricCard
          label="Costo real"
          value={formatCurrency(finance.summary.actualCost)}
          hint="Costo total reconocido sobre ordenes pagadas"
        />
        <MetricCard
          label="Utilidad bruta"
          value={formatCurrency(finance.summary.grossProfit)}
          hint="Ingresos menos costo real"
        />
        <MetricCard
          label="Margen bruto"
          value={`${finance.summary.marginPct.toFixed(1)}%`}
          hint="Margen sobre ingresos del periodo"
        />
        <MetricCard
          label="Listas para despacho"
          value={String(finance.dispatchSummary.readyToDispatch)}
          hint={`${finance.dispatchSummary.operationalOrders} orden(es) operativas`}
        />
        <MetricCard
          label="Con tracking"
          value={String(finance.dispatchSummary.withTracking)}
          hint={`${finance.dispatchSummary.highRisk} orden(es) en riesgo alto`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="admin-card">
          <SectionHeading
            title="Mix de costos"
            description="Desglose del costo real para leer presion de materiales, mano de obra, envio y overhead."
          />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-500">Materiales</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {formatCurrency(finance.summary.materialCost)}
              </p>
              <p className="mt-2 text-sm text-slate-600">Costo de insumo reconocido en ordenes.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-500">Mano de obra</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {formatCurrency(finance.summary.laborCost)}
              </p>
              <p className="mt-2 text-sm text-slate-600">Costo de produccion y acabados.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-500">Envio</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {formatCurrency(finance.summary.shippingCost)}
              </p>
              <p className="mt-2 text-sm text-slate-600">Despacho y transporte del periodo.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-medium text-slate-500">Overhead</p>
              <p className="mt-3 text-3xl font-semibold text-slate-950">
                {formatCurrency(finance.summary.overheadCost)}
              </p>
              <p className="mt-2 text-sm text-slate-600">Indirectos operativos prorrateados.</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 text-sm text-sky-800">
            <p className="font-medium">Preparacion multi-sede</p>
            <p className="mt-2">
              El esquema ya reserva `tenantId` en tablas criticas del negocio para soportar
              expansion por sedes sin rehacer la base.
            </p>
          </div>
        </article>

        <article className="admin-card">
          <SectionHeading
            title="P&L por producto"
            description="Rentabilidad por SKU para detectar ganadores, mezcla comercial y presion de margen."
          />
          <div className="mt-5 space-y-3">
            {finance.byProduct.length ? (
              finance.byProduct.map((item) => (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4" key={item.productId}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{item.productName}</p>
                      <p className="text-sm text-slate-600">{item.sku}</p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p className="font-medium text-slate-800">{item.marginPct.toFixed(1)}%</p>
                      <p>{item.orders} orden(es)</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-4 text-sm text-slate-600">
                    <p>Ingreso {formatCurrency(item.revenue)}</p>
                    <p>Costo {formatCurrency(item.actualCost)}</p>
                    <p>Utilidad {formatCurrency(item.grossProfit)}</p>
                    <p>Cantidad {item.quantity}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay rentabilidad por producto para mostrar.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="admin-card">
          <SectionHeading
            title="Timeline real del periodo"
            description="Lectura diaria de ingresos y ordenes pagadas para comparar tendencia actual."
          />
          <div className="mt-5 space-y-3">
            {finance.timeline.length ? (
              finance.timeline.map((point) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4" key={point.date}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{point.date}</p>
                      <p className="text-sm text-slate-600">{point.orders} orden(es)</p>
                    </div>
                    <p className="text-lg font-semibold text-slate-950">{formatCurrency(point.sales)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay timeline disponible.
              </div>
            )}
          </div>
        </article>

        <article className="admin-card">
          <SectionHeading
            title="Forecasting basico"
            description="Proyeccion simple a 7 dias con promedio movil sobre el comportamiento reciente."
          />
          <div className="mt-5 space-y-3">
            {finance.forecast.length ? (
              finance.forecast.map((point) => (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4" key={point.date}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{point.date}</p>
                      <p className="text-sm text-slate-600">
                        {point.projectedOrders.toFixed(1)} orden(es) proyectadas
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-slate-950">
                      {formatCurrency(point.projectedRevenue)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay forecast disponible.
              </div>
            )}
          </div>
        </article>
      </section>
    </PageShell>
  );
}
