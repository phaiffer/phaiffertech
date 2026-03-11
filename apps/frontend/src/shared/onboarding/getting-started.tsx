'use client';

import Link from 'next/link';
import { StatusBadge } from '@/shared/dashboard/status-badge';

export type GettingStartedStep = {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
  href?: string;
  status?: string | null;
  actionLabel?: string;
};

type GettingStartedChecklistProps = {
  eyebrow?: string;
  title: string;
  description: string;
  steps: GettingStartedStep[];
  variant?: 'default' | 'dark';
};

function surfaceClasses(variant: 'default' | 'dark') {
  if (variant === 'dark') {
    return 'border-cyan-500/15 bg-[linear-gradient(140deg,rgba(6,18,35,0.96),rgba(8,25,47,0.9),rgba(5,15,30,0.96))] text-white';
  }

  return 'border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] text-[color:var(--app-shell-heading)]';
}

function mutedTextClasses(variant: 'default' | 'dark') {
  return variant === 'dark' ? 'text-slate-300' : 'text-[color:var(--app-shell-muted)]';
}

function eyebrowClasses(variant: 'default' | 'dark') {
  return variant === 'dark' ? 'text-cyan-300/85' : 'text-[color:var(--tenant-accent)]';
}

function accentChipClasses(variant: 'default' | 'dark') {
  if (variant === 'dark') {
    return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200';
  }

  return 'border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] text-[color:var(--tenant-accent)]';
}

function neutralChipClasses(variant: 'default' | 'dark') {
  if (variant === 'dark') {
    return 'border-slate-700 bg-slate-950/60 text-slate-200';
  }

  return 'border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] text-[color:var(--app-shell-text)]';
}

function stepSurfaceClasses(variant: 'default' | 'dark', interactive: boolean) {
  if (variant === 'dark') {
    return interactive
      ? 'border-slate-800 bg-slate-950/35 transition hover:-translate-y-0.5 hover:border-cyan-400/35 hover:bg-slate-950/60'
      : 'border-dashed border-slate-700 bg-slate-950/35 opacity-90';
  }

  return interactive
    ? 'border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] transition hover:border-[color:var(--tenant-accent)] hover:shadow-card'
    : 'border-dashed border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] opacity-90';
}

function stepNumberClasses(variant: 'default' | 'dark') {
  if (variant === 'dark') {
    return 'border-cyan-500/35 bg-cyan-500/10 text-cyan-200';
  }

  return 'border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] text-[color:var(--tenant-accent)]';
}

function stepTitleClasses(variant: 'default' | 'dark') {
  return variant === 'dark' ? 'text-white' : 'text-[color:var(--app-shell-heading)]';
}

function stepDescriptionClasses(variant: 'default' | 'dark') {
  return variant === 'dark' ? 'text-slate-400' : 'text-[color:var(--app-shell-muted)]';
}

function actionLabelClasses(variant: 'default' | 'dark') {
  return variant === 'dark' ? 'text-cyan-200' : 'text-[color:var(--tenant-accent)]';
}

export function GettingStartedChecklist({
  eyebrow = 'Getting Started',
  title,
  description,
  steps,
  variant = 'default'
}: GettingStartedChecklistProps) {
  const actionableSteps = steps.filter((step) => Boolean(step.href)).length;
  const guidedSteps = steps.length;
  const blockedSteps = guidedSteps - actionableSteps;

  return (
    <section className={`rounded-3xl border p-5 shadow-card ${surfaceClasses(variant)}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${eyebrowClasses(variant)}`}>
            {eyebrow}
          </p>
          <h2 className={`mt-3 text-xl font-semibold ${stepTitleClasses(variant)}`}>{title}</h2>
          <p className={`mt-2 max-w-3xl text-sm leading-6 ${mutedTextClasses(variant)}`}>{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`inline-flex items-center rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${accentChipClasses(variant)}`}>
            Actionable now {actionableSteps}
          </span>
          <span className={`inline-flex items-center rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${neutralChipClasses(variant)}`}>
            Guided steps {guidedSteps}
          </span>
          {blockedSteps > 0 ? (
            <span className={`inline-flex items-center rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${neutralChipClasses(variant)}`}>
              Needs access {blockedSteps}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => {
          const interactive = Boolean(step.href);
          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold ${stepNumberClasses(variant)}`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${eyebrowClasses(variant)}`}>
                      {step.eyebrow}
                    </p>
                    <h3 className={`mt-2 text-lg font-semibold ${stepTitleClasses(variant)}`}>{step.title}</h3>
                  </div>
                </div>
                {step.status ? <StatusBadge status={step.status} /> : null}
              </div>
              <p className={`mt-4 text-sm leading-6 ${stepDescriptionClasses(variant)}`}>{step.description}</p>
              <span className={`mt-5 inline-flex text-sm font-semibold ${actionLabelClasses(variant)}`}>
                {step.href ? step.actionLabel ?? 'Open next step' : step.actionLabel ?? 'Guided step'}
              </span>
            </>
          );

          if (step.href) {
            return (
              <Link
                key={step.key}
                href={step.href}
                className={`rounded-3xl border p-5 ${stepSurfaceClasses(variant, true)}`}
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={step.key}
              className={`rounded-3xl border p-5 ${stepSurfaceClasses(variant, false)}`}
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
