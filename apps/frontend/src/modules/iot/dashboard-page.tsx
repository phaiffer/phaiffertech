'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { iotService } from '@/shared/services/iot-service';
import { IotDashboardSummary } from '@/shared/types/iot';
import { PageTitle } from '@/shared/ui/page-title';
import { formatDateTime, sortedEntries } from '@/modules/iot/iot-utils';

function StatCard({
  label,
  value,
  href
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{value}</p>
    </Link>
  );
}

function DistributionCard({
  title,
  subtitle,
  values,
  emptyMessage
}: {
  title: string;
  subtitle: string;
  values: Record<string, number>;
  emptyMessage: string;
}) {
  const entries = sortedEntries(values);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>

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

  const stats = summary ? [
    { label: 'Devices', value: summary.totalDevices, href: '/iot/devices' },
    { label: 'Ativos', value: summary.activeDevices, href: '/iot/devices' },
    { label: 'Offline', value: summary.offlineDevices, href: '/iot/devices' },
    { label: 'Alarmes abertos', value: summary.totalAlarmsOpen, href: '/iot/alarms' },
    { label: 'Telemetria 24h', value: summary.telemetryPointsLast24h, href: '/iot/telemetry' },
    { label: 'Manutenção pendente', value: summary.pendingMaintenance, href: '/iot/maintenance' }
  ] : [];

  return (
    <PermissionGuard
      permission="iot.dashboard.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar o dashboard do IoT.</div>}
    >
      <div className="space-y-5">
        <PageTitle
          title="IoT Dashboard"
          description="Resumo operacional do tenant com devices, alarmes, maintenance e telemetria recente."
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Health rule</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            O status básico do device usa a combinação de <code>lastSeenAt</code>, presença recente de telemetria e existência
            de alarmes críticos abertos. A camada atual mantém essa lógica no módulo IoT, sem acoplar o data plane ao storage.
          </p>
          <p className="mt-3 text-xs text-slate-500">Última atualização do card: {formatDateTime(new Date().toISOString())}</p>
        </section>

        {loading ? <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Carregando dashboard...</div> : null}
        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        {summary ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {stats.map((item) => (
                <StatCard key={item.label} label={item.label} value={item.value} href={item.href} />
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <DistributionCard
                title="Alarmes por severidade"
                subtitle="Distribuição atual de alarmes abertos no tenant."
                values={summary.alarmsBySeverity}
                emptyMessage="Nenhum alarme aberto contabilizado."
              />
              <DistributionCard
                title="Devices por recência"
                subtitle="Agrupamento básico para leitura comercial do parque conectado."
                values={summary.devicesLastSeenSummary}
                emptyMessage="Nenhum device contabilizado."
              />
            </div>
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
