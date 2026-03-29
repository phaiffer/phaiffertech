'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { sharedCompactTextClass, sharedPageStackClass } from '@/shared/components/public-visual-system';
import { ApiClientError } from '@/shared/lib/http';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatCurrencyForLocale, formatDateForLocale, formatTimeForLocale } from '@/shared/i18n/formatters';
import { resolvePageItems } from '@/shared/lib/pagination';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { petService } from '@/shared/services/pet-service';
import { ClientPlan, PetAppointment, PetClient, PetInvoice, PetProduct } from '@/shared/types/pet';

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

function hasPetTaxi(appointment: PetAppointment) {
  return /taxi/i.test(appointment.extrasDescription ?? '');
}

function hasPickupMessage(appointment: PetAppointment, clientLookup: Map<string, PetClient>) {
  if (appointment.status.toUpperCase() !== 'COMPLETED') {
    return false;
  }

  return Boolean(clientLookup.get(appointment.clientId)?.email);
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
    ? 'border-transparent bg-[linear-gradient(135deg,var(--accent),#1d4ed8)] text-white shadow-xl shadow-blue-950/20'
    : tone === 'warning'
      ? 'border-warning/20 bg-white'
      : 'border-slate-200 bg-white';

  return (
    <div className={`rounded-[1.6rem] border p-6 ${toneClass}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${tone === 'accent' ? 'text-white/72' : 'text-slate-600'}`}>{label}</p>
      <p className={`mt-4 text-3xl font-semibold tracking-[-0.04em] ${tone === 'accent' ? 'text-white' : 'text-foreground'}`}>{value}</p>
      <p className={`mt-2 text-sm leading-6 ${tone === 'accent' ? 'text-white/80' : 'text-slate-600'}`}>{detail}</p>
    </div>
  );
}

function SignalPill({
  label,
  tone = 'neutral'
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
}) {
  const toneClass = tone === 'accent'
    ? 'bg-blue-100 text-blue-800'
    : tone === 'success'
      ? 'bg-emerald-100 text-emerald-800'
      : tone === 'warning'
        ? 'bg-amber-100 text-amber-800'
        : tone === 'danger'
          ? 'bg-red-100 text-red-800'
          : 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>
      {label}
    </span>
  );
}

