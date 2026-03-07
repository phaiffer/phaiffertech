'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { iotService } from '@/shared/services/iot-service';
import { PageResponse } from '@/shared/types/common';
import { IotDevice, IotTelemetryRecord } from '@/shared/types/iot';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { DateTimeInput } from '@/shared/ui/datetime-input';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;

const initialPage: PageResponse<IotTelemetryRecord> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function toIsoDate(value: string) {
  if (!value) {
    return undefined;
  }
  return new Date(value).toISOString();
}

export function IotTelemetryPage() {
  const [pageData, setPageData] = useState<PageResponse<IotTelemetryRecord>>(initialPage);
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [deviceFilterId, setDeviceFilterId] = useState('');
  const [recordedFrom, setRecordedFrom] = useState('');
  const [recordedTo, setRecordedTo] = useState('');

  const [deviceId, setDeviceId] = useState('');
  const [metricName, setMetricName] = useState('');
  const [metricValue, setMetricValue] = useState('');
  const [unit, setUnit] = useState('');
  const [metadataRaw, setMetadataRaw] = useState('');
  const [recordedAt, setRecordedAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const deviceOptions = useMemo(() => {
    return [
      { value: '', label: 'Todos' },
      ...devices.map((device) => ({ value: device.id, label: device.name }))
    ];
  }, [devices]);

  const formDeviceOptions = useMemo(() => {
    return [
      { value: '', label: 'Selecione um dispositivo' },
      ...devices.map((device) => ({ value: device.id, label: `${device.name} (${device.identifier ?? device.serialNumber ?? '-'})` }))
    ];
  }, [devices]);

  const loadDevices = useCallback(async () => {
    try {
      const result = await iotService.listDevices(0, 200, '');
      setDevices(resolvePageItems(result));
    } catch {
      setDevices([]);
    }
  }, []);

  const load = useCallback(async (
    page: number,
    currentSearch: string,
    currentDeviceId: string,
    currentRecordedFrom: string,
    currentRecordedTo: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await iotService.listTelemetry(page, pageSize, currentSearch, {
        deviceId: currentDeviceId || undefined,
        recordedFrom: toIsoDate(currentRecordedFrom),
        recordedTo: toIsoDate(currentRecordedTo)
      });
      setPageData(result);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar telemetria.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    load(0, search, deviceFilterId, recordedFrom, recordedTo);
  }, [load, search, deviceFilterId, recordedFrom, recordedTo]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!deviceId) {
      setError('Selecione um dispositivo para registrar telemetria.');
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
        metricName,
        metricValue: parsedMetricValue,
        unit: unit || undefined,
        metadata: parsedMetadata,
        recordedAt: toIsoDate(recordedAt)
      });

      setMetricName('');
      setMetricValue('');
      setUnit('');
      setMetadataRaw('');
      setRecordedAt('');
      setSuccess('Telemetria registrada com sucesso.');

      await load(pageData.page, search, deviceFilterId, recordedFrom, recordedTo);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao gravar telemetria.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

  const columns: DataTableColumn<IotTelemetryRecord>[] = [
    {
      key: 'device',
      header: 'Dispositivo',
      render: (record) => {
        const device = devices.find((entry) => entry.id === record.deviceId);
        return device?.name ?? record.deviceId;
      }
    },
    {
      key: 'metricName',
      header: 'Métrica',
      render: (record) => record.metricName
    },
    {
      key: 'metricValue',
      header: 'Valor',
      render: (record) => `${record.metricValue}${record.unit ? ` ${record.unit}` : ''}`
    },
    {
      key: 'recordedAt',
      header: 'Coletado em',
      render: (record) => new Date(record.recordedAt).toLocaleString('pt-BR')
    }
  ];

  return (
    <PermissionGuard
      permission="iot.telemetry.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar telemetria.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="IoT Telemetry" description="Data plane com ingestão e leitura paginada de telemetria." />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_240px_220px_220px_auto_auto]">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Métrica ou unidade" />
          <FormSelect label="Dispositivo" value={deviceFilterId} options={deviceOptions} onChange={setDeviceFilterId} />
          <DateTimeInput label="De" value={recordedFrom} onChange={setRecordedFrom} />
          <DateTimeInput label="Até" value={recordedTo} onChange={setRecordedTo} />
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
              setRecordedFrom('');
              setRecordedTo('');
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Limpar
          </button>
        </div>

        <PermissionGuard permission="iot.telemetry.write">
          <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
            <FormSelect label="Dispositivo" value={deviceId} options={formDeviceOptions} onChange={setDeviceId} />
            <FormInput label="Métrica" value={metricName} onChange={setMetricName} required />
            <FormInput label="Valor" value={metricValue} onChange={setMetricValue} required />
            <FormInput label="Unidade" value={unit} onChange={setUnit} />
            <DateTimeInput label="Coletado em" value={recordedAt} onChange={setRecordedAt} />
            <FormInput label="Metadata (JSON)" value={metadataRaw} onChange={setMetadataRaw} />

            <div className="md:col-span-3 flex gap-2">
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
          onPageChange={(nextPage) => load(nextPage, search, deviceFilterId, recordedFrom, recordedTo)}
        />
      </div>
    </PermissionGuard>
  );
}
