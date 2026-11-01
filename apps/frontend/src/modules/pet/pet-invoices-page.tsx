'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpRight, Clock3, Receipt, WalletCards, type LucideIcon } from 'lucide-react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import {
  sharedCompactTextClass,
  sharedFieldHintClass,
  sharedFilterToolbarClass,
  sharedFormActionsClass,
  sharedInlineActionsClass,
  sharedPageStackClass,
  sharedReminderSurfaceClass
} from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import {
  PetLookupFeedback,
  PetLookupIssue,
  resolvePetLookupIssue,
  resolvePetLookupLabel
} from '@/modules/pet/pet-lookup-feedback';
import { financeService } from '@/shared/services/finance-service';
import { CreatePetInvoicePaymentInput, petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { FinanceCashMovement, FinanceInvoice, FinancePaymentEvent } from '@/shared/types/finance';
import { ClientPlan, PetAppointment, PetClient, PetInvoice } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { DateTimeInput } from '@/shared/ui/datetime-input';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';

const pageSize = 10;
const financePreviewSize = 8;

type InvoicesCopy = AppMessages['screens']['petInvoices'];

function buildStatusOptions(copy: InvoicesCopy) {
  return [
    { value: '', label: copy.allCycles },
    { value: 'DRAFT', label: copy.statusDraft },
    { value: 'ISSUED', label: copy.statusIssued },
    { value: 'PAID', label: copy.statusPaid },
    { value: 'CANCELED', label: copy.statusCanceled }
  ];
}

function buildFormStatusOptions(copy: InvoicesCopy) {
  return buildStatusOptions(copy).filter((option) => option.value);
}

function buildPaymentMethodOptions(copy: InvoicesCopy) {
  return [
    { value: 'PIX', label: 'PIX' },
    { value: 'CASH', label: copy.methodCash },
    { value: 'CREDIT_CARD', label: copy.methodCreditCard },
    { value: 'DEBIT_CARD', label: copy.methodDebitCard },
    { value: 'BANK_TRANSFER', label: copy.methodBankTransfer },
    { value: 'BOLETO', label: copy.methodBoleto },
    { value: 'MANUAL', label: copy.methodManualAdjustment },
    { value: 'OTHER', label: copy.methodOther }
  ];
}

const initialPage: PageResponse<PetInvoice> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

type NextCyclePreviewRow = {
  clientId: string;
  clientName: string;
  billingType: 'Recurring' | 'One-time';
  planName?: string | null;
  remainingSessions?: number | null;
  appointmentCount: number;
  coveredAppointments: number;
  projectedDue: number;
  extrasTotal: number;
  petTaxiTotal: number;
  note: string;
  reference: string;
};

function toDateTimeLocal(isoValue?: string | null) {
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

function formatDateTime(copy: AppMessages['screens']['petInvoices'], value?: string | null, fallback = copy.notRecorded) {
  if (!value) {
    return fallback;
  }

  return new Date(value).toLocaleString('pt-BR');
}

function formatCurrency(value: number, currency = 'BRL') {
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function nowLocalDateTime() {
  return toDateTimeLocal(new Date().toISOString());
}

function getNextCycleDateRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);

  return { start, end };
}

function formatPaymentEventLabel(copy: InvoicesCopy, eventType: string) {
  const labels: Record<string, string> = {
    INVOICE_CREATED: copy.eventInvoiceCreated,
    INVOICE_ISSUED: copy.eventInvoiceIssued,
    INVOICE_CANCELED: copy.eventInvoiceCanceled,
    CHARGE_REQUESTED: copy.eventChargeRequested,
    CHARGE_CREATED: copy.eventChargeCreated,
    CHARGE_FAILED: copy.eventChargeFailed,
    WEBHOOK_RECEIVED: copy.eventWebhookReceived,
    PAYMENT_RECORDED: copy.eventPaymentRecorded,
    PAYMENT_CONFIRMED: copy.eventPaymentConfirmed,
    PAYMENT_CANCELED: copy.eventPaymentCanceled,
    REFUND_RECORDED: copy.eventRefundRecorded
  };
  return labels[eventType] ?? eventType;
}

function formatBusinessContextLabel(copy: InvoicesCopy, contextType: string) {
  const labels: Record<string, string> = {
    'PET.APPOINTMENT': copy.contextAppointment,
    'PET.CLIENT_PLAN': copy.contextClientPlan,
    'PET.CLIENT': copy.contextClient,
    'PET.SERVICE': copy.contextService
  };
  return labels[contextType.toUpperCase()] ?? formatCategoryLabel(copy, contextType);
}

function formatPaymentEventSource(copy: InvoicesCopy, event: FinancePaymentEvent) {
  const channel = event.provider === 'MANUAL'
    ? copy.eventSourceManual
    : copy.eventSourceProvider.replace('{provider}', event.provider);
  return event.recordedByName
    ? copy.eventSourceBy.replace('{channel}', channel).replace('{name}', event.recordedByName)
    : copy.eventSourceSystem.replace('{channel}', channel);
}

function formatCycleLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
}

