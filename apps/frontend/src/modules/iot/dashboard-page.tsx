'use client';

import { useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { DashboardSection } from '@/shared/dashboard/dashboard-section';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { SummaryCard } from '@/shared/dashboard/summary-card';
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

            <section className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-ink">Demo Narrative</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Use esta leitura para conduzir reuniões comerciais: comece pelo panorama executivo,
                  avance para a pressão de alarmes, depois valide a recência da frota e finalize com
                  telemetria e manutenção.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard
                  card={{
                    key: 'iot-demo-step-1',
                    label: 'Step 1 — Inspect fleet',
                    value: summary.totalDevices,
                    status: summary.offlineDevices > 0 ? 'warn' : 'ok',
                    href: '/iot/devices',
                    trend: 'Review device inventory, status and operational footprint.'
                  }}
                />

                <SummaryCard
                  card={{
                    key: 'iot-demo-step-2',
                    label: 'Step 2 — Review alarm pressure',
                    value: summary.totalAlarmsOpen,
                    status: summary.totalAlarmsOpen > 0 ? 'alert' : 'ok',
                    href: '/iot/alarms',
                    trend: 'Show open alarms, severity concentration and acknowledge workflow.'
                  }}
                />

                <SummaryCard
                  card={{
                    key: 'iot-demo-step-3',
                    label: 'Step 3 — Inspect telemetry',
                    value: summary.telemetryPointsLast24h,
                    status: summary.telemetryPointsLast24h > 0 ? 'info' : 'warn',
                    href: '/iot/telemetry',
                    trend: 'Confirm recent readings, thresholds and device-level traceability.'
                  }}
                />

                <SummaryCard
                  card={{
                    key: 'iot-demo-step-4',
                    label: 'Step 4 — Close the loop',
                    value: summary.pendingMaintenance,
                    status: summary.pendingMaintenance > 0 ? 'warn' : 'ok',
                    href: '/iot/maintenance',
                    trend: 'Link incidents to maintenance backlog and operational response.'
                  }}
                />
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