'use client';

import { useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { iotService } from '@/shared/services/iot-service';
import { IotReportSummary } from '@/shared/types/iot';
import {
  AnalysisIcon,
  Chip,
  IotHeroAside,
  IotMiniTrend,
  IotMetricCard,
  IotNotice,
  IotPageHeader,
  IotPanel,
  IotStatusPill
} from '@/modules/iot/iot-chrome';
import {
  buildDemoReportSummary,
  demoObservabilitySeries,
  demoThroughputSeries
} from '@/modules/iot/iot-demo-data';
import { formatDateTime, sortedEntries } from '@/modules/iot/iot-utils';

function DistributionBlock({
  title,
  values
}: {
  title: string;
  values: Record<string, number>;
}) {
  const entries = sortedEntries(values);

  return (
    <div className="rounded-[28px] border border-slate-800 bg-slate-950/35 p-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      <div className="mt-4 space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">Sem dados para esta dimensão.</p>
        ) : null}
        {entries.map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3"
          >
            <span className="text-sm text-slate-300">{key}</span>
            <span className="text-sm font-semibold text-white">{value}</span>
          </div>
        ))}
      </div>
    </div>
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
      setError(
        err instanceof ApiClientError
          ? err.message
          : 'Erro ao carregar a análise global do IoT.'
      );
    } finally {
      setLoading(false);
    }
  }

  const report = useMemo(() => {
    if (!summary || summary.totalDevices === 0) {
      return buildDemoReportSummary();
    }

    return summary;
  }, [summary]);

  const usingDemo = !summary || summary.totalDevices === 0 || Boolean(error);

  return (
    <PermissionGuard
      permission="iot.report.read"
      fallback={
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Você não possui permissão para visualizar a análise global do IoT.
        </div>
      }
    >
      <div className="space-y-6">
        <IotPageHeader
          eyebrow="Executive Observability"
          title="Análise Comparativa Global"
          description="Comparação consolidada de desempenho, cobertura e atividade operacional para a narrativa executiva do IoT System."
          chips={
            <>
              <Chip label="Global" value="multi-ativo" tone="green" icon={<AnalysisIcon />} />
              <Chip label="Devices" value={report.totalDevices} tone="cyan" />
              <Chip label="Telemetry 24h" value={report.telemetryPointsLast24h} tone="neutral" />
            </>
          }
          aside={
            <IotHeroAside
              title="Estado do Painel"
              items={[
                { label: 'Fonte', value: usingDemo ? 'Demo assistida' : 'Dados reais', tone: usingDemo ? 'amber' : 'green' },
                { label: 'Cobertura', value: Object.keys(report.devicesByStatus).length > 1 ? 'Multi-ativo' : 'Single asset', tone: 'cyan' },
                { label: 'Atualização', value: loading ? 'Sincronizando' : 'OK', tone: loading ? 'cyan' : 'green' }
              ]}
            />
          }
        />

        {error ? (
          <IotNotice
            title="Observability em fallback visual"
            description={`${error} A tela continua demonstrável com um resumo estático coerente com o visual aprovado.`}
            tone="amber"
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <IotMetricCard
            label="Eficiência média"
            value="3.58 COP"
            footnote="Indicador sintético para leitura de eficiência da planta."
            tone="cyan"
          />
          <IotMetricCard
            label="Consumo total"
            value={`${report.telemetryPointsLast24h} kWh`}
            footnote="Proxy executivo baseado nas medições consolidadas."
            tone="green"
          />
          <IotMetricCard
            label="Cobertura"
            value={Object.keys(report.devicesByStatus).length > 1 ? 'Multi-Ativo' : 'Mono-Ativo'}
            footnote="Comparação preparada para múltiplos ativos e linhas."
            tone="neutral"
          />
          <IotMetricCard
            label="Gerado em"
            value={formatDateTime(report.generatedAt)}
            footnote="Última consolidação da camada observability."
            tone="green"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
          <IotPanel
            title="Tendência de performance"
            description="Leitura comparativa para apoiar a discussão executiva sem depender de uma camada analítica completa nesta etapa."
          >
            <IotMiniTrend title="Performance por janela" series={demoObservabilitySeries} accent="#60a5fa" />
          </IotPanel>

          <IotPanel
            title="Notas de leitura"
            description="Resumo curto para conduzir a conversa comercial."
          >
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/35 px-4 py-4">
                <p className="text-sm font-semibold text-white">Cobertura operacional</p>
                <p className="mt-2 text-sm text-slate-400">
                  O painel já comunica comparação de ativos e leitura consolidada.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/35 px-4 py-4">
                <p className="text-sm font-semibold text-white">Narrativa executiva</p>
                <p className="mt-2 text-sm text-slate-400">
                  Use disponibilidade, alarmes e eficiência como a sequência principal da demo.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/35 px-4 py-4">
                <p className="text-sm font-semibold text-white">Estado do backend</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <IotStatusPill label={usingDemo ? 'Mock parcial' : 'Resumo real'} tone={usingDemo ? 'amber' : 'green'} />
                </div>
              </div>
            </div>
          </IotPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <IotPanel
            title="Ritmo de coleta"
            description="Cadência visual das coletas para reforçar cobertura temporal."
          >
            <IotMiniTrend title="Coletas consolidadas" series={demoThroughputSeries} accent="#22d3ee" />
          </IotPanel>
          <IotPanel
            title="Distribuições consolidadas"
            description="Blocos principais para explicar como a plataforma organiza a leitura global."
          >
            <div className="grid gap-4">
              <DistributionBlock title="Devices por status" values={report.devicesByStatus} />
              <DistributionBlock title="Alarmes por severidade" values={report.alarmsBySeverity} />
              <DistributionBlock title="Telemetria por métrica" values={report.telemetryByMetric} />
            </div>
          </IotPanel>
        </div>
      </div>
    </PermissionGuard>
  );
}
