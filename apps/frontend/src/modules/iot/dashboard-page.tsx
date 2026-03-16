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
  IotEmptyState,
  IotHeroAside,
  IotMiniTrend,
  IotMetricCard,
  IotModulePage,
  IotNotice,
  IotPageHeader,
  IotPanel,
  IotStatusPill,
  IotSurfaceLink,
  PlugIcon,
  WaveIcon,
} from '@/modules/iot/iot-chrome';
import { getOperationalProfile } from '@/modules/iot/iot-demo-data';
import {
  appendLiveTrendPoint,
  formatDateTime,
  resolveDeviceStatusLabel,
} from '@/modules/iot/iot-utils';

const dashboardPollIntervalMs = 8_000;

const dashboardQuickActions = [
  {
    href: '/iot/add-device',
    title: 'Registrar dispositivo',
    description: 'Cadastre o primeiro ativo para iniciar o monitoramento da operacao.'
  },
  {
    href: '/iot/registers',
    title: 'Mapear registros',
    description: 'Defina temperatura, vibracao e consumo para a coleta inicial.'
  },
  {
    href: '/iot/telemetry',
    title: 'Abrir telemetria',
    description: 'Acompanhe as leituras recebidas e valide a cadencia da coleta.'
  },
  {
    href: '/iot/alarms',
    title: 'Revisar alarmes',
    description: 'Conecte limites, acknowledgement e fila de manutencao.'
  }
];

type Tone = 'neutral' | 'cyan' | 'green' | 'amber' | 'red';

function resolveDeviceTone(status: string): Tone {
  switch (status) {
    case 'OFFLINE':
      return 'red';
    case 'ALERT':
    case 'MAINTENANCE':
      return 'amber';
    case 'ONLINE':
      return 'green';
    default:
      return 'neutral';
  }
}

function resolveStatusTone(status?: string | null): Tone {
  const normalized = status?.toUpperCase() ?? '';

  if (normalized.includes('CRITICAL') || normalized.includes('OFFLINE')) {
    return 'red';
  }

  if (
    normalized.includes('HIGH')
    || normalized.includes('MEDIUM')
    || normalized.includes('OPEN')
    || normalized.includes('ACKNOWLEDGED')
    || normalized.includes('PENDING')
    || normalized.includes('SCHEDULED')
  ) {
    return 'amber';
  }

  if (normalized.includes('ONLINE') || normalized.includes('OK')) {
    return 'green';
  }

  return 'cyan';
}

function resolveOperationalNote(device: IotDevice) {
  switch (device.status) {
    case 'OFFLINE':
      return 'Sem heartbeat recente';
    case 'ALERT':
      return 'Incidente operacional aberto';
    case 'MAINTENANCE':
      return 'Intervencao em andamento';
    case 'ONLINE':
      return 'Fluxo nominal';
    default:
      return resolveDeviceStatusLabel(device.status);
  }
}

function formatTimestamp(value?: string | null) {
  if (!value) {
    return 'Sem horario registrado';
  }

  return formatDateTime(value);
}

type ActivityPanelProps = {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  items: NonNullable<IotDashboardSummary['sections'][number]>['items'];
};

