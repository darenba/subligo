import { BrandProductArt, PageShell, SectionHeading } from '@printos/ui';

import { getCommercialIntelligence } from '../../lib/backoffice';

export const dynamic = 'force-dynamic';

export default async function CampaignsPage() {
  const intelligence = await getCommercialIntelligence();

  return (
    <PageShell
      eyebrow="Campanas"
      title="Panel de campanas y reporting"
      description="Vista operativa para performance, automatizaciones, contenido y salud omnicanal."
    >
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="admin-card">
          <SectionHeading
            title="Momentum comercial"
            description="Aqui conviven performance, contenido y automatizacion para que la lectura no se sienta plana."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-sm text-slate-500">Campanas activas</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {intelligence.campaignHighlights.filter((campaign) => campaign.status === 'ACTIVE').length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-sm text-slate-500">Piezas editoriales</p>
              <p className="mt-2 text-3xl font-semibold text-slate-950">
                {intelligence.contentCalendar.length}
              </p>
            </div>
          </div>
        </article>

        <BrandProductArt badge="campanas" className="min-h-[280px]" variant="mix" />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {intelligence.metrics.map((metric) => (
          <article className="admin-card" key={metric.label}>
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{metric.value}</p>
            <p className="mt-2 text-sm text-slate-600">{metric.hint}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="admin-card">
          <SectionHeading
            title="Highlights de campanas"
            description="ROAS, CTR, leads y recomendacion accionable por campana."
          />
          <div className="mt-5 space-y-3">
            {intelligence.campaignHighlights.length ? (
              intelligence.campaignHighlights.map((campaign) => (
                <div
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  key={campaign.id}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{campaign.name}</p>
                      <p className="text-sm uppercase tracking-[0.18em] text-slate-500">
                        {campaign.channel} | {campaign.status}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p>Leads {campaign.leads}</p>
                      <p>Ingresos L {campaign.revenue.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-4">
                    <p>Budget L {campaign.budget.toFixed(2)}</p>
                    <p>Spent L {campaign.spent.toFixed(2)}</p>
                    <p>ROAS {campaign.roas.toFixed(2)}x</p>
                    <p>CTR {campaign.ctr.toFixed(2)}%</p>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{campaign.recommendation}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay campanas cargadas desde la API.
              </div>
            )}
          </div>
        </article>

        <article className="admin-card">
          <SectionHeading
            title="Calendario editorial"
            description="Piezas programadas por canal con campana asociada."
          />
          <div className="mt-5 space-y-3">
            {intelligence.contentCalendar.length ? (
              intelligence.contentCalendar.map((entry) => (
                <div
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                  key={entry.id}
                >
                  <p className="font-semibold text-slate-950">{entry.topic}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {entry.channel} | {entry.status}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {entry.campaignName ?? 'Sin campana asociada'}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                    {entry.publishAt
                      ? new Date(entry.publishAt).toLocaleString('es-HN')
                      : 'Sin fecha programada'}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay contenido editorial programado.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="admin-card">
          <SectionHeading
            title="Automatizaciones comerciales"
            description="Flujos listos para ejecucion y su ultima trazabilidad."
          />
          <div className="mt-5 space-y-3">
            {intelligence.automationSummary.length ? (
              intelligence.automationSummary.map((automation) => (
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
                No hay automatizaciones visibles.
              </div>
            )}
          </div>
        </article>

        <article className="admin-card">
          <SectionHeading
            title="Salud omnicanal"
            description="Validacion del criterio de 2 o mas canales reales con conversaciones activas."
          />
          <div
            className={`mt-5 rounded-2xl border px-4 py-4 text-sm ${
              intelligence.omnichannelSummary.isReady
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            <p className="font-medium">
              {intelligence.omnichannelSummary.isReady
                ? `Omnicanal listo con ${intelligence.omnichannelSummary.channels.length} canales y ${intelligence.omnichannelSummary.totalConversations} conversaciones.`
                : 'Aun hace falta un segundo canal con actividad real para completar el criterio.'}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {intelligence.omnichannelSummary.channels.length ? (
              intelligence.omnichannelSummary.channels.map((channel) => (
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
        </article>
      </section>
    </PageShell>
  );
}
