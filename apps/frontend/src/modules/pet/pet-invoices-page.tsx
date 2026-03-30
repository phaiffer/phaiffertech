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
import { FinanceCashMovement, FinanceInvoice } from '@/shared/types/finance';
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

const pageSize = 10;
const financePreviewSize = 8;

const statusOptions = [
  { value: '', label: 'Todos os ciclos' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'ISSUED', label: 'Emitida' },
  { value: 'PAID', label: 'Paga' },
  { value: 'CANCELED', label: 'Cancelada' }
];

const formStatusOptions = statusOptions.filter((option) => option.value);

const paymentMethodOptions = [
  { value: 'PIX', label: 'PIX' },
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'CREDIT_CARD', label: 'Cartao de credito' },
  { value: 'DEBIT_CARD', label: 'Cartao de debito' },
  { value: 'BANK_TRANSFER', label: 'Transferencia bancaria' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'MANUAL', label: 'Ajuste manual' },
  { value: 'OTHER', label: 'Outro' }
];

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

function formatDateTime(value?: string | null, fallback = 'Nao registrado') {
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

function formatCycleLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
}

function buildCollectionReference(clientId: string, cycleDate: Date) {
  const month = `${cycleDate.getMonth() + 1}`.padStart(2, '0');
  return `PETFLOW:${clientId}:${cycleDate.getFullYear()}${month}`;
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

function formatMethodLabel(value?: string | null) {
  return paymentMethodOptions.find((option) => option.value === value)?.label ?? value ?? 'Desconhecido';
}

function formatCategoryLabel(value?: string | null) {
  if (!value) {
    return 'Sem categoria';
  }

  const normalized = value.toUpperCase();
  const knownLabels: Record<string, string> = {
    APPOINTMENT: 'Atendimento',
    CLIENT: 'Cliente',
    INVOICE_PAYMENT: 'Pagamento de fatura',
    INVOICE: 'Fatura',
    MANUAL: 'Ajuste manual',
    OTHER: 'Outro',
    PET: 'PetFlow',
    PLAN: 'Plano',
    PRODUCT: 'Produto',
    SERVICE: 'Servico'
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

function formatStatusLabel(value?: string | null) {
  if (!value) {
    return 'Nao informado';
  }

  const normalized = value.toUpperCase();
  const knownLabels: Record<string, string> = {
    ACTIVE: 'Ativa',
    CANCELED: 'Cancelada',
    CANCELLED: 'Cancelada',
    COMPLETED: 'Concluida',
    CONFIRMED: 'Confirmada',
    DRAFT: 'Rascunho',
    INACTIVE: 'Inativa',
    ISSUED: 'Emitida',
    OPEN: 'Em aberto',
    OVERDUE: 'Vencida',
    PAID: 'Paga',
    PENDING: 'Pendente',
    SCHEDULED: 'Agendada'
  };

  return knownLabels[normalized] ?? formatCategoryLabel(value);
}

function formatDirectionLabel(value?: string | null) {
  if (!value) {
    return 'Nao informado';
  }

  if (value.toUpperCase() === 'IN') {
    return 'Entrada';
  }

  if (value.toUpperCase() === 'OUT') {
    return 'Saida';
  }

  return formatCategoryLabel(value);
}

function isOverdueInvoice(invoice: PetInvoice) {
  return invoice.status !== 'PAID'
    && invoice.status !== 'CANCELED'
    && Boolean(invoice.dueAt)
    && new Date(invoice.dueAt as string).getTime() < Date.now();
}

function statToneClass(tone: 'default' | 'warning' | 'danger' = 'default') {
  if (tone === 'warning') {
    return 'border-amber-200/80 bg-[linear-gradient(180deg,rgba(251,191,36,0.12),rgba(255,255,255,0.98))]';
  }

  if (tone === 'danger') {
    return 'border-red-200/80 bg-[linear-gradient(180deg,rgba(248,113,113,0.12),rgba(255,255,255,0.98))]';
  }

  return 'border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.05),rgba(255,255,255,0.99)_140px)]';
}

const billingPanelClass =
  'rounded-3xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.045),rgba(255,255,255,0.99)_140px)] p-5 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.14)]';

const billingPanelMutedClass =
  'rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(16,185,129,0.03),rgba(248,250,252,0.96)_120px)] p-4';

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
    <div className={`rounded-3xl border p-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.16)] ${statToneClass(tone)}`}>
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
    { value: '', label: 'Todos os clientes' },
    ...clients.map((client) => ({ value: client.id, label: client.name ?? client.fullName ?? client.id }))
  ]), [clients]);

  const formClientOptions = useMemo(() => ([
    { value: '', label: 'Selecione um cliente' },
    ...clients.map((client) => ({ value: client.id, label: client.name ?? client.fullName ?? client.id }))
  ]), [clients]);

  const loadClients = useCallback(async () => {
    if (!canReadClients) {
      setClients([]);
      setLookupIssues([{
        key: 'clients',
        label: 'Clientes',
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
        label: 'Clientes',
        message: resolvePetLookupIssue(err)
      }]);
    }
  }, [canReadClients]);

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
      setError(err instanceof ApiClientError ? err.message : 'Nao foi possivel carregar as faturas do PetFlow.');
    } finally {
      setLoading(false);
    }
  }, []);

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
          nextErrors.push(plansResult.reason instanceof Error ? plansResult.reason.message : 'Nao foi possivel carregar os planos mensais para a previsao do proximo ciclo.');
        }

        if (appointmentsResult.status === 'fulfilled') {
          setPreviewAppointments(resolvePageItems(appointmentsResult.value));
        } else {
          setPreviewAppointments([]);
          nextErrors.push(appointmentsResult.reason instanceof Error ? appointmentsResult.reason.message : 'Nao foi possivel carregar os atendimentos do proximo ciclo.');
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
  }, [canReadAppointments, canReadPlans]);

  const rows = resolvePageItems(pageData);
  const reviewedInvoice = useMemo(
    () => rows.find((item) => item.id === reviewInvoiceId) ?? (paymentInvoice?.id === reviewInvoiceId ? paymentInvoice : null),
    [paymentInvoice, reviewInvoiceId, rows]
  );

  useEffect(() => {
    if (!reviewedInvoice?.financeInvoiceId) {
      setFinanceInvoice(null);
      setCashMovements([]);
      setFinanceError(null);
      setFinanceLoading(false);
      return;
    }

    if (!canReadFinanceInvoices && !canReadFinanceCash) {
      setFinanceInvoice(null);
      setCashMovements([]);
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

    Promise.allSettled([invoiceRequest, cashRequest])
      .then(([invoiceResult, cashResult]) => {
        if (!active) {
          return;
        }

        const nextErrors: string[] = [];

        if (invoiceResult.status === 'fulfilled') {
          setFinanceInvoice(invoiceResult.value);
        } else {
          setFinanceInvoice(null);
          nextErrors.push(
            invoiceResult.reason instanceof Error
              ? invoiceResult.reason.message
              : 'Nao foi possivel carregar a fatura financeira vinculada.'
          );
        }

        if (cashResult.status === 'fulfilled') {
          setCashMovements(resolvePageItems(cashResult.value));
        } else {
          setCashMovements([]);
          nextErrors.push(
            cashResult.reason instanceof Error
              ? cashResult.reason.message
              : 'Nao foi possivel carregar os movimentos de caixa da fatura vinculada.'
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
  }, [canReadFinanceCash, canReadFinanceInvoices, reviewedInvoice?.financeInvoiceId]);

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
        ? 'O plano mensal base segue ativo para o proximo ciclo.'
        : 'Este cliente sera cobrado apenas pelos servicos agendados e extras.';

      if (activePlan && activePlan.remainingSessions <= 2) {
        note = client?.email
          ? 'O email de renovacao entra na demo quando o plano chega a visita penultima.'
          : 'O alerta de renovacao esta pronto, mas este cliente ainda precisa de um email cadastrado.';
      } else if (petTaxiTotal > 0) {
        note = 'O pet taxi ja esta refletido como cobranca extra na previsao do proximo ciclo.';
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
  }, [clients, previewAppointments, previewPlans]);
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
      setError('Faturas pagas devem ser ajustadas por um novo documento ou por uma correcao financeira controlada.');
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
      setError('Selecione um cliente e informe um valor total valido.');
      return;
    }

    if (status !== 'DRAFT' && !isoIssuedAt) {
      setError('Faturas emitidas ou canceladas exigem uma data de emissao.');
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
        setSuccess('Fatura atualizada com sucesso.');
      } else {
        await petService.createInvoice({
          clientId,
          totalAmount: parsedTotal,
          status,
          issuedAt: isoIssuedAt,
          dueAt: isoDueAt,
          description: description || undefined
        });
        setSuccess('Fatura criada com sucesso.');
      }

      resetForm();
      await load(pageData.page, search, clientFilterId, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Nao foi possivel salvar a fatura.');
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
      setError('Informe um valor e uma data de recebimento validos para o pagamento.');
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
      setSuccess('Pagamento registrado com sucesso.');
      resetPaymentForm();
      await load(pageData.page, search, clientFilterId, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Nao foi possivel registrar o pagamento.');
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
      setSuccess('Fatura removida com sucesso.');
      if (reviewInvoiceId === deleteCandidate.id) {
        setReviewInvoiceId(null);
        resetPaymentForm();
      }
      await load(pageData.page, search, clientFilterId, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Nao foi possivel remover a fatura selecionada.');
    }
  }

  const columns: DataTableColumn<PetInvoice>[] = [
    {
      key: 'issuedAt',
      header: 'Documento',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">
            {formatDateTime(item.issuedAt, 'Rascunho ainda nao emitido')}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            Vence em {formatDateTime(item.dueAt, 'Sem vencimento definido')}
          </p>
        </div>
      )
    },
    {
      key: 'client',
      header: 'Cliente',
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
      header: 'Contexto do negocio',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">
            {item.businessContextLabel ?? item.description ?? 'Fatura manual'}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {item.businessContextType ? `${formatCategoryLabel(item.businessContextType)} operacional` : 'Fluxo financeiro manual'} • Documento financeiro vinculado {item.financeInvoiceId}
          </p>
        </div>
      )
    },
    {
      key: 'finance',
      header: 'Posicao financeira',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">
            {formatCurrency(item.totalAmount)}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            Pago {formatCurrency(item.paidAmount)} • Em aberto {formatCurrency(item.outstandingAmount)}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {item.outstandingAmount > 0 ? 'A cobranca ainda esta aberta neste ciclo.' : 'Liquidada financeiramente.'}
          </p>
        </div>
      )
    },
    {
      key: 'lifecycle',
      header: 'Ciclo',
      render: (item) => (
        <div className="space-y-2">
          <StatusBadge status={item.status} />
          <p className={sharedCompactTextClass}>
            {item.paidAt
              ? `Pago em ${formatDateTime(item.paidAt)}`
              : item.canceledAt
                ? `Cancelada em ${formatDateTime(item.canceledAt)}`
                : `${item.payments.length} registro(s) de pagamento`}
          </p>
          {isOverdueInvoice(item) ? (
            <p className="text-xs text-red-700">Cobranca vencida para esta fatura.</p>
          ) : null}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Acoes',
          render: (item) => (
        <div className={sharedInlineActionsClass}>
          <button
            type="button"
            onClick={() => reviewInvoice(item)}
            className="ui-inline-button"
          >
            Ver registro financeiro
          </button>
          <PermissionGuard permission="pet.invoice.update">
            {item.status !== 'PAID' ? (
              <button
                type="button"
                onClick={() => beginEdit(item)}
                className="ui-inline-button"
              >
                Editar
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
                Registrar pagamento
              </button>
            ) : null}
          </PermissionGuard>
          <PermissionGuard permission="pet.invoice.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(item)}
              className="ui-inline-danger-button"
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
      permission="pet.invoice.read"
      fallback={<div className="ui-notice-warning">{messages.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PetModuleSubnav />

        <PageTitle
          eyebrow="Financeiro PetFlow"
          title={messages.title}
          description={messages.description}
          actions={(
            <div className="flex flex-wrap gap-2">
              <PermissionGuard permission="pet.invoice.create">
                <button type="button" onClick={beginCreateInvoice} className="ui-primary-button">
                  Emitir fatura
                </button>
              </PermissionGuard>
              <PermissionGuard permission="pet.dashboard.read">
                <Link href="/pet/insights" className="ui-secondary-button">
                  Abrir insights do negocio
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
            label="Faturas no recorte"
            value={new Intl.NumberFormat('pt-BR').format(totalItems)}
            detail={activeFilterCount > 0
              ? 'Os resultados refletem os filtros financeiros atuais.'
              : 'Lista completa de faturas do PetFlow neste ambiente.'}
          />
          <SnapshotCard
            icon={ArrowUpRight}
            label="Valor faturado visivel"
            value={formatCurrency(visibleTotalInvoiced)}
            detail="Montante bruto representado na visualizacao atual."
          />
          <SnapshotCard
            icon={WalletCards}
            label="Saldo em aberto"
            value={formatCurrency(visibleOpenBalance)}
            detail="Valor ainda esperado dentro do recorte visivel de faturas."
            tone={visibleOpenBalance > 0 ? 'warning' : 'default'}
          />
          <SnapshotCard
            icon={AlertTriangle}
            label="Atencao operacional"
            value={String(overdueCount)}
            detail={`${paymentCount} registro(s) de pagamento visiveis neste recorte financeiro.`}
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
                label="Buscar"
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Nome do cliente, contexto ou referencia interna"
              />
              <FormSelect
                label="Cliente"
                value={clientFilterId}
                options={clientOptions}
                onChange={setClientFilterId}
                disabled={clientsLookupUnavailable}
              />
              <FormSelect
                label="Ciclo"
                value={statusFilter}
                options={statusOptions}
                onChange={setStatusFilter}
              />
            </div>

            <div className={sharedFormActionsClass}>
              <button
                type="button"
                onClick={() => setSearch(searchInput)}
                className="ui-primary-button"
              >
                Aplicar filtros
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
                Limpar filtros
              </button>
            </div>
          </div>
        </PageSection>

        <PageSection
          tone="muted"
          title={messages.nextCycleTitle}
          description={`Use esta previa de ${nextCycleLabel} para explicar clientes recorrentes, servicos cobertos, extras de pet taxi e o que ja esta pronto para cobranca.`}
        >
          {previewError ? <div className="ui-notice-warning">{previewError}</div> : null}
          {previewLoading ? (
            <div className="ui-notice-neutral">Carregando a previa do proximo ciclo...</div>
          ) : nextCyclePreviewRows.length === 0 ? (
            <div className="ui-notice-neutral">
              Nenhum plano recorrente ou atendimento agendado esta formando o proximo ciclo neste momento.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SnapshotCard
                  icon={WalletCards}
                  label="Projecao do proximo ciclo"
                  value={formatCurrency(nextCycleProjectedTotal)}
                  detail="Cobranca projetada somando visitas cobertas pelo plano e extras."
                />
                <SnapshotCard
                  icon={Receipt}
                  label="Clientes recorrentes"
                  value={String(nextCycleRecurringClients)}
                  detail="Clientes ja ancorados na esteira recorrente de cobranca."
                />
                <SnapshotCard
                  icon={Clock3}
                  label="Alertas de penultimo ciclo"
                  value={String(nextCyclePenultimateClients)}
                  detail="Clientes que estao entrando agora na conversa de renovacao."
                  tone={nextCyclePenultimateClients > 0 ? 'warning' : 'default'}
                />
                <SnapshotCard
                  icon={ArrowUpRight}
                  label="Clientes com pet taxi"
                  value={String(nextCyclePetTaxiClients)}
                  detail="Clientes que levam extras de coleta ou entrega para o proximo ciclo."
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                {nextCyclePreviewRows.slice(0, 6).map((row) => (
                  <div key={row.reference} className={billingPanelClass}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className={billingPanelEyebrowClass}>Detalhe de cobranca</p>
                        <p className={billingPanelTitleClass}>{row.clientName}</p>
                        <p className={billingPanelTextClass}>{row.reference}</p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        row.billingType === 'Recurring'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}>
                        {row.billingType === 'Recurring' ? 'Recorrente' : 'Avulsa'}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <dt className={billingDetailLabelClass}>Valor projetado</dt>
                        <dd className={billingPrimaryValueClass}>{formatCurrency(row.projectedDue)}</dd>
                      </div>
                      <div>
                        <dt className={billingDetailLabelClass}>Atendimentos</dt>
                        <dd className={billingDetailValueClass}>
                          {row.appointmentCount} agendado(s) / {row.coveredAppointments} coberto(s) pelo plano
                        </dd>
                      </div>
                      <div>
                        <dt className={billingDetailLabelClass}>Status do plano</dt>
                        <dd className={billingDetailValueClass}>
                          {row.planName
                            ? `${row.planName} · ${row.remainingSessions ?? 0} sessoes restantes`
                            : 'Cobranca avulsa apenas'}
                        </dd>
                      </div>
                      <div>
                        <dt className={billingDetailLabelClass}>Extras</dt>
                        <dd className={billingDetailValueClass}>
                          {formatCurrency(row.extrasTotal)}{row.petTaxiTotal > 0 ? ` · ${formatCurrency(row.petTaxiTotal)} de pet taxi` : ''}
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
            title={editingId ? 'Atualizar fatura' : 'Emitir fatura'}
            description="Conecte o servico entregue, a cobranca do cliente e o registro financeiro em um unico passo."
          >
            <PermissionGuard permission={editingId ? 'pet.invoice.update' : 'pet.invoice.create'}>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2">
                  <FormSelect
                    label="Cliente"
                    value={clientId}
                    options={formClientOptions}
                    onChange={setClientId}
                    disabled={clientsLookupUnavailable}
                  />
                  <FormInput
                    label="Valor total"
                    value={totalAmount}
                    onChange={setTotalAmount}
                    type="number"
                    required
                  />
                  <FormSelect
                    label="Ciclo"
                    value={status}
                    options={formStatusOptions}
                    onChange={setStatus}
                  />
                  <DateTimeInput
                    label="Emitida em"
                    value={issuedAt}
                    onChange={setIssuedAt}
                    required={status !== 'DRAFT'}
                  />
                  <DateTimeInput
                    label="Vence em"
                    value={dueAt}
                    onChange={setDueAt}
                  />
                  <FormInput
                    label="Descricao operacional"
                    value={description}
                    onChange={setDescription}
                    placeholder="Pacote de consulta, sinal de cirurgia, combo de banho e tosa..."
                  />
                </div>

                <div className={sharedReminderSurfaceClass}>
                  <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Lembrete do ciclo</p>
                  <p className={`mt-1 ${sharedCompactTextClass}`}>
                    Rascunho mantem a fatura apenas no ambito interno. Documentos emitidos ou cancelados devem ter data de emissao para que financeiro e suporte consigam reconstruir a linha do tempo completa.
                  </p>
                </div>

                {clientsLookupUnavailable ? (
                  <div className="ui-notice-warning">
                    O acesso ao cadastro de clientes e necessario antes de emitir ou editar faturas com seguranca.
                  </div>
                ) : null}

                <div className={sharedFormActionsClass}>
                  <button
                    type="submit"
                    disabled={submitting || clientsLookupUnavailable}
                    className="ui-primary-button"
                  >
                    {submitting ? 'Salvando fatura...' : editingId ? 'Atualizar fatura' : 'Emitir fatura'}
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="ui-secondary-button"
                    >
                      Cancelar edicao
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
            loadingTitle="Carregando a operacao de cobranca"
            loadingDescription="Preparando o ciclo mais recente das faturas e a posicao de pagamento deste ambiente."
            emptyState={{
              title: 'Ainda nao ha faturas',
              description: 'Emita a primeira fatura depois de um atendimento ou servico e registre um pagamento para tornar visiveis saldo em aberto, proximo ciclo e acompanhamento financeiro.',
              action: hasPermission('pet.invoice.create') ? (
                <button type="button" onClick={beginCreateInvoice} className="ui-primary-button">
                  Emitir primeira fatura
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
              title="Visao financeira vinculada"
              description="Use este painel para explicar status da fatura, pagamentos e movimentos de caixa sem sair do PetFlow."
              actions={(
                <button
                  type="button"
                  onClick={() => {
                    setReviewInvoiceId(null);
                    resetPaymentForm();
                  }}
                  className="ui-secondary-button"
                >
                  Fechar visao financeira
                </button>
              )}
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className={billingPanelClass}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className={billingPanelEyebrowClass}>Resumo</p>
                      <p className={billingPanelTitleClass}>{reviewedInvoice.clientName ?? reviewedInvoice.clientId}</p>
                      <p className={billingPanelTextClass}>
                        {reviewedInvoice.businessContextLabel ?? reviewedInvoice.description ?? 'Fatura manual ainda sem rotulo de negocio'}
                      </p>
                    </div>
                    <StatusBadge status={reviewedInvoice.status} />
                  </div>

                  <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className={billingDetailLabelClass}>Valor total</dt>
                      <dd className={billingPrimaryValueClass}>{formatCurrency(reviewedInvoice.totalAmount)}</dd>
                    </div>
                    <div>
                      <dt className={billingDetailLabelClass}>Em aberto</dt>
                      <dd className={billingPrimaryValueClass}>{formatCurrency(reviewedInvoice.outstandingAmount)}</dd>
                    </div>
                    <div>
                      <dt className={billingDetailLabelClass}>Valor pago</dt>
                      <dd className={billingDetailValueClass}>{formatCurrency(reviewedInvoice.paidAmount)}</dd>
                    </div>
                    <div>
                      <dt className={billingDetailLabelClass}>Fatura financeira vinculada</dt>
                      <dd className={billingDetailValueClass}>{reviewedInvoice.financeInvoiceId}</dd>
                    </div>
                    <div>
                      <dt className={billingDetailLabelClass}>Referencia de cobranca</dt>
                      <dd className={billingDetailValueClass}>
                        {buildCollectionReference(reviewedInvoice.clientId, reviewedInvoice.dueAt ? new Date(reviewedInvoice.dueAt) : new Date())}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className={billingPanelClass}>
                  <p className={billingPanelEyebrowClass}>Status</p>
                  <p className={billingPanelTitleClass}>Marcos do ciclo</p>
                  <p className={billingPanelTextClass}>Use estes carimbos de tempo para explicar se a fatura ainda esta em rascunho, emitida, vencida, liquidada ou cancelada.</p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className={billingDetailLabelClass}>Emitida em</p>
                      <p className={billingDetailValueClass}>
                        {formatDateTime(reviewedInvoice.issuedAt, 'Ainda em modo de rascunho')}
                      </p>
                    </div>
                    <div>
                      <p className={billingDetailLabelClass}>Vence em</p>
                      <p className={billingDetailValueClass}>
                        {formatDateTime(reviewedInvoice.dueAt, 'Sem data de vencimento definida')}
                      </p>
                    </div>
                    <div>
                      <p className={billingDetailLabelClass}>Pago em</p>
                      <p className={billingDetailValueClass}>
                        {formatDateTime(reviewedInvoice.paidAt, 'Aguardando liquidacao')}
                      </p>
                    </div>
                    <div>
                      <p className={billingDetailLabelClass}>Cancelada em</p>
                      <p className={billingDetailValueClass}>
                        {formatDateTime(reviewedInvoice.canceledAt, 'Fatura ainda ativa')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {financeLoading ? (
                <div className="ui-notice-neutral">Carregando o contexto financeiro vinculado...</div>
              ) : null}

              {financeError ? (
                <div className="ui-notice-warning">{financeError}</div>
              ) : null}

              {financeInvoice ? (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className={billingPanelClass}>
                    <p className={billingPanelEyebrowClass}>Registro financeiro</p>
                    <p className={billingPanelTitleClass}>Documento financeiro vinculado</p>
                    <p className={billingPanelTextClass}>
                      Origem {formatCategoryLabel(financeInvoice.sourceModule)} • Moeda {financeInvoice.currency}
                    </p>

                    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <dt className={billingDetailLabelClass}>Contraparte</dt>
                        <dd className={billingDetailValueClass}>
                          {financeInvoice.counterpartyName ?? 'Cliente do ambiente ainda sem identificacao'}
                        </dd>
                      </div>
                      <div>
                        <dt className={billingDetailLabelClass}>Numero do documento</dt>
                        <dd className={billingDetailValueClass}>
                          {financeInvoice.documentNumber ?? 'Nao atribuido'}
                        </dd>
                      </div>
                      <div>
                        <dt className={billingDetailLabelClass}>Status financeiro</dt>
                        <dd className={billingDetailValueClass}>
                          {formatStatusLabel(financeInvoice.status)}
                        </dd>
                      </div>
                      <div>
                        <dt className={billingDetailLabelClass}>Valor em aberto</dt>
                        <dd className={billingDetailValueClass}>
                          {formatCurrency(financeInvoice.outstandingAmount, financeInvoice.currency)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className={billingPanelClass}>
                    <p className={billingPanelEyebrowClass}>Fonte de verdade</p>
                    <p className={billingPanelTitleClass}>Base financeira</p>
                    <p className={billingPanelTextClass}>
                      Esta e a fonte financeira de verdade no backend vinculada a esta fatura do PetFlow.
                    </p>

                    <div className="mt-4 space-y-3">
                      <div>
                        <p className={billingDetailLabelClass}>Contexto do negocio</p>
                        <p className={billingDetailValueClass}>
                          {financeInvoice.businessContextLabel ?? financeInvoice.description ?? 'Nenhum rotulo de negocio registrado'}
                        </p>
                      </div>
                      <div>
                        <p className={billingDetailLabelClass}>Destinatario</p>
                        <p className={billingDetailValueClass}>
                          {financeInvoice.recipientLegalName ?? financeInvoice.recipientEmail ?? 'Os dados do destinatario ainda nao foram capturados'}
                        </p>
                      </div>
                      <div>
                        <p className={billingDetailLabelClass}>Referencia fiscal</p>
                        <p className={billingDetailValueClass}>
                          {financeInvoice.fiscalReference
                            ?? (financeInvoice.fiscalStatus ? formatStatusLabel(financeInvoice.fiscalStatus) : 'Nenhuma referencia fiscal vinculada')}
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
                        <p className={billingPanelEyebrowClass}>Acao</p>
                        <p className={billingPanelTitleClass}>Registrar pagamento</p>
                        <p className={billingPanelTextClass}>
                          Use o valor realmente recebido e o carimbo correto para manter o ledger financeiro confiavel.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={resetPaymentForm}
                        className="ui-secondary-button"
                      >
                        Fechar formulario
                      </button>
                    </div>

                    <div className="mt-5 grid gap-4">
                      <FormInput
                        label="Valor recebido"
                        value={paymentAmount}
                        onChange={setPaymentAmount}
                        type="number"
                        required
                      />
                      <FormSelect
                        label="Metodo"
                        value={paymentMethod}
                        options={paymentMethodOptions}
                        onChange={setPaymentMethod}
                      />
                      <DateTimeInput
                        label="Recebido em"
                        value={paymentReceivedAt}
                        onChange={setPaymentReceivedAt}
                        required
                      />
                      <FormInput
                        label="Codigo de referencia"
                        value={paymentReferenceCode}
                        onChange={setPaymentReferenceCode}
                        placeholder="Codigo PIX, numero do recibo, autorizacao do cartao..."
                      />
                      <FormInput
                        label="Observacoes do operador"
                        value={paymentNotes}
                        onChange={setPaymentNotes}
                        placeholder="Qualquer contexto que suporte ou financeiro possam precisar explicar depois"
                      />
                    </div>

                    <p className={`mt-4 ${sharedFieldHintClass}`}>
                      Saldo em aberto antes deste pagamento: {formatCurrency(reviewedInvoice.outstandingAmount)}
                    </p>

                    <div className={sharedFormActionsClass}>
                      <button
                        type="submit"
                        disabled={paymentSubmitting}
                        className="ui-primary-button"
                      >
                        {paymentSubmitting ? 'Registrando pagamento...' : 'Confirmar pagamento'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className={billingPanelClass}>
                    <p className={billingPanelEyebrowClass}>Acao</p>
                    <p className={billingPanelTitleClass}>Proxima acao de cobranca</p>
                    <p className={billingPanelTextClass}>
                      Use o formulario de pagamento quando o valor realmente entrar. Isso mantem status da fatura, historico de pagamento e ledger do ambiente alinhados.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <PermissionGuard permission="pet.invoice.update">
                        {reviewedInvoice.status !== 'PAID' && reviewedInvoice.status !== 'CANCELED' && reviewedInvoice.outstandingAmount > 0 ? (
                          <button
                            type="button"
                            onClick={() => beginPayment(reviewedInvoice)}
                            className="ui-primary-button"
                          >
                            Registrar pagamento
                          </button>
                        ) : null}
                      </PermissionGuard>
                      <PermissionGuard permission="pet.invoice.update">
                        <button
                          type="button"
                          onClick={() => beginEdit(reviewedInvoice)}
                          className="ui-secondary-button"
                        >
                          Revisar dados da fatura
                        </button>
                      </PermissionGuard>
                    </div>
                  </div>
                )}

                <div className={billingPanelClass}>
                  <p className={billingPanelEyebrowClass}>Pagamentos</p>
                  <p className={billingPanelTitleClass}>Historico de pagamentos</p>
                  <p className={billingPanelTextClass}>
                    Estes registros refletem os eventos de liquidacao ja vinculados a fatura selecionada.
                  </p>

                  <div className="mt-4 space-y-3">
                    {reviewedInvoice.payments.length === 0 ? (
                      <div className="ui-notice-warning">
                        Ainda nao ha pagamento registrado para esta fatura.
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
                                {formatCurrency(payment.amount)} via {formatMethodLabel(payment.method)}
                              </p>
                              <p className={`mt-1 ${sharedCompactTextClass}`}>
                                Recebido em {formatDateTime(payment.receivedAt)}
                              </p>
                            </div>
                            <StatusBadge status={payment.status} />
                          </div>
                          {payment.referenceCode ? (
                            <p className={`mt-3 ${sharedCompactTextClass}`}>
                              Referencia {payment.referenceCode}
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
                    <p className={billingPanelEyebrowClass}>Caixa</p>
                    <p className={billingPanelTitleClass}>Visibilidade dos movimentos</p>
                    <p className={billingPanelTextClass}>
                      Revise como esta fatura afetou o caixa do ambiente sem sair do fluxo do PetFlow.
                    </p>
                  </div>
                  {canReadFinanceCash ? <StatusBadge status="info" /> : <StatusBadge status="restricted" />}
                </div>

                {!canReadFinanceCash ? (
                  <div className="ui-notice-neutral mt-4">
                    A visibilidade de caixa exige a permissao <strong>finance.cash.read</strong>.
                  </div>
                ) : cashMovements.length === 0 ? (
                  <div className="ui-notice-warning mt-4">
                    Nenhum movimento de caixa foi gerado para esta fatura ate agora.
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
                              {formatDirectionLabel(movement.direction)} • {formatCurrency(movement.amount, movement.currency)}
                            </p>
                            <p className={`mt-1 ${sharedCompactTextClass}`}>
                              {formatCategoryLabel(movement.category)} em {formatDateTime(movement.occurredAt)}
                            </p>
                          </div>
                          <StatusBadge status={movement.direction === 'IN' ? 'paid' : 'canceled'} />
                        </div>
                        <p className={`mt-3 ${sharedCompactTextClass}`}>
                          {movement.description ?? 'Nenhuma descricao operacional foi registrada para este movimento de caixa.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PageSection>
          </div>
        ) : null}

        <ConfirmDialog
          open={deleteCandidate !== null}
          title="Excluir fatura?"
          description="O registro financeiro vinculado permanece na trilha de auditoria. Use esta acao apenas quando a fatura do ambiente realmente precisar sair da operacao ativa."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