function buildCollectionReference(clientId: string, cycleDate: Date) {
  const month = `${cycleDate.getMonth() + 1}`.padStart(2, '0');
  return `COB-${cycleDate.getFullYear()}${month}-${clientId.slice(0, 8).toUpperCase()}`;
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

function formatMethodLabel(copy: InvoicesCopy, value?: string | null) {
  return buildPaymentMethodOptions(copy).find((option) => option.value === value)?.label ?? value ?? copy.unknown;
}

function formatCategoryLabel(copy: InvoicesCopy, value?: string | null) {
  if (!value) {
    return copy.noCategory;
  }

  const normalized = value.toUpperCase();
  const knownLabels: Record<string, string> = {
    APPOINTMENT: copy.categoryAppointment,
    CLIENT: copy.client,
    INVOICE_PAYMENT: copy.categoryInvoicePayment,
    INVOICE: copy.categoryInvoice,
    MANUAL: copy.methodManualAdjustment,
    OTHER: copy.methodOther,
    PET: 'Gestão Pet',
    PLAN: copy.categoryPlan,
    PRODUCT: copy.categoryProduct,
    SERVICE: copy.categoryService
  };

  if (knownLabels[normalized]) {
    return knownLabels[normalized];
  }

  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatStatusLabel(copy: InvoicesCopy, value?: string | null) {
  if (!value) {
    return copy.notProvided;
  }

  const normalized = value.toUpperCase();
  const knownLabels: Record<string, string> = {
    ACTIVE: copy.statusActiveFeminine,
    CANCELED: copy.statusCanceled,
    CANCELLED: copy.statusCanceled,
    COMPLETED: copy.statusCompleted,
    CONFIRMED: copy.statusConfirmed,
    DRAFT: copy.statusDraft,
    INACTIVE: copy.statusInactiveFeminine,
    ISSUED: copy.statusIssued,
    OPEN: copy.openAmount,
    OVERDUE: copy.statusOverdue,
    PAID: copy.statusPaid,
    PENDING: copy.statusPending,
    SCHEDULED: copy.statusScheduled
  };

  return knownLabels[normalized] ?? formatCategoryLabel(copy, value);
}

function formatDirectionLabel(copy: InvoicesCopy, value?: string | null) {
  if (!value) {
    return copy.notProvided;
  }

  if (value.toUpperCase() === 'IN') {
    return copy.directionIn;
  }

  if (value.toUpperCase() === 'OUT') {
    return copy.directionOut;
  }

  return formatCategoryLabel(copy, value);
}

function isOverdueInvoice(invoice: PetInvoice) {
  return invoice.status !== 'PAID'
    && invoice.status !== 'CANCELED'
    && Boolean(invoice.dueAt)
    && new Date(invoice.dueAt as string).getTime() < Date.now();
}

function statToneClass(tone: 'default' | 'warning' | 'danger' = 'default') {
  if (tone === 'warning') {
    return 'border-amber-200/80 bg-white';
  }

  if (tone === 'danger') {
    return 'border-red-200/80 bg-white';
  }

  return 'border-slate-200/90 bg-white';
}

const billingPanelClass =
  'rounded-3xl border border-slate-200/90 bg-white p-5 ';

const billingPanelMutedClass =
  'rounded-2xl border border-slate-200/80 bg-slate-50 p-4';

const billingPanelEyebrowClass = 'text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]';
const billingPanelTitleClass = 'mt-2 text-[1.15rem] font-semibold text-slate-950';
const billingPanelTextClass = 'mt-1 text-sm leading-6 text-slate-900';
const billingDetailLabelClass = 'text-xs font-semibold uppercase tracking-[0.16em] text-slate-800';
const billingPrimaryValueClass = 'mt-1 text-xl font-bold tracking-[-0.03em] text-slate-900';
const billingDetailValueClass = 'mt-1 text-sm leading-6 text-slate-900';

type SnapshotCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'warning' | 'danger';
};

function SnapshotCard({ icon: Icon, label, value, detail, tone = 'default' }: SnapshotCardProps) {
  return (
    <div className={`rounded-3xl border p-4  ${statToneClass(tone)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-800">
            {label}
          </p>
          <p className="mt-3 text-[2rem] font-bold tracking-[-0.04em] text-slate-900">{value}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
          tone === 'danger'
            ? 'bg-red-100 text-red-700'
            : tone === 'warning'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
        }`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-800">{detail}</p>
    </div>
  );
}

export function PetInvoicesPage() {
  const copy = useAppMessages().screens.petInvoices;
  const messages = useAppMessages().petInvoices;
  const { hasPermission } = usePermissions();
  const [pageData, setPageData] = useState<PageResponse<PetInvoice>>(initialPage);
  const [clients, setClients] = useState<PetClient[]>([]);
  const [lookupIssues, setLookupIssues] = useState<PetLookupIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [clientFilterId, setClientFilterId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [status, setStatus] = useState('ISSUED');
  const [issuedAt, setIssuedAt] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [paymentInvoice, setPaymentInvoice] = useState<PetInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [paymentReceivedAt, setPaymentReceivedAt] = useState(nowLocalDateTime());
  const [paymentReferenceCode, setPaymentReferenceCode] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const [reviewInvoiceId, setReviewInvoiceId] = useState<string | null>(null);
  const [financeInvoice, setFinanceInvoice] = useState<FinanceInvoice | null>(null);
  const [cashMovements, setCashMovements] = useState<FinanceCashMovement[]>([]);
  const [paymentEvents, setPaymentEvents] = useState<FinancePaymentEvent[]>([]);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeError, setFinanceError] = useState<string | null>(null);

  const [deleteCandidate, setDeleteCandidate] = useState<PetInvoice | null>(null);
  const [previewPlans, setPreviewPlans] = useState<ClientPlan[]>([]);
  const [previewAppointments, setPreviewAppointments] = useState<PetAppointment[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const canReadClients = hasPermission('pet.client.read');
  const canReadFinanceInvoices = hasPermission('finance.invoice.read');
  const canReadFinanceCash = hasPermission('finance.cash.read');
  const canReadPlans = hasPermission('pet.plan.read');
  const canReadAppointments = hasPermission('pet.appointment.read');

  const clientOptions = useMemo(() => ([
    { value: '', label: copy.allClients },
    ...clients.map((client) => ({ value: client.id, label: client.name ?? client.fullName ?? client.id }))
  ]), [clients, copy]);

  const formClientOptions = useMemo(() => ([
    { value: '', label: copy.selectClient },
    ...clients.map((client) => ({ value: client.id, label: client.name ?? client.fullName ?? client.id }))
  ]), [clients, copy]);

  const loadClients = useCallback(async () => {
    if (!canReadClients) {
      setClients([]);
      setLookupIssues([{
        key: 'clients',
        label: copy.clients,
        message: resolvePetLookupIssue(null, 'pet.client.read')
      }]);
      return;
    }

    try {
      const result = await petService.listClients(0, 200, '');
      setClients(resolvePageItems(result));
      setLookupIssues([]);
    } catch (err) {
      setClients([]);
      setLookupIssues([{
        key: 'clients',
        label: copy.clients,
        message: resolvePetLookupIssue(err)
      }]);
    }
  }, [canReadClients, copy]);

  const load = useCallback(async (
    page: number,
    currentSearch: string,
    currentClientId: string,
    currentStatus: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listInvoices(page, pageSize, currentSearch, {
        clientId: currentClientId || undefined,
        status: currentStatus || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.loadError));
    } finally {
      setLoading(false);
    }
  }, [copy]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  useEffect(() => {
    void load(0, search, clientFilterId, statusFilter);
  }, [clientFilterId, load, search, statusFilter]);

  useEffect(() => {
    if (!canReadPlans && !canReadAppointments) {
      setPreviewPlans([]);
      setPreviewAppointments([]);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }

    let active = true;
    const { start, end } = getNextCycleDateRange();

    setPreviewLoading(true);
    setPreviewError(null);

    const plansRequest = canReadPlans
      ? petService.listClientPlans(undefined, 0, 200)
      : Promise.resolve<PageResponse<ClientPlan>>({ items: [], totalItems: 0, totalPages: 0, page: 0, size: 200 });
    const appointmentsRequest = canReadAppointments
      ? petService.listAppointments(0, 200, '', {
        scheduledFrom: start.toISOString(),
        scheduledTo: end.toISOString()
      })
      : Promise.resolve<PageResponse<PetAppointment>>({ items: [], totalItems: 0, totalPages: 0, page: 0, size: 200 });

    Promise.allSettled([plansRequest, appointmentsRequest])
      .then(([plansResult, appointmentsResult]) => {
        if (!active) {
          return;
        }

        const nextErrors: string[] = [];

        if (plansResult.status === 'fulfilled') {
          setPreviewPlans(resolvePageItems(plansResult.value));
        } else {
          setPreviewPlans([]);
          nextErrors.push(resolveApiErrorMessage(plansResult.reason, copy.nextCyclePlansError));
        }

        if (appointmentsResult.status === 'fulfilled') {
          setPreviewAppointments(resolvePageItems(appointmentsResult.value));
        } else {
          setPreviewAppointments([]);
          nextErrors.push(resolveApiErrorMessage(appointmentsResult.reason, copy.nextCycleAppointmentsError));
        }

        setPreviewError(nextErrors.length > 0 ? nextErrors.join(' ') : null);
      })
      .finally(() => {
        if (active) {
          setPreviewLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [canReadAppointments, canReadPlans, copy]);

  const rows = resolvePageItems(pageData);
  const reviewedInvoice = useMemo(
    () => rows.find((item) => item.id === reviewInvoiceId) ?? (paymentInvoice?.id === reviewInvoiceId ? paymentInvoice : null),
    [paymentInvoice, reviewInvoiceId, rows]
  );

  useEffect(() => {
    if (!reviewedInvoice?.financeInvoiceId) {
      setFinanceInvoice(null);
      setCashMovements([]);
      setPaymentEvents([]);
      setFinanceError(null);
      setFinanceLoading(false);
      return;
    }

    if (!canReadFinanceInvoices && !canReadFinanceCash) {
      setFinanceInvoice(null);
      setCashMovements([]);
      setPaymentEvents([]);
      setFinanceError(null);
      setFinanceLoading(false);
      return;
    }

    let active = true;
    setFinanceLoading(true);
    setFinanceError(null);

    const invoiceRequest = canReadFinanceInvoices
      ? financeService.getInvoice(reviewedInvoice.financeInvoiceId)
      : Promise.resolve(null);
    const cashRequest = canReadFinanceCash
      ? financeService.listCashMovements(0, financePreviewSize, { invoiceId: reviewedInvoice.financeInvoiceId })
      : Promise.resolve<PageResponse<FinanceCashMovement>>({
        items: [],
        totalItems: 0,
        totalPages: 0,
        page: 0,
        size: financePreviewSize
      });

    const eventsRequest = canReadFinanceInvoices
      ? financeService.listInvoiceEvents(reviewedInvoice.financeInvoiceId)
      : Promise.resolve<FinancePaymentEvent[]>([]);

    Promise.allSettled([invoiceRequest, cashRequest, eventsRequest])
      .then(([invoiceResult, cashResult, eventsResult]) => {
        if (!active) {
          return;
        }

        const nextErrors: string[] = [];

        if (invoiceResult.status === 'fulfilled') {
          setFinanceInvoice(invoiceResult.value);
        } else {
          setFinanceInvoice(null);
          nextErrors.push(
            resolveApiErrorMessage(invoiceResult.reason, copy.financeInvoiceError)
          );
        }

        if (cashResult.status === 'fulfilled') {
          setCashMovements(resolvePageItems(cashResult.value));
        } else {
          setCashMovements([]);
          nextErrors.push(
            resolveApiErrorMessage(cashResult.reason, copy.cashMovementsError)
          );
        }

        if (eventsResult.status === 'fulfilled') {
          setPaymentEvents(eventsResult.value);
        } else {
          setPaymentEvents([]);
          nextErrors.push(
            resolveApiErrorMessage(eventsResult.reason, copy.billingHistoryError)
          );
        }

        setFinanceError(nextErrors.length > 0 ? nextErrors.join(' ') : null);
      })
      .finally(() => {
        if (active) {
          setFinanceLoading(false);
        }
      });

    return () => {
      active = false;
    };
    // paidAmount/status refresh the panel after a payment is recorded on the reviewed invoice.
  }, [
    canReadFinanceCash,
    canReadFinanceInvoices,
    reviewedInvoice?.financeInvoiceId,
    reviewedInvoice?.paidAmount,
    reviewedInvoice?.status, copy
  ]);

  const totalItems = resolveTotalItems(pageData);
  const clientsLookupUnavailable = lookupIssues.some((issue) => issue.key === 'clients');
  const activeFilterCount = [search, clientFilterId, statusFilter].filter(Boolean).length;
  const visibleOpenBalance = rows.reduce((total, invoice) => total + invoice.outstandingAmount, 0);
  const visibleTotalInvoiced = rows.reduce((total, invoice) => total + invoice.totalAmount, 0);
  const paymentCount = rows.reduce((total, invoice) => total + invoice.payments.length, 0);
  const overdueCount = rows.filter((invoice) => isOverdueInvoice(invoice)).length;
  const nextCycleLabel = formatCycleLabel(getNextCycleDateRange().start);
  const nextCyclePreviewRows = useMemo<NextCyclePreviewRow[]>(() => {
    const appointmentsByClient = new Map<string, PetAppointment[]>();

    previewAppointments
      .filter((appointment) => appointment.status.toUpperCase() !== 'CANCELED')
      .forEach((appointment) => {
        const current = appointmentsByClient.get(appointment.clientId) ?? [];
        current.push(appointment);
        appointmentsByClient.set(appointment.clientId, current);
      });

    const clientIds = new Set<string>();
    previewPlans.forEach((plan) => {
      if (plan.remainingSessions > 0) {
        clientIds.add(plan.clientId);
      }
    });
    previewAppointments.forEach((appointment) => clientIds.add(appointment.clientId));

    return Array.from(clientIds).map((clientIdValue) => {
      const client = clients.find((entry) => entry.id === clientIdValue);
      const activePlan = previewPlans.find((plan) => plan.clientId === clientIdValue && plan.remainingSessions > 0) ?? null;
      const appointments = appointmentsByClient.get(clientIdValue) ?? [];
      const projectedDue = appointments.reduce((total, appointment) => total + resolveProjectedDue(appointment), 0);
      const extrasTotal = appointments.reduce((total, appointment) => total + (appointment.extrasAmount ?? 0), 0);
      const petTaxiTotal = appointments.reduce((total, appointment) => (
        /taxi/i.test(appointment.extrasDescription ?? '')
          ? total + (appointment.extrasAmount ?? 0)
          : total
      ), 0);
      const coveredAppointments = appointments.filter((appointment) => appointment.planCovered || appointment.clientPlanId).length;
      const billingType: NextCyclePreviewRow['billingType'] = activePlan ? 'Recurring' : 'One-time';

      let note = activePlan
        ? copy.noteBasePlanActive
        : copy.noteOneOffOnly;

      if (activePlan && activePlan.remainingSessions <= 2) {
        note = client?.email
          ? copy.noteRenewalReady
          : copy.noteRenewalNeedsEmail;
      } else if (petTaxiTotal > 0) {
        note = copy.notePetTaxi;
      }

      return {
        clientId: clientIdValue,
        clientName: client?.name ?? client?.fullName ?? clientIdValue,
        billingType,
        planName: activePlan?.planName ?? null,
        remainingSessions: activePlan?.remainingSessions ?? null,
        appointmentCount: appointments.length,
        coveredAppointments,
        projectedDue,
        extrasTotal,
        petTaxiTotal,
        note,
        reference: buildCollectionReference(clientIdValue, getNextCycleDateRange().start)
      };
    }).sort((left, right) => right.projectedDue - left.projectedDue);
  }, [clients, previewAppointments, previewPlans, copy]);
  const nextCycleProjectedTotal = nextCyclePreviewRows.reduce((total, row) => total + row.projectedDue, 0);
  const nextCycleRecurringClients = nextCyclePreviewRows.filter((row) => row.billingType === 'Recurring').length;
  const nextCyclePetTaxiClients = nextCyclePreviewRows.filter((row) => row.petTaxiTotal > 0).length;
  const nextCyclePenultimateClients = nextCyclePreviewRows.filter((row) => (row.remainingSessions ?? 99) === 2).length;

  function scrollToInvoiceForm() {
    document.getElementById('pet-invoice-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function scrollToFinanceReview() {
    document.getElementById('pet-invoice-finance-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetForm() {
    setEditingId(null);
    setClientId('');
    setTotalAmount('');
    setStatus('ISSUED');
    setIssuedAt('');
    setDueAt('');
    setDescription('');
  }

  function resetPaymentForm() {
    setPaymentInvoice(null);
    setPaymentAmount('');
    setPaymentMethod('PIX');
    setPaymentReceivedAt(nowLocalDateTime());
    setPaymentReferenceCode('');
    setPaymentNotes('');
  }

  function beginCreateInvoice() {
    resetForm();
    scrollToInvoiceForm();
  }

  function beginEdit(item: PetInvoice) {
    if (item.status === 'PAID') {
      setError(copy.paidInvoiceLocked);
      return;
    }

    setEditingId(item.id);
    setClientId(item.clientId);
    setTotalAmount(String(item.totalAmount));
    setStatus(item.status === 'PAID' ? 'ISSUED' : item.status);
    setIssuedAt(toDateTimeLocal(item.issuedAt));
    setDueAt(toDateTimeLocal(item.dueAt));
    setDescription(item.description ?? '');
    setReviewInvoiceId(item.id);
    setError(null);
    setSuccess(null);
    scrollToInvoiceForm();
  }

  function beginPayment(item: PetInvoice) {
    setReviewInvoiceId(item.id);
    setPaymentInvoice(item);
    setPaymentAmount(String(item.outstandingAmount > 0 ? item.outstandingAmount : item.totalAmount));
    setPaymentMethod('PIX');
    setPaymentReceivedAt(nowLocalDateTime());
    setPaymentReferenceCode('');
    setPaymentNotes('');
    setError(null);
    setSuccess(null);
    scrollToFinanceReview();
  }

  function reviewInvoice(item: PetInvoice) {
    setReviewInvoiceId(item.id);
    if (paymentInvoice?.id !== item.id) {
      setPaymentInvoice(null);
    }
    scrollToFinanceReview();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedTotal = Number(totalAmount);
    const isoIssuedAt = toIsoDate(issuedAt);
    const isoDueAt = toIsoDate(dueAt);

    if (!clientId || Number.isNaN(parsedTotal) || parsedTotal < 0) {
      setError(copy.clientAndTotalRequired);
      return;
    }

    if (status !== 'DRAFT' && !isoIssuedAt) {
      setError(copy.issueDateRequired);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        await petService.updateInvoice(editingId, {
          clientId,
          totalAmount: parsedTotal,
          status,
          issuedAt: isoIssuedAt,
          dueAt: isoDueAt,
          description: description || undefined
        });
        setSuccess(copy.updated);
      } else {
        await petService.createInvoice({
          clientId,
          totalAmount: parsedTotal,
          status,
          issuedAt: isoIssuedAt,
          dueAt: isoDueAt,
          description: description || undefined
        });
        setSuccess(copy.created);
      }

      resetForm();
      await load(pageData.page, search, clientFilterId, statusFilter);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.saveError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!paymentInvoice) {
      return;
    }

    const parsedAmount = Number(paymentAmount);
    const isoReceivedAt = toIsoDate(paymentReceivedAt);

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0 || !isoReceivedAt) {
      setError(copy.paymentInvalid);
      return;
    }

    const input: CreatePetInvoicePaymentInput = {
      amount: parsedAmount,
      method: paymentMethod,
      receivedAt: isoReceivedAt,
      referenceCode: paymentReferenceCode || undefined,
      notes: paymentNotes || undefined
    };

    setPaymentSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await petService.createInvoicePayment(paymentInvoice.id, input);
      setSuccess(copy.paymentRecorded);
      resetPaymentForm();
      await load(pageData.page, search, clientFilterId, statusFilter);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.paymentError));
    } finally {
      setPaymentSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await petService.deleteInvoice(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess(copy.deleted);
      if (reviewInvoiceId === deleteCandidate.id) {
        setReviewInvoiceId(null);
        resetPaymentForm();
      }
      await load(pageData.page, search, clientFilterId, statusFilter);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.deleteError));
    }
  }

  const columns: DataTableColumn<PetInvoice>[] = [
    {
      key: 'issuedAt',
      header: copy.columnDocument,
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">
            {formatDateTime(copy, item.issuedAt, copy.draftNotIssued)}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {copy.dueOn} {formatDateTime(copy, item.dueAt, copy.noDueDate)}
          </p>
        </div>
      )
    },
    {
      key: 'client',
      header: copy.client,
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">
            {item.clientName ?? resolvePetLookupLabel(
              clients,
              item.clientId,
              (client) => client.name ?? client.fullName,
              'Cliente',
              clientsLookupUnavailable
            )}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {clients.find((client) => client.id === item.clientId)?.email ?? item.clientId}
          </p>
        </div>
      )
    },
    {
      key: 'context',
      header: copy.businessContext,
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">
            {item.businessContextLabel ?? item.description ?? copy.manualInvoice}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {item.businessContextType ? formatBusinessContextLabel(copy, item.businessContextType) : copy.manualFlow}
            {item.financeInvoiceId ? copy.linkedFinancialRecord : ''}
          </p>
        </div>
      )
    },
    {
      key: 'finance',
      header: copy.columnFinancialPosition,
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">
            {formatCurrency(item.totalAmount)}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {copy.paidLabel} {formatCurrency(item.paidAmount)} {copy.openSeparator} {formatCurrency(item.outstandingAmount)}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {item.outstandingAmount > 0 ? copy.stillOpen : copy.settled}
          </p>
        </div>
      )
    },
    {
      key: 'lifecycle',
      header: copy.cycle,
      render: (item) => (
        <div className="space-y-2">
          <StatusBadge status={item.status} />
          <p className={sharedCompactTextClass}>
            {item.paidAt
              ? copy.paidOnDate.replace('{date}', formatDateTime(copy, item.paidAt))
              : item.canceledAt
                ? copy.canceledOnDate.replace('{date}', formatDateTime(copy, item.canceledAt))
                : copy.paymentRecordsCount.replace('{count}', String(item.payments.length))}
          </p>
          {isOverdueInvoice(item) ? (
            <p className="text-xs text-red-700">{copy.overdue}</p>
          ) : null}
        </div>
      )
    },
    {
      key: 'actions',
      header: copy.actions,
          render: (item) => (
        <div className={sharedInlineActionsClass}>
          <button
            type="button"
            onClick={() => reviewInvoice(item)}
            className="ui-inline-button"
          >
            {copy.viewFinancialRecord}
          </button>
          <PermissionGuard permission="pet.invoice.update">
            {item.status !== 'PAID' ? (
              <button
                type="button"
                onClick={() => beginEdit(item)}
                className="ui-inline-button"
              >
                {copy.edit}
              </button>
            ) : null}
          </PermissionGuard>
          <PermissionGuard permission="pet.invoice.update">
            {item.status !== 'PAID' && item.status !== 'CANCELED' && item.outstandingAmount > 0 ? (
              <button
                type="button"
                onClick={() => beginPayment(item)}
                className="ui-inline-button"
              >
                {copy.recordPayment}
              </button>
            ) : null}
          </PermissionGuard>
          <PermissionGuard permission="pet.invoice.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(item)}
              className="ui-inline-danger-button"
            >
              {copy.delete}
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.invoice.read"
      fallback={<div className="ui-notice-warning">{messages.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PetModuleSubnav />

        <PageTitle
          eyebrow={copy.eyebrow}
          title={messages.title}
          description={messages.description}
          actions={(
            <div className="flex flex-wrap gap-2">
              <PermissionGuard permission="pet.invoice.create">
                <button type="button" onClick={beginCreateInvoice} className="ui-primary-button">
                  {copy.issueInvoice}
                </button>
              </PermissionGuard>
              <PermissionGuard permission="pet.dashboard.read">
                <Link href="/pet/insights" className="ui-secondary-button">
                  {copy.openInsights}
                </Link>
              </PermissionGuard>
            </div>
          )}
        />

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SnapshotCard
            icon={Receipt}
            label={copy.metricInvoices}
            value={new Intl.NumberFormat('pt-BR').format(totalItems)}
            detail={activeFilterCount > 0
              ? copy.metricInvoicesFiltered
              : copy.metricInvoicesAll}
          />
          <SnapshotCard
            icon={ArrowUpRight}
            label={copy.metricBilled}
            value={formatCurrency(visibleTotalInvoiced)}
            detail={copy.metricBilledDetail}
          />
          <SnapshotCard
            icon={WalletCards}
            label={copy.metricOpenBalance}
            value={formatCurrency(visibleOpenBalance)}
            detail={copy.metricOpenBalanceDetail}
            tone={visibleOpenBalance > 0 ? 'warning' : 'default'}
          />
          <SnapshotCard
            icon={AlertTriangle}
            label={copy.metricAttention}
            value={String(overdueCount)}
            detail={copy.paymentRecordsVisible.replace('{count}', String(paymentCount))}
            tone={overdueCount > 0 ? 'danger' : 'default'}
          />
        </div>

        <PageSection
          tone="muted"
          title={messages.filtersTitle}
          description={messages.filtersDescription}
        >
          <div className={sharedFilterToolbarClass}>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)_minmax(0,0.7fr)] xl:items-end">
              <SearchBar
                label={copy.search}
                value={searchInput}
                onChange={setSearchInput}
                placeholder={copy.searchPlaceholder}
              />
              <FormSelect
                label={copy.client}
                value={clientFilterId}
                options={clientOptions}
                onChange={setClientFilterId}
                disabled={clientsLookupUnavailable}
              />
              <FormSelect
                label={copy.cycle}
                value={statusFilter}
                options={buildStatusOptions(copy)}
                onChange={setStatusFilter}
              />
            </div>

            <div className={sharedFormActionsClass}>
              <button
                type="button"
                onClick={() => setSearch(searchInput)}
                className="ui-primary-button"
              >
                {copy.applyFilters}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setClientFilterId('');
                  setStatusFilter('');
                }}
                className="ui-inline-button"
              >
                {copy.clearFilters}
              </button>
            </div>
          </div>
        </PageSection>

        <PageSection
          tone="muted"
          title={messages.nextCycleTitle}
          description={copy.nextCyclePreviewDescription.replace('{cycle}', nextCycleLabel)}
        >
          {previewError ? <div className="ui-notice-warning">{previewError}</div> : null}
          {previewLoading ? (
            <div className="ui-notice-neutral">{copy.nextCycleLoading}</div>
          ) : nextCyclePreviewRows.length === 0 ? (
            <div className="ui-notice-neutral">
              {copy.nextCycleEmpty}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SnapshotCard
                  icon={WalletCards}
                  label={copy.nextCycleProjection}
                  value={formatCurrency(nextCycleProjectedTotal)}
                  detail={copy.nextCycleProjectionDetail}
                />
                <SnapshotCard
                  icon={Receipt}
                  label={copy.recurringClients}
                  value={String(nextCycleRecurringClients)}
                  detail={copy.recurringClientsDetail}
                />
                <SnapshotCard
                  icon={Clock3}
                  label={copy.penultimateAlerts}
                  value={String(nextCyclePenultimateClients)}
                  detail={copy.penultimateAlertsDetail}
                  tone={nextCyclePenultimateClients > 0 ? 'warning' : 'default'}
                />
                <SnapshotCard
                  icon={ArrowUpRight}
                  label={copy.petTaxiClients}
                  value={String(nextCyclePetTaxiClients)}
                  detail={copy.petTaxiClientsDetail}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {nextCyclePreviewRows.slice(0, 6).map((row) => (
                  <div key={row.reference} className={billingPanelClass}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className={billingPanelEyebrowClass}>{copy.billingDetail}</p>
                        <p className={billingPanelTitleClass}>{row.clientName}</p>
                        <p className={billingPanelTextClass}>{row.reference}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        row.billingType === 'Recurring'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {row.billingType === 'Recurring' ? copy.recurring : copy.oneOff}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <dt className={billingDetailLabelClass}>{copy.projectedAmount}</dt>
                        <dd className={billingPrimaryValueClass}>{formatCurrency(row.projectedDue)}</dd>
                      </div>
                      <div>
                        <dt className={billingDetailLabelClass}>{copy.appointments}</dt>
                        <dd className={billingDetailValueClass}>
                          {row.appointmentCount} {copy.scheduledOf} {row.coveredAppointments} {copy.coveredByPlan}
                        </dd>
                      </div>
                      <div>
                        <dt className={billingDetailLabelClass}>{copy.planStatus}</dt>
                        <dd className={billingDetailValueClass}>
                          {row.planName
                            ? copy.planRemainingSessions
                              .replace('{plan}', row.planName)
                              .replace('{count}', String(row.remainingSessions ?? 0))
                            : copy.oneOffOnly}
                        </dd>
                      </div>
                      <div>
                        <dt className={billingDetailLabelClass}>{copy.extras}</dt>
                        <dd className={billingDetailValueClass}>
                          {formatCurrency(row.extrasTotal)}{row.petTaxiTotal > 0 ? copy.petTaxiAmount.replace('{amount}', formatCurrency(row.petTaxiTotal)) : ''}
                        </dd>
                      </div>
                    </dl>

                    <p className={billingPanelTextClass}>{row.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </PageSection>

        <PetLookupFeedback issues={lookupIssues} />

        <div id="pet-invoice-form-section">
          <PageSection
            title={editingId ? copy.updateInvoice : copy.issueInvoice}
            description={copy.formDescription}
          >
            <PermissionGuard permission={editingId ? 'pet.invoice.update' : 'pet.invoice.create'}>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2">
                  <FormSelect
                    label={copy.client}
                    value={clientId}
                    options={formClientOptions}
                    onChange={setClientId}
                    disabled={clientsLookupUnavailable}
                  />
                  <FormInput
                    label={copy.totalAmount}
                    value={totalAmount}
                    onChange={setTotalAmount}
                    type="number"
                    required
                  />
                  <FormSelect
                    label={copy.cycle}
                    value={status}
                    options={buildFormStatusOptions(copy)}
                    onChange={setStatus}
                  />
                  <DateTimeInput
                    label={copy.issuedOn}
                    value={issuedAt}
                    onChange={setIssuedAt}
                    required={status !== 'DRAFT'}
                  />
                  <DateTimeInput
                    label={copy.dueOn}
                    value={dueAt}
                    onChange={setDueAt}
                  />
                  <FormInput
                    label={copy.operationalDescription}
                    value={description}
                    onChange={setDescription}
                    placeholder={copy.descriptionPlaceholder}
                  />
                </div>

                <div className={sharedReminderSurfaceClass}>
                  <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">{copy.cycleReminder}</p>
                  <p className={`mt-1 ${sharedCompactTextClass}`}>
                    {copy.cycleReminderDescription}
                  </p>
                </div>

                {clientsLookupUnavailable ? (
                  <div className="ui-notice-warning">
                    {copy.clientAccessRequired}
                  </div>
                ) : null}

                <div className={sharedFormActionsClass}>
                  <button
                    type="submit"
                    disabled={submitting || clientsLookupUnavailable}
                    className="ui-primary-button"
                  >
                    {submitting ? copy.savingInvoice : editingId ? copy.updateInvoice : copy.issueInvoice}
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="ui-secondary-button"
                    >
                      {copy.cancelEdit}
                    </button>
                  ) : null}
                </div>
              </form>
            </PermissionGuard>
          </PageSection>
        </div>

        <PageSection
          title={messages.pipelineTitle}
          description={messages.pipelineDescription}
        >
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            loading={loading}
            loadingTitle={copy.loadingTitle}
            loadingDescription={copy.loadingDescription}
            emptyState={{
              title: copy.emptyTitle,
              description: copy.emptyDescription,
              action: hasPermission('pet.invoice.create') ? (
                <button type="button" onClick={beginCreateInvoice} className="ui-primary-button">
                  {copy.issueFirst}
                </button>
              ) : undefined
            }}
          />
          <div className="pt-5">
            <Pagination
              page={pageData.page}
              totalPages={pageData.totalPages}
              totalElements={totalItems}
              onPageChange={(page) => void load(page, search, clientFilterId, statusFilter)}
            />
          </div>
        </PageSection>

        {reviewedInvoice ? (
          <div id="pet-invoice-finance-section">
            <PageSection
              title={copy.financialViewTitle}
              description={copy.financialViewDescription}
              actions={(
                <button
                  type="button"
                  onClick={() => {
                    setReviewInvoiceId(null);
                    resetPaymentForm();
                  }}
                  className="ui-secondary-button"
                >
                  {copy.closeFinancialView}
                </button>
              )}
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className={billingPanelClass}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className={billingPanelEyebrowClass}>{copy.summary}</p>
                      <p className={billingPanelTitleClass}>{reviewedInvoice.clientName ?? reviewedInvoice.clientId}</p>
                      <p className={billingPanelTextClass}>
                        {reviewedInvoice.businessContextLabel ?? reviewedInvoice.description ?? copy.manualInvoiceNoLabel}
                      </p>
                    </div>
                    <StatusBadge status={reviewedInvoice.status} />
                  </div>

                  <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className={billingDetailLabelClass}>{copy.totalAmount}</dt>
                      <dd className={billingPrimaryValueClass}>{formatCurrency(reviewedInvoice.totalAmount)}</dd>
                    </div>
                    <div>
                      <dt className={billingDetailLabelClass}>{copy.openAmount}</dt>
                      <dd className={billingPrimaryValueClass}>{formatCurrency(reviewedInvoice.outstandingAmount)}</dd>
                    </div>
                    <div>
                      <dt className={billingDetailLabelClass}>{copy.paidAmount}</dt>
                      <dd className={billingDetailValueClass}>{formatCurrency(reviewedInvoice.paidAmount)}</dd>
                    </div>
                    <div>
                      <dt className={billingDetailLabelClass}>{copy.linkedFinancialInvoice}</dt>
                      <dd className={billingDetailValueClass}>{reviewedInvoice.financeInvoiceId}</dd>
                    </div>
                    <div>
                      <dt className={billingDetailLabelClass}>{copy.billingReference}</dt>
                      <dd className={billingDetailValueClass}>
                        {buildCollectionReference(reviewedInvoice.clientId, reviewedInvoice.dueAt ? new Date(reviewedInvoice.dueAt) : new Date())}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className={billingPanelClass}>
                  <p className={billingPanelEyebrowClass}>{copy.status}</p>
                  <p className={billingPanelTitleClass}>{copy.cycleMilestones}</p>
                  <p className={billingPanelTextClass}>{copy.cycleMilestonesDescription}</p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className={billingDetailLabelClass}>{copy.issuedOn}</p>
                      <p className={billingDetailValueClass}>
                        {formatDateTime(copy, reviewedInvoice.issuedAt, copy.stillDraft)}
                      </p>
                    </div>
                    <div>
                      <p className={billingDetailLabelClass}>{copy.dueOn}</p>
                      <p className={billingDetailValueClass}>
                        {formatDateTime(copy, reviewedInvoice.dueAt, copy.noDueDateSet)}
                      </p>
                    </div>
                    <div>
                      <p className={billingDetailLabelClass}>{copy.paidOn}</p>
                      <p className={billingDetailValueClass}>
                        {formatDateTime(copy, reviewedInvoice.paidAt, copy.awaitingSettlement)}
                      </p>
                    </div>
                    <div>
                      <p className={billingDetailLabelClass}>{copy.canceledOn}</p>
                      <p className={billingDetailValueClass}>
                        {formatDateTime(copy, reviewedInvoice.canceledAt, copy.invoiceStillActive)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {financeLoading ? (
                <div className="ui-notice-neutral">{copy.financialContextLoading}</div>
              ) : null}

              {financeError ? (
                <div className="ui-notice-warning">{financeError}</div>
              ) : null}

              {financeInvoice ? (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className={billingPanelClass}>
                    <p className={billingPanelEyebrowClass}>{copy.financialRecord}</p>
                    <p className={billingPanelTitleClass}>{copy.linkedFinancialDocument}</p>
                    <p className={billingPanelTextClass}>
                      {copy.source} {formatCategoryLabel(copy, financeInvoice.sourceModule)} {copy.currencySeparator} {financeInvoice.currency}
                    </p>

                    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <dt className={billingDetailLabelClass}>{copy.counterparty}</dt>
                        <dd className={billingDetailValueClass}>
                          {financeInvoice.counterpartyName ?? copy.counterpartyMissing}
                        </dd>
                      </div>
                      <div>
                        <dt className={billingDetailLabelClass}>{copy.documentNumber}</dt>
                        <dd className={billingDetailValueClass}>
                          {financeInvoice.documentNumber ?? copy.notAssigned}
                        </dd>
                      </div>
                      <div>
                        <dt className={billingDetailLabelClass}>{copy.financialStatus}</dt>
                        <dd className={billingDetailValueClass}>
                          {formatStatusLabel(copy, financeInvoice.status)}
                        </dd>
                      </div>
                      <div>
                        <dt className={billingDetailLabelClass}>{copy.openValue}</dt>
                        <dd className={billingDetailValueClass}>
                          {formatCurrency(financeInvoice.outstandingAmount, financeInvoice.currency)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className={billingPanelClass}>
                    <p className={billingPanelEyebrowClass}>{copy.sourceOfTruth}</p>
                    <p className={billingPanelTitleClass}>{copy.financialBase}</p>
                    <p className={billingPanelTextClass}>
                      {copy.sourceOfTruthDescription}
                    </p>

                    <div className="mt-4 space-y-3">
                      <div>
                        <p className={billingDetailLabelClass}>{copy.businessContext}</p>
                        <p className={billingDetailValueClass}>
                          {financeInvoice.businessContextLabel ?? financeInvoice.description ?? copy.noBusinessContext}
                        </p>
                      </div>
                      <div>
                        <p className={billingDetailLabelClass}>{copy.recipient}</p>
                        <p className={billingDetailValueClass}>
                          {financeInvoice.recipientLegalName ?? financeInvoice.recipientEmail ?? copy.recipientMissing}
                        </p>
                      </div>
                      <div>
                        <p className={billingDetailLabelClass}>{copy.fiscalReference}</p>
                        <p className={billingDetailValueClass}>
                          {financeInvoice.fiscalReference
                            ?? (financeInvoice.fiscalStatus ? formatStatusLabel(copy, financeInvoice.fiscalStatus) : copy.noFiscalReference)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                {paymentInvoice?.id === reviewedInvoice.id ? (
                  <form onSubmit={handlePaymentSubmit} className={billingPanelClass}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className={billingPanelEyebrowClass}>{copy.action}</p>
                        <p className={billingPanelTitleClass}>{copy.recordPayment}</p>
                        <p className={billingPanelTextClass}>
                          {copy.paymentFormHint}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={resetPaymentForm}
                        className="ui-secondary-button"
                      >
                        {copy.closeForm}
                      </button>
                    </div>

                    <div className="mt-5 grid gap-4">
                      <FormInput
                        label={copy.receivedAmount}
                        value={paymentAmount}
                        onChange={setPaymentAmount}
                        type="number"
                        required
                      />
                      <FormSelect
                        label={copy.method}
                        value={paymentMethod}
                        options={buildPaymentMethodOptions(copy)}
                        onChange={setPaymentMethod}
                      />
                      <DateTimeInput
                        label={copy.receivedOn}
                        value={paymentReceivedAt}
                        onChange={setPaymentReceivedAt}
                        required
                      />
                      <FormInput
                        label={copy.referenceCode}
                        value={paymentReferenceCode}
                        onChange={setPaymentReferenceCode}
                        placeholder={copy.referenceCodePlaceholder}
                      />
                      <FormInput
                        label={copy.operatorNotes}
                        value={paymentNotes}
                        onChange={setPaymentNotes}
                        placeholder={copy.operatorNotesPlaceholder}
                      />
                    </div>

                    <p className={`mt-4 ${sharedFieldHintClass}`}>
                      {copy.openBeforePayment} {formatCurrency(reviewedInvoice.outstandingAmount)}
                    </p>

                    <div className={sharedFormActionsClass}>
                      <button
                        type="submit"
                        disabled={paymentSubmitting}
                        className="ui-primary-button"
                      >
                        {paymentSubmitting ? copy.recordingPayment : copy.confirmPayment}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className={billingPanelClass}>
                    <p className={billingPanelEyebrowClass}>{copy.action}</p>
                    <p className={billingPanelTitleClass}>{copy.nextBillingAction}</p>
                    <p className={billingPanelTextClass}>
                      {copy.nextBillingActionDescription}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <PermissionGuard permission="pet.invoice.update">
                        {reviewedInvoice.status !== 'PAID' && reviewedInvoice.status !== 'CANCELED' && reviewedInvoice.outstandingAmount > 0 ? (
                          <button
                            type="button"
                            onClick={() => beginPayment(reviewedInvoice)}
                            className="ui-primary-button"
                          >
                            {copy.recordPayment}
                          </button>
                        ) : null}
                      </PermissionGuard>
                      <PermissionGuard permission="pet.invoice.update">
                        <button
                          type="button"
                          onClick={() => beginEdit(reviewedInvoice)}
                          className="ui-secondary-button"
                        >
                          {copy.reviewInvoice}
                        </button>
                      </PermissionGuard>
                    </div>
                  </div>
                )}

                <div className={billingPanelClass}>
                  <p className={billingPanelEyebrowClass}>{copy.payments}</p>
                  <p className={billingPanelTitleClass}>{copy.paymentHistory}</p>
                  <p className={billingPanelTextClass}>
                    {copy.paymentHistoryDescription}
                  </p>

                  <div className="mt-4 space-y-3">
                    {reviewedInvoice.payments.length === 0 ? (
                      <div className="ui-notice-warning">
                        {copy.noPayments}
                      </div>
                    ) : (
                      reviewedInvoice.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className={billingPanelMutedClass}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">
                                {formatCurrency(payment.amount)} via {formatMethodLabel(copy, payment.method)}
                              </p>
                              <p className={`mt-1 ${sharedCompactTextClass}`}>
                                {copy.receivedOn} {formatDateTime(copy, payment.receivedAt)}
                              </p>
                            </div>
                            <StatusBadge status={payment.status} />
                          </div>
                          {payment.referenceCode ? (
                            <p className={`mt-3 ${sharedCompactTextClass}`}>
                              {copy.reference} {payment.referenceCode}
                            </p>
                          ) : null}
                          {payment.notes ? (
                            <p className={`mt-1 ${sharedCompactTextClass}`}>{payment.notes}</p>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className={billingPanelClass}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className={billingPanelEyebrowClass}>{copy.cash}</p>
                    <p className={billingPanelTitleClass}>{copy.cashMovements}</p>
                    <p className={billingPanelTextClass}>
                      {copy.cashMovementsDescription}
                    </p>
                  </div>
                  {canReadFinanceCash ? <StatusBadge status="info" /> : <StatusBadge status="restricted" />}
                </div>

                {!canReadFinanceCash ? (
                  <div className="ui-notice-neutral mt-4">
                    {copy.cashPermissionRequired} <strong>finance.cash.read</strong>.
                  </div>
                ) : cashMovements.length === 0 ? (
                  <div className="ui-notice-warning mt-4">
                    {copy.noCashMovements}
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {cashMovements.map((movement) => (
                      <div
                        key={movement.id}
                        className={billingPanelMutedClass}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">
                              {formatDirectionLabel(copy, movement.direction)} • {formatCurrency(movement.amount, movement.currency)}
                            </p>
                            <p className={`mt-1 ${sharedCompactTextClass}`}>
                              {copy.movementOn
                                .replace('{category}', formatCategoryLabel(copy, movement.category))
                                .replace('{date}', formatDateTime(copy, movement.occurredAt))}
                            </p>
                          </div>
                          <StatusBadge status={movement.direction === 'IN' ? 'paid' : 'canceled'} />
                        </div>
                        <p className={`mt-3 ${sharedCompactTextClass}`}>
                          {movement.description ?? copy.noCashDescription}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={billingPanelClass}>
                <div>
                  <p className={billingPanelEyebrowClass}>{copy.traceability}</p>
                  <p className={billingPanelTitleClass}>{copy.billingHistory}</p>
                  <p className={billingPanelTextClass}>
                    {copy.billingHistoryDescription}
                  </p>
                </div>

                {!canReadFinanceInvoices ? (
                  <div className="ui-notice-neutral mt-4">
                    {copy.historyPermissionRequired} <strong>finance.invoice.read</strong>.
                  </div>
                ) : paymentEvents.length === 0 ? (
                  <div className="ui-notice-warning mt-4">
                    {copy.noBillingEvents}
                  </div>
                ) : (
                  <ol className="mt-4 grid gap-3" aria-label={copy.billingHistory}>
                    {paymentEvents.map((event) => (
                      <li key={event.id} className={billingPanelMutedClass}>
                        <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">
                          {formatPaymentEventLabel(copy, event.eventType)}
                        </p>
                        <p className={`mt-1 ${sharedCompactTextClass}`}>
                          {formatDateTime(copy, event.occurredAt)} • {formatPaymentEventSource(copy, event)}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </PageSection>
          </div>
        ) : null}

        <ConfirmDialog
          open={deleteCandidate !== null}
          title={copy.deleteConfirmTitle}
          description={copy.deleteConfirmDescription}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
