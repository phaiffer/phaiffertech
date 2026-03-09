'use client';

import { useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { iotService } from '@/shared/services/iot-service';
import { IotDashboardSummary } from '@/shared/types/iot';
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
  demoAlarmPressureSeries,
  demoQuickActions,
  demoThroughputSeries,
  getOperationalProfile
} from '@/modules/iot/iot-demo-data';
import { formatDateTime } from '@/modules/iot/iot-utils';

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

const watchlist = [
  { name: 'Painel QGBT Sede', status: 'ONLINE', metric: 'LOW 18.4', updatedAt: 'agora', tone: 'green' as const },
  { name: 'Compressor Parafuso CP-01', status: 'ALERT', metric: 'Alta pressão', updatedAt: 'há 7 min', tone: 'amber' as const },
  { name: 'Bomba de Recirculação BM-03', status: 'OFFLINE', metric: 'Sem heartbeat', updatedAt: 'há 1h26', tone: 'red' as const }
];

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
      setError(
        err instanceof ApiClientError ? err.message : 'Erro ao carregar o dashboard do IoT.'
      );
    } finally {
      setLoading(false);
    }
  }

  const useDemoSnapshot = !summary || summary.totalDevices === 0;
  const snapshot = useDemoSnapshot ? fallbackDashboard : summary!;

  const availability =
    snapshot.totalDevices === 0
      ? '0%'
      : `${Math.round((snapshot.activeDevices / snapshot.totalDevices) * 100)}%`;

  const recencyRows = useMemo(() => {
    return watchlist.map((item, index) => ({
      ...item,
      profile: getOperationalProfile(
        {
          id: `watch-${index}`,
          name: item.name,
          identifier: `WATCH-${index + 1}`,
          status: item.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        index
      )
    }));
  }, []);

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
                { label: 'Atualização', value: loading ? 'Sincronizando agora' : 'Janela operacional estável', tone: loading ? 'cyan' : 'green' },
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
            <IotMiniTrend title="Incidentes por dia" series={demoAlarmPressureSeries} accent="#f59e0b" />
          </IotPanel>
          <IotPanel
            title="Ritmo de telemetria"
            description="Cadência visual para mostrar cobertura, atividade da planta e continuidade do stream operacional."
          >
            <IotMiniTrend title="Coletas por janela" series={demoThroughputSeries} accent="#22d3ee" />
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
