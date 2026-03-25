'use client';

import { useEffect, useState } from 'react';
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

function ClientGrowthPanel({ thisMonth, lastMonth }: { thisMonth: number; lastMonth: number }) {
  const delta = thisMonth - lastMonth;
  const deltaSign = delta > 0 ? '+' : '';
  const trendLabel = lastMonth === 0
    ? null
    : `${deltaSign}${delta} vs last month`;

  return (
    <div className={`${sharedPanelSurfaceClass} p-5`} style={workspacePanelSurfaceStyle}>
      <h3 className={sharedSectionHeadingClass}>Client Growth</h3>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className={`${sharedCompactTextClass} mb-1`}>This month</p>
          <p className="text-2xl font-bold text-foreground">{thisMonth}</p>
          {trendLabel ? (
            <p className={`mt-1 ${sharedCompactTextClass} ${delta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
              {trendLabel}
            </p>
          ) : null}
        </div>
        <div>
          <p className={`${sharedCompactTextClass} mb-1`}>Last month</p>
          <p className="text-2xl font-bold text-foreground">{lastMonth}</p>
        </div>
      </div>
    </div>
  );
}

export function PetInsightsPage() {
  const [insights, setInsights] = useState<PetInsightsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const result = await petService.getInsightsSummary();
      setInsights(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load business insights.');
    } finally {
      setLoading(false);
    }
  }

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
      fallback={<div className="ui-notice-warning">Dashboard access is required to view business insights.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="PetFlow business"
          title="Business Insights"
          description="Client growth, top services, pet mix, and appointment patterns — built from your real business activity."
        />

        {loading ? <div className="ui-notice-neutral">Loading insights...</div> : null}
        {error ? <div className="ui-notice-error">{error}</div> : null}

        {insights && hasData ? (
          <>
            <PageSection
              title="Client growth"
              description="New clients registered in the current and previous calendar month."
            >
              <ClientGrowthPanel
                thisMonth={insights.newClientsThisMonth}
                lastMonth={insights.newClientsLastMonth}
              />
            </PageSection>

            <PageSection
              title="Top services"
              description="Top services by total appointment volume across all time."
            >
              <SimpleBarChart
                title="Top Services by Appointment Volume"
                metrics={insights.topServices}
                emptyMessage="No appointment data available yet. Schedule appointments to see service performance."
              />
            </PageSection>

            <div className="grid gap-5 xl:grid-cols-2">
              {insights.speciesMix.length > 0 ? (
                <PageSection
                  title="Pet mix"
                  description="Distribution of pet profiles by species."
                >
                  <SimpleBarChart
                    title="Pets by Species"
                    metrics={insights.speciesMix}
                    emptyMessage="No pet profiles registered yet."
                  />
                </PageSection>
              ) : null}

              {insights.appointmentsByStatus.length > 0 ? (
                <PageSection
                  title="Appointment status"
                  description="Breakdown of all appointments by their current status."
                >
                  <SimpleBarChart
                    title="Appointments by Status"
                    metrics={insights.appointmentsByStatus}
                    emptyMessage="No appointments registered yet."
                  />
                </PageSection>
              ) : null}
            </div>
          </>
        ) : !loading && !error ? (
          <EmptyStateCard
            title="Insights appear after the first operating cycle"
            description="Add a client, register a pet, book an appointment, and issue an invoice. This page will turn that activity into growth and service signals."
            actionLabel="Start your first cycle"
            href="/pet"
          />
        ) : null}
      </div>
    </PermissionGuard>
  );
}
