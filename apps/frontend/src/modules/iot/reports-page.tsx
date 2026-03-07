'use client';

import { useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { iotService } from '@/shared/services/iot-service';
import { IotReportSummary } from '@/shared/types/iot';
import { PageTitle } from '@/shared/ui/page-title';
import { formatDateTime, sortedEntries } from '@/modules/iot/iot-utils';

function StatCard({
  label,
  value
}: {
  label: string;
  value: number;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
    </section>
  );
}

function DistributionCard({
  title,
  values,
  emptyMessage
}: {
  title: string;
  values: Record<string, number>;
  emptyMessage: string;
}) {
  const entries = sortedEntries(values);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-3">
        {entries.length === 0 ? <p className="text-sm text-slate-500">{emptyMessage}</p> : null}
        {entries.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <span className="text-sm text-slate-700">{key}</span>
            <span className="text-sm font-semibold text-slate-900">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function IotReportsPage() {
  const [summary, setSummary] = useState<IotReportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const result = await iotService.getReportSummary();
      setSummary(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar o relatório agregado do IoT.');
    } finally {
      setLoading(false);
    }
  }

  const stats = summary ? [
    { label: 'Devices', value: summary.totalDevices },
    { label: 'Registers', value: summary.totalRegisters },
    { label: 'Telemetria 24h', value: summary.telemetryPointsLast24h },
    { label: 'Alarmes abertos', value: summary.openAlarms },
    { label: 'Maintenance pendente', value: summary.pendingMaintenance }
  ] : [];

  return (
    <PermissionGuard
      permission="iot.report.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar relatórios do IoT.</div>}
    >
      <div className="space-y-5">
        <PageTitle
          title="IoT Reports"
          description="Consolidação por tenant para uso comercial, operacional e acompanhamento executivo."
        />

        {loading ? <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Carregando relatório...</div> : null}
        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        {summary ? (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Gerado em</p>
              <p className="mt-2 text-sm text-slate-700">{formatDateTime(summary.generatedAt)}</p>
            </section>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {stats.map((item) => (
                <StatCard key={item.label} label={item.label} value={item.value} />
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <DistributionCard
                title="Devices por status"
                values={summary.devicesByStatus}
                emptyMessage="Nenhum device contabilizado."
              />
              <DistributionCard
                title="Telemetria por métrica"
                values={summary.telemetryByMetric}
                emptyMessage="Nenhuma métrica contabilizada."
              />
              <DistributionCard
                title="Alarmes por status"
                values={summary.alarmsByStatus}
                emptyMessage="Nenhum alarme contabilizado."
              />
              <DistributionCard
                title="Alarmes por severidade"
                values={summary.alarmsBySeverity}
                emptyMessage="Nenhum alarme contabilizado."
              />
              <DistributionCard
                title="Maintenance por status"
                values={summary.maintenanceByStatus}
                emptyMessage="Nenhuma ordem contabilizada."
              />
            </div>
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
