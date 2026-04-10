import { MetricCard, PageShell, SectionHeading } from '@printos/ui';

import { getBillingOverview } from '../../lib/backoffice';
import { BillingControls } from './billing-controls';

export const dynamic = 'force-dynamic';

function formatCurrency(value: number) {
  return `L ${value.toFixed(2)}`;
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('es-HN') : 'Sin fecha';
}

export default async function BillingPage() {
  const billing = await getBillingOverview(30);

  return (
    <PageShell
      eyebrow="Facturacion"
      title="Facturas, emision y envio"
      description="Operacion documental sobre ordenes pagadas con emision, envio y cola lista para facturar."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Listas para emitir"
          value={String(billing.summary.readyToIssue)}
          hint="Ordenes pagadas sin factura activa"
        />
        <MetricCard
          label="Emitidas"
          value={String(billing.summary.issued)}
          hint="Facturas emitidas y pendientes de envio"
        />
        <MetricCard
          label="Enviadas"
          value={String(billing.summary.sent)}
          hint="Facturas enviadas a cliente"
        />
        <MetricCard
          label="Pagadas"
          value={String(billing.summary.paid)}
          hint="Facturas liquidadas"
        />
        <MetricCard
          label="Electronicas listas"
          value={String(billing.summary.electronicReady)}
          hint="Con XML, PDF y codigo de autorizacion"
        />
        <MetricCard
          label="Facturado 30 dias"
          value={formatCurrency(billing.summary.billedTotal)}
          hint="Monto no cancelado del periodo"
        />
      </section>

      <section className="admin-card">
        <SectionHeading
          title="Centro de facturacion"
          description="Acciones operativas para emitir y enviar el lote pendiente desde el ERP ligero."
        />
        <div className="mt-5">
          <BillingControls />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="admin-card">
          <SectionHeading
            title="Ordenes listas para facturar"
            description="Pagos confirmados con datos documentales suficientes para emision inmediata."
          />
          <div className="mt-5 space-y-3">
            {billing.readyOrders.length ? (
              billing.readyOrders.map((order) => (
                <div
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  key={order.orderId}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {order.orderNumber} | {order.customer}
                      </p>
                      <p className="text-sm text-slate-600">
                        RTN/ID {order.customerTaxId ?? 'Pendiente'} |{' '}
                        {order.paymentProvider ?? 'Sin proveedor'}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p className="font-medium text-slate-900">{formatCurrency(order.total)}</p>
                      <p>{formatDateTime(order.paidAt)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{order.reason}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay ordenes listas para emitir en este momento.
              </div>
            )}
          </div>
        </article>

        <article className="admin-card">
          <SectionHeading
            title="Facturas recientes"
            description="Estado documental, codigo de autorizacion y activos emitidos desde el panel."
          />
          <div className="mt-5 space-y-3">
            {billing.invoices.length ? (
              billing.invoices.map((invoice) => (
                <div
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                  key={invoice.id}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {invoice.invoiceNumber} | {invoice.customer}
                      </p>
                      <p className="text-sm text-slate-600">
                        {invoice.orderNumber} | {invoice.status} |{' '}
                        {invoice.paymentProvider ?? 'Sin proveedor'}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p className="font-medium text-slate-900">
                        {formatCurrency(invoice.total)}
                      </p>
                      <p>{formatDateTime(invoice.issuedAt ?? invoice.createdAt)}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <p>Autorizacion: {invoice.authorizationCode ?? 'Pendiente'}</p>
                    <p>Envio: {formatDateTime(invoice.sentAt)}</p>
                    <p>XML: {invoice.xmlUrl ?? 'Pendiente'}</p>
                    <p>PDF: {invoice.pdfUrl ?? 'Pendiente'}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay facturas recientes para mostrar.
              </div>
            )}
          </div>
        </article>
      </section>
    </PageShell>
  );
}
