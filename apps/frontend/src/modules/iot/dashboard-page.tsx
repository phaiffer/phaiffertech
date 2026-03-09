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
  WaveIcon
} from '@/modules/iot/iot-chrome';
import {
  buildDemoDevicesFromReal,
  demoQuickActions,
  getOperationalProfile
} from '@/modules/iot/iot-demo-data';
import {
  appendLiveTrendPoint,
  formatDateTime,
  resolveDeviceStatusLabel
} from '@/modules/iot/iot-utils';

const fallbackDashboard: IotDashboardSummary = {
  totalDevices: 3,
  activeDevices: 2,
  offlineDevices: 1,
  totalAlarmsOpen: 1,
  alarmsBySeverity: {
    HIGH: 1,
    MEDIUM: 1,
    LOW: 1
  },
  telemetryPointsLast24h: 1240,
  pendingMaintenance: 2,
  devicesLastSeenSummary: {
    last_5m: 1,
    last_60m: 1,
    stale: 1
  },
  summaryCards: [],
  sections: []
};

const dashboardPollIntervalMs = 8_000;

function resolveDeviceTone(status: string) {
  switch (status) {
    case 'OFFLINE':
      return 'red' as const;
    case 'ALERT':
    case 'MAINTENANCE':
      return 'amber' as const;
    case 'ONLINE':
      return 'green' as const;
    default:
      return 'neutral' as const;
  }
}

function resolveOperationalNote(device: IotDevice) {
  switch (device.status) {
    case 'OFFLINE':
      return 'Sem heartbeat recente';
    case 'ALERT':
      return 'Incidente operacional aberto';
    case 'MAINTENANCE':
      return 'Intervenção em andamento';
    case 'ONLINE':
      return 'Fluxo nominal';
    default:
      return resolveDeviceStatusLabel(device.status);
  }
}

