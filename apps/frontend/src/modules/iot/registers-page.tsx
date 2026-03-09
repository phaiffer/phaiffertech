'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { Pagination } from '@/shared/ui/pagination';
import { iotService } from '@/shared/services/iot-service';
import { PageResponse } from '@/shared/types/common';
import { IotDevice, IotRegister, IotTelemetryRecord } from '@/shared/types/iot';
import {
  BoltIcon,
  Chip,
  DeviceIcon,
  IotHeroAside,
  IotNotice,
  IotPageHeader,
  IotPanel,
  IotPrimaryButton,
  IotSecondaryButton,
  IotSelectField,
  IotStatusPill,
  IotTableStateRow,
  IotTextField,
  PlugIcon,
  WaveIcon
} from '@/modules/iot/iot-chrome';
import {
  buildDemoDevicesFromReal,
  buildDemoRegisters,
  buildDemoTelemetryRecords,
  buildModbusCode,
  modbusVariableTemplates,
  parseModbusMapping,
  resolveModbusVariableTemplate
} from '@/modules/iot/iot-demo-data';
import {
  formatDateTime,
  resolveDeviceLabel,
  resolveRegisterStatusLabel
} from '@/modules/iot/iot-utils';

const pageSize = 10;

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' },
  { value: 'MAINTENANCE', label: 'Em manutenção' }
];

const formStatusOptions = statusOptions.filter((option) => option.value);

const functionOptions = [
  { value: 'FC01', label: 'FC01 • Coil status' },
  { value: 'FC02', label: 'FC02 • Entradas discretas' },
  { value: 'FC03', label: 'FC03 • Holding registers' },
  { value: 'FC04', label: 'FC04 • Input registers' }
];

const dataTypeOptions = [
  { value: 'FLOAT32', label: 'FLOAT32' },
  { value: 'UINT16', label: 'UINT16' },
  { value: 'UINT32', label: 'UINT32' },
  { value: 'INT16', label: 'INT16' },
  { value: 'INT32', label: 'INT32' },
  { value: 'BOOLEAN', label: 'BOOLEAN' },
  { value: 'DECIMAL', label: 'DECIMAL' },
  { value: 'STRING', label: 'STRING' }
];

const initialPage: PageResponse<IotRegister> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseRequiredInteger(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function resolveTone(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'green' as const;
    case 'MAINTENANCE':
      return 'amber' as const;
    case 'INACTIVE':
      return 'red' as const;
    default:
      return 'neutral' as const;
  }
}

function resolveReadingTone(value?: number, min?: number, max?: number) {
  if (value === undefined) {
    return 'neutral' as const;
  }

  if ((min !== undefined && value < min) || (max !== undefined && value > max)) {
    return 'amber' as const;
  }

  return 'green' as const;
}

