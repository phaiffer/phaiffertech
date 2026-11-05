'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { petService } from '@/shared/services/pet-service';
import type { DashboardCountMetric } from '@/shared/types/dashboard';
import type { PetInsightsSummary } from '@/shared/types/pet';
import { PageTitle } from '@/shared/ui/page-title';

type MetricBarsProps = {
  metrics: DashboardCountMetric[];
  emptyMessage: string;
  showShare?: boolean;
  renderLabel?: (metric: DashboardCountMetric) => ReactNode;
};

function MetricBars({ metrics, emptyMessage, showShare = false, renderLabel }: MetricBarsProps) {
  const { locale } = useAppI18n();

  if (metrics.length === 0) {
    return <p className="text-sm text-[var(--muted)]">{emptyMessage}</p>;
  }

  const maxValue = Math.max(...metrics.map((metric) => metric.value), 1);
  const total = metrics.reduce((sum, metric) => sum + metric.value, 0);
  const numberFormat = new Intl.NumberFormat(locale);
  const shareFormat = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });

  return (
    <ul className="space-y-2.5">
      {metrics.map((metric) => (
        <li key={metric.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-sm sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto]">
          <span className="truncate text-[var(--ink)]">{renderLabel ? renderLabel(metric) : metric.label}</span>
          <span className="order-last col-span-2 h-2 overflow-hidden rounded-sm bg-[var(--bg-subtle)] sm:order-none sm:col-span-1" aria-hidden="true">
            <span className="block h-full rounded-sm bg-[var(--ink)]" style={{ width: `${Math.max((metric.value / maxValue) * 100, 2)}%` }} />
          </span>
          <span className="ui-mono whitespace-nowrap text-right text-[var(--ink)]">
            {numberFormat.format(metric.value)}
            {showShare && total > 0 ? (
              <span className="ml-2 text-xs text-[var(--muted)]">{shareFormat.format(metric.value / total)}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

type InsightSectionProps = {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
};

function InsightSection({ id, title, description, children }: InsightSectionProps) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div>
        <h2 id={id} className="text-sm font-semibold text-[var(--ink)]">{title}</h2>
        <p className="text-xs text-[var(--muted)]">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function PetInsightsPage() {
  const { locale } = useAppI18n();
  const copy = useAppMessages().screens.petInsights;
  const [insights, setInsights] = useState<PetInsightsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadErrorMessage = copy.insightsLoadError;
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await petService.getInsightsSummary();
      setInsights(result);
    } catch (err) {
      setError(resolveApiErrorMessage(err, loadErrorMessage));
    } finally {
      setLoading(false);
    }
  }, [loadErrorMessage]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasData = insights && (
    insights.newClientsThisMonth > 0
    || insights.newClientsLastMonth > 0
    || insights.topServices.length > 0
    || insights.speciesMix.length > 0
    || insights.appointmentsByStatus.length > 0
  );

  const numberFormat = new Intl.NumberFormat(locale);
  const delta = insights ? insights.newClientsThisMonth - insights.newClientsLastMonth : 0;
  const deltaLabel = insights && insights.newClientsLastMonth > 0
    ? copy.deltaVsLastMonth.replace('{delta}', `${delta > 0 ? '+' : ''}${numberFormat.format(delta)}`)
    : null;
  const totalAppointments = insights?.appointmentsByStatus.reduce((sum, metric) => sum + metric.value, 0) ?? 0;

  return (
    <PermissionGuard
      permission="pet.dashboard.read"
      fallback={<div className="ui-notice-warning">{copy.insightsNoPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle title={copy.insightsTitle} description={copy.insightsDescription} />

        {loading ? <div className="ui-notice-neutral">{copy.insightsLoading}</div> : null}
        {error ? <div className="ui-notice-error">{error}</div> : null}

        {insights && hasData ? (
          <>
            <dl className="grid gap-4 border-y border-[color:var(--line)] py-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-[var(--muted)]">{copy.newClientsThisMonth}</dt>
                <dd className="ui-mono mt-0.5 text-lg font-semibold text-[var(--ink)]">{numberFormat.format(insights.newClientsThisMonth)}</dd>
                {deltaLabel ? (
                  <dd className={`text-xs ${delta < 0 ? 'text-[var(--danger)]' : 'text-[var(--ink-2)]'}`}>{deltaLabel}</dd>
                ) : null}
              </div>
              <div>
                <dt className="text-xs text-[var(--muted)]">{copy.newClientsLastMonth}</dt>
                <dd className="ui-mono mt-0.5 text-lg font-semibold text-[var(--ink)]">{numberFormat.format(insights.newClientsLastMonth)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--muted)]">{copy.totalAppointments}</dt>
                <dd className="ui-mono mt-0.5 text-lg font-semibold text-[var(--ink)]">{numberFormat.format(totalAppointments)}</dd>
              </div>
            </dl>

            <div className="grid gap-8 xl:grid-cols-2">
              <InsightSection id="insights-top-services" title={copy.topServices} description={copy.topServicesDescription}>
                <MetricBars metrics={insights.topServices} emptyMessage={copy.topServicesEmpty} />
              </InsightSection>

              <InsightSection id="insights-status" title={copy.appointmentStatus} description={copy.appointmentStatusDescription}>
                <MetricBars
                  metrics={insights.appointmentsByStatus}
                  emptyMessage={copy.appointmentStatusEmpty}
                  showShare
                  renderLabel={(metric) => <StatusBadge status={metric.key} />}
                />
              </InsightSection>

              <InsightSection id="insights-pet-mix" title={copy.petMix} description={copy.petMixDescription}>
                <MetricBars metrics={insights.speciesMix} emptyMessage={copy.petMixEmpty} showShare />
              </InsightSection>
            </div>
          </>
        ) : !loading && !error ? (
          <EmptyStateCard
            title={copy.insightsSetupTitle}
            description={copy.insightsSetupDescription}
            actionLabel={copy.insightsSetupAction}
            href="/pet"
          />
        ) : null}
      </div>
    </PermissionGuard>
  );
}
