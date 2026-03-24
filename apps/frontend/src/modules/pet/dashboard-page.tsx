'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { DashboardContextCardGrid } from '@/shared/dashboard/dashboard-context-card-grid';
import { DashboardSection } from '@/shared/dashboard/dashboard-section';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { petService } from '@/shared/services/pet-service';
import { PetDashboardSummary } from '@/shared/types/pet';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';

export function PetDashboardPage() {
  const [summary, setSummary] = useState<PetDashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const result = await petService.getDashboardSummary();
      setSummary(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar o dashboard do Pet.');
    } finally {
      setLoading(false);
    }
  }

  const featuredSection = summary?.sections[0] ?? null;
  const supportingSections = summary?.sections.slice(1) ?? [];
  const contextCards = summary ? [
    {
      key: 'pet-coverage',
      label: 'Customer base',
      value: `${summary.totalClients} clients / ${summary.totalPets} pets`,
      description: 'Client and pet coverage stay visible before moving into bookings and care workflows.',
      tone: 'accent' as const
    },
    {
      key: 'pet-agenda',
      label: 'Service rhythm',
      value: `${summary.appointmentsToday} today / ${summary.upcomingAppointments} upcoming`,
      description: 'Daily and near-term appointment load stays visible before deeper queue work takes over.',
      tone: 'neutral' as const
    },
    {
      key: 'pet-attention',
      label: 'Operational attention',
      value: `${summary.lowStockProducts} low stock / ${summary.pendingInvoices} invoices`,
      description: 'Inventory and billing pressure are kept in the same overview band for pet business operators.',
      tone: summary.lowStockProducts > 0 || summary.pendingInvoices > 0 ? 'primary' as const : 'neutral' as const
    }
  ] : [];

  return (
    <PermissionGuard
      permission="pet.dashboard.read"
      fallback={<div className="ui-notice-warning">Você não possui permissão para visualizar o dashboard do Pet.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="PetFlow overview"
          title="Operations Overview"
          description="See appointments, billing pressure, inventory attention, and recent care in one business view."
          actions={(
            <Link href="/pet/insights" className="ui-secondary-button">
              Open business insights
            </Link>
          )}
        />

        {loading ? <div className="ui-notice-neutral">Carregando dashboard...</div> : null}
        {error ? <div className="ui-notice-error">{error}</div> : null}

        {summary ? (
          <>
            <DashboardContextCardGrid cards={contextCards} />

            <PageSection
              title="Daily operations pulse"
              description="Use this view to explain what is happening now, then finish the story with Business Insights."
            >
              <MetricGrid cards={summary.summaryCards} columns="md:grid-cols-2 xl:grid-cols-4" />
            </PageSection>

            {featuredSection ? <DashboardSection section={featuredSection} /> : null}

            {supportingSections.length > 0 ? (
              <div className="grid gap-5 xl:grid-cols-2">
                {supportingSections.map((section) => (
                  <DashboardSection key={section.key} section={section} />
                ))}
              </div>
            ) : null}
          </>
        ) : !loading && !error ? (
          <EmptyStateCard
            title="Start the first PetFlow cycle"
            description="Register a client, add a pet profile, book an appointment, and issue the first invoice to light up this overview."
            actionLabel="Open PetFlow setup"
            href="/pet"
          />
        ) : null}
      </div>
    </PermissionGuard>
  );
}
