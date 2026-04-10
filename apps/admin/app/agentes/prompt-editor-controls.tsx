'use client';

import { startTransition, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { AgentPromptView } from '../../lib/backoffice';
import { extractClientApiError, requestClientApi } from '../../lib/client-api';

type PromptEditorControlsProps = {
  prompt: AgentPromptView;
};

export function PromptEditorControls({ prompt }: PromptEditorControlsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [purpose, setPurpose] = useState(prompt.purpose);
  const [systemPrompt, setSystemPrompt] = useState(prompt.systemPrompt);
  const [userPromptTemplate, setUserPromptTemplate] = useState(prompt.userPromptTemplate);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function savePrompt() {
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const result = await requestClientApi<{ message?: string; version?: string }>(
        `/agents/prompts/${encodeURIComponent(prompt.key)}`,
        {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purpose,
          systemPrompt,
          userPromptTemplate,
          note,
        }),
        },
      );

      if (!result.response.ok) {
        throw new Error(
          extractClientApiError(result, `La API respondio con ${result.response.status}`),
        );
      }

      const payload = result.payload;
      setMessage(`Prompt guardado. Nueva version activa: ${payload?.version ?? 'actualizada'}.`);
      setNote('');
      startTransition(() => router.refresh());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No fue posible actualizar el prompt.',
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
          onClick={() => {
            setIsOpen((current) => !current);
          }}
          type="button"
        >
          {isOpen ? 'Ocultar editor' : 'Editar prompt'}
        </button>
      </div>

      {isOpen ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <label className="block text-sm font-medium text-slate-800">
            Proposito
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-300"
              onChange={(event) => setPurpose(event.target.value)}
              value={purpose}
            />
          </label>

          <label className="block text-sm font-medium text-slate-800">
            System prompt
            <textarea
              className="mt-2 min-h-[140px] w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-300"
              onChange={(event) => setSystemPrompt(event.target.value)}
              value={systemPrompt}
            />
          </label>

          <label className="block text-sm font-medium text-slate-800">
            Plantilla de usuario
            <textarea
              className="mt-2 min-h-[120px] w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-300"
              onChange={(event) => setUserPromptTemplate(event.target.value)}
              value={userPromptTemplate}
            />
          </label>

          <label className="block text-sm font-medium text-slate-800">
            Nota de cambio
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-sky-300"
              onChange={(event) => setNote(event.target.value)}
              placeholder="Ej.: Ajuste de tono comercial para Instagram"
              value={note}
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSaving}
              onClick={() => {
                void savePrompt();
              }}
              type="button"
            >
              {isSaving ? 'Guardando...' : 'Guardar nueva version'}
            </button>
          </div>

          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
