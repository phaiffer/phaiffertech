'use client';

import { useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems } from '@/shared/lib/pagination';
import { iotService } from '@/shared/services/iot-service';
import { IotDashboardSummary, IotDevice } from '@/shared/types/iot';
import {
  AlarmIcon,
  BoltIcon,
  Chip,
  DashboardIcon,
  DeviceIcon,
  IotHeroAside,
  IotMiniTrend,
  IotMetricCard,
  IotNotice,
  IotPageHeader,
  IotPanel,
  IotStatusPill,
  IotSurfaceLink,
  PlugIcon,
  WaveIcon,
} from '@/modules/iot/iot-chrome';
import {
  buildDemoDevicesFromReal,
  demoQuickActions,
  getOperationalProfile,
} from '@/modules/iot/iot-demo-data';
import {
  appendLiveTrendPoint,
  formatDateTime,
  resolveDeviceStatusLabel,
} from '@/modules/iot/iot-utils';

const fallbackDashboard: IotDashboardSummary = {
  totalDevices: 3,
  activeDevices: 2,
  offlineDevices: 1,
  totalAlarmsOpen: 1,
  alarmsBySeverity: { HIGH: 1, MEDIUM: 1, LOW: 1 },
  telemetryPointsLast24h: 1240,
  pendingMaintenance: 2,
  devicesLastSeenSummary: { last_5m: 1, last_60m: 1, stale: 1 },
  summaryCards: [],
  sections: [],
};

const dashboardPollIntervalMs = 8_000;

type Tone = 'neutral' | 'cyan' | 'green' | 'amber' | 'red';

function resolveDeviceTone(status: string): Tone {
  switch (status) {
    case 'OFFLINE': return 'red';
    case 'ALERT':
    case 'MAINTENANCE': return 'amber';
    case 'ONLINE': return 'green';
    default: return 'neutral';
  }
}

function resolveOperationalNote(device: IotDevice) {
  switch (device.status) {
    case 'OFFLINE': return 'Sem heartbeat recente';
    case 'ALERT': return 'Incidente operacional aberto';
    case 'MAINTENANCE': return 'Intervenção em andamento';
    case 'ONLINE': return 'Fluxo nominal';
    default: return resolveDeviceStatusLabel(device.status);
  }
}