export function IotDashboardPage() {
  const [summary, setSummary] = useState<IotDashboardSummary | null>(null);
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [alarmPressureSeries, setAlarmPressureSeries] = useState([
    { label: '10:00', value: 1 },
    { label: '10:08', value: 2 },
    { label: '10:16', value: 1 },
    { label: '10:24', value: 3 },
    { label: '10:32', value: 2 },
    { label: '10:40', value: 2 }
  ]);
  const [throughputSeries, setThroughputSeries] = useState([
    { label: '10:00', value: 120 },
    { label: '10:08', value: 134 },
    { label: '10:16', value: 149 },
    { label: '10:24', value: 163 },
    { label: '10:32', value: 178 },
    { label: '10:40', value: 196 }
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
          iotService.listDevices(0, 4, '')
        ]);

        if (!active) {
          return;
        }

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
        if (!active || background) {
          return;
        }

        setError(
          err instanceof ApiClientError ? err.message : 'Erro ao carregar o dashboard do IoT.'
        );
      } finally {
        if (active && !background) {
          setLoading(false);
        }
      }
    }

    void load();

    const intervalId = window.setInterval(() => {
      void load(true);
    }, dashboardPollIntervalMs);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const useDemoSnapshot = !summary || summary.totalDevices === 0;
  const snapshot = useDemoSnapshot ? fallbackDashboard : summary!;
  const displayDevices = useMemo(() => buildDemoDevicesFromReal(devices), [devices]);

  const availability =
    snapshot.totalDevices === 0
      ? '0%'
      : `${Math.round((snapshot.activeDevices / snapshot.totalDevices) * 100)}%`;

  const recencyRows = useMemo(() => {
    return displayDevices.slice(0, 3).map((device, index) => ({
      name: device.name,
      status: device.status,
      metric: resolveOperationalNote(device),
      updatedAt: device.lastSeenAt ? formatDateTime(device.lastSeenAt) : 'Sem leitura recente',
      tone: resolveDeviceTone(device.status),
      profile: getOperationalProfile(
        device,
        index
      )
    }));
  }, [displayDevices]);

  return (
    <PermissionGuard
      permission="iot.dashboard.read"
      fallback={
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Você não possui permissão para visualizar o dashboard do IoT.
        </div>
      }
    >
      <div className="space-y-6">
        <IotPageHeader
          eyebrow="Operação conectada"
          title="Dashboard operacional"
          description="Leitura executiva da planta conectada com foco em disponibilidade, pressão de alarmes, ritmo de telemetria e backlog de manutenção."
          chips={
            <>
              <Chip label="Dispositivos" value={snapshot.totalDevices} tone="cyan" icon={<DeviceIcon />} />
              <Chip label="Online" value={snapshot.activeDevices} tone="green" icon={<PlugIcon />} />
              <Chip label="Alarmes abertos" value={snapshot.totalAlarmsOpen} tone={snapshot.totalAlarmsOpen > 0 ? 'amber' : 'green'} icon={<AlarmIcon />} />
              <Chip label="Disponibilidade" value={availability} tone="neutral" icon={<DashboardIcon />} />
            </>
          }
          aside={
            <IotHeroAside
              title="Resumo do turno"
              items={[
                { label: 'Modo de leitura', value: useDemoSnapshot ? 'Assistido para apresentação' : 'Integração ativa', tone: useDemoSnapshot ? 'amber' : 'green' },
                {
                  label: 'Atualização',
                  value: loading
                    ? 'Sincronizando agora'
                    : lastRefreshAt
                      ? `Último pulso ${formatDateTime(lastRefreshAt)}`
                      : 'Aguardando primeiro pulso',
                  tone: loading ? 'cyan' : 'green'
                },
                { label: 'Telemetria 24h', value: `${snapshot.telemetryPointsLast24h} pontos`, tone: 'cyan' }
              ]}
            />
          }
        />

        {error ? (
          <IotNotice
            title="Integração indisponível no dashboard"
            description={`${error} A apresentação continua em modo assistido com um snapshot operacional coerente com o restante do módulo.`}
            tone="amber"
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <IotMetricCard
            label="Dispositivos totais"
            value={snapshot.totalDevices}
            footnote={`${snapshot.activeDevices} ativos • ${snapshot.offlineDevices} offline`}
            tone="cyan"
            icon={<DeviceIcon />}
          />
          <IotMetricCard
            label="Alarmes abertos"
            value={snapshot.totalAlarmsOpen}
            footnote="Incidentes priorizados por severidade e tempo aberto."
            tone={snapshot.totalAlarmsOpen > 0 ? 'amber' : 'green'}
            icon={<AlarmIcon />}
          />
          <IotMetricCard
            label="Telemetria 24h"
            value={snapshot.telemetryPointsLast24h}
            footnote="Volume consolidado para leitura executiva de operação."
            tone="green"
            icon={<WaveIcon />}
          />
          <IotMetricCard
            label="Backlog de manutenção"
            value={snapshot.pendingMaintenance}
            footnote="Fila operacional pendente para fechamento de loop."
            tone={snapshot.pendingMaintenance > 0 ? 'amber' : 'green'}
            icon={<BoltIcon />}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <IotPanel
            title="Estado dos dispositivos"
            description="Observação rápida dos ativos mais relevantes para a apresentação e para a conversa operacional."
          >
            <div className="space-y-3">
              {recencyRows.map((row) => (
                <div
                  key={row.name}
                  className="flex flex-col gap-4 rounded-[28px] border border-slate-800 bg-slate-950/35 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="text-lg font-semibold text-white">{row.name}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {row.profile.area} • {row.profile.transport} • {row.profile.host}:{row.profile.port}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <IotStatusPill label={row.metric} tone={row.tone} />
                    <IotStatusPill label={row.status} tone={row.tone} />
                    <span className="text-sm text-slate-500">{row.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </IotPanel>

          <IotPanel
            title="Resumo operacional"
            description="Argumentos curtos para conduzir a reunião e conectar o dashboard às próximas telas do módulo."
          >
            <div className="space-y-3">
              <div className="rounded-[28px] border border-slate-800 bg-slate-950/35 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Eficiência da planta
                </p>
                <p className="mt-3 text-4xl font-semibold text-cyan-300">3.85 COP</p>
                <p className="mt-2 text-sm text-slate-400">
                  Indicador visual para posicionamento executivo e comercial.
                </p>
              </div>
              <div className="rounded-[28px] border border-slate-800 bg-slate-950/35 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Última consolidação
                </p>
                <p className="mt-3 text-lg font-semibold text-white">{formatDateTime(new Date().toISOString())}</p>
                <p className="mt-2 text-sm text-slate-400">
                  Leitura preparada para demonstrar o estado atual da operação.
                </p>
              </div>
            </div>
          </IotPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <IotPanel
            title="Pressão de alarmes"
            description="Distribuição simplificada de incidentes para leitura imediata e transição natural para a central de alarmes."
          >
            <IotMiniTrend title="Incidentes por pulso" series={alarmPressureSeries} accent="#f59e0b" />
          </IotPanel>
          <IotPanel
            title="Ritmo de telemetria"
            description="Cadência visual para mostrar cobertura, atividade da planta e continuidade do stream operacional."
          >
            <IotMiniTrend title="Coletas acumuladas 24h" series={throughputSeries} accent="#22d3ee" />
          </IotPanel>
        </div>

        <IotPanel
          title="Próximos fluxos da apresentação"
          description="Sequência recomendada para navegar entre dispositivos, mapeamento, telemetria, alarmes, manutenção e observabilidade."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
