'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import {
  isCapabilityReady,
  readyCapability,
  unavailableCapability,
  type ModuleCapability
} from '@/shared/modules/module-capability';
import type { GettingStartedStep } from '@/shared/onboarding/getting-started';

export type ModuleWorkspaceChipTone = 'accent' | 'neutral';

export type ModuleWorkspaceChip = {
  label: string;
  value: string | number;
  tone?: ModuleWorkspaceChipTone;
};

export type ModuleWorkspaceOverviewCard = {
  label: string;
  value: string | number;
  description: string;
  status?: string | null;
  capability?: ModuleCapability;
};

export type ModuleWorkspaceFact = {
  label: string;
  value: string;
  description?: string;
  status?: string | null;
};

export type ModuleWorkspaceAction = {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  permission?: string;
  anyOf?: string[];
  available?: boolean;
  restrictionTitle?: string;
  restrictionDescription?: string;
  status?: string | null;
  capability?: ModuleCapability;
};

export type ModuleWorkspaceGuidanceStep = GettingStartedStep & {
  capability?: ModuleCapability;
};

function resolveActionCapability(action: ModuleWorkspaceAction) {
  if (action.capability) {
    return action.capability;
  }

  if (action.available === false) {
    return unavailableCapability({
      title: action.restrictionTitle ?? 'Unavailable in the current workspace',
      description: action.restrictionDescription ?? action.description,
      status: action.status ?? 'restricted',
      actionLabel: 'Unavailable in current workspace role'
    });
  }

  return readyCapability(action.status);
}

function chipClasses(tone: ModuleWorkspaceChipTone) {
  if (tone === 'neutral') {
    return 'border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] text-[color:var(--app-shell-text)]';
  }

  return 'border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] text-[color:var(--tenant-accent)]';
}

export function ModuleWorkspaceHero({
  eyebrow,
  title,
  description,
  chips,
  aside
}: {
  eyebrow: string;
  title: string;
  description: string;
  chips?: ModuleWorkspaceChip[];
  aside?: ReactNode;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div
        className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-6 shadow-card"
        style={{
          backgroundImage:
            'radial-gradient(circle at top left, var(--tenant-accent-soft), transparent 36%), '
            + 'radial-gradient(circle at bottom right, var(--tenant-primary-soft), transparent 32%)'
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--tenant-accent)]">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--app-shell-heading)]">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--app-shell-muted)]">
          {description}
        </p>
        {chips && chips.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {chips.map((chip) => (
              <div
                key={`${chip.label}-${chip.value}`}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${chipClasses(chip.tone ?? 'accent')}`}
              >
                <span>{chip.label}</span>
                <span className="text-[color:var(--app-shell-heading)]">{chip.value}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {aside ? (
        <div className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5 shadow-card">
          {aside}
        </div>
      ) : null}
    </section>
  );
}

export function ModuleWorkspaceFactList({ facts }: { facts: ModuleWorkspaceFact[] }) {
  return (
    <div className="space-y-3">
      {facts.map((fact) => (
        <div
          key={`${fact.label}-${fact.value}`}
          className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">
                {fact.label}
              </p>
              <p className="mt-2 text-sm font-semibold text-[color:var(--app-shell-heading)]">{fact.value}</p>
            </div>
            {fact.status ? <StatusBadge status={fact.status} /> : null}
          </div>
          {fact.description ? (
            <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">{fact.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ModuleWorkspaceOverviewGrid({ cards }: { cards: ModuleWorkspaceOverviewCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={`${card.label}-${card.value}`}
          className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5 shadow-card"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">
                {card.label}
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--app-shell-heading)]">
                {card.value}
              </p>
            </div>
            {card.status ? <StatusBadge status={card.status} /> : null}
          </div>
          <p className="mt-3 text-sm text-[color:var(--app-shell-muted)]">{card.description}</p>
          {!isCapabilityReady(card.capability) && (card.capability?.title || card.capability?.description) ? (
            <div className="mt-4 rounded-2xl border border-dashed border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-4 py-3">
              {card.capability?.title ? (
                <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">{card.capability.title}</p>
              ) : null}
              {card.capability?.description ? (
                <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">{card.capability.description}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function ModuleWorkspaceSection({
  title,
  description,
  action,
  children
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5 shadow-card">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[color:var(--app-shell-heading)]">{title}</h2>
          <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ModuleWorkspaceQuickActionGrid({
  title,
  description,
  actions,
  emptyTitle,
  emptyDescription
}: {
  title: string;
  description: string;
  actions: ModuleWorkspaceAction[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <ModuleWorkspaceSection title={title} description={description}>
      {actions.length === 0 ? (
        <EmptyStateCard title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => {
            const capability = resolveActionCapability(action);
            const interactive = capability.interactive;
            const content = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
                      {action.eyebrow}
                    </p>
                    <h3 className="mt-3 text-lg font-semibold text-[color:var(--app-shell-heading)]">
                      {action.title}
                    </h3>
                  </div>
                  <StatusBadge status={capability.status ?? action.status ?? null} />
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--app-shell-muted)]">{action.description}</p>
                {!isCapabilityReady(capability) && (capability.title || capability.description) ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
                    {capability.title ? (
                      <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">{capability.title}</p>
                    ) : null}
                    {capability.description ? (
                      <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">{capability.description}</p>
                    ) : null}
                  </div>
                ) : null}
                <span className="mt-5 inline-flex text-sm font-semibold text-[color:var(--tenant-accent)]">
                  {capability.actionLabel}
                </span>
              </>
            );

            if (interactive) {
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-5 transition hover:border-[color:var(--tenant-accent)] hover:shadow-card"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={action.href}
                className="rounded-3xl border border-dashed border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-5 opacity-90"
              >
                {content}
              </div>
            );
          })}
        </div>
      )}
    </ModuleWorkspaceSection>
  );
}

export function ModuleWorkspaceGuidance({
  title,
  description,
  steps
}: {
  title: string;
  description: string;
  steps: ModuleWorkspaceGuidanceStep[];
}) {
  if (steps.length === 0) {
    return <EmptyStateCard title={title} description={description} />;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">{title}</p>
        <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => {
          const href = step.href;
          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
                    {step.eyebrow}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold text-[color:var(--app-shell-heading)]">
                    {step.title}
                  </h3>
                </div>
                {step.status ? <StatusBadge status={step.status} /> : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-[color:var(--app-shell-muted)]">{step.description}</p>
              <span className="mt-5 inline-flex text-sm font-semibold text-[color:var(--tenant-accent)]">
                {href ? step.capability?.actionLabel ?? 'Open next step' : 'Guided workspace step'}
              </span>
            </>
          );

          if (href) {
            return (
              <Link
                key={step.key}
                href={href}
                className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-5 transition hover:border-[color:var(--tenant-accent)] hover:shadow-card"
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={step.key}
              className="rounded-3xl border border-dashed border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-5"
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ModuleWorkspaceState({
  tone,
  title,
  description
}: {
  tone: 'neutral' | 'error';
  title: string;
  description: string;
}) {
  return (
    <div
      className={
        tone === 'error'
          ? 'rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700'
          : 'rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-4 py-3 text-sm text-[color:var(--app-shell-muted)]'
      }
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{description}</p>
    </div>
  );
}