export function IotDashboardPage() {
  const [summary, setSummary] = useState<IotDashboardSummary | null>(null);
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [alarmPressureSeries, setAlarmPressureSeries] = useState([
    { label: '09:28', value: 1 },
    { label: '09:36', value: 1 },
    { label: '09:44', value: 2 },
    { label: '09:52', value: 2 },
    { label: '10:00', value: 1 },
    { label: '10:08', value: 2 },
    { label: '10:16', value: 1 },
    { label: '10:24', value: 3 },
    { label: '10:32', value: 2 },
    { label: '10:40', value: 2 },
  ]);
  const [throughputSeries, setThroughputSeries] = useState([
    { label: '09:28', value: 88 },
    { label: '09:36', value: 96 },
    { label: '09:44', value: 104 },
    { label: '09:52', value: 112 },
    { label: '10:00', value: 120 },
    { label: '10:08', value: 134 },
    { label: '10:16', value: 149 },
    { label: '10:24', value: 163 },
    { label: '10:32', value: 178 },
    { label: '10:40', value: 196 },
  ]);

  useEffect(() => {
    let active = true;

    async function load(background = false) {
      if (!background) {
        setLoading(true);
        setError(null);
      }

      try {
        const [dashboardSummary, devicesPage] = await Promise.all([
          iotService.getDashboardSummary(),
          iotService.listDevices(0, 4, ''),
        ]);

        if (!active) return;

        const refreshedAt = new Date();
        setSummary(dashboardSummary);
        setDevices(resolvePageItems(devicesPage));
        setLastRefreshAt(refreshedAt.toISOString());
        setAlarmPressureSeries((current) =>
          appendLiveTrendPoint(current, dashboardSummary.totalAlarmsOpen, refreshedAt)
        );
        setThroughputSeries((current) =>
          appendLiveTrendPoint(current, dashboardSummary.telemetryPointsLast24h, refreshedAt)
        );
        setError(null);
      } catch (err) {
        if (!active || background) return;
        setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar o dashboard do IoT.');
      } finally {
        if (active && !background) setLoading(false);
      }
    }

    void load();
    const intervalId = window.setInterval(() => void load(true), dashboardPollIntervalMs);
    return () => { active = false; window.clearInterval(intervalId); };
  }, []);

  const useDemoSnapshot = !summary || summary.totalDevices === 0;
  const snapshot = useDemoSnapshot ? fallbackDashboard : summary!;
  const displayDevices = useMemo(() => buildDemoDevicesFromReal(devices), [devices]);

  const availability =
    snapshot.totalDevices === 0
      ? '0%'
      : `${Math.round((snapshot.activeDevices / snapshot.totalDevices) * 100)}%`;

  const deviceRows = useMemo(() => {
    return displayDevices.slice(0, 4).map((device, index) => ({
      name: device.name,
      status: device.status,
      metric: resolveOperationalNote(device),
      updatedAt: device.lastSeenAt ? formatDateTime(device.lastSeenAt) : 'Sem leitura recente',
      tone: resolveDeviceTone(device.status),
      profile: getOperationalProfile(device, index),
    }));
  }, [displayDevices]);

  return (
    <PermissionGuard
      permission="iot.dashboard.read"
      fallback={
        <div className="rounded-lg border border-warning/30 bg-warning-muted px-4 py-3 text-sm text-warning">
          Você não possui permissão para visualizar o dashboard do IoT.
        </div>
      }
    >
      <div className="space-y-6">
        {/* Page Header */}
        <IotPageHeader
          eyebrow="Operação conectada"
          title="Dashboard operacional"
          description="Leitura executiva da planta conectada com foco em disponibilidade, alarmes, telemetria e manutenção."
          chips={
            <>
              <Chip label="Dispositivos" value={snapshot.totalDevices} tone="cyan" icon={<DeviceIcon />} />
              <Chip label="Online" value={snapshot.activeDevices} tone="green" icon={<PlugIcon />} />
              <Chip label="Alarmes" value={snapshot.totalAlarmsOpen} tone={snapshot.totalAlarmsOpen > 0 ? 'amber' : 'green'} icon={<AlarmIcon />} />
              <Chip label="Disponibilidade" value={availability} tone="neutral" icon={<DashboardIcon />} />
            </>
          }
          aside={
            <IotHeroAside
              title="Resumo do turno"
              items={[
                { label: 'Modo', value: useDemoSnapshot ? 'Demonstração' : 'Integração ativa', tone: useDemoSnapshot ? 'amber' : 'green' },
                { label: 'Atualização', value: loading ? 'Sincronizando...' : lastRefreshAt ? formatDateTime(lastRefreshAt) : 'Aguardando', tone: loading ? 'cyan' : 'green' },
                { label: 'Telemetria 24h', value: `${snapshot.telemetryPointsLast24h} pontos`, tone: 'cyan' },
              ]}
            />
          }
        />

        {/* Error Notice */}
        {error && (
          <IotNotice
            title="Integração indisponível"
            description={`${error} Mostrando dados de demonstração.`}
            tone="amber"
          />
        )}

        {/* Metrics Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <IotMetricCard
            label="Dispositivos totais"
            value={snapshot.totalDevices}
            footnote={`${snapshot.activeDevices} ativos, ${snapshot.offlineDevices} offline`}
            tone="cyan"
            icon={<DeviceIcon />}
          />
          <IotMetricCard
            label="Alarmes abertos"
            value={snapshot.totalAlarmsOpen}
            footnote="Incidentes priorizados por severidade"
            tone={snapshot.totalAlarmsOpen > 0 ? 'amber' : 'green'}
            icon={<AlarmIcon />}
          />
          <IotMetricCard
            label="Telemetria 24h"
            value={snapshot.telemetryPointsLast24h}
            footnote="Volume consolidado de leituras"
            tone="green"
            icon={<WaveIcon />}
          />
          <IotMetricCard
            label="Manutenção pendente"
            value={snapshot.pendingMaintenance}
            footnote="Fila operacional para fechamento"
            tone={snapshot.pendingMaintenance > 0 ? 'amber' : 'green'}
            icon={<BoltIcon />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Device Status Panel */}
          <IotPanel
            title="Estado dos dispositivos"
            description="Visão rápida dos ativos monitorados"
            className="lg:col-span-2"
          >
            <div className="space-y-2">
              {deviceRows.map((row) => (
                <div
                  key={row.name}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-surface-inset p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{row.name}</p>
                    <p className="mt-1 truncate text-xs text-muted">
                      {row.profile.area} · {row.profile.transport} · {row.profile.host}:{row.profile.port}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <IotStatusPill label={row.metric} tone={row.tone} />
                    <IotStatusPill label={row.status} tone={row.tone} />
                    <span className="text-xs text-muted">{row.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </IotPanel>

          {/* Summary Panel */}
          <IotPanel title="Resumo operacional" description="Indicadores chave">
            <div className="space-y-4">
              <div className="rounded-lg bg-surface-inset p-4">
                <p className="text-2xs font-medium uppercase tracking-wider text-muted">
                  Eficiência da planta
                </p>
                <p className="mt-2 text-3xl font-semibold text-accent">3.85 COP</p>
                <p className="mt-1 text-xs text-muted">Coeficiente de performance</p>
              </div>
              <div className="rounded-lg bg-surface-inset p-4">
                <p className="text-2xs font-medium uppercase tracking-wider text-muted">
                  Última consolidação
                </p>
                <p className="mt-2 text-sm font-medium text-foreground">
                  {formatDateTime(new Date().toISOString())}
                </p>
                <p className="mt-1 text-xs text-muted">Estado atual da operação</p>
              </div>
            </div>
          </IotPanel>
        </div>

        {/* Trend Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <IotMiniTrend
            title="Pressão de alarmes"
            series={alarmPressureSeries}
            accent="var(--warning)"
          />
          <IotMiniTrend
            title="Ritmo de telemetria"
            series={throughputSeries}
            accent="var(--accent)"
          />
        </div>

        {/* Quick Actions */}
        <IotPanel title="Navegação rápida" description="Acesse as principais áreas do módulo IoT">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {demoQuickActions.map((action) => (
              <IotSurfaceLink
                key={action.href}
                href={action.href}
                title={action.title}
                description={action.description}
              />
            ))}
          </div>
        </IotPanel>
      </div>
    </PermissionGuard>
  );
}
