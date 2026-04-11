'use client';

import { startTransition, useState } from 'react';
import { useRouter } from 'next/navigation';

import { extractClientApiError, requestClientApi } from '../../lib/client-api';

const RUN_ACTIONS = [
  {
    id: 'initial-wave',
    label: 'Ejecutar trio inicial',
    path: '/agents/execute/initial-wave',
  },
  {
    id: 'phase-two-wave',
    label: 'Ejecutar fase 2',
    path: '/agents/execute/phase-two-wave',
  },
  {
    id: 'prospectador-local',
    label: 'Prospectador local',
    path: '/agents/execute',
    body: { agentId: 'prospectador-local' },
  },
  {
    id: 'escucha-social',
    label: 'Escucha social',
    path: '/agents/execute',
    body: { agentId: 'escucha-social' },
  },
  {
    id: 'ejecutivo-comercial',
    label: 'Ejecutivo comercial',
    path: '/agents/execute',
    body: { agentId: 'ejecutivo-comercial' },
  },
  {
    id: 'community-manager',
    label: 'Community Manager',
    path: '/agents/execute',
    body: { agentId: 'community-manager' },
  },
  {
    id: 'analista-campanas',
    label: 'Analista de campanas',
    path: '/agents/execute',
    body: { agentId: 'analista-campanas' },
  },
  {
    id: 'coordinador-operativo',
    label: 'Coordinador operativo',
    path: '/agents/execute',
    body: { agentId: 'coordinador-operativo' },
  },
  {
    id: 'analista-financiero',
    label: 'Analista financiero',
    path: '/agents/execute',
    body: { agentId: 'analista-financiero' },
  },
  {
    id: 'reactivation-90-days',
    label: 'Reactivacion 90 dias',
    path: '/automations/reactivation/run',
  },
] as const;

export function AgentRunControls() {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function triggerRun(action: (typeof RUN_ACTIONS)[number]) {
    setPendingAction(action.id);
    setMessage(null);
    setError(null);

    try {
      const requestBody =
        'body' in action && action.body ? JSON.stringify(action.body) : undefined;

      const result = await requestClientApi<{
        executed?: number;
        failed?: number;
        failures?: Array<{ agentId: string; message: string }>;
        wave?: string;
        agentName?: string;
        status?: string;
        message?: string;
        automationName?: string;
        eligibleCustomers?: number;
        leadsCreated?: number;
        tasksCreated?: number;
        conversationsCreated?: number;
      }>(action.path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (!result.response.ok) {
        throw new Error(
          extractClientApiError(result, `La API respondio con ${result.response.status}`),
        );
      }

      const payload = result.payload;
      const failed = typeof payload?.failed === 'number' ? payload.failed : 0;
      const failureSummary =
        failed > 0 && Array.isArray(payload?.failures) && payload.failures.length > 0
          ? ` Fallaron ${failed}: ${payload.failures.map((item) => item.agentId).join(', ')}.`
          : failed > 0
            ? ` Fallaron ${failed} agente(s).`
            : '';

      if (typeof payload?.executed === 'number' && payload?.wave === 'phase-two') {
        setMessage(`Se ejecutaron ${payload.executed} agentes de la fase 2.${failureSummary}`);
      } else if (typeof payload?.executed === 'number') {
        setMessage(`Se ejecutaron ${payload.executed} agentes del trio inicial.${failureSummary}`);
      } else if (payload?.automationName) {
        setMessage(
          `${payload.automationName}: ${payload.eligibleCustomers ?? 0} cuenta(s) elegible(s), ` +
            `${payload.leadsCreated ?? 0} lead(s), ${payload.tasksCreated ?? 0} tarea(s) y ` +
            `${payload.conversationsCreated ?? 0} conversacion(es) creadas.`,
        );
      } else if (payload?.agentName) {
        setMessage(`Corrida creada para ${payload.agentName} en estado ${payload.status ?? 'RUNNING'}.`);
      } else {
        setMessage('Corrida creada correctamente. Refrescando panel...');
      }

      startTransition(() => router.refresh());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No fue posible ejecutar el agente.');
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {RUN_ACTIONS.map((action) => {
          const isPending = pendingAction === action.id;
          return (
            <button
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pendingAction !== null}
              key={action.id}
              onClick={() => {
                void triggerRun(action);
              }}
              type="button"
            >
              {isPending ? 'Ejecutando...' : action.label}
            </button>
          );
        })}
      </div>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
