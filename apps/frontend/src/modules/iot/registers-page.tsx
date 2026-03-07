'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';
import { iotService } from '@/shared/services/iot-service';
import { PageResponse } from '@/shared/types/common';
import { IotDevice, IotRegister } from '@/shared/types/iot';
import { resolveDeviceLabel } from '@/modules/iot/iot-utils';

const pageSize = 10;

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'INACTIVE', label: 'INACTIVE' },
  { value: 'MAINTENANCE', label: 'MAINTENANCE' }
];

const formStatusOptions = statusOptions.filter((option) => option.value);

const dataTypeOptions = [
  { value: 'DECIMAL', label: 'DECIMAL' },
  { value: 'INTEGER', label: 'INTEGER' },
  { value: 'BOOLEAN', label: 'BOOLEAN' },
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

export function IotRegistersPage() {
  const [pageData, setPageData] = useState<PageResponse<IotRegister>>(initialPage);
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [deviceFilterId, setDeviceFilterId] = useState('');
  const [metricFilter, setMetricFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [metricName, setMetricName] = useState('');
  const [unit, setUnit] = useState('');
  const [dataType, setDataType] = useState('DECIMAL');
  const [minThreshold, setMinThreshold] = useState('');
  const [maxThreshold, setMaxThreshold] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<IotRegister | null>(null);

  const deviceOptions = useMemo(() => [
    { value: '', label: 'Todos' },
    ...devices.map((device) => ({ value: device.id, label: device.name }))
  ], [devices]);

  const formDeviceOptions = useMemo(() => [
    { value: '', label: 'Selecione um dispositivo' },
    ...devices.map((device) => ({ value: device.id, label: `${device.name} (${device.identifier ?? device.serialNumber ?? '-'})` }))
  ], [devices]);

  const loadDevices = useCallback(async () => {
    try {
      const result = await iotService.listDevices(0, 300, '');
      setDevices(resolvePageItems(result));
    } catch {
      setDevices([]);
    }
  }, []);

  const load = useCallback(async (
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
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar registers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    void load(0, search, deviceFilterId, metricFilter, statusFilter);
  }, [load, search, deviceFilterId, metricFilter, statusFilter]);

  function resetForm() {
    setEditingId(null);
    setDeviceId('');
    setName('');
    setCode('');
    setMetricName('');
    setUnit('');
    setDataType('DECIMAL');
    setMinThreshold('');
    setMaxThreshold('');
    setStatus('ACTIVE');
  }

  function beginEdit(register: IotRegister) {
    setEditingId(register.id);
    setDeviceId(register.deviceId);
    setName(register.name);
    setCode(register.code);
    setMetricName(register.metricName);
    setUnit(register.unit ?? '');
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
      setError('Selecione um dispositivo para o register.');
      return;
    }

    const parsedMin = parseOptionalNumber(minThreshold);
    const parsedMax = parseOptionalNumber(maxThreshold);

    if (parsedMin === null || parsedMax === null) {
      setError('Thresholds devem ser valores numéricos válidos.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      deviceId,
      name,
      code,
      metricName,
      unit: unit || undefined,
      dataType,
      minThreshold: parsedMin,
      maxThreshold: parsedMax,
      status
    };

    try {
      if (editingId) {
        await iotService.updateRegister(editingId, payload);
        setSuccess('Register atualizado com sucesso.');
      } else {
        await iotService.createRegister(payload);
        setSuccess('Register criado com sucesso.');
      }

      resetForm();
      await load(pageData.page, search, deviceFilterId, metricFilter, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar register.');
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
      setSuccess('Register removido com sucesso.');
      await load(pageData.page, search, deviceFilterId, metricFilter, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir register.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

  const columns: DataTableColumn<IotRegister>[] = [
    {
      key: 'device',
      header: 'Device',
      render: (register) => resolveDeviceLabel(devices, register.deviceId)
    },
    {
      key: 'name',
      header: 'Register',
      render: (register) => (
        <div>
          <p className="font-medium text-slate-900">{register.name}</p>
          <p className="text-xs text-slate-500">{register.code}</p>
        </div>
      )
    },
    {
      key: 'metric',
      header: 'Métrica',
      render: (register) => (
        <div>
          <p>{register.metricName}</p>
          <p className="text-xs text-slate-500">{register.dataType}{register.unit ? ` • ${register.unit}` : ''}</p>
        </div>
      )
    },
    {
      key: 'thresholds',
      header: 'Thresholds',
      render: (register) => `${register.minThreshold ?? '-'} / ${register.maxThreshold ?? '-'}`
    },
    {
      key: 'status',
      header: 'Status',
      render: (register) => register.status
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (register) => (
        <div className="flex gap-2">
          <PermissionGuard permission="iot.register.update">
            <button
              type="button"
              onClick={() => beginEdit(register)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>

          <PermissionGuard permission="iot.register.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(register)}
              className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700"
            >
              Excluir
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="iot.register.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar registers.</div>}
    >
      <div className="space-y-5">
        <PageTitle
          title="IoT Registers"
          description="Registers modelados como canais lógicos por device, sem copiar o acoplamento protocolar do legado."
        />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-6">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Nome, código ou métrica" />
          <FormSelect label="Device" value={deviceFilterId} options={deviceOptions} onChange={setDeviceFilterId} />
          <FormInput label="Métrica" value={metricFilter} onChange={setMetricFilter} />
          <FormSelect label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
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
              setMetricFilter('');
              setStatusFilter('');
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Limpar
          </button>
        </div>

        <PermissionGuard permission={editingId ? 'iot.register.update' : 'iot.register.create'}>
          <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
            <FormSelect label="Device" value={deviceId} options={formDeviceOptions} onChange={setDeviceId} />
            <FormInput label="Nome" value={name} onChange={setName} required />
            <FormInput label="Código" value={code} onChange={setCode} required />
            <FormSelect label="Data type" value={dataType} options={dataTypeOptions} onChange={setDataType} />
            <FormInput label="Métrica" value={metricName} onChange={setMetricName} required />
            <FormInput label="Unidade" value={unit} onChange={setUnit} />
            <FormInput label="Threshold mínimo" value={minThreshold} onChange={setMinThreshold} type="number" />
            <FormInput label="Threshold máximo" value={maxThreshold} onChange={setMaxThreshold} type="number" />
            <FormSelect label="Status" value={status} options={formStatusOptions} onChange={setStatus} />

            <div className="flex gap-2 xl:col-span-4">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? 'Salvando...' : editingId ? 'Atualizar register' : 'Criar register'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancelar edição
                </button>
              ) : null}
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
          emptyMessage="Nenhum register encontrado."
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          onPageChange={(nextPage) => load(nextPage, search, deviceFilterId, metricFilter, statusFilter)}
        />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir register"
          description={deleteCandidate ? `Confirma a exclusão do register ${deleteCandidate.name}?` : undefined}
          confirmLabel="Excluir"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
