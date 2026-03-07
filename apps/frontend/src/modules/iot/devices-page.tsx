'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
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
import { IotDevice } from '@/shared/types/iot';
import { formatDateTime } from '@/modules/iot/iot-utils';

const pageSize = 10;

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'ONLINE', label: 'ONLINE' },
  { value: 'OFFLINE', label: 'OFFLINE' },
  { value: 'MAINTENANCE', label: 'MAINTENANCE' },
  { value: 'ALERT', label: 'ALERT' }
];

const formStatusOptions = statusOptions.filter((option) => option.value);

const typeOptions = [
  { value: '', label: 'Todos' },
  { value: 'SENSOR', label: 'SENSOR' },
  { value: 'GATEWAY', label: 'GATEWAY' },
  { value: 'ACTUATOR', label: 'ACTUATOR' }
];

const initialPage: PageResponse<IotDevice> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

export function IotDevicesPage() {
  const [pageData, setPageData] = useState<PageResponse<IotDevice>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ONLINE');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<IotDevice | null>(null);

  const load = useCallback(async (page: number, currentSearch: string, currentType: string, currentStatus: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await iotService.listDevices(page, pageSize, currentSearch, {
        type: currentType || undefined,
        status: currentStatus || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar devices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(0, search, typeFilter, statusFilter);
  }, [load, search, typeFilter, statusFilter]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setIdentifier('');
    setType('');
    setLocation('');
    setDescription('');
    setStatus('ONLINE');
  }

  function beginEdit(device: IotDevice) {
    setEditingId(device.id);
    setName(device.name);
    setIdentifier(device.identifier ?? device.serialNumber ?? '');
    setType(device.type ?? '');
    setLocation(device.location ?? '');
    setDescription(device.description ?? '');
    setStatus(device.status);
    setSuccess(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      name,
      identifier,
      type: type || undefined,
      location: location || undefined,
      description: description || undefined,
      status
    };

    try {
      if (editingId) {
        await iotService.updateDevice(editingId, payload);
        setSuccess('Device atualizado com sucesso.');
      } else {
        await iotService.createDevice(payload);
        setSuccess('Device criado com sucesso.');
      }

      resetForm();
      await load(pageData.page, search, typeFilter, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar device.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await iotService.deleteDevice(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess('Device removido com sucesso.');
      await load(pageData.page, search, typeFilter, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir device.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

  const columns: DataTableColumn<IotDevice>[] = [
    {
      key: 'name',
      header: 'Device',
      render: (device) => (
        <div>
          <p className="font-medium text-slate-900">{device.name}</p>
          <p className="text-xs text-slate-500">{device.identifier ?? device.serialNumber ?? '-'}</p>
        </div>
      )
    },
    {
      key: 'context',
      header: 'Contexto',
      render: (device) => (
        <div>
          <p>{device.location ?? '-'}</p>
          <p className="text-xs text-slate-500">{device.description ?? 'Sem descrição'}</p>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (device) => device.type ?? '-'
    },
    {
      key: 'status',
      header: 'Status',
      render: (device) => device.status
    },
    {
      key: 'lastSeenAt',
      header: 'Last seen',
      render: (device) => formatDateTime(device.lastSeenAt)
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (device) => (
        <div className="flex gap-2">
          <PermissionGuard permission="iot.device.update">
            <button
              type="button"
              onClick={() => beginEdit(device)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>

          <PermissionGuard permission="iot.device.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(device)}
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
      permission="iot.device.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar devices.</div>}
    >
      <div className="space-y-5">
        <PageTitle
          title="IoT Devices"
          description="Cadastro de devices com contexto operacional, status básico e última comunicação."
        />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-5">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Nome, identifier, localização ou descrição" />
          <FormSelect label="Tipo" value={typeFilter} options={typeOptions} onChange={setTypeFilter} />
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
              setTypeFilter('');
              setStatusFilter('');
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Limpar
          </button>
        </div>

        <PermissionGuard permission={editingId ? 'iot.device.update' : 'iot.device.create'}>
          <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-3">
            <FormInput label="Nome" value={name} onChange={setName} required />
            <FormInput label="Identifier" value={identifier} onChange={setIdentifier} required />
            <FormSelect label="Tipo" value={type} options={typeOptions} onChange={setType} />
            <FormInput label="Localização" value={location} onChange={setLocation} />
            <FormInput label="Descrição" value={description} onChange={setDescription} />
            <FormSelect label="Status" value={status} options={formStatusOptions} onChange={setStatus} />

            <div className="flex gap-2 xl:col-span-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? 'Salvando...' : editingId ? 'Atualizar device' : 'Criar device'}
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
          emptyMessage="Nenhum device encontrado."
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          onPageChange={(nextPage) => load(nextPage, search, typeFilter, statusFilter)}
        />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir device"
          description={deleteCandidate ? `Confirma a exclusão de ${deleteCandidate.name}?` : undefined}
          confirmLabel="Excluir"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
