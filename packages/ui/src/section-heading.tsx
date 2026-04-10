import type { ReactNode } from 'react';

type SectionHeadingProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
};

export function SectionHeading({ title, description, eyebrow, action }: SectionHeadingProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <span className="inline-flex items-center rounded-full border border-brand/30 bg-brand/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
          {title}
        </h2>
        {description ? (
          <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex flex-wrap gap-3">{action}</div> : null}
    </div>
  );
}
