'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PetOperationsDashboard } from '@/modules/pet/pet-operations-dashboard';
import { DashboardContextCardGrid } from '@/shared/dashboard/dashboard-context-card-grid';
import {
  buildDashboardExperienceCopy,
  getAccessibleWorkspaceModules,
  getContractedWorkspaceModules,
  resolveDashboardWorkspaceVariant,
  resolveModuleWorkspaceHref
} from '@/shared/dashboard/contextual-dashboard';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import {
  buildExecutiveAttentionSignals,
  buildExecutiveContextCards,
  buildExecutiveOnboardingSteps,
  buildExecutiveRecommendedActions,
} from '@/shared/dashboard/executive-dashboard';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { ApiClientError } from '@/shared/lib/http';
import { GettingStartedChecklist } from '@/shared/onboarding/getting-started';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { moduleService } from '@/shared/services/module-service';
import { PlatformDashboardSummary } from '@/shared/types/module';
import { PageTitle } from '@/shared/ui/page-title';

function DashboardNotice({ message }: { message: string }) {
  return <div className="ui-notice-error">{message}</div>;
}

export default function DashboardPage() {
  const platform = useFrontendPlatform();
  const [summary, setSummary] = useState<PlatformDashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setSummaryLoading(true);

    moduleService
      .getDashboardSummary()
      .then((result) => {
        if (!active) {
          return;
        }

        setSummary(result);
        setSummaryError(null);
        setSummaryLoading(false);
      })
      .catch((err) => {
        if (!active) {
          return;
        }

        setSummaryError(err instanceof ApiClientError ? err.message : 'Unable to load dashboard summary.');
        setSummaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const variant = useMemo(() => resolveDashboardWorkspaceVariant(platform), [platform]);
  const experience = useMemo(() => buildDashboardExperienceCopy(platform), [platform]);
  const contractedModules = useMemo(() => getContractedWorkspaceModules(platform), [platform]);
  const accessibleModules = useMemo(() => getAccessibleWorkspaceModules(platform), [platform]);
  const hasPetVisible = useMemo(
    () => accessibleModules.some((moduleItem) => moduleItem.code === 'PET'),
    [accessibleModules]
  );
  const visibleOfficialModules = useMemo(() => (
    hasPetVisible
      ? accessibleModules.filter((moduleItem) => moduleItem.code === 'PET')
      : accessibleModules.filter((moduleItem) => moduleItem.code !== 'IOT')
  ), [accessibleModules, hasPetVisible]);

  const visibleSummaryModuleCodes = useMemo(() => {
    return new Set(visibleOfficialModules.map((moduleItem) => moduleItem.code));
  }, [visibleOfficialModules]);

  const visibleModuleSummaries = useMemo(
    () => summary?.modules.filter((moduleSummary) => visibleSummaryModuleCodes.has(moduleSummary.moduleCode)) ?? [],
    [summary?.modules, visibleSummaryModuleCodes]
  );

  const recommendedActions = useMemo(
    () => buildExecutiveRecommendedActions(platform, visibleModuleSummaries),
    [platform, visibleModuleSummaries]
  );
  const attentionSignals = useMemo(
    () => buildExecutiveAttentionSignals(platform, visibleModuleSummaries),
    [platform, visibleModuleSummaries]
  );
  const contextCards = useMemo(
    () => buildExecutiveContextCards(platform, visibleModuleSummaries, recommendedActions, attentionSignals).slice(0, 3),
    [attentionSignals, platform, recommendedActions, visibleModuleSummaries]
  );
  const onboardingSteps = useMemo(
    () => buildExecutiveOnboardingSteps(platform, visibleModuleSummaries),
    [platform, visibleModuleSummaries]
  );

  const priorityActions = useMemo(() => {
    const seen = new Set<string>();

    return [...attentionSignals, ...recommendedActions]
      .filter((action) => {
        if (seen.has(action.key)) {
          return false;
        }

        seen.add(action.key);
        return true;
      })
      .slice(0, 3);
  }, [attentionSignals, recommendedActions]);

  const visibleModules = useMemo(() => {
    if (variant === 'platform') {
      return hasPetVisible
        ? platform.modules.items.filter((moduleItem) => moduleItem.code === 'PET')
        : platform.modules.items.filter((moduleItem) => moduleItem.code !== 'CORE_PLATFORM' && moduleItem.code !== 'IOT');
    }

    return hasPetVisible
      ? contractedModules.filter((moduleItem) => moduleItem.code === 'PET')
      : contractedModules.filter((moduleItem) => moduleItem.code !== 'IOT');
  }, [contractedModules, hasPetVisible, platform.modules.items, variant]);

  if (hasPetVisible) {
    return (
      <PetOperationsDashboard
        eyebrow="PetFlow"
        title="PetFlow overview"
        description="Visao principal da demo com atendimentos do dia, planos perto do fim, estoque baixo, cobranca do proximo ciclo e comissao do time."
        surfaceLabel="Official demo surface"
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title={hasPetVisible ? 'PetFlow overview' : variant === 'platform' ? 'Platform overview' : 'Workspace overview'}
        description={hasPetVisible
          ? 'Commercial launchpad for the PetFlow demo: daily schedule, recurring plans, stock alerts, and billing attention in one place.'
          : experience.description}
      />

      {summaryError ? <DashboardNotice message={summaryError} /> : null}
      {summaryLoading ? (
        <div className="rounded-lg border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3 text-sm text-[color:var(--app-shell-muted)]">
          Loading workspace overview...
        </div>
      ) : null}

      <DashboardContextCardGrid cards={contextCards} />

      {!summaryLoading && !summaryError && onboardingSteps.length > 0 && visibleModuleSummaries.length === 0 ? (
        <GettingStartedChecklist
          eyebrow={variant === 'platform' ? 'Workspace setup' : 'Getting started'}
          title={variant === 'platform' ? 'Prepare the next customer workspace' : `Get ${platform.branding.scopeName} moving`}
          description={
            variant === 'platform'
              ? 'Some contracted products still need their first records. Use this checklist to expose the smallest viable operating surface.'
              : 'Some contracted products still need their first records. Start with the essentials so the workspace becomes easier to sell and operate.'
          }
          steps={onboardingSteps}
        />
      ) : null}

      <section className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5 shadow-card">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-[color:var(--app-shell-heading)]">
            {hasPetVisible ? 'Official demo surface' : variant === 'platform' ? 'Visible products' : 'Products in this workspace'}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
            {hasPetVisible
              ? 'Keep the visible surface centered on PetFlow while the rest of the platform stays preserved internally.'
              : variant === 'platform'
                ? 'Keep the commercial product surface clear and expose only what is ready to be shown.'
                : 'Open the contracted module surfaces that matter right now.'}
          </p>
        </div>

        {platform.modules.error ? (
          <DashboardNotice message={platform.modules.error} />
        ) : platform.modules.loading ? (
          <div className="rounded-lg border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-4 py-3 text-sm text-[color:var(--app-shell-muted)]">
            Loading product visibility...
          </div>
        ) : visibleModules.length === 0 ? (
          <EmptyStateCard
            title="No visible products"
            description="No contracted product surface is currently being exposed for this workspace."
            actionLabel="Open settings"
            href="/settings"
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            {visibleModules.map((moduleItem) => {
              const href = resolveModuleWorkspaceHref(moduleItem.code);

              return (
                <article
                  key={moduleItem.code}
                  className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">
                        {moduleItem.code}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">
                        {moduleItem.name}
                      </h3>
                      <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">
                        {moduleItem.description}
                      </p>
                    </div>
                    <StatusBadge status={moduleItem.available ? 'active' : 'pending'} />
                  </div>

                  <p className="mt-4 text-sm text-[color:var(--app-shell-muted)]">
                    {moduleItem.available
                      ? 'Visible in the current workspace.'
                      : 'Kept out of the main surface until the workspace is fully ready.'}
                  </p>

                  {moduleItem.available ? (
                    <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">
                      {priorityActions.find((action) => action.eyebrow === moduleItem.code)?.title
                        ?? 'Open the module home to continue with the current workspace scope.'}
                    </p>
                  ) : null}

                  {href && moduleItem.available ? (
                    <Link
                      href={href}
                      className="mt-4 inline-flex text-sm font-medium text-[color:var(--tenant-accent)]"
                    >
                      Open module
                    </Link>
                  ) : (
                    <p className="mt-4 text-sm font-medium text-[color:var(--app-shell-muted)]">
                      This module stays paused in the main navigation for now.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
