'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { DateTimeInput } from '@/shared/ui/datetime-input';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';
import { iotService } from '@/shared/services/iot-service';
import { PageResponse } from '@/shared/types/common';
import { IotDevice, IotMaintenance } from '@/shared/types/iot';
import { formatDateTime, resolveDeviceLabel, toDateTimeLocal, toIsoDate } from '@/modules/iot/iot-utils';

const pageSize = 10;

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'SCHEDULED', label: 'SCHEDULED' },
  { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
  { value: 'COMPLETED', label: 'COMPLETED' },
  { value: 'CANCELLED', label: 'CANCELLED' }
];

const formStatusOptions = statusOptions.filter((option) => option.value);

const priorityOptions = [
  { value: '', label: 'Todas' },
  { value: 'LOW', label: 'LOW' },
  { value: 'MEDIUM', label: 'MEDIUM' },
  { value: 'HIGH', label: 'HIGH' },
  { value: 'CRITICAL', label: 'CRITICAL' }
];

const formPriorityOptions = priorityOptions.filter((option) => option.value);

const initialPage: PageResponse<IotMaintenance> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

export function IotMaintenancePage() {
  const [pageData, setPageData] = useState<PageResponse<IotMaintenance>>(initialPage);
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [deviceFilterId, setDeviceFilterId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('PENDING');
  const [priority, setPriority] = useState('MEDIUM');
  const [scheduledAt, setScheduledAt] = useState('');
  const [completedAt, setCompletedAt] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<IotMaintenance | null>(null);

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
    currentStatus: string,
    currentPriority: string,
    currentStartAt: string,
    currentEndAt: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await iotService.listMaintenance(page, pageSize, currentSearch, {
        deviceId: currentDeviceId || undefined,
        status: currentStatus || undefined,
        priority: currentPriority || undefined,
        startAt: toIsoDate(currentStartAt),
        endAt: toIsoDate(currentEndAt)
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar maintenance.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    void load(0, search, deviceFilterId, statusFilter, priorityFilter, startAt, endAt);
  }, [load, search, deviceFilterId, statusFilter, priorityFilter, startAt, endAt]);

  function resetForm() {
    setEditingId(null);
    setDeviceId('');
    setTitle('');
    setDescription('');
    setStatus('PENDING');
    setPriority('MEDIUM');
    setScheduledAt('');
    setCompletedAt('');
    setAssignedUserId('');
  }

  function beginEdit(record: IotMaintenance) {
    setEditingId(record.id);
    setDeviceId(record.deviceId);
    setTitle(record.title);
    setDescription(record.description ?? '');
    setStatus(record.status);
    setPriority(record.priority);
    setScheduledAt(toDateTimeLocal(record.scheduledAt));
    setCompletedAt(toDateTimeLocal(record.completedAt));
    setAssignedUserId(record.assignedUserId ?? '');
    setSuccess(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!deviceId) {
      setError('Selecione um dispositivo para a ordem de maintenance.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      deviceId,
      title,
      description: description || undefined,
      status,
      priority,
      scheduledAt: toIsoDate(scheduledAt),
      completedAt: toIsoDate(completedAt),
      assignedUserId: assignedUserId || undefined
    };

    try {
      if (editingId) {
        await iotService.updateMaintenance(editingId, payload);
        setSuccess('Maintenance atualizada com sucesso.');
      } else {
        await iotService.createMaintenance(payload);
        setSuccess('Maintenance criada com sucesso.');
      }

      resetForm();
      await load(pageData.page, search, deviceFilterId, statusFilter, priorityFilter, startAt, endAt);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar maintenance.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await iotService.deleteMaintenance(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess('Maintenance removida com sucesso.');
      await load(pageData.page, search, deviceFilterId, statusFilter, priorityFilter, startAt, endAt);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir maintenance.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

  const columns: DataTableColumn<IotMaintenance>[] = [
    {
      key: 'device',
      header: 'Device',
      render: (record) => resolveDeviceLabel(devices, record.deviceId)
    },
    {
      key: 'title',
      header: 'Ordem',
      render: (record) => (
        <div>
          <p className="font-medium text-slate-900">{record.title}</p>
          <p className="text-xs text-slate-500">{record.description ?? 'Sem descrição'}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (record) => record.status
    },
    {
      key: 'priority',
      header: 'Prioridade',
      render: (record) => record.priority
    },
    {
      key: 'scheduledAt',
      header: 'Agendada',
      render: (record) => formatDateTime(record.scheduledAt)
    },
    {
      key: 'completedAt',
      header: 'Concluída',
      render: (record) => formatDateTime(record.completedAt)
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (record) => (
        <div className="flex gap-2">
          <PermissionGuard permission="iot.maintenance.update">
            <button
              type="button"
              onClick={() => beginEdit(record)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>

          <PermissionGuard permission="iot.maintenance.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(record)}
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
      permission="iot.maintenance.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar maintenance.</div>}
    >
      <div className="space-y-5">
        <PageTitle
          title="IoT Maintenance"
          description="Ordens básicas de manutenção para operação comercial do módulo IoT."
        />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Título, descrição ou status" />
          <FormSelect label="Device" value={deviceFilterId} options={deviceOptions} onChange={setDeviceFilterId} />
          <FormSelect label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
          <FormSelect label="Prioridade" value={priorityFilter} options={priorityOptions} onChange={setPriorityFilter} />
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
                setStatusFilter('');
                setPriorityFilter('');
                setStartAt('');
                setEndAt('');
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Limpar
            </button>
          </div>
        </div>

        <PermissionGuard permission={editingId ? 'iot.maintenance.update' : 'iot.maintenance.create'}>
          <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
            <FormSelect label="Device" value={deviceId} options={formDeviceOptions} onChange={setDeviceId} />
            <FormInput label="Título" value={title} onChange={setTitle} required />
            <FormInput label="Descrição" value={description} onChange={setDescription} />
            <FormInput label="Assigned user id" value={assignedUserId} onChange={setAssignedUserId} />
            <FormSelect label="Status" value={status} options={formStatusOptions} onChange={setStatus} />
            <FormSelect label="Prioridade" value={priority} options={formPriorityOptions} onChange={setPriority} />
            <DateTimeInput label="Agendada em" value={scheduledAt} onChange={setScheduledAt} />
            <DateTimeInput label="Concluída em" value={completedAt} onChange={setCompletedAt} />

            <div className="flex gap-2 xl:col-span-4">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? 'Salvando...' : editingId ? 'Atualizar maintenance' : 'Criar maintenance'}
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
          emptyMessage="Nenhuma ordem de maintenance encontrada."
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          onPageChange={(nextPage) => load(nextPage, search, deviceFilterId, statusFilter, priorityFilter, startAt, endAt)}
        />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir maintenance"
          description={deleteCandidate ? `Confirma a exclusão da ordem ${deleteCandidate.title}?` : undefined}
          confirmLabel="Excluir"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
