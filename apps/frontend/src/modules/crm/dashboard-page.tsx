'use client';

import { useEffect, useState } from 'react';
import { DashboardSection } from '@/shared/dashboard/dashboard-section';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { crmService } from '@/shared/services/crm-service';
import { CrmDashboardSummary } from '@/shared/types/crm';

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
      fallback={
        <div className="rounded-lg border border-warning/30 bg-warning-muted px-4 py-3 text-sm text-warning">
          Você não possui permissão para visualizar o dashboard do CRM.
        </div>
      }
    >
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-accent">
            Operações comerciais
          </p>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard CRM</h1>
          <p className="mt-1 text-sm text-muted">
            Visão operacional de vendas com pipeline, qualificação e atividade recente.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted">
            Carregando dashboard...
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive-muted px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Dashboard Content */}
        {summary ? (
          <>
            {/* Summary Metrics */}
            <MetricGrid cards={summary.summaryCards} columns="sm:grid-cols-2 lg:grid-cols-5" />

            {/* Sections */}
            <div className="space-y-6">
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
