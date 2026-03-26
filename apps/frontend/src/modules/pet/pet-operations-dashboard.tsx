'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { sharedCompactTextClass, sharedPageStackClass } from '@/shared/components/public-visual-system';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems } from '@/shared/lib/pagination';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { petService } from '@/shared/services/pet-service';
import { ClientPlan, PetAppointment, PetClient, PetInvoice, PetProduct } from '@/shared/types/pet';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';

type PetOperationsDashboardProps = {
  eyebrow: string;
  title: string;
  description: string;
  showSubnav?: boolean;
  surfaceLabel?: string;
};

type DashboardState = {
  clients: PetClient[];
  todayAppointments: PetAppointment[];
  completedMonthAppointments: PetAppointment[];
  nextCycleAppointments: PetAppointment[];
  plans: ClientPlan[];
  products: PetProduct[];
  invoices: PetInvoice[];
};

type StatTone = 'default' | 'accent' | 'warning';

const initialState: DashboardState = {
  clients: [],
  todayAppointments: [],
  completedMonthAppointments: [],
  nextCycleAppointments: [],
  plans: [],
  products: [],
  invoices: []
};

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function nextCycleRange(date = new Date()) {
  return {
    start: new Date(date.getFullYear(), date.getMonth() + 1, 1, 0, 0, 0, 0),
    end: new Date(date.getFullYear(), date.getMonth() + 2, 0, 23, 59, 59, 999)
  };
}

