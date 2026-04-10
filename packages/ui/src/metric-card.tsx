type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-[30px] border border-line/70 bg-white/92 p-6 shadow-ambient transition hover:-translate-y-[1px] hover:shadow-[0_24px_48px_rgba(15,20,30,0.12)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(252,209,34,0.85),rgba(88,176,219,0.55),rgba(207,95,159,0.65))]" />
      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-brand/10 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-14 w-14 rounded-full bg-sky/10 blur-2xl" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-accent">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.1rem]">
        {value}
      </p>
      {hint ? <p className="mt-2 text-sm text-slate-600">{hint}</p> : null}
    </article>
  );
}
