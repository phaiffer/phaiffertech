'use client';

import { useEffect, useState } from 'react';
import { DashboardSection } from '@/shared/dashboard/dashboard-section';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { petService } from '@/shared/services/pet-service';
import { PetDashboardSummary } from '@/shared/types/pet';
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

  return (
    <PermissionGuard
      permission="pet.dashboard.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar o dashboard do Pet.</div>}
    >
      <div className="space-y-5">
        <PageTitle
          title="Pet Dashboard"
          description="Visão clínica e comercial com agenda, prontuários recentes e filas operacionais do tenant."
        />

        {loading ? <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Carregando dashboard...</div> : null}
        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        {summary ? (
          <>
            <MetricGrid cards={summary.summaryCards} columns="md:grid-cols-2 xl:grid-cols-4" />
            <div className="space-y-4">
              {summary.sections.map((section) => (
                <DashboardSection key={section.key} section={section} />
              ))}
            </div>
          </>
        ) : !loading && !error ? (
          <EmptyStateCard
            title="Sem dados de Pet"
            description="Nenhuma métrica clínica ou comercial está disponível para o tenant atual."
          />
        ) : null}
      </div>
    </PermissionGuard>
  );
}
