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
      fallback={<div className="ui-notice-warning">Você não possui permissão para visualizar o dashboard do Pet.</div>}
    >
      <div className="space-y-5">
        <PageTitle
          title="Pet Dashboard"
          description="Visão clínica e comercial com agenda, prontuários recentes e filas operacionais do tenant."
        />

        {loading ? <div className="ui-notice-neutral">Carregando dashboard...</div> : null}
        {error ? <div className="ui-notice-error">{error}</div> : null}

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
            title="Nenhum fluxo clínico ativo ainda"
            description="Cadastre clientes, pacientes, serviços e a primeira consulta para liberar agenda, prontuários recentes e fila operacional neste dashboard."
          />
        ) : null}
      </div>
    </PermissionGuard>
  );
}
