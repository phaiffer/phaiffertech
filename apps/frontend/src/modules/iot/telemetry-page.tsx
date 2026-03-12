'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { Pagination } from '@/shared/ui/pagination';
import { iotService } from '@/shared/services/iot-service';
import { PageResponse } from '@/shared/types/common';
import { IotDevice, IotRegister, IotTelemetryRecord } from '@/shared/types/iot';
import {
    Chip,
    DeviceIcon,
    IotDataTable,
    IotDataTableHead,
    IotDateTimeField,
    IotEmptyState,
    IotHeroAside,
    IotModulePage,
    IotMiniTrend,
    IotNotice,
    IotPageHeader,
  IotPanel,
  IotPrimaryButton,
    IotSecondaryButton,
    IotSelectField,
    IotStatusPill,
    IotSupportCard,
    IotTableStateRow,
    IotTextField,
    WaveIcon
} from '@/modules/iot/iot-chrome';
import {
  buildDemoDevicesFromReal,
  buildDemoRegisters,
  buildDemoTelemetryRecords,
  parseModbusMapping
} from '@/modules/iot/iot-demo-data';
import {
  formatDateTime,
  resolveDeviceLabel,
  resolveRegisterLabel,
  resolveTelemetryQualityLabel,
  toIsoDate
} from '@/modules/iot/iot-utils';

const pageSize = 10;
const telemetryPollIntervalMs = 6_000;

const initialPage: PageResponse<IotTelemetryRecord> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

type DisplayTelemetry = IotTelemetryRecord & {
  deviceName?: string;
  registerName?: string;
  quality?: string;
  functionCode?: string;
  registerAddress?: string;
};

function buildTelemetryTrend(records: IotTelemetryRecord[]) {
  if (records.length === 0) {
    return [
      { label: '00h', value: 0 },
      { label: '04h', value: 0 },
      { label: '08h', value: 0 },
      { label: '12h', value: 0 },
      { label: '16h', value: 0 },
      { label: '20h', value: 0 }
    ];
  }

  const buckets = ['00h', '04h', '08h', '12h', '16h', '20h'];
  const counts = new Map<string, number>(buckets.map((bucket) => [bucket, 0]));

  records.forEach((record) => {
    const hours = new Date(record.recordedAt).getHours();
    const bucket = `${String(Math.floor(hours / 4) * 4).padStart(2, '0')}h`;
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  });

  return buckets.map((bucket) => ({ label: bucket, value: counts.get(bucket) ?? 0 }));
}

function resolveQuality(record: DisplayTelemetry, register?: IotRegister) {
  const metadataQuality =
    typeof record.metadata?.quality === 'string' ? record.metadata.quality : record.quality;

  if (metadataQuality) {
    return metadataQuality.toUpperCase();
  }

  if (
    register &&
    ((register.minThreshold !== undefined && record.metricValue < register.minThreshold) ||
      (register.maxThreshold !== undefined && record.metricValue > register.maxThreshold))
  ) {
    return 'WARN';
  }

  return 'GOOD';
}

function resolveQualityTone(quality: string) {
  switch (quality) {
    case 'WARN':
      return 'amber' as const;
    case 'STALE':
      return 'red' as const;
    case 'GOOD':
      return 'green' as const;
    default:
      return 'neutral' as const;
  }
}

