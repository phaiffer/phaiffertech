'use client';

import { useEffect, useState } from 'react';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { DashboardContextCardGrid } from '@/shared/dashboard/dashboard-context-card-grid';
import { DashboardSection } from '@/shared/dashboard/dashboard-section';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { crmService } from '@/shared/services/crm-service';
import { CrmDashboardSummary } from '@/shared/types/crm';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';

export function CrmDashboardPage() {
  const [summary, setSummary] = useState<CrmDashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await crmService.getDashboardSummary();
      setSummary(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar dashboard do CRM.');
    } finally {
      setLoading(false);
    }
  }

  const featuredSection = summary?.sections[0] ?? null;
  const supportingSections = summary?.sections.slice(1) ?? [];
  const contextCards = summary ? [
    {
      key: 'crm-coverage',
      label: 'Commercial coverage',
      value: `${summary.totalCompanies} companies / ${summary.totalContacts} contacts`,
      description: 'Keep account and relationship coverage visible before drilling into pipeline movement.',
      tone: 'accent' as const
    },
    {
      key: 'crm-qualification',
      label: 'Qualification load',
      value: `${summary.totalLeads} leads`,
      description: 'Lead volume stays explicit here so qualification work does not disappear behind later pipeline stages.',
      tone: 'neutral' as const
    },
    {
      key: 'crm-follow-up',
      label: 'Follow-up pressure',
      value: `${summary.overdueTasks} overdue / ${summary.tasksPendentes} open`,
      description: 'Use the task pressure signal to rebalance follow-up before the commercial queue drifts.',
      tone: summary.overdueTasks > 0 ? 'primary' as const : 'neutral' as const
    }
  ] : [];

  return (
    <PermissionGuard
      permission="crm.dashboard.read"
      fallback={
        <div className="rounded-lg border border-warning/30 bg-warning-muted px-4 py-3 text-sm text-warning">
          Você não possui permissão para visualizar o dashboard do CRM.
        </div>
      }
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="CRM workspace"
          title="Commercial dashboard"
          description="Visão operacional de vendas com pipeline, qualificação e atividade recente organizada com a mesma hierarquia adotada nas páginas administrativas consolidadas."
        />

        {loading && (
          <div className="ui-notice-neutral">
            Carregando dashboard...
          </div>
        )}

        {error && (
          <div className="ui-notice-error">{error}</div>
        )}

        {summary ? (
          <>
            <DashboardContextCardGrid cards={contextCards} />

            <PageSection
              title="Commercial pulse"
              description="Use the consolidated KPI row to scan volume, stage pressure, and recent commercial movement before drilling into deeper sections."
            >
              <MetricGrid cards={summary.summaryCards} columns="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" />
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
            title="No deals yet"
            description="Create the first company, contact, and deal so this dashboard can surface pipeline value, recent movement, and stage distribution."
            actionLabel="Open CRM workspace"
            href="/crm"
          />
        ) : null}
      </div>
    </PermissionGuard>
  );
}
