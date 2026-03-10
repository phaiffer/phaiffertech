'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { DashboardContextCardGrid } from '@/shared/dashboard/dashboard-context-card-grid';
import { DashboardQuickActions } from '@/shared/dashboard/dashboard-quick-actions';
import { DashboardSection } from '@/shared/dashboard/dashboard-section';
import {
  buildDashboardContextCards,
  buildDashboardExperienceCopy,
  buildDashboardQuickActions,
  getAccessibleWorkspaceModules,
  getContractedWorkspaceModules,
  resolveDashboardWorkspaceVariant,
  resolveModuleWorkspaceHref
} from '@/shared/dashboard/contextual-dashboard';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { ApiClientError } from '@/shared/lib/http';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { moduleService } from '@/shared/services/module-service';
import { PlatformDashboardSummary } from '@/shared/types/module';
import { PageTitle } from '@/shared/ui/page-title';

function DashboardNotice({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </div>
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
  const contextCards = useMemo(() => buildDashboardContextCards(platform), [platform]);
  const quickActions = useMemo(() => buildDashboardQuickActions(platform), [platform]);
  const contractedModules = useMemo(() => getContractedWorkspaceModules(platform), [platform]);
  const accessibleModules = useMemo(() => getAccessibleWorkspaceModules(platform), [platform]);

  const visibleSummaryModuleCodes = useMemo(() => {
    return new Set(accessibleModules.map((moduleItem) => moduleItem.code));
  }, [accessibleModules]);

  const moduleAvailabilityByCode = useMemo(
    () => new Map(platform.modules.items.map((moduleItem) => [moduleItem.code, moduleItem.available])),
    [platform.modules.items]
  );

  const visibleModuleSummaries = useMemo(
    () => summary?.modules.filter((moduleSummary) => visibleSummaryModuleCodes.has(moduleSummary.moduleCode)) ?? [],
    [summary?.modules, visibleSummaryModuleCodes]
  );

  return (
    <div className="space-y-5">
      <PageTitle title="Dashboard" description={experience.description} />

      <DashboardContextCardGrid cards={contextCards} />

      <DashboardQuickActions
        title={experience.actionsTitle}
        description={experience.actionsDescription}
        actions={quickActions}
      />

      {summaryError ? <DashboardNotice message={summaryError} /> : null}

      {summary?.coreSummary ? <DashboardSection section={summary.coreSummary} /> : null}

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
              Loading module availability...
            </div>
          ) : platform.modules.items.length === 0 ? (
            <EmptyStateCard
              title="No modules available"
              description="No module catalog entries were returned for the authenticated platform workspace."
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
              Loading contracted modules...
            </div>
          ) : contractedModules.length === 0 ? (
            <EmptyStateCard
              title="No contracted modules"
              description="This tenant does not currently expose any contracted product workspace."
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
            Loading module summaries...
          </div>
        ) : visibleModuleSummaries.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {visibleModuleSummaries.map((moduleSummary) => (
              <section
                key={moduleSummary.moduleCode}
                className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5 shadow-card"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">
                      {moduleSummary.moduleCode}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">
                      {moduleSummary.title}
                    </h3>
                    <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">
                      {moduleSummary.description}
                    </p>
                  </div>
                  <StatusBadge status={moduleAvailabilityByCode.get(moduleSummary.moduleCode) ? 'ok' : 'warn'} />
                </div>

                <MetricGrid cards={moduleSummary.summaryCards} columns="md:grid-cols-2" />

                <Link
                  href={moduleSummary.href}
                  className="mt-4 inline-flex text-sm font-medium text-[color:var(--tenant-accent)]"
                >
                  Open module dashboard
                </Link>
              </section>
            ))}
          </div>
        ) : (
          <EmptyStateCard
            title="No summaries available"
            description="No module summary is currently available for this workspace and access scope."
          />
        )}
      </section>
    </div>
  );
}