export function PetOperationsDashboard({
  eyebrow,
  title,
  description,
  showSubnav = false,
  surfaceLabel
}: PetOperationsDashboardProps) {
  const { locale } = useAppI18n();
  const t = useAppMessages().petDashboard;
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
        nextErrors.push(todayResult.reason instanceof ApiClientError ? todayResult.reason.message : t.errors.appointments);
      }

      if (plansResult.status === 'rejected') {
        nextErrors.push(plansResult.reason instanceof ApiClientError ? plansResult.reason.message : t.errors.plans);
      }

      if (productsResult.status === 'rejected') {
        nextErrors.push(productsResult.reason instanceof ApiClientError ? productsResult.reason.message : t.errors.inventory);
      }

      if (invoicesResult.status === 'rejected') {
        nextErrors.push(invoicesResult.reason instanceof ApiClientError ? invoicesResult.reason.message : t.errors.billing);
      }

      setError(nextErrors.length > 0 ? nextErrors.join(' ') : null);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [
    canReadAppointments,
    canReadClients,
    canReadDashboard,
    canReadInvoices,
    canReadPlans,
    canReadProducts,
    t.errors.appointments,
    t.errors.billing,
    t.errors.inventory,
    t.errors.plans
  ]);

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
  const readyWithPickupMessage = readyPets.filter((appointment) => hasPickupMessage(appointment, clientLookup)).length;
  const petTaxiToday = todayAppointments.filter((appointment) => hasPetTaxi(appointment));

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

  const nextCycleProjectedDue = state.nextCycleAppointments.reduce((total, appointment) => total + resolveProjectedDue(appointment), 0);
  const nextCycleRecurring = state.nextCycleAppointments.filter((appointment) => Boolean(appointment.clientPlanId)).length;
  const monthCommissionTotal = state.completedMonthAppointments.reduce((total, appointment) => total + (appointment.commissionAmount ?? 0), 0);
  const penultimateBathCount = planAlerts.filter((plan) => plan.remainingSessions === 2).length;

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

  const invoiceByClient = useMemo(() => {
    return new Map(openInvoices.map((invoice) => [invoice.clientId, invoice]));
  }, [openInvoices]);

  const appointmentByClient = useMemo(() => {
    return new Map(todayAppointments.map((appointment) => [appointment.clientId, appointment]));
  }, [todayAppointments]);

  const dashboardRows = useMemo(() => {
    return planAlerts.slice(0, 5).map((plan) => {
      const matchingInvoice = invoiceByClient.get(plan.clientId);
      const matchingAppointment = appointmentByClient.get(plan.clientId);

      return {
        id: plan.id,
        clientName: resolveClientName(clientLookup, plan.clientId),
        planName: plan.planName,
        remainingSessions: plan.remainingSessions,
        expiresAt: plan.expiresAt,
        outstandingAmount: matchingInvoice?.outstandingAmount ?? 0,
        professionalName: matchingAppointment?.professionalName ?? t.queue.pendingProfessional,
        petTaxi: matchingAppointment ? hasPetTaxi(matchingAppointment) : false
      };
    });
  }, [appointmentByClient, clientLookup, invoiceByClient, planAlerts, t.queue.pendingProfessional]);

  const activityItems = useMemo(() => {
    return [
      {
        key: 'ready',
        title: t.pills.pickupSent,
        description: readyPets.length > 0
          ? `${readyWithPickupMessage} ${t.pills.pickupSent.toLowerCase()}`
          : t.stats.pickupMessageReady,
        tone: 'success' as const
      },
      {
        key: 'plans',
        title: t.stats.penultimateBath,
        description: `${penultimateBathCount} ${t.billing.remainingSessions}`,
        tone: penultimateBathCount > 0 ? 'warning' as const : 'neutral' as const
      },
      {
        key: 'taxi',
        title: t.pills.petTaxi,
        description: petTaxiToday.length > 0 ? `${petTaxiToday.length} ${t.queue.title.toLowerCase()}` : t.stats.petTaxiEmpty,
        tone: petTaxiToday.length > 0 ? 'accent' as const : 'neutral' as const
      },
      {
        key: 'stock',
        title: t.stats.lowStock,
        description: lowStockProducts.length > 0 ? `${lowStockProducts.length} ${t.inventory.title.toLowerCase()}` : t.inventory.empty,
        tone: lowStockProducts.length > 0 ? 'danger' as const : 'neutral' as const
      },
      {
        key: 'billing',
        title: t.stats.nextCycle,
        description: formatCurrencyForLocale(locale, nextCycleProjectedDue),
        tone: 'accent' as const
      }
    ];
  }, [
    locale,
    lowStockProducts.length,
    nextCycleProjectedDue,
    penultimateBathCount,
    petTaxiToday.length,
    readyPets.length,
    readyWithPickupMessage,
    t.billing.remainingSessions,
    t.inventory.empty,
    t.inventory.title,
    t.pills.petTaxi,
    t.pills.pickupSent,
    t.queue.title,
    t.stats.pickupMessageReady,
    t.stats.lowStock,
    t.stats.nextCycle,
    t.stats.penultimateBath,
    t.stats.petTaxiEmpty
  ]);

  if (!canReadDashboard) {
    return <div className="ui-notice-warning">{t.noPermission}</div>;
  }

  return (
    <div className={sharedPageStackClass}>
      {showSubnav ? <PetModuleSubnav /> : null}

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            {surfaceLabel ? <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">{surfaceLabel}</p> : null}
            <p className={`${surfaceLabel ? 'mt-3 ' : ''}text-xs font-semibold uppercase tracking-[0.18em] text-slate-500`}>{eyebrow}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-900 lg:text-[2.2rem]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/pet/appointments" className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900">
              {t.actions.appointments}
            </Link>
            <Link href="/pet/invoices" className="inline-flex items-center rounded-xl bg-[linear-gradient(135deg,var(--accent),#1d4ed8)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/20">
              {t.actions.billing}
            </Link>
          </div>
        </div>
      </section>

      {loading ? <div className="ui-notice-neutral">{t.loading}</div> : null}
      {error ? <div className="ui-notice-error">{error}</div> : null}

      {!loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <OperationsStatCard
            label={t.stats.appointmentsDay}
            value={String(todayAppointments.length)}
            detail={`${inProgressPets.length} ${t.stats.appointmentsDayDetail.replace('{ready}', String(readyPets.length))}`}
            tone="accent"
          />
          <OperationsStatCard
            label={t.stats.penultimateBath}
            value={String(penultimateBathCount)}
            detail={`${expiringPlans.length} ${t.stats.penultimateBathDetail}`}
            tone={planAlerts.length > 0 ? 'warning' : 'default'}
          />
          <OperationsStatCard
            label={t.stats.nextCycle}
            value={formatCurrencyForLocale(locale, nextCycleProjectedDue)}
            detail={`${nextCycleRecurring} ${t.stats.nextCycleDetail}`}
          />
          <OperationsStatCard
            label={t.stats.commission}
            value={formatCurrencyForLocale(locale, monthCommissionTotal)}
            detail={`${state.completedMonthAppointments.length} ${t.stats.commissionDetail}`}
          />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,1fr)]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{t.queue.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{t.queue.description}</p>
            </div>
            <Link href="/pet/appointments" className="text-sm font-semibold text-[color:var(--accent)] transition-colors hover:text-slate-900">
              {t.actions.appointments}
            </Link>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="ui-notice-neutral">{t.queue.empty}</div>
          ) : (
            <div className="space-y-4">
              {todayAppointments.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="flex items-center gap-4 rounded-[1.35rem] border border-slate-200 p-4 transition-colors hover:bg-slate-50">
                  <div className="min-w-[4.5rem] text-center">
                    <p className="text-sm font-bold text-slate-900">{formatTimeForLocale(locale, appointment.scheduledAt)}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {appointment.status.toUpperCase() === 'COMPLETED' ? t.pills.pickupSent : appointment.status.toLowerCase()}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-900">
                    {(appointment.petName ?? appointment.petId ?? 'PF').slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{appointment.petName ?? appointment.petId}</p>
                    <p className="text-sm text-slate-600">
                      {resolveClientName(clientLookup, appointment.clientId, appointment.clientName)} · {appointment.serviceName}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <SignalPill label={appointment.clientPlanId ? t.pills.recurring : t.pills.oneTime} tone={appointment.clientPlanId ? 'success' : 'neutral'} />
                      <SignalPill label={appointment.professionalName ?? t.queue.pendingProfessional} tone="accent" />
                      {appointment.planRemainingSessions === 2 ? <SignalPill label={t.pills.penultimateBath} tone="warning" /> : null}
                      {hasPetTaxi(appointment) ? <SignalPill label={t.pills.petTaxi} tone="accent" /> : null}
                    </div>
                  </div>

                  <div className="space-y-2 text-right">
                    <StatusBadge status={appointment.status} />
                    <p className="text-sm font-semibold text-slate-900">{formatCurrencyForLocale(locale, resolveProjectedDue(appointment))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">{t.billing.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{t.billing.description}</p>

          <div className="mt-6 space-y-4">
            {activityItems.map((item) => (
              <div key={item.key} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                    item.tone === 'success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : item.tone === 'warning'
                        ? 'bg-amber-100 text-amber-700'
                        : item.tone === 'danger'
                          ? 'bg-red-100 text-red-700'
                          : item.tone === 'accent'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-current" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t.billing.nextCycleLabel}</p>
            <p className="mt-2 text-2xl font-bold tracking-[-0.03em] text-slate-900">{formatCurrencyForLocale(locale, nextCycleProjectedDue)}</p>
            <p className={`mt-2 ${sharedCompactTextClass}`}>{nextCycleRecurring} {t.billing.nextCycleDetail}</p>
          </div>
        </section>
      </div>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{t.billing.title}</h3>
            <p className="mt-1 text-sm text-slate-600">
              {t.queue.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SignalPill label={`${recurringToday.length} ${t.pills.recurring}`} tone="success" />
            {petTaxiToday.length > 0 ? <SignalPill label={`${petTaxiToday.length} ${t.pills.petTaxi}`} tone="accent" /> : null}
            {lowStockProducts.length > 0 ? <SignalPill label={`${lowStockProducts.length} ${t.pills.belowMinimum}`} tone="danger" /> : null}
          </div>
        </div>

        {dashboardRows.length === 0 ? (
          <div className="ui-notice-neutral">{t.billing.noAlerts}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t.pills.recurring}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t.pills.activePlan}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t.billing.nextCycleLabel}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t.pills.responsible}</th>
                  <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{t.pills.petTaxi}</th>
                </tr>
              </thead>
              <tbody>
                {dashboardRows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-semibold text-slate-900">{row.clientName}</p>
                        <p className="mt-1 text-sm text-slate-600">{row.planName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        <SignalPill label={`${row.remainingSessions} ${t.billing.remainingSessions}`} tone={row.remainingSessions === 2 ? 'warning' : 'success'} />
                        {row.remainingSessions === 2 ? <SignalPill label={t.pills.penultimateBath} tone="warning" /> : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <p>{row.expiresAt ? `${t.billing.expiresAt} ${formatDateForLocale(locale, row.expiresAt, '', { day: '2-digit', month: 'short' })}` : t.billing.noAlerts}</p>
                      <p className="mt-1 font-semibold text-slate-900">{formatCurrencyForLocale(locale, row.outstandingAmount)}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{row.professionalName}</td>
                    <td className="px-4 py-4">
                      {row.petTaxi ? <SignalPill label={t.pills.petTaxi} tone="accent" /> : <span className="text-sm text-slate-500">-</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{t.inventory.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{t.inventory.description}</p>
            </div>
            <Link href="/pet/inventory" className="text-sm font-semibold text-[color:var(--accent)] transition-colors hover:text-slate-900">
              {t.inventory.title}
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="ui-notice-neutral">{t.inventory.empty}</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {lowStockProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{product.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{t.inventory.sku} {product.sku}</p>
                    </div>
                    <StatusBadge status={product.currentQuantity <= product.minimumQuantity ? 'alert' : 'warn'} />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-slate-900">{product.currentQuantity} {product.unitOfMeasure}</p>
                  <p className={`mt-2 ${sharedCompactTextClass}`}>{t.inventory.minimum} {product.minimumQuantity} · {t.inventory.reorder} {product.reorderPoint}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-slate-900">{t.production.title}</h3>
          <p className="mt-1 text-sm text-slate-600">{t.production.description}</p>

          {productionByProfessional.length === 0 ? (
            <div className="ui-notice-neutral mt-6">{t.production.empty}</div>
          ) : (
            <div className="mt-6 space-y-4">
              {productionByProfessional.map((professional) => (
                <div key={professional.professionalName} className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{professional.professionalName}</p>
                      <p className="mt-1 text-sm text-slate-600">{professional.completed} {t.production.completed}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <SignalPill label={t.pills.responsible} tone="accent" />
                        <SignalPill label={t.pills.commission} tone="success" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{formatCurrencyForLocale(locale, professional.commission)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
