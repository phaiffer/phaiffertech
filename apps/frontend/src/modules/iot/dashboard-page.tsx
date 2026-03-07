'use client';

import { useEffect, useState } from 'react';
import { DashboardSection } from '@/shared/dashboard/dashboard-section';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { iotService } from '@/shared/services/iot-service';
import { IotDashboardSummary } from '@/shared/types/iot';
import { PageTitle } from '@/shared/ui/page-title';

export function IotDashboardPage() {
  const [summary, setSummary] = useState<IotDashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const result = await iotService.getDashboardSummary();
      setSummary(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar o dashboard do IoT.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PermissionGuard
      permission="iot.dashboard.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar o dashboard do IoT.</div>}
    >
      <div className="space-y-5">
        <PageTitle
          title="IoT Dashboard"
          description="Visão operacional do parque conectado com alarmes, recência da frota e backlog de manutenção."
        />

        {loading ? <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Carregando dashboard...</div> : null}
        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        {summary ? (
          <>
            <MetricGrid cards={summary.summaryCards} columns="md:grid-cols-2 xl:grid-cols-3" />
            <div className="space-y-4">
              {summary.sections.map((section) => (
                <DashboardSection key={section.key} section={section} />
              ))}
            </div>
          </>
        ) : !loading && !error ? (
          <EmptyStateCard
            title="Sem dados de IoT"
            description="Nenhuma métrica operacional de IoT está disponível para o tenant atual."
          />
        ) : null}
      </div>
    </PermissionGuard>
  );
}
