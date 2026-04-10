import type { PropsWithChildren, ReactNode } from 'react';

type PageShellProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}>;

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: PageShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="relative overflow-hidden rounded-[34px] border border-line/70 bg-white/90 p-8 shadow-ambient backdrop-blur">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#fcd122_0%,#58b0db_45%,#cf5f9f_100%)]" />
        <div className="pointer-events-none absolute -right-14 top-0 h-36 w-36 rounded-full bg-brand/[0.18] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-28 w-28 rounded-full bg-sky/[0.15] blur-3xl" />
        <div className="relative flex flex-col gap-5">
          {eyebrow ? <span className="brand-kicker">{eyebrow}</span> : null}
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {title}
              </h1>
              {description ? (
                <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex flex-wrap gap-3 rounded-[26px] border border-line/70 bg-white/75 p-3 shadow-sm">
                {actions}
              </div>
            ) : null}
          </div>
        </div>
      </header>
      <main className="flex flex-col gap-6">{children}</main>
    </div>
  );
}
