'use client';

import { useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { DashboardSection } from '@/shared/dashboard/dashboard-section';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { ApiClientError } from '@/shared/lib/http';
import { iotService } from '@/shared/services/iot-service';
import { IotDashboardSummary } from '@/shared/types/iot';
import { PageTitle } from '@/shared/ui/page-title';
import {
  buildIotExecutiveCards,
  buildIotExecutiveOverviewSection,
  buildIotFleetRecencySection,
  orderIotDashboardSections
} from './iot-utils';

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

  const executiveCards = useMemo(() => {
    if (!summary) {
      return [];
    }

    return buildIotExecutiveCards(summary);
  }, [summary]);

  const orderedSections = useMemo(() => {
    if (!summary) {
      return [];
    }

    const composedSections = [
      buildIotExecutiveOverviewSection(summary),
      buildIotFleetRecencySection(summary),
      ...summary.sections
    ];

    return orderIotDashboardSections(composedSections);
  }, [summary]);

  return (
    <PermissionGuard
      permission="iot.dashboard.read"
      fallback={
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Você não possui permissão para visualizar o dashboard do IoT.
        </div>
      }
    >
      <div className="space-y-6">
        <PageTitle
          title="IoT Dashboard"
          description="Visão executiva e operacional do parque conectado, com foco em disponibilidade, alarmes, telemetria e manutenção."
        />

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
            Carregando dashboard...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {summary ? (
          <>
            <MetricGrid cards={executiveCards} columns="md:grid-cols-2 xl:grid-cols-3" />

            <section className="rounded-3xl border border-slate-200 bg-panel p-5 shadow-card">
              <div className="mb-5">
                <h2 className="text-base font-semibold text-ink">Demo Narrative</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Use esta leitura para conduzir reuniões comerciais: comece pelo panorama executivo,
                  avance para a pressão de alarmes, depois valide a recência da frota e finalize com
                  telemetria e manutenção.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <a
                  href="/iot/devices"
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-action hover:shadow-md"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Step 1
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">Inspect fleet</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Review device inventory, status and operational footprint.
                  </div>
                </a>

                <a
                  href="/iot/alarms"
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-action hover:shadow-md"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Step 2
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">Review alarm pressure</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Show open alarms, severity concentration and acknowledge workflow.
                  </div>
                </a>

                <a
                  href="/iot/telemetry"
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-action hover:shadow-md"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Step 3
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">Inspect telemetry</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Confirm recent readings, thresholds and device-level traceability.
                  </div>
                </a>

                <a
                  href="/iot/maintenance"
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-action hover:shadow-md"
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Step 4
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">Close the loop</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Link incidents to maintenance backlog and operational response.
                  </div>
                </a>
              </div>
            </section>

            <div className="space-y-4">
              {orderedSections.map((section) => (
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