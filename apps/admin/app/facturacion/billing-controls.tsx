'use client';

import { startTransition, useState } from 'react';
import { useRouter } from 'next/navigation';

import { extractClientApiError, requestClientApi } from '../../lib/client-api';

const BILLING_ACTIONS = [
  {
    id: 'issue-ready',
    label: 'Emitir listas',
    path: '/billing/invoices/issue-ready',
  },
  {
    id: 'send-pending',
    label: 'Enviar pendientes',
    path: '/billing/invoices/send-pending',
  },
] as const;

export function BillingControls() {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function triggerAction(action: (typeof BILLING_ACTIONS)[number]) {
    setPendingAction(action.id);
    setMessage(null);
    setError(null);

    try {
      const result = await requestClientApi<{
        issued?: number;
        sent?: number;
        message?: string;
      }>(action.path, {
        method: 'POST',
      });

      if (!result.response.ok) {
        throw new Error(
          extractClientApiError(result, `La API respondio con ${result.response.status}`),
        );
      }

      setMessage(result.payload?.message ?? 'Accion completada correctamente.');
      startTransition(() => router.refresh());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible ejecutar la accion de facturacion.',
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {BILLING_ACTIONS.map((action) => {
          const isPending = pendingAction === action.id;
          return (
            <button
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pendingAction !== null}
              key={action.id}
              onClick={() => {
                void triggerAction(action);
              }}
              type="button"
            >
              {isPending ? 'Procesando...' : action.label}
            </button>
          );
        })}
      </div>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