export function IotTelemetryPage() {
  const [pageData, setPageData] = useState<PageResponse<IotTelemetryRecord>>(initialPage);
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [registers, setRegisters] = useState<IotRegister[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [deviceFilterId, setDeviceFilterId] = useState('');
  const [registerFilterId, setRegisterFilterId] = useState('');
  const [metricFilter, setMetricFilter] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  const [deviceId, setDeviceId] = useState('');
  const [registerId, setRegisterId] = useState('');
  const [metricName, setMetricName] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [unit, setUnit] = useState('');
  const [metadataRaw, setMetadataRaw] = useState('');
  const [recordedAt, setRecordedAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadDevices = useCallback(async () => {
    try {
      const result = await iotService.listDevices(0, 200, '');
      setDevices(resolvePageItems(result));
    } catch {
      setDevices([]);
    }
  }, []);

  const loadRegisters = useCallback(async () => {
    try {
      const result = await iotService.listRegisters(0, 300, '');
      setRegisters(resolvePageItems(result));
    } catch {
      setRegisters([]);
    }
  }, []);

  const load = useCallback(
    async (
      page: number,
      currentSearch: string,
      currentDeviceId: string,
      currentRegisterId: string,
      currentMetricFilter: string,
      currentStartAt: string,
      currentEndAt: string,
      options: { background?: boolean } = {}
    ) => {
      if (!options.background) {
        setLoading(true);
        setError(null);
      }

      try {
        const result = await iotService.listTelemetry(page, pageSize, currentSearch, {
          deviceId: currentDeviceId || undefined,
          registerId: currentRegisterId || undefined,
          metricName: currentMetricFilter || undefined,
          startAt: toIsoDate(currentStartAt),
          endAt: toIsoDate(currentEndAt)
        });
        setPageData(result);
        setError(null);
      } catch (err) {
        if (!options.background) {
          setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar telemetria.');
        }
      } finally {
        if (!options.background) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    void loadDevices();
    void loadRegisters();
  }, [loadDevices, loadRegisters]);

  useEffect(() => {
    void load(0, search, deviceFilterId, registerFilterId, metricFilter, startAt, endAt);
  }, [load, search, deviceFilterId, registerFilterId, metricFilter, startAt, endAt]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadDevices();
      void loadRegisters();
      void load(
        pageData.page,
        search,
        deviceFilterId,
        registerFilterId,
        metricFilter,
        startAt,
        endAt,
        { background: true }
      );
    }, telemetryPollIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [
    deviceFilterId,
    endAt,
    load,
    loadDevices,
    loadRegisters,
    metricFilter,
    pageData.page,
    registerFilterId,
    search,
    startAt
  ]);

  const displayDevices = useMemo(() => buildDemoDevicesFromReal(devices), [devices]);
  const displayRegisters = useMemo(
    () => (registers.length > 0 ? registers : buildDemoRegisters(displayDevices)),
    [displayDevices, registers]
  );

  const realRows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const useDemoMode =
    Boolean(error) ||
    (!loading &&
      totalItems === 0 &&
      !search &&
      !deviceFilterId &&
      !registerFilterId &&
      !metricFilter &&
      !startAt &&
      !endAt);

  const demoRows = useMemo(() => {
    return buildDemoTelemetryRecords(displayDevices, displayRegisters).filter((record) => {
      const matchesSearch =
        !search ||
        [record.metricName, record.unit, record.deviceName, record.registerName]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesDevice = !deviceFilterId || record.deviceId === deviceFilterId;
      const matchesRegister = !registerFilterId || record.registerId === registerFilterId;
      const matchesMetric =
        !metricFilter || record.metricName.toLowerCase().includes(metricFilter.toLowerCase());
      return matchesSearch && matchesDevice && matchesRegister && matchesMetric;
    });
  }, [deviceFilterId, displayDevices, displayRegisters, metricFilter, registerFilterId, search]);

  const visibleRows: DisplayTelemetry[] = useDemoMode ? demoRows : realRows;

  const deviceOptions = useMemo(
    () => [
      { value: '', label: 'Todos os dispositivos' },
      ...displayDevices.map((device) => ({ value: device.id, label: device.name }))
    ],
    [displayDevices]
  );

  const visibleFilterRegisters = useMemo(() => {
    if (!deviceFilterId) {
      return displayRegisters;
    }

    return displayRegisters.filter((register) => register.deviceId === deviceFilterId);
  }, [deviceFilterId, displayRegisters]);

  const visibleFormRegisters = useMemo(() => {
    if (!deviceId) {
      return displayRegisters;
    }

    return displayRegisters.filter((register) => register.deviceId === deviceId);
  }, [deviceId, displayRegisters]);

  const registerOptions = useMemo(
    () => [
      { value: '', label: 'Todos os registradores' },
      ...visibleFilterRegisters.map((register) => ({
        value: register.id,
        label: `${register.name} (${register.metricName})`
      }))
    ],
    [visibleFilterRegisters]
  );

  const formDeviceOptions = useMemo(
    () => [
      { value: '', label: 'Selecione um dispositivo' },
      ...displayDevices.map((device) => ({
        value: device.id,
        label: `${device.name} (${device.identifier ?? device.serialNumber ?? '-'})`
      }))
    ],
    [displayDevices]
  );

  const formRegisterOptions = useMemo(
    () => [
      { value: '', label: 'Sem registrador específico' },
      ...visibleFormRegisters.map((register) => ({
        value: register.id,
        label: `${register.name} (${register.metricName})`
      }))
    ],
    [visibleFormRegisters]
  );

  useEffect(() => {
    if (registerFilterId && !visibleFilterRegisters.some((register) => register.id === registerFilterId)) {
      setRegisterFilterId('');
    }
  }, [registerFilterId, visibleFilterRegisters]);

  useEffect(() => {
    if (registerId && !visibleFormRegisters.some((register) => register.id === registerId)) {
      setRegisterId('');
    }
  }, [registerId, visibleFormRegisters]);

  useEffect(() => {
    if (!registerId) {
      return;
    }

    const selectedRegister = displayRegisters.find((register) => register.id === registerId);
    if (!selectedRegister) {
      return;
    }

    setDeviceId(selectedRegister.deviceId);
    setMetricName(selectedRegister.metricName);
    if (selectedRegister.unit) {
      setUnit(selectedRegister.unit);
    }
  }, [displayRegisters, registerId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!deviceId) {
      setError('Selecione um dispositivo para registrar telemetria.');
      return;
    }

    if (!metricName.trim()) {
      setError('Informe a métrica para a telemetria.');
      return;
    }

    const parsedMetricValue = Number(metricValue);
    if (Number.isNaN(parsedMetricValue)) {
      setError('Valor da métrica inválido.');
      return;
    }

    let parsedMetadata: Record<string, unknown> | undefined;
    if (metadataRaw.trim()) {
      try {
        parsedMetadata = JSON.parse(metadataRaw) as Record<string, unknown>;
      } catch {
        setError('Metadata inválido. Informe JSON válido.');
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await iotService.writeTelemetry({
        deviceId,
        registerId: registerId || undefined,
        metricName,
        metricValue: parsedMetricValue,
        unit: unit || undefined,
        metadata: parsedMetadata,
        recordedAt: toIsoDate(recordedAt)
      });

      setMetricValue('');
      setMetadataRaw('');
      setRecordedAt('');
      setSuccess('Telemetria registrada com sucesso.');
      await load(pageData.page, search, deviceFilterId, registerFilterId, metricFilter, startAt, endAt);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao gravar telemetria.');
    } finally {
      setSubmitting(false);
    }
  }

  const uniqueMetrics = new Set(visibleRows.map((row) => row.metricName)).size;
  const devicesInFlow = new Set(visibleRows.map((row) => row.deviceId)).size;
  const trendSeries = useMemo(() => buildTelemetryTrend(visibleRows), [visibleRows]);
  const recentRows = [...visibleRows]
    .sort((left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime())
    .slice(0, 5);

  return (
    <PermissionGuard
      permission="iot.telemetry.read"
      fallback={
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Você não possui permissão para visualizar telemetria do IoT.
        </div>
      }
    >
      <IotModulePage>
        <IotPageHeader
          eyebrow="Fluxo operacional"
          title="Stream de telemetria"
          description="Leitura operacional contínua do IoT System com relação explícita entre dispositivo, registrador, mapeamento Modbus e qualidade de coleta."
          chips={
            <>
              <Chip label="Pontos" value={visibleRows.length} tone="cyan" icon={<WaveIcon />} />
              <Chip label="Dispositivos em fluxo" value={devicesInFlow} tone="green" icon={<DeviceIcon />} />
              <Chip label="Métricas" value={uniqueMetrics} tone="neutral" />
            </>
          }
          aside={
            <IotHeroAside
              title="Ritmo de Coleta"
              items={[
                { label: 'Modo de leitura', value: useDemoMode ? 'Assistido para apresentação' : 'Fluxo real ativo', tone: useDemoMode ? 'amber' : 'green' },
                { label: 'Último pulso', value: recentRows[0] ? formatDateTime(recentRows[0].recordedAt) : 'Sem coleta recente', tone: 'cyan' },
                { label: 'Estado do stream', value: recentRows.length > 0 ? 'Ativo' : 'Sem atividade', tone: recentRows.length > 0 ? 'green' : 'amber' }
              ]}
            />
          }
        />

        {error ? (
          <IotNotice
            title="Integração indisponível no stream"
            description={`${error} A experiência continua demonstrável em modo assistido com um stream coerente com os dispositivos e registradores já exibidos.`}
            tone="amber"
          />
        ) : null}

        {success ? <IotNotice title="Ingestão concluída" description={success} tone="green" /> : null}

        <IotPanel
          title="Filtros de stream"
          description="Refine o fluxo por ativo, registrador, métrica ou janela de coleta."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <IotTextField
              label="Busca"
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Métrica, unidade ou ativo"
            />
            <IotSelectField label="Dispositivo" value={deviceFilterId} onChange={setDeviceFilterId} options={deviceOptions} />
            <IotSelectField label="Registrador" value={registerFilterId} onChange={setRegisterFilterId} options={registerOptions} />
            <IotTextField
              label="Métrica"
              value={metricFilter}
              onChange={setMetricFilter}
              placeholder="temperatura / corrente / energia"
            />
            <IotDateTimeField label="De" value={startAt} onChange={setStartAt} />
            <IotDateTimeField label="Até" value={endAt} onChange={setEndAt} />
            <div className="flex items-end gap-3 xl:col-span-2">
              <IotPrimaryButton onClick={() => setSearch(searchInput)}>Aplicar filtros</IotPrimaryButton>
              <IotSecondaryButton
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setDeviceFilterId('');
                  setRegisterFilterId('');
                  setMetricFilter('');
                  setStartAt('');
                  setEndAt('');
                }}
              >
                Limpar
              </IotSecondaryButton>
            </div>
          </div>
        </IotPanel>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_390px]">
          <IotPanel
            title="Leituras recentes"
            description="Snapshot operacional das amostras mais recentes para reforçar a sensação de stream ao vivo."
          >
            <div className="space-y-3">
              {recentRows.length === 0 ? (
                <IotEmptyState
                  title="Sem pulso recente nesta janela"
                  description="Ajuste os filtros ou mantenha a apresentação com o stream assistido já consolidado no módulo."
                  tone="amber"
                />
              ) : (
                recentRows.map((record) => {
                  const register = displayRegisters.find((entry) => entry.id === record.registerId);
                  const mapping = parseModbusMapping(
                    register?.code,
                    record.metricName,
                    register?.name,
                    register?.dataType,
                    record.unit
                  );
                  const quality = resolveQuality(record, register);

                  return (
                    <div
                      key={record.id}
                      className="flex flex-col gap-4 rounded-lg border border-border bg-surface-inset px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {record.deviceName ?? resolveDeviceLabel(displayDevices, record.deviceId)}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {record.registerName ?? resolveRegisterLabel(displayRegisters, record.registerId)} • {mapping.functionCode}:{mapping.registerAddress}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <IotStatusPill
                          label={`${record.metricValue}${record.unit ? ` ${record.unit}` : ''}`}
                          tone={resolveQualityTone(quality)}
                        />
                        <IotStatusPill label={resolveTelemetryQualityLabel(quality)} tone={resolveQualityTone(quality)} />
                        <span className="text-sm text-muted">{formatDateTime(record.recordedAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </IotPanel>

          <PermissionGuard permission="iot.telemetry.write">
            <IotPanel
              title="Ingestão manual"
              description="Entrada controlada para simular ou registrar uma leitura operacional dentro do fluxo atual."
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <IotSelectField label="Dispositivo" value={deviceId} onChange={setDeviceId} options={formDeviceOptions} />
                <IotSelectField label="Registrador" value={registerId} onChange={setRegisterId} options={formRegisterOptions} />
                <IotTextField label="Métrica" value={metricName} onChange={setMetricName} required />
                <IotTextField label="Valor" value={metricValue} onChange={setMetricValue} type="number" required />
                <IotTextField label="Unidade" value={unit} onChange={setUnit} />
                <IotDateTimeField label="Coletado em" value={recordedAt} onChange={setRecordedAt} />
                <IotTextField
                  label="Metadata (JSON)"
                  value={metadataRaw}
                  onChange={setMetadataRaw}
                  placeholder='{"source":"modbus-gateway","quality":"GOOD"}'
                />
                <div className="flex gap-3">
                  <IotPrimaryButton type="submit" disabled={submitting}>
                    {submitting ? 'Registrando leitura...' : 'Registrar leitura'}
                  </IotPrimaryButton>
                </div>
              </form>
            </IotPanel>
          </PermissionGuard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
          <IotPanel
            title="Tendência de coleta"
            description="Curva simplificada para comunicar ritmo de ingestão ao longo da janela recente."
          >
            <IotMiniTrend title="Pontos por janela" series={trendSeries} accent="var(--tenant-accent)" />
          </IotPanel>
          <IotPanel
            title="Sinais do stream"
            description="Indicadores curtos para leitura rápida e ligação natural com registradores e dashboard."
          >
            <div className="space-y-3">
              <IotSupportCard className="px-4 py-4">
                <p className="text-sm font-semibold text-foreground">Cobertura atual</p>
                <p className="mt-2 text-sm text-muted">
                  {devicesInFlow} dispositivo(s) e {uniqueMetrics} métrica(s) participando do stream exibido.
                </p>
              </IotSupportCard>
              <IotSupportCard className="px-4 py-4">
                <p className="text-sm font-semibold text-foreground">Relacionamento com registradores</p>
                <p className="mt-2 text-sm text-muted">
                  Cada leitura mantém o vínculo com registrador, função Modbus e endereço lógico.
                </p>
              </IotSupportCard>
            </div>
          </IotPanel>
        </div>

        <IotPanel
          title="Tabela de telemetria"
          description="Leitura densa para operação, com contexto de ativo, registrador, mapeamento e qualidade."
        >
          <IotDataTable>
              <thead className="border-b border-border bg-surface-inset/80">
                <tr>
                  {['Dispositivo', 'Registrador', 'Mapeamento', 'Métrica', 'Valor', 'Qualidade', 'Coletado em'].map((header) => (
                    <IotDataTableHead key={header}>
                      {header}
                    </IotDataTableHead>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70 text-sm text-foreground">
                {loading ? (
                  <IotTableStateRow
                    colSpan={7}
                    title="Sincronizando o stream"
                    description="Consolidando as leituras recentes, o mapeamento Modbus e a qualidade dos pontos."
                  />
                ) : visibleRows.length === 0 ? (
                  <IotTableStateRow
                    colSpan={7}
                    title="Nenhum ponto nesta janela"
                    description="Ajuste os filtros ou use o modo assistido para manter a leitura contínua da operação."
                    tone="amber"
                  />
                ) : (
                  visibleRows.map((record) => {
                    const register = displayRegisters.find((entry) => entry.id === record.registerId);
                    const mapping = parseModbusMapping(
                      register?.code,
                      record.metricName,
                      register?.name,
                      register?.dataType,
                      record.unit
                    );
                    const quality = resolveQuality(record, register);

                    return (
                      <tr key={record.id} className="transition-colors hover:bg-surface-inset/40">
                        <td className="px-4 py-4 text-foreground">
                          {record.deviceName ?? resolveDeviceLabel(displayDevices, record.deviceId)}
                        </td>
                        <td className="px-4 py-4 text-foreground">
                          {record.registerName ?? resolveRegisterLabel(displayRegisters, record.registerId)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <IotStatusPill label={mapping.functionCode} tone="cyan" />
                            <IotStatusPill label={mapping.registerAddress} tone="neutral" />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-foreground">{record.metricName}</td>
                        <td className="px-4 py-4">
                          <IotStatusPill
                            label={`${record.metricValue}${record.unit ? ` ${record.unit}` : ''}`}
                            tone={resolveQualityTone(quality)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <IotStatusPill label={resolveTelemetryQualityLabel(quality)} tone={resolveQualityTone(quality)} />
                        </td>
                        <td className="px-4 py-4 text-muted">{formatDateTime(record.recordedAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
          </IotDataTable>
        </IotPanel>

        {!useDemoMode ? (
          <Pagination
            page={pageData.page}
            totalPages={pageData.totalPages}
            totalElements={totalItems}
            onPageChange={(nextPage) =>
              load(nextPage, search, deviceFilterId, registerFilterId, metricFilter, startAt, endAt)
            }
          />
        ) : null}
      </IotModulePage>
    </PermissionGuard>
  );
}
