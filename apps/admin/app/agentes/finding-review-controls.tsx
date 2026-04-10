'use client';

import { startTransition, useState } from 'react';
import { useRouter } from 'next/navigation';

import { extractClientApiError, requestClientApi } from '../../lib/client-api';

type FindingReviewControlsProps = {
  findingId: string;
};

export function FindingReviewControls({ findingId }: FindingReviewControlsProps) {
  const router = useRouter();
  const [pendingDecision, setPendingDecision] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(decision: 'APPROVED' | 'REJECTED') {
    setPendingDecision(decision);
    setError(null);

    try {
      const result = await requestClientApi<{ message?: string }>(
        `/agents/findings/${findingId}/review`,
        {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decision }),
        },
      );

      if (!result.response.ok) {
        throw new Error(
          extractClientApiError(result, `La API respondio con ${result.response.status}`),
        );
      }

      startTransition(() => router.refresh());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'No fue posible registrar la revision.');
    } finally {
      setPendingDecision(null);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pendingDecision !== null}
          onClick={() => {
            void submit('APPROVED');
          }}
          type="button"
        >
          {pendingDecision === 'APPROVED' ? 'Aprobando...' : 'Aprobar'}
        </button>
        <button
          className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={pendingDecision !== null}
          onClick={() => {
            void submit('REJECTED');
          }}
          type="button"
        >
          {pendingDecision === 'REJECTED' ? 'Rechazando...' : 'Rechazar'}
        </button>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
