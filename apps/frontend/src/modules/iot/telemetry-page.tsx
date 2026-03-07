'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { DateTimeInput } from '@/shared/ui/datetime-input';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';
import { iotService } from '@/shared/services/iot-service';
import { PageResponse } from '@/shared/types/common';
import { IotDevice, IotRegister, IotTelemetryRecord } from '@/shared/types/iot';
import {
  formatDateTime,
  resolveDeviceLabel,
  resolveRegisterLabel,
  toIsoDate
} from '@/modules/iot/iot-utils';

const pageSize = 10;

const initialPage: PageResponse<IotTelemetryRecord> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

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

  const deviceOptions = useMemo(() => [
    { value: '', label: 'Todos' },
    ...devices.map((device) => ({ value: device.id, label: device.name }))
  ], [devices]);

  const formDeviceOptions = useMemo(() => [
    { value: '', label: 'Selecione um dispositivo' },
    ...devices.map((device) => ({ value: device.id, label: `${device.name} (${device.identifier ?? device.serialNumber ?? '-'})` }))
  ], [devices]);

  const visibleFilterRegisters = useMemo(() => {
    if (!deviceFilterId) {
      return registers;
    }
    return registers.filter((register) => register.deviceId === deviceFilterId);
  }, [deviceFilterId, registers]);

  const visibleFormRegisters = useMemo(() => {
    if (!deviceId) {
      return registers;
    }
    return registers.filter((register) => register.deviceId === deviceId);
  }, [deviceId, registers]);

  const registerOptions = useMemo(() => [
    { value: '', label: 'Todos' },
    ...visibleFilterRegisters.map((register) => ({
      value: register.id,
      label: `${register.name} (${register.metricName})`
    }))
  ], [visibleFilterRegisters]);

  const formRegisterOptions = useMemo(() => [
    { value: '', label: 'Sem register específico' },
    ...visibleFormRegisters.map((register) => ({
      value: register.id,
      label: `${register.name} (${register.metricName})`
    }))
  ], [visibleFormRegisters]);

  const loadDevices = useCallback(async () => {
    try {
      const result = await iotService.listDevices(0, 300, '');
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

  const load = useCallback(async (
    page: number,
    currentSearch: string,
    currentDeviceId: string,
    currentRegisterId: string,
    currentMetricFilter: string,
    currentStartAt: string,
    currentEndAt: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await iotService.listTelemetry(page, pageSize, currentSearch, {
        deviceId: currentDeviceId || undefined,
        registerId: currentRegisterId || undefined,
        metricName: currentMetricFilter || undefined,
        startAt: toIsoDate(currentStartAt),
        endAt: toIsoDate(currentEndAt)
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar telemetria.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDevices();
    void loadRegisters();
  }, [loadDevices, loadRegisters]);

  useEffect(() => {
    void load(0, search, deviceFilterId, registerFilterId, metricFilter, startAt, endAt);
  }, [load, search, deviceFilterId, registerFilterId, metricFilter, startAt, endAt]);

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

    const selectedRegister = registers.find((register) => register.id === registerId);
    if (!selectedRegister) {
      return;
    }

    if (deviceId !== selectedRegister.deviceId) {
      setDeviceId(selectedRegister.deviceId);
    }

    setMetricName(selectedRegister.metricName);
    if (selectedRegister.unit) {
      setUnit(selectedRegister.unit);
    }
  }, [deviceId, registerId, registers]);

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

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

  const columns: DataTableColumn<IotTelemetryRecord>[] = [
    {
      key: 'device',
      header: 'Device',
      render: (record) => resolveDeviceLabel(devices, record.deviceId)
    },
    {
      key: 'register',
      header: 'Register',
      render: (record) => resolveRegisterLabel(registers, record.registerId)
    },
    {
      key: 'metric',
      header: 'Métrica',
      render: (record) => record.metricName
    },
    {
      key: 'value',
      header: 'Valor',
      render: (record) => `${record.metricValue}${record.unit ? ` ${record.unit}` : ''}`
    },
    {
      key: 'recordedAt',
      header: 'Coletado em',
      render: (record) => formatDateTime(record.recordedAt)
    }
  ];

  return (
    <PermissionGuard
      permission="iot.telemetry.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar telemetria.</div>}
    >
      <div className="space-y-5">
        <PageTitle
          title="IoT Telemetry"
          description="Ingestão e leitura paginada de telemetry com filtros por device, register, métrica e período."
        />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Métrica ou unidade" />
          <FormSelect label="Device" value={deviceFilterId} options={deviceOptions} onChange={setDeviceFilterId} />
          <FormSelect label="Register" value={registerFilterId} options={registerOptions} onChange={setRegisterFilterId} />
          <FormInput label="Métrica" value={metricFilter} onChange={setMetricFilter} />
          <DateTimeInput label="De" value={startAt} onChange={setStartAt} />
          <DateTimeInput label="Até" value={endAt} onChange={setEndAt} />
          <div className="flex gap-2 xl:col-span-2">
            <button
              type="button"
              onClick={() => setSearch(searchInput)}
              className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setDeviceFilterId('');
                setRegisterFilterId('');
                setMetricFilter('');
                setStartAt('');
                setEndAt('');
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Limpar
            </button>
          </div>
        </div>

        <PermissionGuard permission="iot.telemetry.write">
          <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
            <FormSelect label="Device" value={deviceId} options={formDeviceOptions} onChange={setDeviceId} />
            <FormSelect label="Register" value={registerId} options={formRegisterOptions} onChange={setRegisterId} />
            <FormInput label="Métrica" value={metricName} onChange={setMetricName} required />
            <FormInput label="Valor" value={metricValue} onChange={setMetricValue} type="number" required />
            <FormInput label="Unidade" value={unit} onChange={setUnit} />
            <DateTimeInput label="Coletado em" value={recordedAt} onChange={setRecordedAt} />
            <FormInput label="Metadata (JSON)" value={metadataRaw} onChange={setMetadataRaw} />

            <div className="flex gap-2 xl:col-span-4">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? 'Registrando...' : 'Registrar telemetria'}
              </button>
            </div>
          </form>
        </PermissionGuard>

        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          emptyMessage="Nenhum registro de telemetria encontrado."
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          onPageChange={(nextPage) => load(nextPage, search, deviceFilterId, registerFilterId, metricFilter, startAt, endAt)}
        />
      </div>
    </PermissionGuard>
  );
}