function ActivityPanel({
  title,
  description,
  emptyTitle,
  emptyDescription,
  items
}: ActivityPanelProps) {
  return (
    <IotPanel title={title} description={description}>
      {items.length === 0 ? (
        <IotEmptyState title={emptyTitle} description={emptyDescription} tone="neutral" compact />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface-inset p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{item.label}</p>
                {item.sublabel ? <p className="mt-1 text-xs text-muted">{item.sublabel}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {item.status ? <IotStatusPill label={item.status} tone={resolveStatusTone(item.status)} /> : null}
                <span className="text-xs text-muted">{formatTimestamp(item.timestamp)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </IotPanel>
  );
}

export function IotDashboardPage() {
  const [summary, setSummary] = useState<IotDashboardSummary | null>(null);
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [alarmPressureSeries, setAlarmPressureSeries] = useState<Array<{ label: string; value: number }>>([]);
  const [throughputSeries, setThroughputSeries] = useState<Array<{ label: string; value: number }>>([]);

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
        setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar o dashboard do IoT.');
      } finally {
        if (active && !background) {
          setLoading(false);
        }
      }
    }

    void load();
    const intervalId = window.setInterval(() => void load(true), dashboardPollIntervalMs);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const snapshot = summary;
  const hasOperationalData = Boolean(
    snapshot && (
      snapshot.totalDevices > 0
      || snapshot.totalAlarmsOpen > 0
      || snapshot.telemetryPointsLast24h > 0
      || snapshot.pendingMaintenance > 0
    )
  );

  const availability = !snapshot || snapshot.totalDevices === 0
    ? '--'
    : `${Math.round((snapshot.activeDevices / snapshot.totalDevices) * 100)}%`;

  const deviceRows = useMemo(() => {
    return devices.slice(0, 4).map((device, index) => ({
      name: device.name,
      status: device.status,
      metric: resolveOperationalNote(device),
      updatedAt: device.lastSeenAt ? formatDateTime(device.lastSeenAt) : 'Sem leitura recente',
      tone: resolveDeviceTone(device.status),
      profile: getOperationalProfile(device, index),
    }));
  }, [devices]);

  const alarmSection = snapshot?.sections.find((section) => section.key === 'iot-alarms');
  const telemetrySection = snapshot?.sections.find((section) => section.key === 'iot-telemetry');
  const heartbeatFresh = snapshot?.devicesLastSeenSummary?.last_5m ?? 0;
  const heartbeatAttention = (snapshot?.devicesLastSeenSummary?.stale ?? 0) + (snapshot?.devicesLastSeenSummary?.never_seen ?? 0);
  const severityMix = snapshot
    ? Object.entries(snapshot.alarmsBySeverity)
        .map(([key, value]) => `${key} ${value}`)
        .join(' / ')
    : '--';

  return (
    <PermissionGuard
      permission="iot.dashboard.read"
      fallback={
        <div className="rounded-lg border border-warning/30 bg-warning-muted px-4 py-3 text-sm text-warning">
          Você não possui permissão para visualizar o dashboard do IoT.
        </div>
      }
    >
      <IotModulePage>
        <IotPageHeader
          eyebrow="Operacao conectada"
          title="Dashboard operacional"
          description="Leitura executiva da planta conectada com foco em disponibilidade, alarmes, telemetria e manutencao."
          chips={
            <>
              <Chip label="Dispositivos" value={snapshot?.totalDevices ?? '--'} tone="cyan" icon={<DeviceIcon />} />
              <Chip label="Ativos" value={snapshot?.activeDevices ?? '--'} tone="green" icon={<PlugIcon />} />
              <Chip label="Alarmes" value={snapshot?.totalAlarmsOpen ?? '--'} tone={(snapshot?.totalAlarmsOpen ?? 0) > 0 ? 'amber' : 'green'} icon={<AlarmIcon />} />
              <Chip label="Disponibilidade" value={availability} tone="neutral" icon={<DashboardIcon />} />
            </>
          }
          aside={
            <IotHeroAside
              title="Resumo do turno"
              items={[
                { label: 'Modo', value: hasOperationalData ? 'Telemetria ativa' : 'Primeira configuracao', tone: hasOperationalData ? 'green' : 'amber' },
                { label: 'Atualizacao', value: loading ? 'Sincronizando...' : lastRefreshAt ? formatDateTime(lastRefreshAt) : 'Aguardando', tone: loading ? 'cyan' : 'green' },
                { label: 'Telemetria 24h', value: snapshot ? `${snapshot.telemetryPointsLast24h} pontos` : '--', tone: 'cyan' },
              ]}
            />
          }
        />

        {error && (
          <IotNotice
            title="Integracao indisponivel"
            description={error}
            tone="amber"
          />
        )}

        {!loading && !error && !hasOperationalData ? (
          <>
            <IotNotice
              title="Nenhum dispositivo registrado ainda"
              description="Adicione o primeiro dispositivo, mapeie seus registros e comece a coletar telemetria para liberar o pulso operacional deste dashboard."
              tone="amber"
            />

            <IotPanel title="Primeiros passos" description="Use este roteiro para ativar o workspace IoT no tenant atual.">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {dashboardQuickActions.map((action) => (
                  <IotSurfaceLink
                    key={action.href}
                    href={action.href}
                    title={action.title}
                    description={action.description}
                  />
                ))}
              </div>
            </IotPanel>
          </>
        ) : null}

        {snapshot && hasOperationalData ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <IotMetricCard
                label="Dispositivos totais"
                value={snapshot.totalDevices}
                footnote={`${snapshot.activeDevices} ativos, ${snapshot.offlineDevices} offline`}
                detailTitle={snapshot.offlineDevices > 0 ? 'Fleet attention required' : 'Fleet coverage is stable'}
                detailDescription={snapshot.offlineDevices > 0
                  ? 'Open the fleet table to inspect which assets lost heartbeat and whether maintenance or incident flows need to be opened.'
                  : 'Use the device list to confirm that the nominal state is holding over time.'}
                tone="cyan"
                icon={<DeviceIcon />}
              />
              <IotMetricCard
                label="Alarmes abertos"
                value={snapshot.totalAlarmsOpen}
                footnote="Incidentes priorizados por severidade"
                detailTitle={snapshot.totalAlarmsOpen > 0 ? 'Incident pressure needs ownership' : 'No open incident pressure'}
                detailDescription={snapshot.totalAlarmsOpen > 0
                  ? 'Prioritize acknowledgement first, then decide whether the event should be escalated into field work.'
                  : 'Keep the alarm queue visible to catch changes before they affect availability.'}
                tone={snapshot.totalAlarmsOpen > 0 ? 'amber' : 'green'}
                icon={<AlarmIcon />}
              />
              <IotMetricCard
                label="Telemetria 24h"
                value={snapshot.telemetryPointsLast24h}
                footnote="Volume consolidado de leituras"
                detailTitle={snapshot.telemetryPointsLast24h > 0 ? 'Signal flow is active' : 'No recent signal volume'}
                detailDescription={snapshot.telemetryPointsLast24h > 0
                  ? 'Use the trend cards below to confirm whether collection rhythm is improving or degrading.'
                  : 'Inspect registers and telemetry ingestion before relying on the executive pulse.'}
                tone="green"
                icon={<WaveIcon />}
              />
              <IotMetricCard
                label="Manutencao pendente"
                value={snapshot.pendingMaintenance}
                footnote="Fila operacional para fechamento"
                detailTitle={snapshot.pendingMaintenance > 0 ? 'Backlog still open' : 'Backlog currently controlled'}
                detailDescription={snapshot.pendingMaintenance > 0
                  ? 'Use the maintenance board to sequence actions by urgency and tie them back to incident pressure.'
                  : 'Track maintenance only as a confirmation step while the dashboard remains stable.'}
                tone={snapshot.pendingMaintenance > 0 ? 'amber' : 'green'}
                icon={<BoltIcon />}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <IotPanel
                title="Estado dos dispositivos"
                description="Visao rapida dos ativos monitorados"
                className="lg:col-span-2"
              >
                {deviceRows.length === 0 ? (
                  <IotEmptyState
                    title="Nenhum dispositivo sincronizado"
                    description="Registre o primeiro dispositivo para preencher o estado operacional desta planta."
                    tone="neutral"
                    compact
                  />
                ) : (
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
                )}
              </IotPanel>

              <IotPanel title="Resumo operacional" description="Indicadores reais do workspace conectado">
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-surface-inset p-4">
                    <p className="text-2xs font-medium uppercase tracking-wider text-muted">Heartbeat fresco</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{heartbeatFresh}</p>
                    <p className="mt-1 text-xs text-muted">Dispositivos com leitura recente nos ultimos cinco minutos.</p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-inset p-4">
                    <p className="text-2xs font-medium uppercase tracking-wider text-muted">Atencao de disponibilidade</p>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{heartbeatAttention}</p>
                    <p className="mt-1 text-xs text-muted">Ativos com heartbeat defasado ou sem leitura registrada.</p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-inset p-4">
                    <p className="text-2xs font-medium uppercase tracking-wider text-muted">Severidade dos alarmes</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{severityMix || 'Sem alarmes abertos'}</p>
                    <p className="mt-1 text-xs text-muted">Distribuicao atual usada pelo dashboard e pela fila de incidentes.</p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface-inset p-4">
                    <p className="text-2xs font-medium uppercase tracking-wider text-muted">Proxima acao do operador</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {snapshot.totalAlarmsOpen > 0 ? 'Abrir alarmes e backlog' : 'Validar continuidade da coleta'}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {snapshot.totalAlarmsOpen > 0
                        ? 'Conecte acknowledgement, manutencao e telemetria para fechar o ciclo de resposta.'
                        : 'Confirme o ritmo de telemetria antes de expandir a cobertura da planta.'}
                    </p>
                  </div>
                </div>
              </IotPanel>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <ActivityPanel
                title="Alertas recentes"
                description="Ultimos eventos operacionais que ainda pressionam a fila IoT."
                emptyTitle="Nenhum alerta recente"
                emptyDescription="Assim que os alarmes forem disparados, eles aparecerao aqui com severidade e horario."
                items={alarmSection?.items ?? []}
              />
              <ActivityPanel
                title="Telemetria recente"
                description="Leituras mais novas recebidas dos dispositivos monitorados."
                emptyTitle="Nenhuma telemetria recente"
                emptyDescription="Mapeie registros e inicie a coleta para liberar a lista de sinais mais recentes."
                items={telemetrySection?.items ?? []}
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <IotMiniTrend
                title="Pressao de alarmes"
                series={alarmPressureSeries}
                accent="var(--tenant-accent)"
              />
              <IotMiniTrend
                title="Ritmo de telemetria"
                series={throughputSeries}
                accent="var(--info)"
              />
            </div>
          </>
        ) : null}

        <IotPanel title="Navegacao rapida" description="Acesse as principais areas do modulo IoT">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dashboardQuickActions.map((action) => (
              <IotSurfaceLink
                key={action.href}
                href={action.href}
                title={action.title}
                description={action.description}
              />
            ))}
          </div>
        </IotPanel>
      </IotModulePage>
    </PermissionGuard>
  );
}
