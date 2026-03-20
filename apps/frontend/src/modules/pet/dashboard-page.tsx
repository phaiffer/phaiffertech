'use client';

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
      label: 'Care base',
      value: `${summary.totalClients} clients / ${summary.totalPets} pets`,
      description: 'Keep owner and patient coverage readable before moving into bookings and clinical workflows.',
      tone: 'accent' as const
    },
    {
      key: 'pet-agenda',
      label: 'Schedule rhythm',
      value: `${summary.appointmentsToday} today / ${summary.upcomingAppointments} upcoming`,
      description: 'Daily and near-term appointment load should stay visible before deeper queue work takes over.',
      tone: 'neutral' as const
    },
    {
      key: 'pet-attention',
      label: 'Operational attention',
      value: `${summary.lowStockProducts} low stock / ${summary.pendingInvoices} invoices`,
      description: 'Clinical delivery, inventory, and billing pressure are intentionally kept in the same overview band.',
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
          eyebrow="PetFlow workspace"
          title="Operational dashboard"
          description="Visão clínica e comercial com agenda, prontuários recentes e filas operacionais organizada com o mesmo ritmo visual das áreas administrativas e públicas já consolidadas."
        />

        {loading ? <div className="ui-notice-neutral">Carregando dashboard...</div> : null}
        {error ? <div className="ui-notice-error">{error}</div> : null}

        {summary ? (
          <>
            <DashboardContextCardGrid cards={contextCards} />

            <PageSection
              title="Clinic pulse"
              description="Scan the consolidated KPI row first, then move into the highlighted operational sections below."
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
            title="No PetFlow activity yet"
            description="Register the first client, patient, service, and appointment so this dashboard can surface schedule load, recent records, and the operational queue."
            actionLabel="Open PetFlow workspace"
            href="/pet"
          />
        ) : null}
      </div>
    </PermissionGuard>
  );
}
