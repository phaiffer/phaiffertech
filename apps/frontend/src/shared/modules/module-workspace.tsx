'use client';

'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  sharedCompactTextClass,
  sharedDashedSurfaceClass,
  sharedEyebrowClass,
  sharedMutedSurfaceClass,
  sharedPageTitleClass,
  sharedPanelSurfaceClass,
  sharedSectionHeadingClass,
  sharedSupportingTextClass
} from '@/shared/components/public-visual-system';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n } from '@/shared/i18n/app-i18n-provider';
import type { AppLocale } from '@/shared/i18n/app-i18n-provider';
import { getAppMessages } from '@/shared/i18n/messages';
import {
  workspaceDashedSurfaceStyle,
  workspaceMutedSurfaceStyle,
  workspacePanelSurfaceStyle
} from '@/shared/modules/module-workspace-visual';
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
  anyEntitlements?: readonly string[];
  available?: boolean;
  restrictionTitle?: string;
  restrictionDescription?: string;
  status?: string | null;
  capability?: ModuleCapability;
};

export type ModuleWorkspaceGuidanceStep = GettingStartedStep & {
  capability?: ModuleCapability;
};

function resolveActionCapability(action: ModuleWorkspaceAction, locale: AppLocale) {
  const copy = getAppMessages(locale).moduleCapability;
  if (action.capability) {
    return action.capability;
  }

  if (action.available === false) {
    return unavailableCapability({
      title: action.restrictionTitle ?? copy.unavailableGenericTitle,
      description: action.restrictionDescription ?? action.description,
      status: action.status ?? 'restrito',
      actionLabel: copy.unavailableForRole
    }, locale);
  }

  return readyCapability(action.status, locale);
}

function chipClasses(tone: ModuleWorkspaceChipTone) {
  if (tone === 'neutral') {
    return 'border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] text-[color:var(--app-shell-text)]';
  }

  return 'border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] text-[color:var(--tenant-accent)]';
}

const interactiveWorkspaceCardClass =
  `${sharedMutedSurfaceClass} p-5 transition-all duration-200 hover:border-[color:var(--tenant-accent)] hover:shadow-md`;

const disabledWorkspaceCardClass = `${sharedDashedSurfaceClass} p-5 opacity-90`;
const workspaceLabelClass = 'text-xs font-semibold uppercase tracking-[0.18em] text-slate-900';
const workspaceValueClass = 'mt-3 text-[1.9rem] font-bold tracking-[-0.04em] text-slate-900';
const workspaceSupportingCopyClass = 'mt-2 text-sm leading-6 text-slate-800';
const workspaceBodyCopyClass = 'text-sm leading-6 text-slate-800';

