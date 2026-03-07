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
import { IotAlarm, IotDevice, IotRegister } from '@/shared/types/iot';
import {
  formatDateTime,
  resolveDeviceLabel,
  resolveRegisterLabel,
  toDateTimeLocal,
  toIsoDate
} from '@/modules/iot/iot-utils';

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

export function IotAlarmsPage() {
  const [pageData, setPageData] = useState<PageResponse<IotAlarm>>(initialPage);
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [registers, setRegisters] = useState<IotRegister[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [deviceFilterId, setDeviceFilterId] = useState('');
  const [registerFilterId, setRegisterFilterId] = useState('');
  const [triggeredFrom, setTriggeredFrom] = useState('');
  const [triggeredTo, setTriggeredTo] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [registerId, setRegisterId] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [status, setStatus] = useState('OPEN');
  const [triggeredAt, setTriggeredAt] = useState('');
  const [acknowledgedAt, setAcknowledgedAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<IotAlarm | null>(null);

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
    currentSeverity: string,
    currentStatus: string,
    currentTriggeredFrom: string,
    currentTriggeredTo: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await iotService.listAlarms(page, pageSize, currentSearch, {
        deviceId: currentDeviceId || undefined,
        registerId: currentRegisterId || undefined,
        severity: currentSeverity || undefined,
        status: currentStatus || undefined,
        triggeredFrom: toIsoDate(currentTriggeredFrom),
        triggeredTo: toIsoDate(currentTriggeredTo)
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar alarmes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDevices();
    void loadRegisters();
  }, [loadDevices, loadRegisters]);

  useEffect(() => {
    void load(0, search, deviceFilterId, registerFilterId, severityFilter, statusFilter, triggeredFrom, triggeredTo);
  }, [load, search, deviceFilterId, registerFilterId, severityFilter, statusFilter, triggeredFrom, triggeredTo]);

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

  function resetForm() {
    setEditingId(null);
    setDeviceId('');
    setRegisterId('');
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
    setRegisterId(alarm.registerId ?? '');
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
      registerId: registerId || undefined,
      code,
      message,
      severity,
      status,
      triggeredAt: toIsoDate(triggeredAt),
      acknowledgedAt: toIsoDate(acknowledgedAt)
    };

    try {
      if (editingId) {
        await iotService.updateAlarm(editingId, payload);
        setSuccess('Alarme atualizado com sucesso.');
      } else {
        await iotService.createAlarm(payload);
        setSuccess('Alarme criado com sucesso.');
      }

      resetForm();
      await load(pageData.page, search, deviceFilterId, registerFilterId, severityFilter, statusFilter, triggeredFrom, triggeredTo);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar alarme.');
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
      await load(pageData.page, search, deviceFilterId, registerFilterId, severityFilter, statusFilter, triggeredFrom, triggeredTo);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir alarme.');
    }
  }

  async function handleAcknowledge(alarm: IotAlarm) {
    try {
      await iotService.acknowledgeAlarm(alarm.id);
      setSuccess('Alarme reconhecido com sucesso.');
      await load(pageData.page, search, deviceFilterId, registerFilterId, severityFilter, statusFilter, triggeredFrom, triggeredTo);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao reconhecer alarme.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

  const columns: DataTableColumn<IotAlarm>[] = [
    {
      key: 'alarm',
      header: 'Alarme',
      render: (alarm) => (
        <div>
          <p className="font-medium text-slate-900">{alarm.code}</p>
          <p className="text-xs text-slate-500">{alarm.message}</p>
        </div>
      )
    },
    {
      key: 'device',
      header: 'Device',
      render: (alarm) => resolveDeviceLabel(devices, alarm.deviceId)
    },
    {
      key: 'register',
      header: 'Register',
      render: (alarm) => resolveRegisterLabel(registers, alarm.registerId)
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
      render: (alarm) => formatDateTime(alarm.triggeredAt)
    },
    {
      key: 'ack',
      header: 'Ack',
      render: (alarm) => {
        if (!alarm.acknowledgedAt) {
          return '-';
        }

        return (
          <div>
            <p>{formatDateTime(alarm.acknowledgedAt)}</p>
            <p className="text-xs text-slate-500">{alarm.acknowledgedBy ?? 'sem usuário'}</p>
          </div>
        );
      }
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
              className="rounded-lg border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 disabled:opacity-50"
              disabled={alarm.status !== 'OPEN'}
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
        <PageTitle
          title="IoT Alarms"
          description="Gestão de alarmes com vínculo opcional a register, filtros operacionais e acknowledge."
        />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Código, mensagem ou severidade" />
          <FormSelect label="Device" value={deviceFilterId} options={deviceOptions} onChange={setDeviceFilterId} />
          <FormSelect label="Register" value={registerFilterId} options={registerOptions} onChange={setRegisterFilterId} />
          <FormSelect label="Severidade" value={severityFilter} options={severityOptions} onChange={setSeverityFilter} />
          <FormSelect label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
          <DateTimeInput label="Disparado de" value={triggeredFrom} onChange={setTriggeredFrom} />
          <DateTimeInput label="Disparado até" value={triggeredTo} onChange={setTriggeredTo} />
          <div className="flex gap-2">
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
                setSeverityFilter('');
                setStatusFilter('');
                setTriggeredFrom('');
                setTriggeredTo('');
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Limpar
            </button>
          </div>
        </div>

        <PermissionGuard permission={editingId ? 'iot.alarm.update' : 'iot.alarm.create'}>
          <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-4">
            <FormSelect label="Device" value={deviceId} options={formDeviceOptions} onChange={setDeviceId} />
            <FormSelect label="Register" value={registerId} options={formRegisterOptions} onChange={setRegisterId} />
            <FormInput label="Código" value={code} onChange={setCode} required />
            <FormSelect label="Severidade" value={severity} options={formSeverityOptions} onChange={setSeverity} />
            <FormInput label="Mensagem" value={message} onChange={setMessage} required />
            <FormSelect label="Status" value={status} options={formStatusOptions} onChange={setStatus} />
            <DateTimeInput label="Disparado em" value={triggeredAt} onChange={setTriggeredAt} />
            <DateTimeInput label="Reconhecido em" value={acknowledgedAt} onChange={setAcknowledgedAt} />

            <div className="flex gap-2 xl:col-span-4">
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
          onPageChange={(nextPage) => load(nextPage, search, deviceFilterId, registerFilterId, severityFilter, statusFilter, triggeredFrom, triggeredTo)}
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
