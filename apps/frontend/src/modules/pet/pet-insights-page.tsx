'use client';

import { useCallback, useEffect, useState } from 'react';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { SimpleBarChart } from '@/shared/dashboard/simple-bar-chart';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { petService } from '@/shared/services/pet-service';
import type { PetInsightsSummary } from '@/shared/types/pet';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import {
  sharedCompactTextClass,
  sharedPanelSurfaceClass,
  sharedSectionHeadingClass
} from '@/shared/components/public-visual-system';
import { workspacePanelSurfaceStyle } from '@/shared/modules/module-workspace-visual';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';

function ClientGrowthPanel({ thisMonth, lastMonth }: { thisMonth: number; lastMonth: number }) {
  const copy = useAppMessages().screens.petInsights;
  const delta = thisMonth - lastMonth;
  const deltaSign = delta > 0 ? '+' : '';
  const trendLabel = lastMonth === 0
    ? null
    : copy.deltaVsLastMonth.replace('{delta}', `${deltaSign}${delta}`);

  return (
    <div className={`${sharedPanelSurfaceClass} p-5`} style={workspacePanelSurfaceStyle}>
      <h3 className={sharedSectionHeadingClass}>{copy.clientGrowthChart}</h3>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className={`${sharedCompactTextClass} mb-1`}>{copy.thisMonth}</p>
          <p className="text-2xl font-bold text-foreground">{thisMonth}</p>
          {trendLabel ? (
            <p className={`mt-1 ${sharedCompactTextClass} ${delta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {trendLabel}
            </p>
          ) : null}
        </div>
        <div>
          <p className={`${sharedCompactTextClass} mb-1`}>{copy.lastMonth}</p>
          <p className="text-2xl font-bold text-foreground">{lastMonth}</p>
        </div>
      </div>
    </div>
  );
}

export function PetInsightsPage() {
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
      setError(err instanceof ApiClientError ? err.message : loadErrorMessage);
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

  return (
    <PermissionGuard
      permission="pet.dashboard.read"
      fallback={<div className="ui-notice-warning">{copy.insightsNoPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="Gestão Pet"
          title={copy.insightsTitle}
          description={copy.insightsDescription}
        />

        {loading ? <div className="ui-notice-neutral">{copy.insightsLoading}</div> : null}
        {error ? <div className="ui-notice-error">{error}</div> : null}

        {insights && hasData ? (
          <>
            <PageSection
              title={copy.clientGrowth}
              description={copy.clientGrowthDescription}
            >
              <ClientGrowthPanel
                thisMonth={insights.newClientsThisMonth}
                lastMonth={insights.newClientsLastMonth}
              />
            </PageSection>

            <PageSection
              title={copy.topServices}
              description={copy.topServicesDescription}
            >
              <SimpleBarChart
                title={copy.topServicesChart}
                metrics={insights.topServices}
                emptyMessage={copy.topServicesEmpty}
              />
            </PageSection>

            <div className="grid gap-5 xl:grid-cols-2">
              {insights.speciesMix.length > 0 ? (
                <PageSection
                  title={copy.petMix}
                  description={copy.petMixDescription}
                >
                  <SimpleBarChart
                    title={copy.petMixChart}
                    metrics={insights.speciesMix}
                    emptyMessage={copy.petMixEmpty}
                  />
                </PageSection>
              ) : null}

              {insights.appointmentsByStatus.length > 0 ? (
                <PageSection
                  title={copy.appointmentStatus}
                  description={copy.appointmentStatusDescription}
                >
                  <SimpleBarChart
                    title={copy.appointmentStatusChart}
                    metrics={insights.appointmentsByStatus}
                    emptyMessage={copy.appointmentStatusEmpty}
                  />
                </PageSection>
              ) : null}
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
