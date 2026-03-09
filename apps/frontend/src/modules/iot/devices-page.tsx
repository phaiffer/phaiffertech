'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { Pagination } from '@/shared/ui/pagination';
import { iotService } from '@/shared/services/iot-service';
import { PageResponse } from '@/shared/types/common';
import { IotDevice } from '@/shared/types/iot';
import {
  Chip,
  DeviceIcon,
  IotActionButton,
  IotHeroAside,
  IotNotice,
  IotPageHeader,
  IotPanel,
  IotPrimaryButton,
  IotSecondaryButton,
  IotSelectField,
  IotStatusPill,
  IotTableStateRow,
  IotTabButton,
  IotTextField
} from '@/modules/iot/iot-chrome';
import { buildDemoDevicesFromReal, getOperationalProfile } from '@/modules/iot/iot-demo-data';
import { formatDateTime, resolveDeviceStatusLabel, resolveDeviceTypeLabel } from '@/modules/iot/iot-utils';

const pageSize = 10;

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'MAINTENANCE', label: 'Em manutenção' },
  { value: 'ALERT', label: 'Em alerta' }
];

const typeOptions = [
  { value: '', label: 'Todos os tipos' },
  { value: 'SENSOR', label: 'Sensor' },
  { value: 'GATEWAY', label: 'Gateway' },
  { value: 'ACTUATOR', label: 'Atuador' }
];

const editableStatusOptions = statusOptions.filter((option) => option.value);
const editableTypeOptions = [
  { value: '', label: 'Sem categoria' },
  ...typeOptions.filter((option) => option.value)
];

const initialPage: PageResponse<IotDevice> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function resolveTone(status: string) {
  switch (status) {
    case 'ONLINE':
      return 'green' as const;
    case 'OFFLINE':
      return 'red' as const;
    case 'ALERT':
    case 'MAINTENANCE':
      return 'amber' as const;
    default:
      return 'neutral' as const;
  }
}

