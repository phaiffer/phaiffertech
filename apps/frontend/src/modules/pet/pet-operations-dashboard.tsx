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
import { PageSection } from '@/shared/ui/page-section';

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
    ? 'border-transparent bg-[linear-gradient(135deg,var(--accent),color-mix(in_srgb,var(--accent)_82%,#0f172a_18%))] text-white shadow-[0_18px_40px_-24px_color-mix(in_srgb,var(--accent)_45%,transparent)]'
    : tone === 'warning'
      ? 'border-warning/20 bg-white'
      : 'border-slate-200 bg-white';

  return (
    <div className={`rounded-[1.5rem] border p-5 shadow-xs ${toneClass}`}>
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
  const readyMissingPickupMessage = readyPets.length - readyWithPickupMessage;
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

  const overdueInvoices = openInvoices.filter((invoice) => invoice.dueAt && new Date(invoice.dueAt).getTime() < Date.now());
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

  if (!canReadDashboard) {
    return <div className="ui-notice-warning">{t.noPermission}</div>;
  }

  return (
    <div className={sharedPageStackClass}>
      {showSubnav ? <PetModuleSubnav /> : null}

      <section className="flex flex-col gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-xs lg:flex-row lg:items-center lg:justify-between lg:p-6">
        <div className="max-w-3xl">
          {surfaceLabel ? <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">{surfaceLabel}</p> : null}
          <p className={`${surfaceLabel ? 'mt-2 ' : ''}text-xs font-semibold uppercase tracking-[0.18em] text-slate-600`}>{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/pet/appointments" className="ui-secondary-button">
            {t.actions.appointments}
          </Link>
          <Link href="/pet/invoices" className="ui-primary-button">
            {t.actions.billing}
          </Link>
        </div>
      </section>

      {loading ? <div className="ui-notice-neutral">{t.loading}</div> : null}
      {error ? <div className="ui-notice-error">{error}</div> : null}

      {!loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
        <PageSection
          title={t.queue.title}
          description={t.queue.description}
        >
          {todayAppointments.length === 0 ? (
            <div className="ui-notice-neutral">
              {t.queue.empty}
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.slice(0, 6).map((appointment) => (
                <div key={appointment.id} className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">
                        {formatTimeForLocale(locale, appointment.scheduledAt)} · {appointment.petName ?? appointment.petId}
                      </p>
                      <p className={sharedCompactTextClass}>
                        {resolveClientName(clientLookup, appointment.clientId, appointment.clientName)} · {appointment.serviceName}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        <SignalPill
                          label={appointment.clientPlanId ? t.pills.recurring : t.pills.oneTime}
                          tone={appointment.clientPlanId ? 'success' : 'neutral'}
                        />
                        <SignalPill label={appointment.professionalName ?? t.queue.pendingProfessional} tone="accent" />
                        {appointment.clientPlanId ? <SignalPill label={t.pills.activePlan} tone="success" /> : null}
                        {appointment.planRemainingSessions === 2 ? <SignalPill label={t.pills.penultimateBath} tone="warning" /> : null}
                        {hasPetTaxi(appointment) ? <SignalPill label={t.pills.petTaxi} tone="accent" /> : null}
                        {hasPickupMessage(appointment, clientLookup) ? <SignalPill label={t.pills.pickupSent} tone="success" /> : null}
                      </div>
                      <p className={sharedCompactTextClass}>
                        {appointment.professionalName ?? t.queue.missingProfessional}
                        {appointment.extrasAmount ? ` · ${t.queue.extrasLabel} ${formatCurrencyForLocale(locale, appointment.extrasAmount)}` : ''}
                        {appointment.commissionAmount != null ? ` · ${t.queue.commissionLabel} ${formatCurrencyForLocale(locale, appointment.commissionAmount)}` : ''}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <StatusBadge status={appointment.status} />
                      <p className="text-sm font-semibold text-foreground">{formatCurrencyForLocale(locale, resolveProjectedDue(appointment))}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PageSection>

        <PageSection
          tone="muted"
          title={t.billing.title}
          description={t.billing.description}
        >
          <div className="space-y-3">
            <div className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">{t.billing.nextCycleLabel}</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{formatCurrencyForLocale(locale, nextCycleProjectedDue)}</p>
              <p className={`mt-2 ${sharedCompactTextClass}`}>
                {nextCycleRecurring} {t.billing.nextCycleDetail}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <SignalPill label={`${recurringToday.length} ${t.pills.recurring}`} tone="success" />
                {petTaxiToday.length > 0 ? <SignalPill label={`${petTaxiToday.length} ${t.pills.petTaxi}`} tone="accent" /> : null}
                {readyPets.length > 0 ? (
                  <SignalPill
                    label={readyMissingPickupMessage > 0 ? `${readyMissingPickupMessage} ${t.pills.pickupPending}` : t.pills.pickupSent}
                    tone={readyMissingPickupMessage > 0 ? 'warning' : 'success'}
                  />
                ) : null}
              </div>
            </div>

            {planAlerts.slice(0, 3).map((plan) => (
              <div key={plan.id} className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {resolveClientName(clientLookup, plan.clientId)} · {plan.planName}
                    </p>
                    <p className={`mt-1 ${sharedCompactTextClass}`}>
                      {plan.remainingSessions} {t.billing.remainingSessions} · {t.billing.expiresAt} {formatDateForLocale(locale, plan.expiresAt, '', { day: '2-digit', month: 'short' })}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <SignalPill label={t.pills.activePlan} tone="success" />
                      {plan.remainingSessions === 2 ? <SignalPill label={t.pills.penultimateBath} tone="warning" /> : null}
                    </div>
                  </div>
                  <StatusBadge status={plan.remainingSessions === 2 ? 'warn' : 'pending'} />
                </div>
              </div>
            ))}

            {openInvoices.slice(0, 3).map((invoice) => (
              <div key={invoice.id} className="rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {resolveClientName(clientLookup, invoice.clientId, invoice.clientName)}
                    </p>
                    <p className={`mt-1 ${sharedCompactTextClass}`}>
                      {t.billing.dueAt} {formatDateForLocale(locale, invoice.dueAt, '', { day: '2-digit', month: 'short' })} · {t.billing.balance} {formatCurrencyForLocale(locale, invoice.outstandingAmount)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <SignalPill label={t.pills.cycleCharge} tone="accent" />
                      {overdueInvoices.some((item) => item.id === invoice.id) ? <SignalPill label={t.pills.overdue} tone="danger" /> : null}
                    </div>
                  </div>
                  <StatusBadge status={overdueInvoices.some((item) => item.id === invoice.id) ? 'alert' : invoice.status} />
                </div>
              </div>
            ))}

            {planAlerts.length === 0 && openInvoices.length === 0 ? (
              <div className="ui-notice-neutral">{t.billing.noAlerts}</div>
            ) : null}
          </div>
        </PageSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <PageSection
          title={t.inventory.title}
          description={t.inventory.description}
        >
          {lowStockProducts.length === 0 ? (
            <div className="ui-notice-neutral">{t.inventory.empty}</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {lowStockProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{product.name}</p>
                      <p className={`mt-1 ${sharedCompactTextClass}`}>{t.inventory.sku} {product.sku}</p>
                    </div>
                    <StatusBadge status={product.currentQuantity <= product.minimumQuantity ? 'alert' : 'warn'} />
                  </div>
                  <p className="mt-4 text-lg font-semibold text-foreground">
                    {product.currentQuantity} {product.unitOfMeasure}
                  </p>
                  <p className={`mt-2 ${sharedCompactTextClass}`}>
                    {t.inventory.minimum} {product.minimumQuantity} · {t.inventory.reorder} {product.reorderPoint}
                  </p>
                  {product.currentQuantity <= product.minimumQuantity ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <SignalPill label={t.pills.belowMinimum} tone="danger" />
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </PageSection>

        <PageSection
          tone="muted"
          title={t.production.title}
          description={t.production.description}
        >
          {productionByProfessional.length === 0 ? (
            <div className="ui-notice-neutral">{t.production.empty}</div>
          ) : (
            <div className="space-y-3">
              {productionByProfessional.map((professional) => (
                <div key={professional.professionalName} className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{professional.professionalName}</p>
                      <p className={`mt-1 ${sharedCompactTextClass}`}>
                        {professional.completed} {t.production.completed}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <SignalPill label={t.pills.responsible} tone="accent" />
                        <SignalPill label={t.pills.commission} tone="success" />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{formatCurrencyForLocale(locale, professional.commission)}</p>
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
