import { MetricCard, PageShell, SectionHeading } from '@printos/ui';

import { getAccountingOverview } from '../../lib/backoffice';

export const dynamic = 'force-dynamic';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-HN', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function formatCurrency(value: number) {
  return `L ${value.toFixed(2)}`;
}

export default async function AccountingPage() {
  const accounting = await getAccountingOverview(30);

  return (
    <PageShell
      eyebrow="Contabilidad"
      title="Cobros, conciliacion y control"
      description="Primer corte de ERP ligero con lectura de cobros, conciliacion manual y readiness documental sobre pagos reales."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Cobrado 30 dias"
          value={formatCurrency(accounting.summary.collectedPaid)}
          hint="Ingresos con pago confirmado en el periodo"
        />
        <MetricCard
          label="Por cobrar"
          value={formatCurrency(accounting.summary.pendingCollection)}
          hint="Pagos pendientes o autorizados"
        />
        <MetricCard
          label="Reembolsado"
          value={formatCurrency(accounting.summary.refundedAmount)}
          hint="Monto devuelto y pendiente de ajuste"
        />
        <MetricCard
          label="Por conciliar"
          value={String(accounting.summary.reconciliationNeeded)}
          hint="Pagos manuales o con revision pendiente"
        />
        <MetricCard
          label="Listas para facturar"
          value={String(accounting.summary.invoiceReady)}
          hint="Ordenes pagadas con datos suficientes"
        />
        <MetricCard
          label="Auto conciliados"
          value={String(accounting.summary.autoReconciled)}
          hint="Pagos con referencia y bajo riesgo"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="admin-card">
          <SectionHeading
            title="Mix por proveedor"
            description="Lectura rapida de volumen, cobro y presion de conciliacion por canal de pago."
          />
          <div className="mt-5 space-y-3">
            {accounting.byProvider.length ? (
              accounting.byProvider.map((provider) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4" key={provider.provider}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">{provider.provider}</p>
                      <p className="text-sm text-slate-600">{provider.payments} pago(s)</p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p>{formatCurrency(provider.collected)} cobrados</p>
                      <p>{formatCurrency(provider.pending)} pendientes</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                    <p>Reembolsado {formatCurrency(provider.refunded)}</p>
                    <p>{provider.reconciliationNeeded} con conciliacion pendiente</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay pagos para agrupar por proveedor.
              </div>
            )}
          </div>
        </article>

        <article className="admin-card">
          <SectionHeading
            title="Timeline de cobranza"
            description="Separacion diaria entre cobrado, pendiente y reembolsado para leer el pulso de caja."
          />
          <div className="mt-5 space-y-3">
            {accounting.collectionTimeline.length ? (
              accounting.collectionTimeline.map((point) => (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4" key={point.date}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-950">{point.date}</p>
                      <p className="text-sm text-slate-600">
                        Cobrado {formatCurrency(point.collected)} | Pendiente {formatCurrency(point.pending)}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600">Reembolsado {formatCurrency(point.refunded)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay timeline de cobranza disponible.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="admin-card">
          <SectionHeading
            title="Cola de conciliacion"
            description="Pagos manuales o pendientes que necesitan accion humana para cerrar el circuito contable."
          />
          <div className="mt-5 space-y-3">
            {accounting.reconciliationQueue.length ? (
              accounting.reconciliationQueue.map((payment) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4" key={payment.paymentId}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {payment.orderNumber} | {payment.customer}
                      </p>
                      <p className="text-sm text-slate-600">
                        {[payment.provider, payment.method, payment.status].join(' | ')}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p className="font-medium text-slate-900">{formatCurrency(payment.amount)}</p>
                      <p>
                        {payment.paidAt ? DATE_FORMATTER.format(new Date(payment.paidAt)) : 'Sin fecha de pago'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{payment.reason}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Accion sugerida: {payment.recommendedAction}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {payment.transactionId ? `Ref ${payment.transactionId}` : 'Sin referencia externa'}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay pagos pendientes de conciliacion.
              </div>
            )}
          </div>
        </article>

        <article className="admin-card">
          <SectionHeading
            title="Readiness documental"
            description="Ordenes pagadas listas para facturacion o pendientes de completar datos comerciales."
          />
          <div className="mt-5 space-y-3">
            {accounting.invoiceQueue.length ? (
              accounting.invoiceQueue.map((order) => (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4" key={order.orderId}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {order.orderNumber} | {order.customer}
                      </p>
                      <p className="text-sm text-slate-600">
                        {order.paymentProvider ?? 'Sin proveedor registrado'}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p className="font-medium text-slate-900">{formatCurrency(order.total)}</p>
                      <p>
                        {order.paidAt ? DATE_FORMATTER.format(new Date(order.paidAt)) : 'Sin fecha de pago'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{order.reason}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {order.billingReady ? 'Lista para emitir' : 'Completar datos antes de emitir'}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay ordenes pagadas para revisar.
              </div>
            )}
          </div>
        </article>
      </section>
    </PageShell>
  );
}