export function IotDevicesPage() {
  const searchParams = useSearchParams();
  const [pageData, setPageData] = useState<PageResponse<IotDevice>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [editingDevice, setEditingDevice] = useState<IotDevice | null>(null);
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ONLINE');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<IotDevice | null>(null);

  const load = useCallback(
    async (page: number, currentSearch: string, currentType: string, currentStatus: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await iotService.listDevices(page, pageSize, currentSearch, {
          type: currentType || undefined,
          status: currentStatus || undefined
        });
        setPageData(result);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar dispositivos.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (searchParams.get('created') === '1') {
      setSuccess('Dispositivo criado com sucesso e pronto para aparecer na frota.');
    }
  }, [searchParams]);

  useEffect(() => {
    void load(0, search, typeFilter, statusFilter);
  }, [load, search, typeFilter, statusFilter]);

  const realRows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const shouldUseDemo =
    Boolean(error) ||
    (!loading &&
      totalItems === 0 &&
      !search &&
      !statusFilter &&
      !typeFilter);

  const demoRows = useMemo(() => {
    const source = buildDemoDevicesFromReal([]);
    return source.filter((device) => {
      const matchesSearch =
        !search ||
        [device.name, device.identifier, device.location, device.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesStatus = !statusFilter || device.status === statusFilter;
      const matchesType = !typeFilter || device.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [search, statusFilter, typeFilter]);

  const visibleRows = shouldUseDemo ? demoRows : realRows;
  const onlineCount = visibleRows.filter((device) => device.status === 'ONLINE').length;
  const offlineCount = visibleRows.filter((device) => device.status === 'OFFLINE').length;
  const attentionCount = visibleRows.filter((device) => device.status !== 'ONLINE').length;

  function beginEdit(device: IotDevice) {
    setEditingDevice(device);
    setName(device.name);
    setIdentifier(device.identifier ?? device.serialNumber ?? '');
    setType(device.type ?? '');
    setLocation(device.location ?? '');
    setDescription(device.description ?? '');
    setStatus(device.status);
    setError(null);
    setSuccess(null);
  }

  function resetEditor() {
    setEditingDevice(null);
    setName('');
    setIdentifier('');
    setType('');
    setLocation('');
    setDescription('');
    setStatus('ONLINE');
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingDevice) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await iotService.updateDevice(editingDevice.id, {
        name,
        identifier,
        type: type || undefined,
        location: location || undefined,
        description: description || undefined,
        status
      });

      setSuccess('Dispositivo atualizado com sucesso.');
      resetEditor();
      await load(pageData.page, search, typeFilter, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao atualizar dispositivo.');
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
      setSuccess('Dispositivo removido da frota com sucesso.');
      await load(pageData.page, search, typeFilter, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir dispositivo.');
    }
  }

  return (
    <PermissionGuard
      permission="iot.device.read"
      fallback={
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Você não possui permissão para visualizar a gestão de dispositivos.
        </div>
      }
    >
      <div className="space-y-6">
        <IotPageHeader
          eyebrow="Frota conectada"
          title="Dispositivos da operação"
          description="Inventário operacional dos ativos conectados com status, contexto de comunicação e acesso direto ao onboarding Modbus."
          chips={
            <>
              <Chip label="Dispositivos" value={visibleRows.length} tone="green" icon={<DeviceIcon />} />
              <Chip label="Online" value={onlineCount} tone="green" />
              <Chip label="Fora do nominal" value={attentionCount} tone={attentionCount > 0 ? 'amber' : 'green'} />
            </>
          }
          action={<IotActionButton href="/iot/add-device">Cadastrar dispositivo</IotActionButton>}
          aside={
            <IotHeroAside
              title="Estado da Frota"
              items={[
                { label: 'Modo de leitura', value: shouldUseDemo ? 'Assistido para apresentação' : 'Integração ativa', tone: shouldUseDemo ? 'amber' : 'green' },
                { label: 'Ativos exibidos', value: visibleRows.length.toString(), tone: 'cyan' },
                { label: 'Ações críticas', value: shouldUseDemo ? 'Somente navegação' : 'Editar e excluir', tone: shouldUseDemo ? 'amber' : 'green' }
              ]}
            />
          }
        />

        {error ? (
          <IotNotice
            title="Integração indisponível na frota"
            description={`${error} A página continua utilizável em modo assistido com um parque de referência alinhado ao restante do módulo.`}
            tone="amber"
          />
        ) : null}

        {success ? (
          <IotNotice title="Operação concluída" description={success} tone="green" />
        ) : null}

        <IotPanel
          title="Filtros operacionais"
          description="Refine a frota por nome, tipo e status sem sair do fluxo operacional da apresentação."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <IotTextField
              label="Busca"
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Nome, ID técnico ou localização"
            />
            <IotSelectField label="Tipo" value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
            <IotSelectField label="Status" value={statusFilter} onChange={setStatusFilter} options={statusOptions} />
            <div className="flex items-end gap-3">
              <IotPrimaryButton onClick={() => setSearch(searchInput)}>Aplicar filtros</IotPrimaryButton>
              <IotSecondaryButton
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setStatusFilter('');
                  setTypeFilter('');
                }}
              >
                Limpar
              </IotSecondaryButton>
            </div>
            <div className="flex items-end gap-3">
              <IotTabButton
                label={`Ativos (${onlineCount})`}
                active={statusFilter === 'ONLINE'}
                onClick={() => setStatusFilter(statusFilter === 'ONLINE' ? '' : 'ONLINE')}
              />
              <IotTabButton
                label={`Offline (${offlineCount})`}
                active={statusFilter === 'OFFLINE'}
                onClick={() => setStatusFilter(statusFilter === 'OFFLINE' ? '' : 'OFFLINE')}
              />
            </div>
          </div>
        </IotPanel>

        {editingDevice && !shouldUseDemo ? (
          <IotPanel
            title={`Editar ${editingDevice.name}`}
            description="A edição permanece conectada ao contrato real do módulo IoT, sem alterar a estrutura consolidada."
          >
            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <IotTextField label="Nome" value={name} onChange={setName} />
                <IotTextField label="Identificador" value={identifier} onChange={setIdentifier} />
                <IotSelectField label="Tipo" value={type} onChange={setType} options={editableTypeOptions} />
                <IotTextField label="Localização" value={location} onChange={setLocation} />
                <IotSelectField
                  label="Status"
                  value={status}
                  onChange={setStatus}
                  options={editableStatusOptions}
                />
                <IotTextField label="Descrição" value={description} onChange={setDescription} />
              </div>
              <div className="flex gap-3">
                <IotPrimaryButton type="submit" disabled={submitting}>
                  {submitting ? 'Atualizando ativo...' : 'Salvar ajustes'}
                </IotPrimaryButton>
                <IotSecondaryButton onClick={resetEditor}>Cancelar</IotSecondaryButton>
              </div>
            </form>
          </IotPanel>
        ) : null}

        <IotPanel
          title="Tabela operacional"
          description="Lista densa com contexto Modbus, cobertura de leitura, status atual e último contato conhecido."
        >
          <div className="overflow-hidden rounded-[28px] border border-cyan-500/15">
            <table className="min-w-full bg-[#050f1f]">
              <thead className="border-b border-cyan-500/15 bg-[#061427]">
                <tr>
                  {['Nome', 'Contexto Modbus', 'Leituras', 'Status', 'Último contato', 'Ações'].map((header) => (
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
                    colSpan={6}
                    title="Sincronizando a frota"
                    description="Consolidando o inventário operacional e o contexto de comunicação dos ativos."
                  />
                ) : visibleRows.length === 0 ? (
                  <IotTableStateRow
                    colSpan={6}
                    title="Nenhum dispositivo nesta janela"
                    description="Ajuste os filtros ou siga em modo assistido para manter a narrativa da frota."
                    tone="amber"
                  />
                ) : (
                  visibleRows.map((device, index) => {
                    const profile = getOperationalProfile(device, index);
                    const tone = resolveTone(device.status);

                    return (
                      <tr key={device.id} className="bg-[#071223]/80">
                        <td className="px-4 py-4">
                          <p className="font-semibold text-white">{device.name}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {device.identifier ?? device.serialNumber ?? '-'} • {device.location ?? profile.area}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                            {resolveDeviceTypeLabel(device.type)} • {profile.transport}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p>{profile.transport}</p>
                          <p className="mt-1 text-sm text-slate-400">
                            {profile.host}:{profile.port} • Unit {profile.unitId}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p>{profile.registerCount} variáveis</p>
                          <p className="mt-1 text-sm text-slate-400">
                            Polling {profile.pollInterval} • Gateway {profile.gateway}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <IotStatusPill label={resolveDeviceStatusLabel(device.status)} tone={tone} />
                            <IotStatusPill label={profile.signal} tone={profile.health} />
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-400">{formatDateTime(device.lastSeenAt)}</td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {!shouldUseDemo ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => beginEdit(device)}
                                  className="rounded-2xl border border-slate-700 bg-slate-950/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200 transition hover:border-cyan-400/35"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteCandidate(device)}
                                  className="rounded-2xl border border-rose-500/30 bg-rose-500/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-200 transition hover:bg-rose-500/12"
                                >
                                  Excluir
                                </button>
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

        {!shouldUseDemo ? (
          <Pagination
            page={pageData.page}
            totalPages={pageData.totalPages}
            totalElements={totalItems}
            onPageChange={(nextPage) => load(nextPage, search, typeFilter, statusFilter)}
          />
        ) : null}

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir dispositivo"
          description={deleteCandidate ? `Confirma a exclusão de ${deleteCandidate.name}?` : undefined}
          confirmLabel="Excluir"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
