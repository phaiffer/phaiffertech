'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { iotService } from '@/shared/services/iot-service';
import { PageResponse } from '@/shared/types/common';
import { IotAlarm, IotDevice } from '@/shared/types/iot';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { DateTimeInput } from '@/shared/ui/datetime-input';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'OPEN', label: 'OPEN' },
  { value: 'ACKNOWLEDGED', label: 'ACKNOWLEDGED' },
  { value: 'RESOLVED', label: 'RESOLVED' }
];

const formStatusOptions = statusOptions.filter((option) => option.value);

const severityOptions = [
  { value: '', label: 'Todas' },
  { value: 'LOW', label: 'LOW' },
  { value: 'MEDIUM', label: 'MEDIUM' },
  { value: 'HIGH', label: 'HIGH' },
  { value: 'CRITICAL', label: 'CRITICAL' }
];

const formSeverityOptions = severityOptions.filter((option) => option.value);

const initialPage: PageResponse<IotAlarm> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function toDateTimeLocal(isoValue?: string) {
  if (!isoValue) {
    return '';
  }

  const date = new Date(isoValue);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function toIsoDate(value: string) {
  if (!value) {
    return undefined;
  }
  return new Date(value).toISOString();
}

export function IotAlarmsPage() {
  const [pageData, setPageData] = useState<PageResponse<IotAlarm>>(initialPage);
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [deviceFilterId, setDeviceFilterId] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [status, setStatus] = useState('OPEN');
  const [triggeredAt, setTriggeredAt] = useState('');
  const [acknowledgedAt, setAcknowledgedAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<IotAlarm | null>(null);

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
    currentSeverity: string,
    currentStatus: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await iotService.listAlarms(page, pageSize, currentSearch, {
        deviceId: currentDeviceId || undefined,
        severity: currentSeverity || undefined,
        status: currentStatus || undefined
      });
      setPageData(result);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar alarmes.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  useEffect(() => {
    load(0, search, deviceFilterId, severityFilter, statusFilter);
  }, [load, search, deviceFilterId, severityFilter, statusFilter]);

  function resetForm() {
    setEditingId(null);
    setDeviceId('');
    setCode('');
    setMessage('');
    setSeverity('HIGH');
    setStatus('OPEN');
    setTriggeredAt('');
    setAcknowledgedAt('');
  }

  function beginEdit(alarm: IotAlarm) {
    setEditingId(alarm.id);
    setDeviceId(alarm.deviceId);
    setCode(alarm.code);
    setMessage(alarm.message);
    setSeverity(alarm.severity);
    setStatus(alarm.status);
    setTriggeredAt(toDateTimeLocal(alarm.triggeredAt));
    setAcknowledgedAt(toDateTimeLocal(alarm.acknowledgedAt));
    setSuccess(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!deviceId) {
      setError('Selecione um dispositivo para o alarme.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      deviceId,
      code,
      message,
      severity,
      status,
      triggeredAt: toIsoDate(triggeredAt),
      acknowledgedAt: toIsoDate(acknowledgedAt)
    };

    try {
      if (editingId) {
        await iotService.updateAlarm(editingId, {
          ...payload,
          status
        });
        setSuccess('Alarme atualizado com sucesso.');
      } else {
        await iotService.createAlarm(payload);
        setSuccess('Alarme criado com sucesso.');
      }

      resetForm();
      await load(pageData.page, search, deviceFilterId, severityFilter, statusFilter);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao salvar alarme.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await iotService.deleteAlarm(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess('Alarme removido com sucesso.');
      await load(pageData.page, search, deviceFilterId, severityFilter, statusFilter);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao excluir alarme.';
      setError(message);
    }
  }

  async function handleAcknowledge(alarm: IotAlarm) {
    try {
      await iotService.acknowledgeAlarm(alarm.id);
      setSuccess('Alarme reconhecido com sucesso.');
      await load(pageData.page, search, deviceFilterId, severityFilter, statusFilter);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao reconhecer alarme.';
      setError(message);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

  const columns: DataTableColumn<IotAlarm>[] = [
    {
      key: 'code',
      header: 'Código',
      render: (alarm) => alarm.code
    },
    {
      key: 'message',
      header: 'Mensagem',
      render: (alarm) => alarm.message
    },
    {
      key: 'severity',
      header: 'Severidade',
      render: (alarm) => alarm.severity
    },
    {
      key: 'status',
      header: 'Status',
      render: (alarm) => alarm.status
    },
    {
      key: 'triggeredAt',
      header: 'Disparado em',
      render: (alarm) => new Date(alarm.triggeredAt).toLocaleString('pt-BR')
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (alarm) => (
        <div className="flex gap-2">
          <PermissionGuard permission="iot.alarm.update">
            <button
              type="button"
              onClick={() => beginEdit(alarm)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>

          <PermissionGuard permission="iot.alarm.ack">
            <button
              type="button"
              onClick={() => handleAcknowledge(alarm)}
              className="rounded-lg border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700"
              disabled={alarm.status === 'ACKNOWLEDGED'}
            >
              Ack
            </button>
          </PermissionGuard>

          <PermissionGuard permission="iot.alarm.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(alarm)}
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
      permission="iot.alarm.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar alarmes.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="IoT Alarms" description="Gestão de alarmes com reconhecimento e filtros operacionais." />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_240px_180px_180px_auto_auto]">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Código, mensagem, severidade" />
          <FormSelect label="Dispositivo" value={deviceFilterId} options={deviceOptions} onChange={setDeviceFilterId} />
          <FormSelect label="Severidade" value={severityFilter} options={severityOptions} onChange={setSeverityFilter} />
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
              setSeverityFilter('');
              setStatusFilter('');
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Limpar
          </button>
        </div>

        <PermissionGuard permission={editingId ? 'iot.alarm.update' : 'iot.alarm.create'}>
          <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
            <FormSelect label="Dispositivo" value={deviceId} options={formDeviceOptions} onChange={setDeviceId} />
            <FormInput label="Código" value={code} onChange={setCode} required />
            <FormSelect label="Severidade" value={severity} options={formSeverityOptions} onChange={setSeverity} />
            <FormInput label="Mensagem" value={message} onChange={setMessage} required />
            <FormSelect label="Status" value={status} options={formStatusOptions} onChange={setStatus} />
            <DateTimeInput label="Disparado em" value={triggeredAt} onChange={setTriggeredAt} />
            <DateTimeInput label="Reconhecido em" value={acknowledgedAt} onChange={setAcknowledgedAt} />

            <div className="md:col-span-3 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? 'Salvando...' : editingId ? 'Atualizar alarme' : 'Criar alarme'}
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
          emptyMessage="Nenhum alarme encontrado."
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          onPageChange={(nextPage) => load(nextPage, search, deviceFilterId, severityFilter, statusFilter)}
        />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir alarme"
          description={deleteCandidate ? `Confirma a exclusão do alarme ${deleteCandidate.code}?` : undefined}
          confirmLabel="Excluir"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