export function ModuleWorkspaceHero({
  eyebrow,
  title,
  description,
  chips,
  aside,
  action
}: {
  eyebrow: string;
  title: string;
  description: string;
  chips?: ModuleWorkspaceChip[];
  aside?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div
        className={`${sharedPanelSurfaceClass} p-6 sm:p-7`}
        style={{
          ...workspacePanelSurfaceStyle,
          backgroundImage:
            'linear-gradient(180deg, var(--workspace-panel-tint) 0%, transparent 180px), '
            + 'radial-gradient(circle at top left, var(--tenant-accent-soft), transparent 36%), '
            + 'radial-gradient(circle at bottom right, var(--tenant-primary-soft), transparent 32%), '
            + 'radial-gradient(circle at top right, var(--workspace-panel-support), transparent 48%)'
        }}
      >
        <p className={sharedEyebrowClass}>{eyebrow}</p>
        <h1 className={`mt-4 ${sharedPageTitleClass}`}>{title}</h1>
        <p className={`mt-4 max-w-3xl ${sharedSupportingTextClass}`}>{description}</p>
        {action ? <div className="mt-6">{action}</div> : null}
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
        <div className={`${sharedPanelSurfaceClass} p-5`} style={workspacePanelSurfaceStyle}>
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
          className={`${sharedMutedSurfaceClass} p-4`}
          style={workspaceMutedSurfaceStyle}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={workspaceLabelClass}>
                {fact.label}
              </p>
              <p className={workspaceValueClass}>{fact.value}</p>
            </div>
            {fact.status ? <StatusBadge status={fact.status} /> : null}
          </div>
          {fact.description ? (
            <p className={workspaceSupportingCopyClass}>{fact.description}</p>
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
          className={`${sharedPanelSurfaceClass} p-5`}
          style={workspacePanelSurfaceStyle}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={workspaceLabelClass}>
                {card.label}
              </p>
              <p className={workspaceValueClass}>
                {card.value}
              </p>
            </div>
            {card.status ? <StatusBadge status={card.status} /> : null}
          </div>
          <p className={workspaceSupportingCopyClass}>{card.description}</p>
          {!isCapabilityReady(card.capability) && (card.capability?.title || card.capability?.description) ? (
            <div className={`mt-4 ${sharedDashedSurfaceClass} px-4 py-3`} style={workspaceDashedSurfaceStyle}>
              {card.capability?.title ? (
                <p className={sharedSectionHeadingClass}>{card.capability.title}</p>
              ) : null}
              {card.capability?.description ? (
                <p className={workspaceSupportingCopyClass}>{card.capability.description}</p>
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
    <section className={`${sharedPanelSurfaceClass} p-5`} style={workspacePanelSurfaceStyle}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className={sharedSectionHeadingClass}>{title}</h2>
          <p className={`mt-1 ${sharedCompactTextClass}`}>{description}</p>
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
  const { locale } = useAppI18n();
  return (
    <ModuleWorkspaceSection title={title} description={description}>
      {actions.length === 0 ? (
        <EmptyStateCard title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {actions.map((action) => {
            const capability = resolveActionCapability(action, locale);
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
                <p className={workspaceSupportingCopyClass}>{action.description}</p>
                {!isCapabilityReady(capability) && (capability.title || capability.description) ? (
                  <div
                    className="mt-4 rounded-2xl border border-dashed border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3"
                    style={workspaceDashedSurfaceStyle}
                  >
                    {capability.title ? (
                      <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">{capability.title}</p>
                    ) : null}
                    {capability.description ? (
                      <p className={workspaceSupportingCopyClass}>{capability.description}</p>
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
                  className={interactiveWorkspaceCardClass}
                  style={workspaceMutedSurfaceStyle}
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={action.href}
                className={disabledWorkspaceCardClass}
                style={workspaceDashedSurfaceStyle}
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
  const { messages } = useAppI18n();
  if (steps.length === 0) {
    return <EmptyStateCard title={title} description={description} />;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className={sharedSectionHeadingClass}>{title}</p>
        <p className={`mt-1 ${sharedCompactTextClass}`}>{description}</p>
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
              <p className={workspaceSupportingCopyClass}>{step.description}</p>
              <span className="mt-5 inline-flex text-sm font-semibold text-[color:var(--tenant-accent)]">
                {href ? step.capability?.actionLabel ?? messages.moduleCapability.openNextStep : messages.moduleCapability.guidedWorkspaceStep}
              </span>
            </>
          );

          if (href) {
            return (
              <Link
                key={step.key}
                href={href}
                className={interactiveWorkspaceCardClass}
                style={workspaceMutedSurfaceStyle}
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={step.key}
              className={disabledWorkspaceCardClass}
              style={workspaceDashedSurfaceStyle}
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
          ? 'rounded-2xl border border-destructive/30 bg-destructive-muted px-4 py-3 text-sm text-destructive'
          : `${sharedMutedSurfaceClass} px-4 py-3 ${workspaceBodyCopyClass}`
      }
      style={tone === 'error' ? undefined : workspaceMutedSurfaceStyle}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{description}</p>
    </div>
  );
}
