'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { Pagination } from '@/shared/ui/pagination';
import { iotService } from '@/shared/services/iot-service';
import { PageResponse } from '@/shared/types/common';
import { IotAlarm, IotDevice, IotRegister } from '@/shared/types/iot';
import {
  AlarmIcon,
  Chip,
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
import { demoAlarmList } from '@/modules/iot/iot-demo-data';
import {
  formatDateTime,
  resolveAlarmSeverityLabel,
  resolveAlarmStatusLabel,
  resolveDeviceLabel,
  resolveRegisterLabel
} from '@/modules/iot/iot-utils';

const pageSize = 10;

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'OPEN', label: 'Aberto' },
  { value: 'ACKNOWLEDGED', label: 'Reconhecido' },
  { value: 'RESOLVED', label: 'Resolvido' }
];

const severityOptions = [
  { value: '', label: 'Todas as severidades' },
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'CRITICAL', label: 'Crítica' }
];

const initialPage: PageResponse<IotAlarm> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

type DisplayAlarm = IotAlarm & {
  deviceName?: string;
  registerName?: string;
};

function resolveToneFromSeverity(severity: string) {
  switch (severity) {
    case 'CRITICAL':
    case 'HIGH':
      return 'red' as const;
    case 'MEDIUM':
      return 'amber' as const;
    case 'LOW':
      return 'green' as const;
    default:
      return 'neutral' as const;
  }
}

