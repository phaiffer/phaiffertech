'use client';

import { useEffect, useState } from 'react';
import { DashboardSection } from '@/shared/dashboard/dashboard-section';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { crmService } from '@/shared/services/crm-service';
import { CrmDashboardSummary } from '@/shared/types/crm';
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

  return (
    <PermissionGuard
      permission="crm.dashboard.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar o dashboard do CRM.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="CRM Dashboard" description="Visão operacional de vendas com pipeline, qualificação e atividade recente." />

        {loading ? <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Carregando dashboard...</div> : null}
        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        {summary ? (
          <>
            <MetricGrid cards={summary.summaryCards} columns="md:grid-cols-2 xl:grid-cols-5" />
            <div className="space-y-4">
              {summary.sections.map((section) => (
                <DashboardSection key={section.key} section={section} />
              ))}
            </div>
          </>
        ) : !loading && !error ? (
          <EmptyStateCard
            title="Sem dados de CRM"
            description="Nenhuma métrica de CRM está disponível para o tenant atual."
          />
        ) : null}
      </div>
    </PermissionGuard>
  );
}