export function IotRegistersPage() {
  const [pageData, setPageData] = useState<PageResponse<IotRegister>>(initialPage);
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [telemetry, setTelemetry] = useState<IotTelemetryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [deviceFilterId, setDeviceFilterId] = useState('');
  const [metricFilter, setMetricFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [editingRegister, setEditingRegister] = useState<IotRegister | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [name, setName] = useState('');
  const [metricName, setMetricName] = useState('');
  const [functionCode, setFunctionCode] = useState('FC03');
  const [registerAddress, setRegisterAddress] = useState('40001');
  const [unit, setUnit] = useState('');
  const [dataType, setDataType] = useState('FLOAT32');
  const [minThreshold, setMinThreshold] = useState('');
  const [maxThreshold, setMaxThreshold] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<IotRegister | null>(null);

  const loadDevices = useCallback(async () => {
    try {
      const result = await iotService.listDevices(0, 200, '');
      setDevices(resolvePageItems(result));
    } catch {
      setDevices([]);
    }
  }, []);

  const loadTelemetry = useCallback(async () => {
    try {
      const result = await iotService.listTelemetry(0, 200, '');
      setTelemetry(resolvePageItems(result));
    } catch {
      setTelemetry([]);
    }
  }, []);

  const load = useCallback(
    async (
      page: number,
      currentSearch: string,
      currentDeviceId: string,
      currentMetricFilter: string,
      currentStatus: string
    ) => {
      setLoading(true);
      setError(null);

      try {
        const result = await iotService.listRegisters(page, pageSize, currentSearch, {
          deviceId: currentDeviceId || undefined,
          metricName: currentMetricFilter || undefined,
          status: currentStatus || undefined
        });
        setPageData(result);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar registradores.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadDevices();
    void loadTelemetry();
  }, [loadDevices, loadTelemetry]);

  useEffect(() => {
    void load(0, search, deviceFilterId, metricFilter, statusFilter);
  }, [load, search, deviceFilterId, metricFilter, statusFilter]);

  const displayDevices = useMemo(() => buildDemoDevicesFromReal(devices), [devices]);
  const realRows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const useDemoMode =
    Boolean(error) ||
    (!loading &&
      totalItems === 0 &&
      !search &&
      !deviceFilterId &&
      !metricFilter &&
      !statusFilter);

  const demoRows = useMemo<IotRegister[]>(() => {
    return buildDemoRegisters(displayDevices).filter((register) => {
      const matchesSearch =
        !search ||
        [register.name, register.code, register.metricName]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesDevice = !deviceFilterId || register.deviceId === deviceFilterId;
      const matchesMetric =
        !metricFilter || register.metricName.toLowerCase().includes(metricFilter.toLowerCase());
      const matchesStatus = !statusFilter || register.status === statusFilter;
      return matchesSearch && matchesDevice && matchesMetric && matchesStatus;
    });
  }, [deviceFilterId, displayDevices, metricFilter, search, statusFilter]);

  const visibleRows: IotRegister[] = useDemoMode ? demoRows : realRows;
  const displayTelemetry = useMemo(
    () =>
      useDemoMode
        ? buildDemoTelemetryRecords(displayDevices, visibleRows)
        : telemetry,
    [displayDevices, telemetry, useDemoMode, visibleRows]
  );

  const latestTelemetryByRegister = useMemo(() => {
    const map = new Map<string, IotTelemetryRecord>();
    const sorted = [...displayTelemetry].sort(
      (left, right) => new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime()
    );

    sorted.forEach((record) => {
      if (record.registerId && !map.has(record.registerId)) {
        map.set(record.registerId, record);
      }
    });

    return map;
  }, [displayTelemetry]);

  const deviceOptions = useMemo(
    () => [
      { value: '', label: 'Todos os dispositivos' },
      ...displayDevices.map((device) => ({ value: device.id, label: device.name }))
    ],
    [displayDevices]
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

  const selectedTemplate = useMemo(
    () => resolveModbusVariableTemplate(metricName, name, buildModbusCode(functionCode, registerAddress)),
    [functionCode, metricName, name, registerAddress]
  );

  const activeRegisters = visibleRows.filter((register) => register.status === 'ACTIVE').length;
  const mappedDevices = new Set(visibleRows.map((register) => register.deviceId)).size;
  const fc03Registers = visibleRows.filter((register) =>
    (register.functionCode ?? parseModbusMapping(register.code, register.metricName, register.name).functionCode) ===
    'FC03'
  ).length;

  function resetForm() {
    setEditingRegister(null);
    setDeviceId('');
    setName('');
    setMetricName('');
    setFunctionCode('FC03');
    setRegisterAddress('40001');
    setUnit('');
    setDataType('FLOAT32');
    setMinThreshold('');
    setMaxThreshold('');
    setStatus('ACTIVE');
  }

  function applyTemplate(templateId: string) {
    const template = modbusVariableTemplates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }

    setName(template.label);
    setMetricName(template.label);
    setFunctionCode(template.functionCode);
    setRegisterAddress(template.registerAddress);
    setUnit(template.unit);
    setDataType(template.dataType.toUpperCase());
  }

  function beginEdit(register: IotRegister) {
    const mapping = parseModbusMapping(
      register.code,
      register.metricName,
      register.name,
      register.dataType,
      register.unit
    );

    setEditingRegister(register);
    setDeviceId(register.deviceId);
    setName(register.name);
    setMetricName(register.metricName);
    setFunctionCode(register.functionCode ?? mapping.functionCode);
    setRegisterAddress(register.registerAddress?.toString() ?? mapping.registerAddress);
    setUnit(register.unit ?? mapping.unit ?? '');
    setDataType(register.dataType);
    setMinThreshold(register.minThreshold?.toString() ?? '');
    setMaxThreshold(register.maxThreshold?.toString() ?? '');
    setStatus(register.status);
    setSuccess(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!deviceId) {
      setError('Selecione um dispositivo para o registrador Modbus.');
      return;
    }

    const parsedMin = parseOptionalNumber(minThreshold);
    const parsedMax = parseOptionalNumber(maxThreshold);
    const parsedRegisterAddress = parseRequiredInteger(registerAddress);

    if (parsedMin === null || parsedMax === null) {
      setError('As faixas mínima e máxima devem ser números válidos.');
      return;
    }

    if (parsedRegisterAddress === null) {
      setError('O endereço / offset Modbus deve ser um número inteiro válido.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      deviceId,
      name,
      code: buildModbusCode(functionCode, String(parsedRegisterAddress)),
      functionCode,
      registerAddress: parsedRegisterAddress,
      metricName,
      unit: unit || undefined,
      dataType,
      minThreshold: parsedMin,
      maxThreshold: parsedMax,
      status
    };

    try {
      if (editingRegister) {
        await iotService.updateRegister(editingRegister.id, payload);
        setSuccess('Registrador atualizado com sucesso.');
      } else {
        await iotService.createRegister(payload);
        setSuccess('Registrador criado com sucesso.');
      }

      resetForm();
      await Promise.all([
        load(pageData.page, search, deviceFilterId, metricFilter, statusFilter),
        loadTelemetry()
      ]);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Erro ao salvar registrador.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await iotService.deleteRegister(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess('Registrador removido com sucesso.');
      await load(pageData.page, search, deviceFilterId, metricFilter, statusFilter);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Erro ao excluir registrador.'
      );
    }
  }

  return (
    <PermissionGuard
      permission="iot.register.read"
      fallback={
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Você não possui permissão para visualizar registradores do IoT.
        </div>
      }
    >
      <div className="space-y-6">
        <IotPageHeader
          eyebrow="Mapeamento industrial"
          title="Registradores Modbus"
          description="Camada de configuração industrial dos canais Modbus, conectando dispositivo, função, endereço, tipo de dado, faixas operacionais e leitura mais recente."
          chips={
            <>
              <Chip label="Registradores" value={visibleRows.length} tone="cyan" icon={<PlugIcon />} />
              <Chip label="Ativos" value={activeRegisters} tone="green" icon={<WaveIcon />} />
              <Chip label="Dispositivos mapeados" value={mappedDevices} tone="neutral" icon={<DeviceIcon />} />
              <Chip label="Holding regs" value={fc03Registers} tone="amber" icon={<BoltIcon />} />
            </>
          }
          aside={
            <IotHeroAside
              title="Estado do Mapeamento"
              items={[
                { label: 'Modo de leitura', value: useDemoMode ? 'Assistido para apresentação' : 'Configuração real ativa', tone: useDemoMode ? 'amber' : 'green' },
                { label: 'Canais com leitura', value: `${latestTelemetryByRegister.size}`, tone: 'cyan' },
                { label: 'Padrão dominante', value: 'Modbus FC03/FC04', tone: 'green' }
              ]}
            />
          }
        />

        {error ? (
          <IotNotice
            title="Integração indisponível no mapeamento"
            description={`${error} A tela continua demonstrável em modo assistido com mapeamentos coerentes com a narrativa Modbus.`}
            tone="amber"
          />
        ) : null}

        {success ? <IotNotice title="Operação concluída" description={success} tone="green" /> : null}

        <IotPanel
          title="Filtros de mapeamento"
          description="Refine a lista por ativo, métrica ou status antes de aprofundar o mapeamento industrial."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <IotTextField
              label="Busca"
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Nome, código ou métrica"
            />
            <IotSelectField
              label="Dispositivo"
              value={deviceFilterId}
              onChange={setDeviceFilterId}
              options={deviceOptions}
            />
            <IotTextField
              label="Métrica"
              value={metricFilter}
              onChange={setMetricFilter}
              placeholder="Temperatura, corrente, energia..."
            />
            <IotSelectField
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
            />
            <div className="flex items-end gap-3">
              <IotPrimaryButton onClick={() => setSearch(searchInput)}>Aplicar filtros</IotPrimaryButton>
              <IotSecondaryButton
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setDeviceFilterId('');
                  setMetricFilter('');
                  setStatusFilter('');
                }}
              >
                Limpar
              </IotSecondaryButton>
            </div>
          </div>
        </IotPanel>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
          <IotPanel
            title={editingRegister ? `Editar ${editingRegister.name}` : 'Novo registrador Modbus'}
            description="Cadastro apresentado como configuração industrial, reutilizando o contrato real de registradores do backend."
          >
            <PermissionGuard permission={editingRegister ? 'iot.register.update' : 'iot.register.create'}>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <IotSelectField
                    label="Dispositivo"
                    value={deviceId}
                    onChange={setDeviceId}
                    options={formDeviceOptions}
                  />
                  <IotTextField
                    label="Nome do canal"
                    value={name}
                    onChange={setName}
                    placeholder="Temperatura de descarga"
                    required
                  />
                  <IotTextField
                    label="Métrica"
                    value={metricName}
                    onChange={setMetricName}
                    placeholder="Temperatura / Corrente / Potência"
                    required
                  />
                  <IotSelectField
                    label="Função Modbus"
                    value={functionCode}
                    onChange={setFunctionCode}
                    options={functionOptions}
                  />
                  <IotTextField
                    label="Endereço / offset"
                    value={registerAddress}
                    onChange={setRegisterAddress}
                    placeholder="40001"
                    required
                  />
                  <IotSelectField
                    label="Tipo de dado"
                    value={dataType}
                    onChange={setDataType}
                    options={dataTypeOptions}
                  />
                  <IotTextField label="Unidade" value={unit} onChange={setUnit} placeholder="°C / bar / A" />
                  <IotTextField
                    label="Faixa mínima"
                    value={minThreshold}
                    onChange={setMinThreshold}
                    type="number"
                    placeholder="0"
                  />
                  <IotTextField
                    label="Faixa máxima"
                    value={maxThreshold}
                    onChange={setMaxThreshold}
                    type="number"
                    placeholder="100"
                  />
                  <IotSelectField
                    label="Status"
                    value={status}
                    onChange={setStatus}
                    options={formStatusOptions}
                  />
                </div>

                <div className="rounded-[28px] border border-slate-800 bg-slate-950/35 p-5">
                  <p className="text-sm font-semibold text-white">Preview do mapeamento</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <IotStatusPill label={buildModbusCode(functionCode, registerAddress)} tone="cyan" />
                    <IotStatusPill label={dataType} tone="neutral" />
                    {unit ? <IotStatusPill label={unit} tone="green" /> : null}
                    {selectedTemplate ? (
                      <IotStatusPill label={selectedTemplate.label} tone="amber" />
                    ) : null}
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    O campo `code` persistido no backend continua sendo o mapeamento construído a partir de função e endereço.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <IotPrimaryButton type="submit" disabled={submitting}>
                    {submitting
                      ? 'Salvando mapeamento...'
                      : editingRegister
                        ? 'Salvar ajustes'
                        : 'Criar registrador'}
                  </IotPrimaryButton>
                  {editingRegister ? (
                    <IotSecondaryButton onClick={resetForm}>Cancelar edição</IotSecondaryButton>
                  ) : null}
                </div>
              </form>
            </PermissionGuard>
          </IotPanel>

          <IotPanel
            title="Pacotes Modbus"
            description="Atalhos para acelerar o cadastro com semântica industrial coerente."
          >
            <div className="space-y-3">
              {modbusVariableTemplates.map((template) => {
                const active =
                  selectedTemplate?.id === template.id ||
                  metricName.toLowerCase().includes(template.label.toLowerCase());

                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => applyTemplate(template.id)}
                    className={[
                      'w-full rounded-[24px] border px-4 py-4 text-left transition',
                      active
                        ? 'border-cyan-400/45 bg-cyan-400/12'
                        : 'border-slate-800 bg-slate-950/35 hover:border-slate-600'
                    ].join(' ')}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-white">{template.label}</p>
                      <IotStatusPill label={`${template.functionCode}:${template.registerAddress}`} tone="cyan" />
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{template.description}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {template.dataType} • {template.unit}
                    </p>
                  </button>
                );
              })}
            </div>
          </IotPanel>
        </div>

        <IotPanel
          title="Tabela operacional de registradores"
          description="Lista densa com associação ao ativo, mapeamento Modbus, faixas operacionais e última leitura conhecida."
        >
          <div className="overflow-hidden rounded-[28px] border border-cyan-500/15">
            <table className="min-w-full bg-[#050f1f]">
              <thead className="border-b border-cyan-500/15 bg-[#061427]">
                <tr>
                  {['Variável', 'Dispositivo', 'Mapeamento', 'Tipo / unidade', 'Faixas', 'Última leitura', 'Status', 'Ações'].map((header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-200">
                {loading ? (
                  <IotTableStateRow
                    colSpan={8}
                    title="Sincronizando os registradores"
                    description="Consolidando mapeamento Modbus, faixas operacionais e vínculo com as leituras."
                  />
                ) : visibleRows.length === 0 ? (
                  <IotTableStateRow
                    colSpan={8}
                    title="Nenhum registrador nesta janela"
                    description="Ajuste os filtros ou mantenha a apresentação com o mapeamento assistido do módulo."
                    tone="amber"
                  />
                ) : (
                  visibleRows.map((register) => {
                    const mapping = parseModbusMapping(
                      register.code,
                      register.metricName,
                      register.name,
                      register.dataType,
                      register.unit
                    );
                    const latestReading = latestTelemetryByRegister.get(register.id);
                    const latestValue =
                      latestReading?.metricValue !== undefined
                        ? Number(latestReading.metricValue)
                        : undefined;
                    const latestTone = resolveReadingTone(
                      latestValue,
                      register.minThreshold,
                      register.maxThreshold
                    );

                    return (
                      <tr key={register.id} className="bg-[#071223]/80">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-white">{register.name}</p>
                          <p className="mt-1 text-sm text-slate-400">{register.metricName}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {resolveDeviceLabel(displayDevices, register.deviceId)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <IotStatusPill label={mapping.functionCode} tone="cyan" />
                            <IotStatusPill label={mapping.registerAddress} tone="neutral" />
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p>{register.dataType}</p>
                          <p className="mt-1 text-sm text-slate-400">{register.unit ?? '-'}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {register.minThreshold ?? '-'} / {register.maxThreshold ?? '-'}
                        </td>
                        <td className="px-4 py-4">
                          {latestReading ? (
                            <div className="flex flex-col gap-2">
                              <IotStatusPill
                                label={`${latestReading.metricValue}${latestReading.unit ? ` ${latestReading.unit}` : ''}`}
                                tone={latestTone}
                              />
                              <span className="text-xs text-slate-500">
                                {formatDateTime(latestReading.recordedAt)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500">Sem leitura na janela atual</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <IotStatusPill label={resolveRegisterStatusLabel(register.status)} tone={resolveTone(register.status)} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {!useDemoMode ? (
                              <>
                                <PermissionGuard permission="iot.register.update">
                                  <button
                                    type="button"
                                    onClick={() => beginEdit(register)}
                                    className="rounded-2xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200 transition hover:border-cyan-400/35"
                                  >
                                    Editar
                                  </button>
                                </PermissionGuard>
                                <PermissionGuard permission="iot.register.delete">
                                  <button
                                    type="button"
                                    onClick={() => setDeleteCandidate(register)}
                                    className="rounded-2xl border border-rose-500/30 bg-rose-500/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-200 transition hover:bg-rose-500/12"
                                  >
                                    Excluir
                                  </button>
                                </PermissionGuard>
                              </>
                            ) : (
                              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                Somente navegação
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </IotPanel>

        {!useDemoMode ? (
          <Pagination
            page={pageData.page}
            totalPages={pageData.totalPages}
            totalElements={totalItems}
            onPageChange={(nextPage) =>
              load(nextPage, search, deviceFilterId, metricFilter, statusFilter)
            }
          />
        ) : null}

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir registrador"
          description={
            deleteCandidate
              ? `Confirma a exclusão do registrador ${deleteCandidate.name}?`
              : undefined
          }
          confirmLabel="Excluir"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