function resolveStatusTone(status: string) {
  switch (status) {
    case 'OPEN':
      return 'red' as const;
    case 'ACKNOWLEDGED':
      return 'amber' as const;
    case 'RESOLVED':
      return 'green' as const;
    default:
      return 'neutral' as const;
  }
}

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

  const loadDevices = useCallback(async () => {
    try {
      const result = await iotService.listDevices(0, 200, '');
      setDevices(resolvePageItems(result));
    } catch {
      setDevices([]);
    }
  }, []);

  const loadRegisters = useCallback(async () => {
    try {
      const result = await iotService.listRegisters(0, 200, '');
      setRegisters(resolvePageItems(result));
    } catch {
      setRegisters([]);
    }
  }, []);

  const load = useCallback(
    async (page: number, currentSearch: string, currentSeverity: string, currentStatus: string) => {
      setLoading(true);
      setError(null);

      try {
        const result = await iotService.listAlarms(page, pageSize, currentSearch, {
          severity: currentSeverity || undefined,
          status: currentStatus || undefined
        });
        setPageData(result);
      } catch (err) {
        setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar alarmes.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadDevices();
    void loadRegisters();
  }, [loadDevices, loadRegisters]);

  useEffect(() => {
    void load(0, search, severityFilter, statusFilter);
  }, [load, search, severityFilter, statusFilter]);

  async function acknowledgeAlarm(alarmId: string) {
    try {
      await iotService.acknowledgeAlarm(alarmId);
      setSuccess('Alarme reconhecido com sucesso.');
      await load(pageData.page, search, severityFilter, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao reconhecer alarme.');
    }
  }

  const realRows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const useDemoMode =
    Boolean(error) ||
    (!loading && totalItems === 0 && !search && !statusFilter && !severityFilter);

  const demoRows = useMemo(() => {
    return demoAlarmList.filter((alarm) => {
      const matchesSearch =
        !search ||
        [alarm.code, alarm.message, alarm.deviceName, alarm.registerName]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      const matchesStatus = !statusFilter || alarm.status === statusFilter;
      const matchesSeverity = !severityFilter || alarm.severity === severityFilter;
      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [search, severityFilter, statusFilter]);

  const visibleRows: DisplayAlarm[] = useDemoMode ? demoRows : realRows;
  const openCount = visibleRows.filter((alarm) => alarm.status === 'OPEN').length;
  const acknowledgedCount = visibleRows.filter((alarm) => alarm.status === 'ACKNOWLEDGED').length;
  const resolvedCount = visibleRows.filter((alarm) => alarm.status === 'RESOLVED').length;

  return (
    <PermissionGuard
      permission="iot.alarm.read"
      fallback={
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Você não possui permissão para visualizar alarmes do IoT.
        </div>
      }
    >
      <div className="space-y-6">
        <IotPageHeader
          eyebrow="Resposta operacional"
          title="Central de alarmes"
          description="Fila operacional de eventos críticos com severidade, ativo afetado, registrador associado e ação rápida para reconhecimento."
          chips={
            <>
              <Chip label="Abertos" value={openCount} tone={openCount > 0 ? 'red' : 'green'} icon={<AlarmIcon />} />
              <Chip label="Reconhecidos" value={acknowledgedCount} tone="amber" />
              <Chip label="Resolvidos" value={resolvedCount} tone="green" />
            </>
          }
          aside={
            <IotHeroAside
              title="Situação do turno"
              items={[
                { label: 'Modo de leitura', value: useDemoMode ? 'Assistido para apresentação' : 'Fila real ativa', tone: useDemoMode ? 'amber' : 'green' },
                { label: 'Ação sugerida', value: openCount > 0 ? 'Reconhecer e escalar' : 'Operação estável', tone: openCount > 0 ? 'red' : 'green' },
                { label: 'Incidentes exibidos', value: `${visibleRows.length}`, tone: 'cyan' }
              ]}
            />
          }
        />

        {error ? (
          <IotNotice
            title="Integração indisponível na central de alarmes"
            description={`${error} A tela permanece apresentável em modo assistido com um conjunto estático de incidentes coerente com os ativos e registradores.`}
            tone="amber"
          />
        ) : null}

        {success ? <IotNotice title="Ação executada" description={success} tone="green" /> : null}

        <IotPanel
          title="Filtros operacionais"
          description="Use severidade, status e busca textual para conduzir a conversa de resposta a incidentes."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <IotTextField
              label="Busca"
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Código, mensagem ou ativo"
            />
            <IotSelectField
              label="Severidade"
              value={severityFilter}
              onChange={setSeverityFilter}
              options={severityOptions}
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
                  setStatusFilter('');
                  setSeverityFilter('');
                }}
              >
                Limpar
              </IotSecondaryButton>
            </div>
            <div className="flex items-end gap-3">
              <IotTabButton
                label={`Abertos (${openCount})`}
                active={statusFilter === 'OPEN'}
                onClick={() => setStatusFilter(statusFilter === 'OPEN' ? '' : 'OPEN')}
              />
              <IotTabButton
                label={`Reconhecidos (${acknowledgedCount})`}
                active={statusFilter === 'ACKNOWLEDGED'}
                onClick={() => setStatusFilter(statusFilter === 'ACKNOWLEDGED' ? '' : 'ACKNOWLEDGED')}
              />
            </div>
          </div>
        </IotPanel>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_360px]">
          <IotPanel
            title="Fila de alarmes"
            description="Leitura densa para o time operacional com ativo, registrador, mensagem e momento do evento."
          >
            <div className="overflow-hidden rounded-[28px] border border-cyan-500/15">
              <table className="min-w-full bg-[#050f1f]">
                <thead className="border-b border-cyan-500/15 bg-[#061427]">
                  <tr>
                    {['Código', 'Severidade', 'Status', 'Ativo', 'Registrador', 'Mensagem', 'Data/hora', 'Ações'].map((header) => (
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
                      title="Sincronizando a fila de alarmes"
                      description="Consolidando severidade, status e relacionamento com ativos e registradores."
                    />
                  ) : visibleRows.length === 0 ? (
                    <IotTableStateRow
                      colSpan={8}
                      title="Nenhum alarme nesta janela"
                      description="Ajuste os filtros ou mantenha a apresentação com a fila assistida do módulo."
                      tone="amber"
                    />
                  ) : (
                  visibleRows.map((alarm) => {
                      const deviceLabel = alarm.deviceName ?? resolveDeviceLabel(devices, alarm.deviceId);
                      const registerLabel =
                        alarm.registerName ?? resolveRegisterLabel(registers, alarm.registerId);

                      return (
                        <tr key={alarm.id} className="bg-[#071223]/80">
                          <td className="px-4 py-4">
                            <p className="font-semibold text-white">{alarm.code}</p>
                          </td>
                          <td className="px-4 py-4">
                            <IotStatusPill label={resolveAlarmSeverityLabel(alarm.severity)} tone={resolveToneFromSeverity(alarm.severity)} />
                          </td>
                          <td className="px-4 py-4">
                            <IotStatusPill label={resolveAlarmStatusLabel(alarm.status)} tone={resolveStatusTone(alarm.status)} />
                          </td>
                          <td className="px-4 py-4 text-slate-300">{deviceLabel}</td>
                          <td className="px-4 py-4 text-slate-400">{registerLabel}</td>
                          <td className="px-4 py-4">
                            <p className="max-w-sm text-slate-300">{alarm.message}</p>
                          </td>
                          <td className="px-4 py-4 text-slate-400">{formatDateTime(alarm.triggeredAt)}</td>
                          <td className="px-4 py-4">
                            {!useDemoMode && alarm.status === 'OPEN' ? (
                              <button
                                type="button"
                                onClick={() => void acknowledgeAlarm(alarm.id)}
                                className="rounded-2xl border border-cyan-400/35 bg-cyan-400/12 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-400/18"
                              >
                                Reconhecer
                              </button>
                            ) : (
                              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                {useDemoMode ? 'Somente navegação' : 'Sem ação'}
                              </span>
                            )}
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
            title="Playbook de resposta"
            description="Roteiro enxuto para demonstrar priorização, ownership e transição para manutenção."
          >
            <div className="space-y-3">
              {[
                '1. Validar o ativo e o registrador afetado antes de escalar.',
                '2. Reconhecer o alarme para registrar ownership operacional.',
                '3. Direcionar manutenção quando houver repetição, perda de heartbeat ou criticidade alta.',
                '4. Fechar o loop no dashboard e na observabilidade consolidada.'
              ].map((step) => (
                <div
                  key={step}
                  className="rounded-2xl border border-slate-800 bg-slate-950/35 px-4 py-3 text-sm text-slate-300"
                >
                  {step}
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
            onPageChange={(nextPage) => load(nextPage, search, severityFilter, statusFilter)}
          />
        ) : null}
      </div>
    </PermissionGuard>
  );
}
