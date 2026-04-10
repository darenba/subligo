import { PageShell, SectionHeading } from '@printos/ui';

import { AgentRunControls } from './agent-run-controls';
import { FindingReviewControls } from './finding-review-controls';
import { PromptEditorControls } from './prompt-editor-controls';
import {
  getAgentDefinitions,
  getAgentFindings,
  getAgentPrompts,
  getAgentReviewQueue,
  getAgentRuns,
  getAutomations,
  getCommercialIntelligence,
  getCrmConversations,
  getSocialSignals,
} from '../../lib/backoffice';

export const dynamic = 'force-dynamic';

const CONNECTED_AGENTS = [
  'prospectador-local',
  'escucha-social',
  'ejecutivo-comercial',
  'community-manager',
  'analista-campanas',
  'coordinador-operativo',
  'analista-financiero',
] as const;

const CONNECTED_AGENT_SET = new Set(CONNECTED_AGENTS);
const DATE_FORMATTER = new Intl.DateTimeFormat('es-HN', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function humanizeMode(mode: string) {
  return mode.replaceAll('_', ' ').toLowerCase();
}

function formatRunMeta(mode: string, createdAt: string) {
  return `${humanizeMode(mode)} - ${DATE_FORMATTER.format(new Date(createdAt))}`;
}

function formatSignalMeta(signal: { channel: string; location?: string | null; status?: string | null }) {
  return [signal.channel, signal.location, signal.status].filter(Boolean).join(' - ');
}

function formatAutomationMeta(automation: {
  triggerType: string;
  riskLevel?: string | null;
  lastRunAt?: string | null;
}) {
  return [
    automation.triggerType.replaceAll('_', ' ').toLowerCase(),
    automation.riskLevel?.toLowerCase(),
    automation.lastRunAt ? `ultima corrida ${DATE_FORMATTER.format(new Date(automation.lastRunAt))}` : null,
  ]
    .filter(Boolean)
    .join(' - ');
}

function keywordsToText(value: unknown) {
  if (!Array.isArray(value)) return 'Sin keywords';
  const items = value.map((item) => String(item)).filter(Boolean);
  return items.length ? items.join(', ') : 'Sin keywords';
}

function extractReviewText(payload: Record<string, unknown> | null | undefined) {
  if (!payload) return 'Sin borrador visible';
  const draftCopy = typeof payload['draftCopy'] === 'string' ? payload['draftCopy'] : null;
  const draftMessage = typeof payload['draftMessage'] === 'string' ? payload['draftMessage'] : null;
  const recommendation =
    typeof payload['recommendation'] === 'string' ? payload['recommendation'] : null;
  return draftCopy ?? draftMessage ?? recommendation ?? 'Sin borrador visible';
}

export default async function AgentsPage() {
  const [definitions, runs, findings, signals, reviewQueue, prompts, automations, conversations, intelligence] =
    await Promise.all([
      getAgentDefinitions(),
      getAgentRuns(40),
      getAgentFindings(24),
      getSocialSignals(24),
      getAgentReviewQueue(16),
      getAgentPrompts(),
      getAutomations(),
      getCrmConversations(),
      getCommercialIntelligence(),
    ]);

  const connectedDefinitions = definitions.filter((agent) =>
    CONNECTED_AGENT_SET.has(agent.id as (typeof CONNECTED_AGENTS)[number]),
  );
  const recentAgentNames = new Set(runs.map((run) => run.agentName));
  const channels = new Set(conversations.map((conversation) => conversation.channel));

  const hasInitialWave = ['prospectador-local', 'escucha-social', 'ejecutivo-comercial'].every(
    (agentId) => recentAgentNames.has(agentId),
  );
  const hasPhaseTwoCoverage = CONNECTED_AGENTS.every((agentId) =>
    connectedDefinitions.some((definition) => definition.id === agentId),
  );
  const hasPromptCoverage = prompts.length >= CONNECTED_AGENTS.length;
  const hasSignalsAndFindings = findings.length > 0 && signals.length > 0;
  const hasAutomationFlow = automations.some(
    (automation) => Boolean(automation.lastRunAt) || automation.tasksCount > 0,
  );
  const hasAutomationInventory = automations.length >= 8;
  const hasOmnichannel = channels.size >= 2;
  const hasCampaignReporting =
    intelligence.campaignHighlights.length > 0 &&
    intelligence.metrics.length >= 5 &&
    intelligence.contentCalendar.length > 0;
  const hasReviewQueue = reviewQueue.length > 0;

  const phaseTwoChecks = [
    {
      label: 'Framework de 7 agentes IA visible y conectado',
      ok: hasPhaseTwoCoverage,
    },
    {
      label: 'Al menos 3 agentes ejecutan y dejan trazabilidad',
      ok: hasInitialWave,
    },
    {
      label: 'Bandeja omnicanal muestra 2 o mas canales reales',
      ok: hasOmnichannel,
    },
    {
      label: 'Motor de prompts editable y versionado desde panel',
      ok: hasPromptCoverage,
    },
    {
      label: 'Un flujo de automation corre de punta a punta',
      ok: hasAutomationFlow,
    },
    {
      label: 'Panel de campanas y analytics avanzado disponible',
      ok: hasCampaignReporting,
    },
    {
      label: 'Inventario base de 8 automatizaciones registrado',
      ok: hasAutomationInventory,
    },
    {
      label: 'Bandeja de aprobacion humana con borradores trazables',
      ok: hasReviewQueue,
    },
    {
      label: 'Hallazgos y senales persistidas para comercial',
      ok: hasSignalsAndFindings,
    },
  ];

  const pendingChecks = phaseTwoChecks.filter((item) => !item.ok);
  const phaseTwoReady = pendingChecks.length === 0;

  return (
    <PageShell
      eyebrow="Fase 2"
      title="Agentes IA comerciales"
      description="Primer corte operativo de inteligencia comercial con corridas persistidas, hallazgos trazables y senales de demanda sobre datos reales."
      actions={<AgentRunControls />}
    >
      <section className="grid gap-4 xl:grid-cols-4">
        {connectedDefinitions.map((agent) => (
          <article className="admin-card" key={agent.id}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-600">
              {humanizeMode(agent.defaultMode)}
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
              {agent.name}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{agent.objective}</p>
            <div className="mt-5 grid gap-3 text-sm text-slate-600">
              <div>
                <p className="font-medium text-slate-800">Fuentes conectadas</p>
                <p>{agent.dataSources.join(', ')}</p>
              </div>
              <div>
                <p className="font-medium text-slate-800">Prompt activo</p>
                <p>{agent.promptKeys[0] ?? 'Sin prompt registrado'}</p>
              </div>
              <div>
                <p className="font-medium text-slate-800">Trazabilidad</p>
                <p>
                  {agent.traceability.runTable} / {agent.traceability.findingTable}
                  {agent.traceability.signalTable ? ` / ${agent.traceability.signalTable}` : ''}
                </p>
              </div>
              <div>
                <p className="font-medium text-slate-800">Aprobacion humana</p>
                <p>{agent.humanApprovalRequired ? 'Requerida antes de actuar' : 'No requerida'}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="admin-card">
          <SectionHeading
            title="Corridas recientes"
            description="Cada ejecucion queda persistida en agent_runs con estado, modo y hallazgos asociados."
          />
          <div className="mt-5 space-y-3">
            {runs.length ? (
              runs.slice(0, 12).map((run) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4" key={run.id}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{run.agentName}</p>
                      <p className="text-sm text-slate-600">{formatRunMeta(run.mode, run.createdAt)}</p>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p className="font-medium text-slate-800">{run.status}</p>
                      <p>{run.findings.length} hallazgo(s)</p>
                    </div>
                  </div>
                  {run.errorMessage ? (
                    <p className="mt-3 text-sm text-rose-600">{run.errorMessage}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                Todavia no hay corridas persistidas. Usa los botones de arriba para lanzar el trio inicial.
              </div>
            )}
          </div>
        </article>

        <article className="admin-card">
          <SectionHeading
            title="Hallazgos priorizados"
            description="Insights generados por los agentes conectados y listos para revision humana."
          />
          <div className="mt-5 space-y-3">
            {findings.length ? (
              findings.slice(0, 12).map((finding) => (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4" key={finding.id}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{finding.title}</p>
                      <p className="text-sm text-slate-600">{finding.description}</p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p className="font-medium text-slate-800">{finding.priority}</p>
                      <p>{finding.agentRun.agentName}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <span>{finding.type}</span>
                    {finding.entityType ? <span>{finding.entityType}</span> : null}
                    {typeof finding.score === 'number' ? <span>score {finding.score}</span> : null}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                Aun no hay hallazgos generados.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <article className="admin-card">
          <SectionHeading
            title="Bandeja de aprobacion humana"
            description="Borradores y hallazgos que requieren una decision explicita antes de actuar o publicar."
          />
          <div className="mt-5 space-y-3">
            {reviewQueue.length ? (
              reviewQueue.slice(0, 8).map((finding) => (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4" key={finding.id}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{finding.title}</p>
                      <p className="text-sm text-slate-600">{finding.description}</p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p className="font-medium text-slate-800">{finding.agentRun.agentName}</p>
                      <p>{finding.priority}</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    {extractReviewText(finding.payload)}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <span>{finding.type}</span>
                    {finding.payload && typeof finding.payload['promptKey'] === 'string' ? (
                      <span>{finding.payload['promptKey']}</span>
                    ) : null}
                    {finding.payload && typeof finding.payload['channel'] === 'string' ? (
                      <span>{finding.payload['channel']}</span>
                    ) : null}
                  </div>
                  <FindingReviewControls findingId={finding.id} />
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay borradores pendientes de aprobacion en este momento.
              </div>
            )}
          </div>
        </article>

        <article className="admin-card">
          <SectionHeading
            title="Prompts activos y versionado"
            description="Prompts registrados en el framework con version visible y variables trazables."
          />
          <div className="mt-5 space-y-3">
            {prompts.length ? (
              prompts.slice(0, 8).map((prompt) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4" key={prompt.key}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{prompt.key}</p>
                      <p className="text-sm text-slate-600">{prompt.purpose}</p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p className="font-medium text-slate-800">{prompt.version}</p>
                      <p>{prompt.agentId}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                    <span>{prompt.requiresHumanApproval ? 'human approval' : 'auto-safe'}</span>
                    <span>{prompt.variables.length} variable(s)</span>
                    <span>{prompt.isCustomized ? 'customized' : 'base prompt'}</span>
                    {prompt.baseVersion !== prompt.version ? <span>base {prompt.baseVersion}</span> : null}
                  </div>
                  <div className="mt-4 space-y-3 rounded-2xl border border-white/70 bg-white/80 p-4 text-sm text-slate-700">
                    <div>
                      <p className="font-medium text-slate-900">System prompt</p>
                      <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-600">
                        {prompt.systemPrompt}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Plantilla de usuario</p>
                      <p className="mt-2 whitespace-pre-wrap leading-6 text-slate-600">
                        {prompt.userPromptTemplate}
                      </p>
                    </div>
                  </div>
                  <PromptEditorControls prompt={prompt} />
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                No hay prompts registrados para mostrar.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="admin-card">
          <SectionHeading
            title="Senales sociales"
            description="Conversaciones transformadas en demanda clasificada para comercial y marketing."
          />
          <div className="mt-5 space-y-3">
            {signals.length ? (
              signals.slice(0, 8).map((signal) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4" key={signal.id}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{signal.summary}</p>
                      <p className="text-sm text-slate-600">{formatSignalMeta(signal)}</p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p className="font-medium text-slate-800">{signal.urgency}</p>
                      <p>L {Number(signal.valuePotential ?? 0).toFixed(2)}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    Keywords: {keywordsToText(signal.keywords)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                Todavia no hay social signals persistidas.
              </div>
            )}
          </div>
        </article>

        <article className="admin-card">
          <SectionHeading
            title="Automatizaciones comerciales"
            description="Flujos que dejan trazabilidad en tasks, leads y conversaciones del negocio."
          />
          <div className="mt-5 space-y-3">
            {automations.length ? (
              automations.map((automation) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4" key={automation.id}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{automation.name}</p>
                      <p className="text-sm text-slate-600">
                        {automation.description ?? 'Sin descripcion registrada'}
                      </p>
                    </div>
                    <div className="text-right text-sm text-slate-600">
                      <p className="font-medium text-slate-800">{automation.status}</p>
                      <p>{automation.tasksCount} tarea(s)</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{formatAutomationMeta(automation)}</p>
                  {automation.recentTasks.length ? (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {automation.recentTasks.slice(0, 3).map((task) => (
                        <span
                          className="rounded-full border border-slate-200 bg-white px-3 py-1"
                          key={task.id}
                        >
                          {task.priority} - {task.status}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                Todavia no hay automatizaciones registradas.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <article className="admin-card">
          <SectionHeading
            title="Checklist Fase 2"
            description="Verificacion operativa del corte actual antes de pasar a la siguiente fase."
          />
          <div className="mt-5 space-y-3">
            {phaseTwoChecks.map((item) => (
              <div
                className={`rounded-2xl border px-4 py-4 text-sm ${
                  item.ok
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
                }`}
                key={item.label}
              >
                <p className="font-medium">
                  {item.ok ? 'Listo' : 'Pendiente'} - {item.label}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <SectionHeading
            title="Estado de cierre"
            description="Resumen de aceptacion de Fase 2 y huecos que quedarian antes de pasar a la siguiente ola."
          />
          {phaseTwoReady ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
              <p className="font-semibold">Fase 2 lista para checkpoint.</p>
              <p className="mt-2">
                Ya se cumplen framework de agentes, prompts versionados, omnicanal, automatizacion,
                reporting de campanas y analytics avanzado sobre datos reales.
              </p>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              <p className="font-semibold">Aun faltan puntos para cerrar Fase 2.</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                {pendingChecks.map((item) => (
                  <li key={item.label}>{item.label}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">Despues de Fase 2</p>
            <p className="mt-2">
              Lo siguiente es operacion avanzada: produccion completa, despachos con tracking, costos
              reales, P&amp;L operativo y forecasting.
            </p>
          </div>
        </article>
      </section>
    </PageShell>
  );
}
