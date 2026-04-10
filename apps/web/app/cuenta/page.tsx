import { BrandProductArt, PageShell, SectionHeading } from '@printos/ui';

import { getRecentOrders, getSavedDesignSessions } from '../../lib/account';

export default async function AccountPage() {
  const [orders, sessions] = await Promise.all([getRecentOrders(), getSavedDesignSessions()]);

  return (
    <PageShell
      eyebrow="Cliente"
      title="Area del cliente"
      description="Espacio para consultar pedidos, reusar disenos guardados y monitorear entregas."
    >
      <section className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <article className="glass-card p-6">
          <SectionHeading
            title="Todo lo tuyo en una sola vista"
            description="Pedidos, disenos guardados y reordenes rapidos con una lectura mas ordenada para el cliente."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-line/70 bg-white/75 px-4 py-4">
              <p className="text-sm text-slate-500">Pedidos recientes</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{orders.length}</p>
            </div>
            <div className="rounded-[22px] border border-line/70 bg-white/75 px-4 py-4">
              <p className="text-sm text-slate-500">Disenos guardados</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">{sessions.length}</p>
            </div>
            <div className="rounded-[22px] border border-line/70 bg-white/75 px-4 py-4">
              <p className="text-sm text-slate-500">Con produccion activa</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {orders.filter((order) =>
                  ['PENDING', 'CONFIRMED', 'IN_PRODUCTION', 'READY', 'SHIPPED'].includes(order.status),
                ).length}
              </p>
            </div>
          </div>
        </article>

        <BrandProductArt badge="mi cuenta" className="min-h-[320px]" variant="mix" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="glass-card p-6">
          <SectionHeading
            title="Pedidos recientes"
            description="Ultimas ordenes creadas desde checkout para reordenar o monitorear estado."
          />
          <div className="mt-5 space-y-3">
            {orders.length ? (
              orders.slice(0, 4).map((order) => (
                <div className="rounded-2xl border border-slate-200 bg-white p-4" key={order.id}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <p className="font-semibold text-slate-950">{order.orderNumber}</p>
                    <span className="brand-chip">{order.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {order.items?.length ?? 0} item(s)
                    {order.createdAt
                      ? ` - ${new Date(order.createdAt).toLocaleDateString('es-HN')}`
                      : ''}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600">
                No hay pedidos disponibles todavia o la API/base de datos no esta activa.
              </div>
            )}
          </div>
        </article>

        <article className="glass-card p-6">
          <SectionHeading
            title="Disenos guardados"
            description="Sesiones guardadas desde el personalizador para reusar o finalizar compra."
          />
          <div className="mt-5 space-y-3">
            {sessions.length ? (
              sessions.slice(0, 4).map((session) => (
                <div className="rounded-[28px] bg-slate-950 p-5 text-white" key={session.id}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <p className="font-semibold">Sesion {session.id.slice(0, 8)}...</p>
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white/80">
                      {session.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/70">
                    Producto: {session.productId}
                  </p>
                  {session.notes ? (
                    <p className="mt-2 text-sm text-white/80">{session.notes}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-600">
                No hay sesiones guardadas disponibles o la API/base de datos no esta activa.
              </div>
            )}
          </div>
        </article>
      </section>
    </PageShell>
  );
}
