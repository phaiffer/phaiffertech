'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { Pagination } from '@/shared/ui/pagination';
import { iotService } from '@/shared/services/iot-service';
import { PageResponse } from '@/shared/types/common';
import { IotAlarm, IotDevice, IotMaintenance } from '@/shared/types/iot';
import {
  AlarmIcon,
  BoltIcon,
  Chip,
  DeviceIcon,
  IotDateTimeField,
  IotHeroAside,
  IotNotice,
  IotPageHeader,
  IotPanel,
  IotPrimaryButton,
  IotSecondaryButton,
  IotSelectField,
  IotStatusPill,
  IotTabButton,
  IotTextField,
  IotTextareaField
} from '@/modules/iot/iot-chrome';
import {
  buildDemoDevicesFromReal,
  buildDemoMaintenanceRecords,
  demoAlarmList
} from '@/modules/iot/iot-demo-data';
import {
  formatDateTime,
  resolveDeviceLabel,
  toDateTimeLocal,
  toIsoDate
} from '@/modules/iot/iot-utils';

const pageSize = 10;

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'PENDING', label: 'PENDING' },
  { value: 'SCHEDULED', label: 'SCHEDULED' },
  { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
  { value: 'COMPLETED', label: 'COMPLETED' },
  { value: 'CANCELLED', label: 'CANCELLED' }
];

const formStatusOptions = statusOptions.filter((option) => option.value);

const priorityOptions = [
  { value: '', label: 'Todas as prioridades' },
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

type DisplayMaintenance = IotMaintenance & {
  deviceName?: string;
  trigger?: string;
  linkedAlarmCode?: string;
  ownerLabel?: string;
  shift?: string;
};

function resolveStatusTone(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'green' as const;
    case 'IN_PROGRESS':
    case 'SCHEDULED':
      return 'cyan' as const;
    case 'PENDING':
      return 'amber' as const;
    case 'CANCELLED':
      return 'red' as const;
    default:
      return 'neutral' as const;
  }
}

function resolvePriorityTone(priority: string) {
  switch (priority) {
    case 'CRITICAL':
      return 'red' as const;
    case 'HIGH':
      return 'amber' as const;
    case 'MEDIUM':
      return 'cyan' as const;
    case 'LOW':
      return 'green' as const;
    default:
      return 'neutral' as const;
  }
}

