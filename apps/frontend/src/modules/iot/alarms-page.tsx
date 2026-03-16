'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { Pagination } from '@/shared/ui/pagination';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { iotService } from '@/shared/services/iot-service';
import { PageResponse } from '@/shared/types/common';
import { IotAlarm, IotDevice, IotRegister } from '@/shared/types/iot';
import {
    AlarmIcon,
    Chip,
    IotHeroAside,
    IotInlineActionButton,
    IotModulePage,
    IotNotice,
    IotPageHeader,
    IotPanel,
  IotPrimaryButton,
  IotSecondaryButton,
  IotSelectField,
    IotSupportCard,
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
const alarmsPollIntervalMs = 8_000;

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
    async (
      page: number,
      currentSearch: string,
      currentSeverity: string,
      currentStatus: string,
      options: { background?: boolean } = {}
    ) => {
      if (!options.background) {
        setLoading(true);
        setError(null);
      }

      try {
        const result = await iotService.listAlarms(page, pageSize, currentSearch, {
          severity: currentSeverity || undefined,
          status: currentStatus || undefined
        });
        setPageData(result);
        setError(null);
      } catch (err) {
        if (!options.background) {
          setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar alarmes.');
        }
      } finally {
        if (!options.background) {
          setLoading(false);
        }
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

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadDevices();
      void loadRegisters();
      void load(pageData.page, search, severityFilter, statusFilter, { background: true });
    }, alarmsPollIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [load, loadDevices, loadRegisters, pageData.page, search, severityFilter, statusFilter]);

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
  const columns: DataTableColumn<DisplayAlarm>[] = [
    {
      key: 'code',
      header: 'Codigo',
      render: (alarm) => <p className="font-semibold text-foreground">{alarm.code}</p>
    },
    {
      key: 'severity',
      header: 'Severidade',
      render: (alarm) => <StatusBadge status={resolveAlarmSeverityLabel(alarm.severity)} />
    },
    {
      key: 'status',
      header: 'Status',
      render: (alarm) => <StatusBadge status={resolveAlarmStatusLabel(alarm.status)} />
    },
    {
      key: 'device',
      header: 'Ativo',
      render: (alarm) => (
        <span className="text-foreground">
          {alarm.deviceName ?? resolveDeviceLabel(devices, alarm.deviceId)}
        </span>
      )
    },
    {
      key: 'register',
      header: 'Registrador',
      render: (alarm) => (
        <span className="text-muted">
          {alarm.registerName ?? resolveRegisterLabel(registers, alarm.registerId)}
        </span>
      )
    },
    {
      key: 'message',
      header: 'Mensagem',
      render: (alarm) => <p className="max-w-sm text-foreground">{alarm.message}</p>
    },
    {
      key: 'triggeredAt',
      header: 'Data/hora',
      render: (alarm) => <span className="text-muted">{formatDateTime(alarm.triggeredAt)}</span>
    },
    {
      key: 'actions',
      header: 'Acoes',
      render: (alarm) =>
        !useDemoMode && alarm.status === 'OPEN' ? (
          <IotInlineActionButton onClick={() => void acknowledgeAlarm(alarm.id)}>
            Reconhecer
          </IotInlineActionButton>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {useDemoMode ? 'Somente navegação' : 'Sem ação'}
          </span>
        )
    }
  ];

  return (
    <PermissionGuard
      permission="iot.alarm.read"
      fallback={
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Você não possui permissão para visualizar alarmes do IoT.
        </div>
      }
    >
      <IotModulePage>
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
            <DataTable
              columns={columns}
              rows={visibleRows}
              getRowKey={(alarm) => alarm.id}
              loading={loading}
              loadingTitle="Sincronizando a fila de alarmes"
              loadingDescription="Consolidando severidade, status e relacionamento com ativos e registradores."
              emptyState={{
                title: 'Nenhum alarme nesta janela',
                description: 'Ajuste os filtros ou siga com a primeira integracao ativa para preencher a central de alarmes.'
              }}
            />
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
                <IotSupportCard
                  key={step}
                  className="px-4 py-3 text-sm text-foreground"
                >
                  {step}
                </IotSupportCard>
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
      </IotModulePage>
    </PermissionGuard>
  );
}
