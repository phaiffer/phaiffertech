'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { useKeyboardShortcut } from '@/shared/hooks/use-keyboard-shortcut';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatCurrencyForLocale, formatDateForLocale, formatTimeForLocale } from '@/shared/i18n/formatters';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems } from '@/shared/lib/pagination';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { petService } from '@/shared/services/pet-service';
import type { ClientPlan, PetAppointment, PetClient, PetInvoice, PetProduct } from '@/shared/types/pet';

type PetOperationsDashboardProps = {
  /** @deprecated v2 headers have no eyebrow. */
  eyebrow?: string;
  title: string;
  /** Kept for callers; the v2 "Hoje" header shows the date instead of a sentence. */
  description?: string;
  showSubnav?: boolean;
  /** @deprecated */
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

const initialState: DashboardState = {
  clients: [],
  todayAppointments: [],
  completedMonthAppointments: [],
  nextCycleAppointments: [],
  plans: [],
  products: [],
  invoices: []
};

// Queue stages backed by real appointment statuses (see docs/design/comanda/GAPS.md):
// "No banho"/"Na tosa" are merged into "Em atendimento" and "Retirado" has no signal.
type QueueStage = 'waiting' | 'inProgress' | 'ready';
const STAGE_BY_STATUS: Record<string, QueueStage> = {
  SCHEDULED: 'waiting',
  CONFIRMED: 'waiting',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'ready'
};
const STAGE_DOT: Record<QueueStage, string> = {
  waiting: 'waiting',
  inProgress: 'in-progress',
  ready: 'ready'
};
const MAX_PENDING_ITEMS = 8;

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

function isSameDay(value: string | null | undefined, day: Date) {
  if (!value) return false;
  const date = new Date(value);
  return date.getFullYear() === day.getFullYear()
    && date.getMonth() === day.getMonth()
    && date.getDate() === day.getDate();
}

export function PetOperationsDashboard({
  title,
  showSubnav = false
}: PetOperationsDashboardProps) {
  const { locale } = useAppI18n();
  const t = useAppMessages().petDashboard;
  const copy = useAppMessages().screens.petToday;
  const platform = useFrontendPlatform();
  const router = useRouter();
  const [state, setState] = useState<DashboardState>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);

  const hasPermission = (permission: string) => platform.user?.permissions.includes(permission) ?? false;
  const hasWorkspaceWidePetVisibility =
    platform.workspace.hasFullPlatformVisibility || platform.workspace.canManagePlatformAdministration;
  const canReadDashboard = hasPermission('pet.dashboard.read') || hasWorkspaceWidePetVisibility;
  const canReadClients = hasPermission('pet.client.read');
  const canReadAppointments = hasPermission('pet.appointment.read');
  const canCreateAppointments = hasPermission('pet.appointment.create');
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
        ? petService.listAppointments(0, 200, '', {
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

      const [
        clientsResult,
        todayResult,
        completedResult,
        nextCycleResult,
        plansResult,
        productsResult,
        invoicesResult
      ] = results;
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
        nextErrors.push(resolveApiErrorMessage(todayResult.reason, t.errors.appointments));
      }

      if (plansResult.status === 'rejected') {
        nextErrors.push(resolveApiErrorMessage(plansResult.reason, t.errors.plans));
      }

      if (productsResult.status === 'rejected') {
        nextErrors.push(resolveApiErrorMessage(productsResult.reason, t.errors.inventory));
      }

      if (invoicesResult.status === 'rejected') {
        nextErrors.push(resolveApiErrorMessage(invoicesResult.reason, t.errors.billing));
      }

      setError(nextErrors.length > 0 ? nextErrors.join(' ') : null);
      setLoadedAt(new Date());
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

  const openNewAppointment = useCallback(() => {
    router.push('/pet/appointments?novo=1');
  }, [router]);

  useKeyboardShortcut('n', openNewAppointment, { enabled: canCreateAppointments });

  const clientLookup = useMemo(() => new Map(state.clients.map((client) => [client.id, client])), [state.clients]);

  const todayAppointments = useMemo(
    () => state.todayAppointments
      .filter((appointment) => !['CANCELED', 'NO_SHOW'].includes(appointment.status.toUpperCase()))
      .sort((left, right) => new Date(left.scheduledAt).getTime() - new Date(right.scheduledAt).getTime()),
    [state.todayAppointments]
  );

  const queue = useMemo(() => {
    const columns: Record<QueueStage, PetAppointment[]> = { waiting: [], inProgress: [], ready: [] };
    todayAppointments.forEach((appointment) => {
      const stage = STAGE_BY_STATUS[appointment.status.toUpperCase()];
      if (stage) columns[stage].push(appointment);
    });
    return columns;
  }, [todayAppointments]);

  const expectedToday = useMemo(
    () => todayAppointments.reduce((total, appointment) => total + resolveProjectedDue(appointment), 0),
    [todayAppointments]
  );

  // Today's cash: confirmed payments received today on the invoices loaded above.
  const cash = useMemo(() => {
    const today = new Date();
    const totals = { cash: 0, pix: 0, card: 0, other: 0 };
    state.invoices.forEach((invoice) => {
      (invoice.payments ?? []).forEach((payment) => {
        if (payment.status !== 'CONFIRMED' || !isSameDay(payment.receivedAt, today)) return;
        if (payment.method === 'CASH') totals.cash += payment.amount;
        else if (payment.method === 'PIX') totals.pix += payment.amount;
        else if (payment.method === 'CREDIT_CARD' || payment.method === 'DEBIT_CARD') totals.card += payment.amount;
        else totals.other += payment.amount;
      });
    });
    return { ...totals, total: totals.cash + totals.pix + totals.card + totals.other };
  }, [state.invoices]);

  const planAlerts = useMemo(
    () => state.plans
      .filter((plan) => plan.remainingSessions > 0 && plan.remainingSessions <= 2)
      .sort((left, right) => left.remainingSessions - right.remainingSessions),
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

  const pendingItems = useMemo(() => {
    const billing = openInvoices.map((invoice) => ({
      key: `invoice-${invoice.id}`,
      kind: copy.pendingBilling,
      title: invoice.clientName ?? resolveClientName(clientLookup, invoice.clientId),
      detail: copy.billingDetail.replace('{amount}', formatCurrencyForLocale(locale, invoice.outstandingAmount)),
      action: copy.actionCharge,
      href: '/pet/invoices'
    }));
    const plans = planAlerts.map((plan) => ({
      key: `plan-${plan.id}`,
      kind: copy.pendingPlan,
      title: resolveClientName(clientLookup, plan.clientId),
      detail: copy.planDetail.replace('{plan}', plan.planName).replace('{n}', String(plan.remainingSessions)),
      action: copy.actionRenew,
      href: '/pet/plans'
    }));
    const stock = lowStockProducts.map((product) => ({
      key: `product-${product.id}`,
      kind: copy.pendingStock,
      title: product.name,
      detail: copy.stockDetail
        .replace('{qty}', String(product.currentQuantity))
        .replace('{min}', String(product.reorderPoint)),
      action: copy.actionRestock,
      href: '/pet/inventory'
    }));
    return [...billing, ...plans, ...stock];
  }, [clientLookup, copy, locale, lowStockProducts, openInvoices, planAlerts]);

  const month = useMemo(() => ({
    completed: state.completedMonthAppointments.length,
    commission: state.completedMonthAppointments.reduce((total, appointment) => total + (appointment.commissionAmount ?? 0), 0),
    open: openInvoices.reduce((total, invoice) => total + invoice.outstandingAmount, 0),
    nextCycle: state.nextCycleAppointments.reduce((total, appointment) => total + resolveProjectedDue(appointment), 0)
  }), [openInvoices, state.completedMonthAppointments, state.nextCycleAppointments]);

  if (!canReadDashboard) {
    return <div className="ui-notice-warning">{t.noPermission}</div>;
  }

  const formatCount = (value: number) => new Intl.NumberFormat(locale).format(value);
  const stats: Array<{ key: string; label: string; value: string }> = [
    { key: 'total', label: copy.statTotal, value: formatCount(todayAppointments.length) },
    { key: 'waiting', label: copy.statWaiting, value: formatCount(queue.waiting.length) },
    { key: 'inProgress', label: copy.statInProgress, value: formatCount(queue.inProgress.length) },
    { key: 'ready', label: copy.statReady, value: formatCount(queue.ready.length) },
    { key: 'expected', label: copy.statExpected, value: formatCurrencyForLocale(locale, expectedToday) },
    ...(canReadInvoices
      ? [{ key: 'received', label: copy.statReceived, value: formatCurrencyForLocale(locale, cash.total) }]
      : [])
  ];
  const stages: Array<{ key: QueueStage; label: string }> = [
    { key: 'waiting', label: copy.stageWaiting },
    { key: 'inProgress', label: copy.stageInProgress },
    { key: 'ready', label: copy.stageReady }
  ];
  const todayLabel = formatDateForLocale(locale, new Date(), '', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className={sharedPageStackClass}>
      {showSubnav ? <PetModuleSubnav /> : null}

      {/* Header: H1 + date, freshness and actions. */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-baseline gap-2.5">
          <h1 className="text-xl font-semibold text-[var(--ink)]">{title}</h1>
          <span className="text-[var(--muted)]">{todayLabel}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {loadedAt ? (
            <span className="mr-1.5 text-xs text-[var(--muted)]">
              {copy.updatedAt.replace('{time}', formatTimeForLocale(locale, loadedAt.toISOString()))}
            </span>
          ) : null}
          <button type="button" onClick={() => window.print()} className="ui-secondary-button">
            {copy.printQueue}
          </button>
          {canCreateAppointments ? (
            <button type="button" onClick={openNewAppointment} aria-keyshortcuts="N" className="ui-primary-button">
              {copy.newAppointment}
              <kbd className="ui-kbd" aria-hidden="true">N</kbd>
            </button>
          ) : null}
        </div>
      </header>

      {error ? <div className="ui-notice-error">{error}</div> : null}

      {/* Metrics strip */}
      <dl className="flex flex-wrap border-y border-[color:var(--line)]">
        {stats.map((stat) => (
          <div key={stat.key} className="flex flex-col gap-0.5 border-r border-[color:var(--line-soft)] px-4 py-3 first:pl-0 last:border-r-0">
            <dt className="text-xs text-[var(--muted)]">{stat.label}</dt>
            <dd className="ui-mono text-lg font-medium text-[var(--ink)]">{loading ? '…' : stat.value}</dd>
          </div>
        ))}
      </dl>

      {/* Today's queue: one column per stage on desktop, grouped list on mobile. */}
      <section aria-label={copy.queue}>
        {loading ? (
          <p className="text-sm text-[var(--muted)]">{copy.loading}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {stages.map((stage) => (
              <div key={stage.key} className="flex min-w-0 flex-col gap-1.5">
                <h2 className="mb-1 flex items-center gap-1.5 px-0.5 text-[13px] font-semibold text-[var(--ink)]">
                  <span className="ui-status-dot" data-status={STAGE_DOT[stage.key]} aria-hidden="true" />
                  {stage.label}
                  <span className="ui-mono font-normal text-[var(--muted)]">{queue[stage.key].length}</span>
                </h2>
                {queue[stage.key].length === 0 ? (
                  <p className="px-0.5 text-xs text-[var(--muted)]">{copy.stageEmpty}</p>
                ) : (
                  queue[stage.key].map((appointment) => (
                    <QueueCard
                      key={appointment.id}
                      appointment={appointment}
                      ready={stage.key === 'ready'}
                      hasPickupMessage={hasPickupMessage(appointment, clientLookup)}
                      locale={locale}
                      copy={copy}
                    />
                  ))
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid border-t border-[color:var(--line)] lg:grid-cols-[2fr_1fr]">
        {/* Pending items */}
        <section aria-labelledby="today-pending" className="min-w-0 py-4 lg:border-r lg:border-[color:var(--line)] lg:pr-6">
          <h2 id="today-pending" className="mb-2 text-sm font-semibold text-[var(--ink)]">
            {copy.pending} <span className="ui-mono font-normal text-[var(--muted)]">{pendingItems.length}</span>
          </h2>
          {pendingItems.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{copy.noPending}</p>
          ) : (
            <ul>
              {pendingItems.slice(0, MAX_PENDING_ITEMS).map((item) => (
                <li
                  key={item.key}
                  className="grid grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-3 border-t border-[color:var(--line-soft)] py-2"
                >
                  <span className="text-xs text-[var(--muted)]">{item.kind}</span>
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-[var(--ink)]">{item.title}</span>{' '}
                    <span className="text-[var(--muted)]">· {item.detail}</span>
                  </span>
                  <Link href={item.href} className="whitespace-nowrap font-medium text-[var(--ink)] underline-offset-2 hover:underline">
                    {item.action}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="min-w-0 py-4 lg:pl-6">
          {canReadInvoices ? (
            <section aria-labelledby="today-cash" className="mb-5">
              <h2 id="today-cash" className="mb-2 text-sm font-semibold text-[var(--ink)]">{copy.cash}</h2>
              <dl>
                {[
                  [copy.cashCash, cash.cash],
                  [copy.cashPix, cash.pix],
                  [copy.cashCard, cash.card],
                  [copy.cashOther, cash.other]
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between border-t border-[color:var(--line-soft)] py-1.5">
                    <dt>{label}</dt>
                    <dd className="ui-mono">{formatCurrencyForLocale(locale, value as number)}</dd>
                  </div>
                ))}
                <div className="flex justify-between border-t border-[var(--ink)] py-1.5 font-semibold">
                  <dt>{copy.cashTotal}</dt>
                  <dd className="ui-mono">{formatCurrencyForLocale(locale, cash.total)}</dd>
                </div>
              </dl>
              <p className="mt-1 text-xs text-[var(--muted)]">{copy.cashNote}</p>
              <Link href="/pet/invoices" className="mt-2 inline-block font-medium text-[var(--ink)] underline-offset-2 hover:underline">
                {copy.openBilling}
              </Link>
            </section>
          ) : null}

          <section aria-labelledby="today-month">
            <h2 id="today-month" className="mb-2 text-sm font-semibold text-[var(--ink)]">{copy.month}</h2>
            <dl>
              {[
                [copy.monthCompleted, formatCount(month.completed)],
                [copy.monthCommission, formatCurrencyForLocale(locale, month.commission)],
                [copy.monthOpen, formatCurrencyForLocale(locale, month.open)],
                [copy.monthNextCycle, formatCurrencyForLocale(locale, month.nextCycle)]
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 border-t border-[color:var(--line-soft)] py-1.5">
                  <dt>{label}</dt>
                  <dd className="ui-mono">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

function QueueCard({
  appointment,
  ready,
  hasPickupMessage: pickupReady,
  locale,
  copy
}: {
  appointment: PetAppointment;
  ready: boolean;
  hasPickupMessage: boolean;
  locale: ReturnType<typeof useAppI18n>['locale'];
  copy: ReturnType<typeof useAppMessages>['screens']['petToday'];
}) {
  const planEnding = Boolean(appointment.clientPlanId) && (appointment.planRemainingSessions ?? 99) <= 1;
  const flag = hasPetTaxi(appointment) ? copy.flagTaxi : planEnding ? copy.flagPlanEnding : '';
  const meta = [
    appointment.professionalName,
    appointment.clientPlanId
      ? copy.planRemaining.replace('{n}', String(appointment.planRemainingSessions ?? 0))
      : copy.oneTime,
    resolveProjectedDue(appointment) > 0 ? formatCurrencyForLocale(locale, resolveProjectedDue(appointment)) : null
  ].filter(Boolean).join(' · ');

  return (
    <Link
      href="/pet/appointments"
      className="flex flex-col gap-0.5 rounded-md border border-[color:var(--line)] bg-[var(--bg)] px-2.5 py-2 text-[var(--ink)] hover:border-[color:var(--control)]"
    >
      <span className="flex items-baseline gap-2">
        <span className="ui-mono text-xs text-[var(--muted)]">{formatTimeForLocale(locale, appointment.scheduledAt)}</span>
        <span className={`font-semibold ${ready ? 'ui-highlight' : ''}`}>{appointment.petName ?? '-'}</span>
        {flag ? <span className="ml-auto whitespace-nowrap text-xs text-[var(--muted)]">{flag}</span> : null}
      </span>
      <span className="truncate text-[13px] text-[var(--ink-2)]">{appointment.serviceName}</span>
      <span className="truncate text-xs text-[var(--muted)]">{meta}</span>
      {ready ? (
        <span className="mt-1 flex items-center justify-between gap-2 border-t border-[color:var(--line-soft)] pt-1.5 text-xs">
          <span className="text-[var(--muted)]">{pickupReady ? copy.pickupMessageReady : copy.pickupNoEmail}</span>
          <span className="font-semibold underline">{copy.notifyOwner}</span>
        </span>
      ) : null}
    </Link>
  );
}
