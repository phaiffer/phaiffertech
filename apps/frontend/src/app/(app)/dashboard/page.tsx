'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DashboardContextCardGrid } from '@/shared/dashboard/dashboard-context-card-grid';
import { DashboardQuickActions } from '@/shared/dashboard/dashboard-quick-actions';
import { DashboardSection } from '@/shared/dashboard/dashboard-section';
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
  buildExecutiveModuleSnapshots,
  buildExecutiveOnboardingSteps,
  buildExecutiveRecommendedActions,
} from '@/shared/dashboard/executive-dashboard';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { ApiClientError } from '@/shared/lib/http';
import { GettingStartedChecklist } from '@/shared/onboarding/getting-started';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { moduleService } from '@/shared/services/module-service';
import { DashboardListItem } from '@/shared/types/dashboard';
import { PlatformDashboardSummary } from '@/shared/types/module';
import { PageTitle } from '@/shared/ui/page-title';

function DashboardNotice({ message }: { message: string }) {
  return (
    <div className="ui-notice-error">
      {message}
    </div>
  );
}

function formatTimestamp(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function ExecutiveActivityList({
  title,
  description,
  items,
  emptyTitle,
  emptyDescription,
  actionLabel,
  href
}: {
  title: string;
  description: string;
  items: DashboardListItem[];
  emptyTitle: string;
  emptyDescription: string;
  actionLabel: string;
  href: string;
}) {
  return (
    <div className="mt-5">
      <div>
        <h4 className="text-sm font-semibold text-[color:var(--app-shell-heading)]">{title}</h4>
        <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyStateCard
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={actionLabel}
            href={href}
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => {
            const content = (
              <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">{item.label}</p>
                    {item.sublabel ? (
                      <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">{item.sublabel}</p>
                    ) : null}
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                {item.timestamp ? (
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                    {formatTimestamp(item.timestamp)}
                  </p>
                ) : null}
              </div>
            );

            return item.href ? (
              <Link key={item.id} href={item.href}>
                {content}
              </Link>
            ) : (
              <div key={item.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExecutiveModuleCard({
  snapshot
}: {
  snapshot: ReturnType<typeof buildExecutiveModuleSnapshots>[number];
}) {
  return (
    <article className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">
            {snapshot.moduleCode}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">
            {snapshot.title}
          </h3>
          <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">
            {snapshot.description}
          </p>
        </div>
        <StatusBadge status={snapshot.status} />
      </div>

      <div className="mt-5">
        <MetricGrid cards={snapshot.summaryCards} columns="md:grid-cols-2" />
      </div>

      <ExecutiveActivityList
        title={snapshot.featuredTitle}
        description={snapshot.featuredDescription}
        items={snapshot.featuredItems}
        emptyTitle={snapshot.emptyTitle}
        emptyDescription={snapshot.emptyDescription}
        actionLabel={snapshot.nextAction.title}
        href={snapshot.nextAction.href}
      />

      <div className="mt-5 rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
          Next action
        </p>
        <h4 className="mt-2 text-base font-semibold text-[color:var(--app-shell-heading)]">
          {snapshot.nextAction.title}
        </h4>
        <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">
          {snapshot.nextAction.description}
        </p>
        <Link
          href={snapshot.nextAction.href}
          className="mt-4 inline-flex text-sm font-semibold text-[color:var(--tenant-accent)]"
        >
          {snapshot.nextAction.title}
        </Link>
      </div>
    </article>
  );
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

  const variant = useMemo(
    () => resolveDashboardWorkspaceVariant(platform),
    [platform]
  );
  const experience = useMemo(() => buildDashboardExperienceCopy(platform), [platform]);
  const contractedModules = useMemo(() => getContractedWorkspaceModules(platform), [platform]);
  const accessibleModules = useMemo(() => getAccessibleWorkspaceModules(platform), [platform]);

  const visibleSummaryModuleCodes = useMemo(() => {
    return new Set(accessibleModules.map((moduleItem) => moduleItem.code));
  }, [accessibleModules]);

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
    () => buildExecutiveContextCards(platform, visibleModuleSummaries, recommendedActions, attentionSignals),
    [attentionSignals, platform, recommendedActions, visibleModuleSummaries]
  );
  const onboardingSteps = useMemo(
    () => buildExecutiveOnboardingSteps(platform, visibleModuleSummaries),
    [platform, visibleModuleSummaries]
  );
  const moduleSnapshots = useMemo(
    () => buildExecutiveModuleSnapshots(platform, visibleModuleSummaries),
    [platform, visibleModuleSummaries]
  );

  return (
    <div className="space-y-5">
      <PageTitle title="Executive Dashboard" description={experience.description} />

      <DashboardContextCardGrid cards={contextCards} />

      <DashboardQuickActions
        title={experience.actionsTitle}
        description={experience.actionsDescription}
        actions={recommendedActions}
      />

      {summaryError ? <DashboardNotice message={summaryError} /> : null}
      {summaryLoading ? (
        <div className="rounded-lg border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3 text-sm text-[color:var(--app-shell-muted)]">
          Loading executive signals...
        </div>
      ) : null}

      {summary?.coreSummary ? <DashboardSection section={summary.coreSummary} /> : null}

      {!summaryLoading && !summaryError && onboardingSteps.length > 0 ? (
        <GettingStartedChecklist
          eyebrow={variant === 'platform' ? 'Workspace Setup' : 'Guided Onboarding'}
          title={variant === 'platform' ? 'Guide the next product setup' : `Get ${platform.branding.scopeName} moving`}
          description={
            variant === 'platform'
              ? 'Some contracted products still need their first operational records. Start with the setup steps below so the executive dashboard can begin surfacing real signals.'
              : 'Some contracted modules still need their first operational records. Start with the setup steps below so the workspace can begin surfacing real signals.'
          }
          steps={onboardingSteps}
        />
      ) : null}

      {attentionSignals.length > 0 ? (
        <DashboardQuickActions
          title="Needs Attention"
          description="These signals should be addressed before deeper drill-down work."
          actions={attentionSignals}
        />
      ) : null}

      {variant === 'platform' ? (
        <section className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5 shadow-card">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-[color:var(--app-shell-heading)]">
              {experience.modulesTitle}
            </h2>
            <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
              {experience.modulesDescription}
            </p>
          </div>

          {platform.modules.error ? (
            <DashboardNotice message={platform.modules.error} />
          ) : platform.modules.loading ? (
            <div className="rounded-lg border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-4 py-3 text-sm text-[color:var(--app-shell-muted)]">
              Loading workspace coverage...
            </div>
          ) : platform.modules.items.length === 0 ? (
            <EmptyStateCard
              title="No modules available"
              description="No module catalog entries were returned for the authenticated platform workspace."
              actionLabel="Open settings"
              href="/settings"
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              {platform.modules.items.map((moduleItem) => (
                <div
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
                    <StatusBadge status={moduleItem.available ? 'ok' : 'warn'} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 text-xs text-[color:var(--app-shell-muted)]">
                      <span>Tenant binding</span>
                      <StatusBadge status={moduleItem.moduleEnabled ? 'active' : 'offline'} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[color:var(--app-shell-muted)]">
                      <span>Feature exposure</span>
                      <StatusBadge status={moduleItem.featureFlagEnabled ? 'ok' : 'warn'} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5 shadow-card">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-[color:var(--app-shell-heading)]">
              {experience.modulesTitle}
            </h2>
            <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
              {experience.modulesDescription}
            </p>
          </div>

          {platform.modules.error ? (
            <DashboardNotice message={platform.modules.error} />
          ) : platform.modules.loading ? (
            <div className="rounded-lg border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-4 py-3 text-sm text-[color:var(--app-shell-muted)]">
              Loading workspace coverage...
            </div>
          ) : contractedModules.length === 0 ? (
            <EmptyStateCard
              title="No contracted modules"
              description="This tenant does not currently expose any contracted product workspace."
              actionLabel="Open settings"
              href="/settings"
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-3">
              {contractedModules.map((moduleItem) => {
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
                        ? 'Available in this workspace.'
                        : 'Contracted for this tenant and awaiting final workspace availability.'}
                    </p>

                    {href && moduleItem.available ? (
                      <Link
                        href={href}
                        className="mt-4 inline-flex text-sm font-medium text-[color:var(--tenant-accent)]"
                      >
                        Open module workspace
                      </Link>
                    ) : (
                      <p className="mt-4 text-sm font-medium text-[color:var(--app-shell-muted)]">
                        Module navigation will appear here once the workspace is fully exposed.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[color:var(--app-shell-heading)]">
            {experience.summariesTitle}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
            {experience.summariesDescription}
          </p>
        </div>

        {summaryLoading ? (
          <div className="rounded-lg border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3 text-sm text-[color:var(--app-shell-muted)]">
            Loading module executive summaries...
          </div>
        ) : moduleSnapshots.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {moduleSnapshots.map((snapshot) => (
              <ExecutiveModuleCard key={snapshot.moduleCode} snapshot={snapshot} />
            ))}
          </div>
        ) : (
          <EmptyStateCard
            title="No summaries available"
            description="No module summary is currently available for this workspace and access scope."
            actionLabel="Open settings"
            href="/settings"
          />
        )}
      </section>
    </div>
  );
}
