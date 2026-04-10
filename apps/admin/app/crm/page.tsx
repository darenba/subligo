import { PageShell, SectionHeading } from '@printos/ui';

import { getCrmConversations, getCrmLeads, getCrmPipeline } from '../../lib/backoffice';

export const dynamic = 'force-dynamic';

function formatChannelLabel(channel: string) {
  return channel.replaceAll('_', ' ').toUpperCase();
}

export default async function CrmPage() {
  const [leads, pipeline, conversations] = await Promise.all([
    getCrmLeads(),
    getCrmPipeline(),
    getCrmConversations(),
  ]);

  const channelCounts = conversations.reduce<Record<string, number>>((acc, conversation) => {
    acc[conversation.channel] = (acc[conversation.channel] ?? 0) + 1;
    return acc;
  }, {});
  const channelSummary = Object.entries(channelCounts).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  const isMultichannelReady = channelSummary.length >= 2;

  return (
    <PageShell
      eyebrow="CRM"
      title="Pipeline comercial"
      description="Leads, pipeline e inbox omnicanal consumidos desde la API comercial."
    >
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="admin-card">
          <SectionHeading title="Pipeline" description="Distribucion viva de oportunidades por etapa." />
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {pipeline.length ? (
              pipeline.map((stage) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={stage.stage}>
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                    {stage.stage}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">{stage.count}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Valor: L {Number(stage.totalValue ?? 0).toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay etapas cargadas desde la API todavia.
              </div>
            )}
          </div>
        </article>

        <article className="admin-card">
          <SectionHeading
            title="Leads recientes"
            description="Prospectos reales listos para seguimiento o cotizacion."
          />
          <div className="mt-5 space-y-3">
            {leads.length ? (
              leads.slice(0, 6).map((lead) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4" key={lead.id}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{lead.contactName}</p>
                      <p className="text-sm text-slate-600">
                        {lead.channel} - {lead.source}
                        {lead.email ? ` - ${lead.email}` : ''}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p className="font-medium text-slate-800">{lead.stage}</p>
                      <p>Score {lead.score}</p>
                    </div>
                  </div>
                  {lead.notes ? <p className="mt-3 text-sm text-slate-600">{lead.notes}</p> : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay leads disponibles.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="admin-card">
        <SectionHeading
          title="Inbox omnicanal"
          description="Conversaciones reales consolidadas desde dos o mas canales del negocio."
        />
        <div className="mt-5 space-y-4">
          <div
            className={`rounded-2xl border px-4 py-4 text-sm ${
              isMultichannelReady
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            <p className="font-medium">
              {isMultichannelReady
                ? 'Inbox multicanal activo con dos o mas canales reales.'
                : 'Hace falta al menos un segundo canal con conversaciones reales para completar este criterio.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {channelSummary.length ? (
              channelSummary.map(([channel, count]) => (
                <span
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-600"
                  key={channel}
                >
                  {formatChannelLabel(channel)} - {count}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Sin canales detectados
              </span>
            )}
          </div>

          <div className="space-y-3">
            {conversations.length ? (
              conversations.slice(0, 8).map((conversation) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                  key={conversation.id}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {conversation.lead?.contactName ?? 'Conversacion sin lead'}
                      </p>
                      <p className="text-sm text-slate-600">
                        {conversation.channel}
                        {conversation.subject ? ` - ${conversation.subject}` : ''}
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">
                      {new Date(conversation.updatedAt).toLocaleString('es-HN')}
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {conversation.messages?.[0]?.content ?? 'Sin mensajes recientes.'}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay conversaciones registradas todavia.
              </div>
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