export function IotMaintenancePage() {
  const [pageData, setPageData] = useState<PageResponse<IotMaintenance>>(initialPage);
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [alarms, setAlarms] = useState<IotAlarm[]>([]);
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

  const [editingRecord, setEditingRecord] = useState<IotMaintenance | null>(null);
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

  const loadDevices = useCallback(async () => {
    try {
      const result = await iotService.listDevices(0, 200, '');
      setDevices(resolvePageItems(result));
    } catch {
      setDevices([]);
    }
  }, []);

  const loadAlarms = useCallback(async () => {
    try {
      const result = await iotService.listAlarms(0, 50, '', { status: 'OPEN' });
      setAlarms(resolvePageItems(result));
    } catch {
      setAlarms([]);
    }
  }, []);

  const load = useCallback(
    async (
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
    },
    []
  );

  useEffect(() => {
    void loadDevices();
    void loadAlarms();
  }, [loadAlarms, loadDevices]);

  useEffect(() => {
    void load(0, search, deviceFilterId, statusFilter, priorityFilter, startAt, endAt);
  }, [load, search, deviceFilterId, statusFilter, priorityFilter, startAt, endAt]);

  const displayDevices = useMemo(() => buildDemoDevicesFromReal(devices), [devices]);
  const realRows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const useDemoMode =
    Boolean(error) ||
    (!loading &&
      totalItems === 0 &&
      !search &&
      !deviceFilterId &&
      !statusFilter &&
      !priorityFilter &&
      !startAt &&
      !endAt);

  const demoRows = useMemo(() => {
    return buildDemoMaintenanceRecords(displayDevices).filter((record) => {
      const matchesSearch =
        !search ||
        [record.title, record.description, record.deviceName, record.trigger]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesDevice = !deviceFilterId || record.deviceId === deviceFilterId;
      const matchesStatus = !statusFilter || record.status === statusFilter;
      const matchesPriority = !priorityFilter || record.priority === priorityFilter;
      return matchesSearch && matchesDevice && matchesStatus && matchesPriority;
    });
  }, [deviceFilterId, displayDevices, priorityFilter, search, statusFilter]);

  const visibleRows: DisplayMaintenance[] = useDemoMode ? demoRows : realRows;
  const displayAlarms = alarms.length > 0 ? alarms : demoAlarmList;

  const deviceOptions = useMemo(
    () => [
      { value: '', label: 'Todos os devices' },
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

  function resetForm() {
    setEditingRecord(null);
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
    setEditingRecord(record);
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
      setError('Selecione um dispositivo para a ordem de manutenção.');
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
      if (editingRecord) {
        await iotService.updateMaintenance(editingRecord.id, payload);
        setSuccess('Ordem de manutenção atualizada com sucesso.');
      } else {
        await iotService.createMaintenance(payload);
        setSuccess('Ordem de manutenção criada com sucesso.');
      }

      resetForm();
      await load(pageData.page, search, deviceFilterId, statusFilter, priorityFilter, startAt, endAt);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Erro ao salvar maintenance.'
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
      await iotService.deleteMaintenance(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess('Ordem de manutenção removida com sucesso.');
      await load(pageData.page, search, deviceFilterId, statusFilter, priorityFilter, startAt, endAt);
    } catch (err) {
      setError(
        err instanceof ApiClientError ? err.message : 'Erro ao excluir maintenance.'
      );
    }
  }

  const pendingCount = visibleRows.filter((record) => record.status === 'PENDING').length;
  const inProgressCount = visibleRows.filter((record) => record.status === 'IN_PROGRESS').length;
  const completedCount = visibleRows.filter((record) => record.status === 'COMPLETED').length;
  const criticalCount = visibleRows.filter((record) => record.priority === 'CRITICAL').length;

  return (
    <PermissionGuard
      permission="iot.maintenance.read"
      fallback={
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Você não possui permissão para visualizar manutenção do IoT.
        </div>
      }
    >
      <div className="space-y-6">
        <IotPageHeader
          eyebrow="Operational Response Loop"
          title="Maintenance"
          description="Fechamento operacional entre ativo, incidente e ação de campo, mantendo o fluxo real de ordens do backend e enriquecendo a leitura industrial."
          chips={
            <>
              <Chip label="Pendentes" value={pendingCount} tone="amber" icon={<BoltIcon />} />
              <Chip label="Em progresso" value={inProgressCount} tone="cyan" icon={<DeviceIcon />} />
              <Chip label="Concluídas" value={completedCount} tone="green" />
              <Chip label="Críticas" value={criticalCount} tone={criticalCount > 0 ? 'red' : 'green'} icon={<AlarmIcon />} />
            </>
          }
          aside={
            <IotHeroAside
              title="Estado do Backlog"
              items={[
                { label: 'Modo', value: useDemoMode ? 'Demo assistida' : 'Ordens reais', tone: useDemoMode ? 'amber' : 'green' },
                { label: 'Incidentes abertos', value: `${displayAlarms.length}`, tone: 'cyan' },
                { label: 'Fechamento', value: completedCount > 0 ? 'Com histórico' : 'Em construção', tone: completedCount > 0 ? 'green' : 'amber' }
              ]}
            />
          }
        />

        {error ? (
          <IotNotice
            title="Maintenance em fallback visual"
            description={`${error} A tela continua pronta para demo com backlog estático alinhado aos alarmes e devices.`}
            tone="amber"
          />
        ) : null}

        {success ? <IotNotice title="Operação concluída" description={success} tone="green" /> : null}

        <IotPanel
          title="Filtros do backlog"
          description="Refine a fila por ativo, prioridade, status e janela operacional."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <IotTextField
              label="Busca"
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Título, causa ou equipe"
            />
            <IotSelectField label="Device" value={deviceFilterId} onChange={setDeviceFilterId} options={deviceOptions} />
            <IotSelectField label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
            <IotSelectField
              label="Prioridade"
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={priorityOptions}
            />
            <IotDateTimeField label="De" value={startAt} onChange={setStartAt} />
            <IotDateTimeField label="Até" value={endAt} onChange={setEndAt} />
            <div className="flex items-end gap-3 xl:col-span-2">
              <IotPrimaryButton onClick={() => setSearch(searchInput)}>Aplicar</IotPrimaryButton>
              <IotSecondaryButton
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setDeviceFilterId('');
                  setStatusFilter('');
                  setPriorityFilter('');
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
            title="Board operacional"
            description="Visão rápida das ordens em aberto, execução e histórico recente."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { key: 'PENDING', title: 'Pendentes', tone: 'amber' as const },
                { key: 'IN_PROGRESS', title: 'Em progresso', tone: 'cyan' as const },
                { key: 'COMPLETED', title: 'Concluídas', tone: 'green' as const }
              ].map((column) => {
                const columnRows = visibleRows.filter((record) => record.status === column.key).slice(0, 3);

                return (
                  <div key={column.key} className="rounded-[26px] border border-slate-800 bg-slate-950/35 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">{column.title}</p>
                      <IotStatusPill label={String(columnRows.length)} tone={column.tone} />
                    </div>
                    <div className="mt-4 space-y-3">
                      {columnRows.length === 0 ? (
                        <p className="text-sm text-slate-500">Sem ordens nesta coluna.</p>
                      ) : (
                        columnRows.map((record) => (
                          <div key={record.id} className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3">
                            <p className="font-medium text-white">{record.title}</p>
                            <p className="mt-1 text-sm text-slate-400">
                              {'deviceName' in record && record.deviceName
                                ? record.deviceName
                                : resolveDeviceLabel(displayDevices, record.deviceId)}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </IotPanel>

          <IotPanel
            title={editingRecord ? `Editar ${editingRecord.title}` : 'Nova ação de campo'}
            description="A ordem continua sendo persistida no backend real do módulo IoT."
          >
            <PermissionGuard permission={editingRecord ? 'iot.maintenance.update' : 'iot.maintenance.create'}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <IotSelectField label="Device" value={deviceId} onChange={setDeviceId} options={formDeviceOptions} />
                <IotTextField label="Título da ação" value={title} onChange={setTitle} required />
                <IotTextareaField
                  label="Descrição / causa"
                  value={description}
                  onChange={setDescription}
                  placeholder="Descreva o problema, a hipótese e a ação planejada."
                />
                <IotTextField
                  label="Responsável / equipe (UUID opcional)"
                  value={assignedUserId}
                  onChange={setAssignedUserId}
                  placeholder="time-campo-a ou UUID"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <IotSelectField label="Status" value={status} onChange={setStatus} options={formStatusOptions} />
                  <IotSelectField
                    label="Prioridade"
                    value={priority}
                    onChange={setPriority}
                    options={formPriorityOptions}
                  />
                  <IotDateTimeField label="Agendada em" value={scheduledAt} onChange={setScheduledAt} />
                  <IotDateTimeField label="Concluída em" value={completedAt} onChange={setCompletedAt} />
                </div>
                <div className="flex flex-wrap gap-3">
                  <IotPrimaryButton type="submit" disabled={submitting}>
                    {submitting
                      ? 'Salvando...'
                      : editingRecord
                        ? 'Atualizar ordem'
                        : 'Criar ordem'}
                  </IotPrimaryButton>
                  {editingRecord ? (
                    <IotSecondaryButton onClick={resetForm}>Cancelar edição</IotSecondaryButton>
                  ) : null}
                </div>
              </form>
            </PermissionGuard>
          </IotPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
          <IotPanel
            title="Tabela operacional de maintenance"
            description="Backlog detalhado com ativo, gatilho, prioridade, agenda e responsável."
          >
            <div className="overflow-hidden rounded-[28px] border border-cyan-500/15">
              <table className="min-w-full bg-[#050f1f]">
                <thead className="border-b border-cyan-500/15 bg-[#061427]">
                  <tr>
                    {['Ativo', 'Ação', 'Gatilho', 'Prioridade', 'Status', 'Janela', 'Responsável', 'Ações'].map((header) => (
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
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                        Carregando ordens de manutenção...
                      </td>
                    </tr>
                  ) : visibleRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                        Nenhuma ordem de maintenance encontrada.
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((record) => {
                      const matchedAlarm = displayAlarms.find((alarm) => alarm.deviceId === record.deviceId);
                      const trigger =
                        record.trigger ??
                        matchedAlarm?.message ??
                        'Inspeção preventiva ou ação manual';
                      const ownerLabel = record.ownerLabel ?? record.assignedUserId ?? 'Não atribuído';

                      return (
                        <tr key={record.id} className="bg-[#071223]/80">
                          <td className="px-4 py-4 text-slate-300">
                            {record.deviceName ?? resolveDeviceLabel(displayDevices, record.deviceId)}
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-white">{record.title}</p>
                            <p className="mt-1 text-sm text-slate-400">{record.description ?? 'Sem descrição'}</p>
                          </td>
                          <td className="px-4 py-4 text-slate-300">
                            <p>{trigger}</p>
                            <p className="mt-1 text-xs text-slate-500">{record.linkedAlarmCode ?? matchedAlarm?.code ?? 'Sem alarme vinculado'}</p>
                          </td>
                          <td className="px-4 py-4">
                            <IotStatusPill label={record.priority} tone={resolvePriorityTone(record.priority)} />
                          </td>
                          <td className="px-4 py-4">
                            <IotStatusPill label={record.status} tone={resolveStatusTone(record.status)} />
                          </td>
                          <td className="px-4 py-4 text-slate-400">
                            <p>{formatDateTime(record.scheduledAt)}</p>
                            <p className="mt-1 text-xs">
                              {record.completedAt ? `Fim ${formatDateTime(record.completedAt)}` : 'Ainda não concluída'}
                            </p>
                          </td>
                          <td className="px-4 py-4 text-slate-300">{ownerLabel}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              {!useDemoMode ? (
                                <>
                                  <PermissionGuard permission="iot.maintenance.update">
                                    <button
                                      type="button"
                                      onClick={() => beginEdit(record)}
                                      className="rounded-2xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200 transition hover:border-cyan-400/35"
                                    >
                                      Editar
                                    </button>
                                  </PermissionGuard>
                                  <PermissionGuard permission="iot.maintenance.delete">
                                    <button
                                      type="button"
                                      onClick={() => setDeleteCandidate(record)}
                                      className="rounded-2xl border border-rose-500/30 bg-rose-500/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-200 transition hover:bg-rose-500/12"
                                    >
                                      Excluir
                                    </button>
                                  </PermissionGuard>
                                </>
                              ) : (
                                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                  Somente visual
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

          <IotPanel
            title="Incidentes de origem"
            description="Contexto operacional para justificar a abertura ou priorização das ordens."
          >
            <div className="space-y-3">
              {displayAlarms.slice(0, 4).map((alarm) => (
                <div
                  key={alarm.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/35 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">{alarm.code}</p>
                    <IotStatusPill label={alarm.status} tone={resolveStatusTone(alarm.status === 'OPEN' ? 'PENDING' : 'IN_PROGRESS')} />
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{alarm.message}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                    {formatDateTime(alarm.triggeredAt)}
                  </p>
                </div>
              ))}
            </div>
          </IotPanel>
        </div>

        {!useDemoMode ? (
          <Pagination
            page={pageData.page}
            totalPages={pageData.totalPages}
            totalElements={totalItems}
            onPageChange={(nextPage) =>
              load(nextPage, search, deviceFilterId, statusFilter, priorityFilter, startAt, endAt)
            }
          />
        ) : null}

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir maintenance"
          description={
            deleteCandidate
              ? `Confirma a exclusão da ordem ${deleteCandidate.title}?`
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