function formatCurrency(value: number, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(value?: string | null) {
  if (!value) return 'Sem data';
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function resolveProjectedDue(appointment: PetAppointment) {
  if (appointment.finalAmountDue != null) {
    return appointment.finalAmountDue;
  }

  if (appointment.planCovered) {
    return appointment.extrasAmount ?? 0;
  }

  return (appointment.servicePrice ?? 0) + (appointment.extrasAmount ?? 0);
}

function resolveClientName(clientLookup: Map<string, PetClient>, clientId: string, fallback?: string | null) {
  const client = clientLookup.get(clientId);
  return fallback ?? client?.name ?? client?.fullName ?? clientId;
}

function OperationsStatCard({
  label,
  value,
  detail,
  tone = 'default'
}: {
  label: string;
  value: string;
  detail: string;
  tone?: StatTone;
}) {
  const toneClass = tone === 'accent'
    ? 'border-[color:var(--accent)] bg-accent-muted'
    : tone === 'warning'
      ? 'border-warning/30 bg-warning-muted'
      : 'border-border bg-surface';

  return (
    <div className={`rounded-[1.6rem] border p-4 shadow-xs ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      <p className={`mt-2 ${sharedCompactTextClass}`}>{detail}</p>
    </div>
  );
}

export function PetOperationsDashboard({
  eyebrow,
  title,
  description,
  showSubnav = false,
  surfaceLabel
}: PetOperationsDashboardProps) {
  const platform = useFrontendPlatform();
  const [state, setState] = useState<DashboardState>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = (permission: string) => platform.user?.permissions.includes(permission) ?? false;
  const hasWorkspaceWidePetVisibility =
    platform.workspace.hasFullPlatformVisibility || platform.workspace.canManagePlatformAdministration;
  const canReadDashboard = hasPermission('pet.dashboard.read') || hasWorkspaceWidePetVisibility;
  const canReadClients = hasPermission('pet.client.read');
  const canReadAppointments = hasPermission('pet.appointment.read');
  const canReadPlans = hasPermission('pet.plan.read');
  const canReadProducts = hasPermission('pet.product.read');
  const canReadInvoices = hasPermission('pet.invoice.read');

  useEffect(() => {
    if (!canReadDashboard) {
      setLoading(false);
      return;
    }

    let active = true;
    const todayStart = startOfDay();
    const todayEnd = endOfDay();
    const monthStart = startOfMonth();
    const monthEnd = endOfMonth();
    const nextCycle = nextCycleRange();

    setLoading(true);
    setError(null);

    Promise.allSettled([
      canReadClients ? petService.listClients(0, 200, '') : Promise.resolve(null),
      canReadAppointments
        ? petService.listAppointments(0, 200, '', {
            scheduledFrom: todayStart.toISOString(),
            scheduledTo: todayEnd.toISOString()
          })
        : Promise.resolve(null),
      canReadAppointments
        ? petService.listAppointments(0, 500, '', {
            status: 'COMPLETED',
            scheduledFrom: monthStart.toISOString(),
            scheduledTo: monthEnd.toISOString()
          })
        : Promise.resolve(null),
      canReadAppointments
        ? petService.listAppointments(0, 200, '', {
            scheduledFrom: nextCycle.start.toISOString(),
            scheduledTo: nextCycle.end.toISOString()
          })
        : Promise.resolve(null),
      canReadPlans ? petService.listClientPlans(undefined, 0, 200) : Promise.resolve(null),
      canReadProducts ? petService.listProducts(0, 200, '') : Promise.resolve(null),
      canReadInvoices ? petService.listInvoices(0, 200, '') : Promise.resolve(null)
    ]).then((results) => {
      if (!active) {
        return;
      }

      const [clientsResult, todayResult, completedResult, nextCycleResult, plansResult, productsResult, invoicesResult] = results;
      const nextErrors: string[] = [];

      setState({
        clients: clientsResult.status === 'fulfilled' && clientsResult.value ? resolvePageItems(clientsResult.value) : [],
        todayAppointments: todayResult.status === 'fulfilled' && todayResult.value ? resolvePageItems(todayResult.value) : [],
        completedMonthAppointments: completedResult.status === 'fulfilled' && completedResult.value ? resolvePageItems(completedResult.value) : [],
        nextCycleAppointments: nextCycleResult.status === 'fulfilled' && nextCycleResult.value ? resolvePageItems(nextCycleResult.value) : [],
        plans: plansResult.status === 'fulfilled' && plansResult.value ? resolvePageItems(plansResult.value) : [],
        products: productsResult.status === 'fulfilled' && productsResult.value ? resolvePageItems(productsResult.value) : [],
        invoices: invoicesResult.status === 'fulfilled' && invoicesResult.value ? resolvePageItems(invoicesResult.value) : []
      });

      if (todayResult.status === 'rejected') {
        nextErrors.push(todayResult.reason instanceof ApiClientError ? todayResult.reason.message : 'Nao foi possivel carregar os atendimentos do dia.');
      }

      if (plansResult.status === 'rejected') {
        nextErrors.push(plansResult.reason instanceof ApiClientError ? plansResult.reason.message : 'Nao foi possivel carregar os planos do workspace.');
      }

      if (productsResult.status === 'rejected') {
        nextErrors.push(productsResult.reason instanceof ApiClientError ? productsResult.reason.message : 'Nao foi possivel carregar o estoque do workspace.');
      }

      if (invoicesResult.status === 'rejected') {
        nextErrors.push(invoicesResult.reason instanceof ApiClientError ? invoicesResult.reason.message : 'Nao foi possivel carregar a cobranca do workspace.');
      }

      setError(nextErrors.length > 0 ? nextErrors.join(' ') : null);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [canReadAppointments, canReadClients, canReadDashboard, canReadInvoices, canReadPlans, canReadProducts]);

  const clientLookup = useMemo(() => {
    return new Map(state.clients.map((client) => [client.id, client]));
  }, [state.clients]);

  const todayAppointments = useMemo(
    () => state.todayAppointments
      .filter((appointment) => !['CANCELED', 'NO_SHOW'].includes(appointment.status.toUpperCase()))
      .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()),
    [state.todayAppointments]
  );

  const readyPets = todayAppointments.filter((appointment) => appointment.status.toUpperCase() === 'COMPLETED');
  const inProgressPets = todayAppointments.filter((appointment) => appointment.status.toUpperCase() === 'IN_PROGRESS');
  const recurringToday = todayAppointments.filter((appointment) => Boolean(appointment.clientPlanId));
  const oneTimeToday = todayAppointments.filter((appointment) => !appointment.clientPlanId);
  const todayProjectedDue = todayAppointments.reduce((total, appointment) => total + resolveProjectedDue(appointment), 0);

  const planAlerts = useMemo(
    () => state.plans
      .filter((plan) => plan.remainingSessions > 0 && plan.remainingSessions <= 2)
      .sort((left, right) => left.remainingSessions - right.remainingSessions),
    [state.plans]
  );

  const expiringPlans = useMemo(
    () => state.plans.filter((plan) => {
      if (!plan.expiresAt || plan.remainingSessions <= 0) {
        return false;
      }

      const diff = new Date(plan.expiresAt).getTime() - Date.now();
      return diff <= 1000 * 60 * 60 * 24 * 14;
    }),
    [state.plans]
  );

  const lowStockProducts = useMemo(
    () => state.products
      .filter((product) => product.currentQuantity <= product.reorderPoint)
      .sort((left, right) => left.currentQuantity - right.currentQuantity),
    [state.products]
  );

  const openInvoices = useMemo(
    () => state.invoices
      .filter((invoice) => invoice.status !== 'PAID' && invoice.status !== 'CANCELED' && invoice.outstandingAmount > 0)
      .sort((left, right) => right.outstandingAmount - left.outstandingAmount),
    [state.invoices]
  );

  const overdueInvoices = openInvoices.filter((invoice) => invoice.dueAt && new Date(invoice.dueAt).getTime() < Date.now());
  const nextCycleProjectedDue = state.nextCycleAppointments.reduce((total, appointment) => total + resolveProjectedDue(appointment), 0);
  const nextCycleRecurring = state.nextCycleAppointments.filter((appointment) => Boolean(appointment.clientPlanId)).length;
  const monthCommissionTotal = state.completedMonthAppointments.reduce((total, appointment) => total + (appointment.commissionAmount ?? 0), 0);

  const productionByProfessional = useMemo(() => {
    const grouped = new Map<string, { professionalName: string; completed: number; commission: number }>();

    state.completedMonthAppointments.forEach((appointment) => {
      const key = appointment.professionalId;
      const current = grouped.get(key) ?? {
        professionalName: appointment.professionalName ?? key,
        completed: 0,
        commission: 0
      };

      current.completed += 1;
      current.commission += appointment.commissionAmount ?? 0;
      grouped.set(key, current);
    });

    return Array.from(grouped.values()).sort((left, right) => right.commission - left.commission).slice(0, 4);
  }, [state.completedMonthAppointments]);

  if (!canReadDashboard) {
    return <div className="ui-notice-warning">Voce nao possui permissao para visualizar o dashboard do PetFlow.</div>;
  }

  return (
    <div className={sharedPageStackClass}>
      {showSubnav ? <PetModuleSubnav /> : null}
      {surfaceLabel ? <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">{surfaceLabel}</p> : null}

        <PageTitle
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={(
            <>
              <Link href="/pet/appointments" className="ui-secondary-button">
                Agenda operacional
              </Link>
              <Link href="/pet/invoices" className="ui-primary-button">
                Cobranca e proximo ciclo
              </Link>
            </>
          )}
        />

        {loading ? <div className="ui-notice-neutral">Carregando o panorama operacional do PetFlow...</div> : null}
        {error ? <div className="ui-notice-error">{error}</div> : null}

        {!loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <OperationsStatCard
              label="Atendimentos do dia"
              value={String(todayAppointments.length)}
              detail={`${inProgressPets.length} em andamento e ${readyPets.length} pets prontos para liberar.`}
              tone="accent"
            />
            <OperationsStatCard
              label="Recorrentes vs avulsos"
              value={`${recurringToday.length} / ${oneTimeToday.length}`}
              detail="Separacao visivel entre clientes de plano e atendimentos pontuais."
            />
            <OperationsStatCard
              label="Penultimo banho"
              value={String(planAlerts.filter((plan) => plan.remainingSessions === 2).length)}
              detail={`${expiringPlans.length} planos expiram nas proximas duas semanas.`}
              tone={planAlerts.length > 0 ? 'warning' : 'default'}
            />
            <OperationsStatCard
              label="Estoque baixo"
              value={String(lowStockProducts.length)}
              detail="Itens abaixo do ponto de reposicao antes de comprometer a operacao."
              tone={lowStockProducts.length > 0 ? 'warning' : 'default'}
            />
            <OperationsStatCard
              label="Proximo ciclo"
              value={formatCurrency(nextCycleProjectedDue)}
              detail={`${nextCycleRecurring} atendimentos do proximo ciclo ja estao conectados a planos recorrentes.`}
            />
            <OperationsStatCard
              label="Comissao / producao"
              value={formatCurrency(monthCommissionTotal)}
              detail={`${state.completedMonthAppointments.length} atendimentos concluidos ja geraram comissao neste mes.`}
            />
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <PageSection
            title="Fila operacional de hoje"
            description="Use esta fila para contar a historia do dia: recepcao, profissional responsavel, plano associado e valor previsto."
          >
            {todayAppointments.length === 0 ? (
              <div className="ui-notice-neutral">Nenhum atendimento esta agendado para hoje neste workspace.</div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.slice(0, 6).map((appointment) => (
                  <div key={appointment.id} className="rounded-[1.45rem] border border-border bg-surface-inset p-4 shadow-xs">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {formatTime(appointment.scheduledAt)} · {appointment.petName ?? appointment.petId}
                        </p>
                        <p className={`mt-1 ${sharedCompactTextClass}`}>
                          {resolveClientName(clientLookup, appointment.clientId, appointment.clientName)} · {appointment.serviceName}
                        </p>
                        <p className={`mt-2 ${sharedCompactTextClass}`}>
                          {appointment.professionalName ?? 'Profissional nao informado'}
                          {appointment.clientPlanId ? ' · Plano recorrente' : ' · Atendimento avulso'}
                          {appointment.extrasAmount ? ` · Extras ${formatCurrency(appointment.extrasAmount)}` : ''}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <StatusBadge status={appointment.status} />
                        <p className="text-sm font-semibold text-foreground">{formatCurrency(resolveProjectedDue(appointment))}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PageSection>

          <PageSection
            tone="muted"
            title="Renovacao e cobranca"
            description="Planos perto do fim, cobranças em aberto e o valor projetado para o proximo ciclo."
          >
            <div className="space-y-3">
              <div className="rounded-[1.45rem] border border-border bg-surface px-4 py-4 shadow-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Proximo ciclo</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{formatCurrency(nextCycleProjectedDue)}</p>
                <p className={`mt-2 ${sharedCompactTextClass}`}>
                  {nextCycleRecurring} atendimentos ja entram como recorrentes no proximo ciclo.
                </p>
              </div>

              {planAlerts.slice(0, 3).map((plan) => (
                <div key={plan.id} className="rounded-[1.35rem] border border-border bg-surface px-4 py-4 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {resolveClientName(clientLookup, plan.clientId)} · {plan.planName}
                      </p>
                      <p className={`mt-1 ${sharedCompactTextClass}`}>
                        {plan.remainingSessions} sessoes restantes · expira em {formatDate(plan.expiresAt)}
                      </p>
                    </div>
                    <StatusBadge status={plan.remainingSessions === 2 ? 'warn' : 'pending'} />
                  </div>
                </div>
              ))}

              {openInvoices.slice(0, 3).map((invoice) => (
                <div key={invoice.id} className="rounded-[1.35rem] border border-border bg-surface px-4 py-4 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {resolveClientName(clientLookup, invoice.clientId, invoice.clientName)}
                      </p>
                      <p className={`mt-1 ${sharedCompactTextClass}`}>
                        Vence em {formatDate(invoice.dueAt)} · saldo {formatCurrency(invoice.outstandingAmount)}
                      </p>
                    </div>
                    <StatusBadge status={overdueInvoices.some((item) => item.id === invoice.id) ? 'alert' : invoice.status} />
                  </div>
                </div>
              ))}

              {planAlerts.length === 0 && openInvoices.length === 0 ? (
                <div className="ui-notice-neutral">Sem alertas de plano ou cobranca neste momento.</div>
              ) : null}
            </div>
          </PageSection>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <PageSection
            title="Estoque abaixo do ponto"
            description="Mantenha shampoo, loja e consumo operacional visiveis antes de perder venda ou atrasar atendimento."
          >
            {lowStockProducts.length === 0 ? (
              <div className="ui-notice-neutral">Nenhum item esta abaixo do ponto de reposicao agora.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {lowStockProducts.slice(0, 4).map((product) => (
                  <div key={product.id} className="rounded-[1.45rem] border border-border bg-surface-inset p-4 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{product.name}</p>
                        <p className={`mt-1 ${sharedCompactTextClass}`}>SKU {product.sku}</p>
                      </div>
                      <StatusBadge status={product.currentQuantity <= product.minimumQuantity ? 'alert' : 'warn'} />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-foreground">
                      {product.currentQuantity} {product.unitOfMeasure}
                    </p>
                    <p className={`mt-2 ${sharedCompactTextClass}`}>
                      Minimo {product.minimumQuantity} · reposicao em {product.reorderPoint}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </PageSection>

          <PageSection
            tone="muted"
            title="Producao por profissional"
            description="Mostre a producao do mes junto com a comissao prevista para reforcar a historia operacional."
          >
            {productionByProfessional.length === 0 ? (
              <div className="ui-notice-neutral">Ainda nao ha atendimentos concluidos suficientes para resumir a producao deste mes.</div>
            ) : (
              <div className="space-y-3">
                {productionByProfessional.map((professional) => (
                  <div key={professional.professionalName} className="rounded-[1.45rem] border border-border bg-surface px-4 py-4 shadow-xs">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{professional.professionalName}</p>
                        <p className={`mt-1 ${sharedCompactTextClass}`}>
                          {professional.completed} atendimentos concluidos neste mes
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(professional.commission)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PageSection>
        </div>
      </div>
  );
}
