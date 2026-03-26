'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import {
  sharedCompactTextClass,
  sharedFieldHintClass,
  sharedFilterToolbarClass,
  sharedFormActionsClass,
  sharedInlineActionsClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
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
import { PetClient, PetInvoice } from '@/shared/types/pet';
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
  { value: '', label: 'All lifecycles' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ISSUED', label: 'Issued' },
  { value: 'PAID', label: 'Paid' },
  { value: 'CANCELED', label: 'Canceled' }
];

const formStatusOptions = statusOptions.filter((option) => option.value);

const paymentMethodOptions = [
  { value: 'PIX', label: 'PIX' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CREDIT_CARD', label: 'Credit card' },
  { value: 'DEBIT_CARD', label: 'Debit card' },
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'MANUAL', label: 'Manual adjustment' },
  { value: 'OTHER', label: 'Other' }
];

const initialPage: PageResponse<PetInvoice> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
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

function formatDateTime(value?: string | null, fallback = 'Not recorded') {
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

function formatMethodLabel(value?: string | null) {
  return paymentMethodOptions.find((option) => option.value === value)?.label ?? value ?? 'Unknown';
}

function formatCategoryLabel(value?: string | null) {
  if (!value) {
    return 'Uncategorized';
  }

  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDirectionLabel(value?: string | null) {
  if (!value) {
    return 'Unspecified';
  }

  if (value.toUpperCase() === 'IN') {
    return 'Cash in';
  }

  if (value.toUpperCase() === 'OUT') {
    return 'Cash out';
  }

  return formatCategoryLabel(value);
}

function statToneClass(tone: 'default' | 'warning' | 'danger' = 'default') {
  if (tone === 'warning') {
    return 'border-[color:var(--status-warning-weak)] bg-[color:var(--status-warning-soft)]';
  }

  if (tone === 'danger') {
    return 'border-[color:var(--status-danger-weak)] bg-[color:var(--status-danger-soft)]';
  }

  return 'border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)]';
}

type SnapshotCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'warning' | 'danger';
};

function SnapshotCard({ label, value, detail, tone = 'default' }: SnapshotCardProps) {
  return (
    <div className={`rounded-3xl border p-4 shadow-xs ${statToneClass(tone)}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-[color:var(--app-shell-heading)]">{value}</p>
      <p className={`mt-2 ${sharedCompactTextClass}`}>{detail}</p>
    </div>
  );
}

export function PetInvoicesPage() {
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

  const canReadClients = hasPermission('pet.client.read');
  const canReadFinanceInvoices = hasPermission('finance.invoice.read');
  const canReadFinanceCash = hasPermission('finance.cash.read');

  const clientOptions = useMemo(() => ([
    { value: '', label: 'All clients' },
    ...clients.map((client) => ({ value: client.id, label: client.name ?? client.fullName ?? client.id }))
  ]), [clients]);

  const formClientOptions = useMemo(() => ([
    { value: '', label: 'Select a client' },
    ...clients.map((client) => ({ value: client.id, label: client.name ?? client.fullName ?? client.id }))
  ]), [clients]);

  const loadClients = useCallback(async () => {
    if (!canReadClients) {
      setClients([]);
      setLookupIssues([{
        key: 'clients',
        label: 'Clients',
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
        label: 'Clients',
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
      setError(err instanceof ApiClientError ? err.message : 'Unable to load PetFlow invoices.');
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
              : 'Unable to load the linked finance invoice.'
          );
        }

        if (cashResult.status === 'fulfilled') {
          setCashMovements(resolvePageItems(cashResult.value));
        } else {
          setCashMovements([]);
          nextErrors.push(
            cashResult.reason instanceof Error
              ? cashResult.reason.message
              : 'Unable to load cash movements for the linked invoice.'
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
  const overdueCount = rows.filter((invoice) => (
    invoice.status !== 'PAID'
    && invoice.status !== 'CANCELED'
    && Boolean(invoice.dueAt)
    && new Date(invoice.dueAt as string).getTime() < Date.now()
  )).length;

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
      setError('Paid invoices should be adjusted through a new document or a controlled finance correction.');
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
      setError('Select a client and enter a valid total amount.');
      return;
    }

    if (status !== 'DRAFT' && !isoIssuedAt) {
      setError('Issued or canceled invoices require an issue date.');
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
        setSuccess('Invoice updated successfully.');
      } else {
        await petService.createInvoice({
          clientId,
          totalAmount: parsedTotal,
          status,
          issuedAt: isoIssuedAt,
          dueAt: isoDueAt,
          description: description || undefined
        });
        setSuccess('Invoice created successfully.');
      }

      resetForm();
      await load(pageData.page, search, clientFilterId, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to save the invoice.');
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
      setError('Enter a valid amount and received date for the payment.');
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
      setSuccess('Payment recorded successfully.');
      resetPaymentForm();
      await load(pageData.page, search, clientFilterId, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to record the payment.');
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
      setSuccess('Invoice removed successfully.');
      if (reviewInvoiceId === deleteCandidate.id) {
        setReviewInvoiceId(null);
        resetPaymentForm();
      }
      await load(pageData.page, search, clientFilterId, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to delete the selected invoice.');
    }
  }

  const columns: DataTableColumn<PetInvoice>[] = [
    {
      key: 'issuedAt',
      header: 'Document',
      render: (item) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">
            {formatDateTime(item.issuedAt, 'Draft not issued yet')}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            Due {formatDateTime(item.dueAt, 'No due date')}
          </p>
        </div>
      )
    },
    {
      key: 'client',
      header: 'Client',
      render: (item) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">
            {item.clientName ?? resolvePetLookupLabel(
              clients,
              item.clientId,
              (client) => client.name ?? client.fullName,
              'Client',
              clientsLookupUnavailable
            )}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>{item.clientId}</p>
        </div>
      )
    },
    {
      key: 'context',
      header: 'Business context',
      render: (item) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">
            {item.businessContextLabel ?? item.description ?? 'Manual invoice'}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            Linked finance document {item.financeInvoiceId}
          </p>
        </div>
      )
    },
    {
      key: 'finance',
      header: 'Finance position',
      render: (item) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">
            {formatCurrency(item.totalAmount)}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            Paid {formatCurrency(item.paidAmount)} • Open {formatCurrency(item.outstandingAmount)}
          </p>
        </div>
      )
    },
    {
      key: 'lifecycle',
      header: 'Lifecycle',
      render: (item) => (
        <div className="space-y-2">
          <StatusBadge status={item.status} />
          <p className={sharedCompactTextClass}>
            {item.paidAt
              ? `Paid on ${formatDateTime(item.paidAt)}`
              : item.canceledAt
                ? `Canceled on ${formatDateTime(item.canceledAt)}`
                : `${item.payments.length} payment record${item.payments.length === 1 ? '' : 's'}`}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
          render: (item) => (
        <div className={sharedInlineActionsClass}>
          <button
            type="button"
            onClick={() => reviewInvoice(item)}
            className="ui-inline-button"
          >
            View finance record
          </button>
          <PermissionGuard permission="pet.invoice.update">
            {item.status !== 'PAID' ? (
              <button
                type="button"
                onClick={() => beginEdit(item)}
                className="ui-inline-button"
              >
                Edit
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
                Register payment
              </button>
            ) : null}
          </PermissionGuard>
          <PermissionGuard permission="pet.invoice.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(item)}
              className="ui-inline-danger-button"
            >
              Delete
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.invoice.read"
      fallback={<div className="ui-notice-warning">You do not have permission to view PetFlow invoices.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="PetFlow finance"
          title="Billing & Invoices"
          description="Show how PetFlow services become invoices, payments, and finance visibility."
          actions={(
            <div className="flex flex-wrap gap-2">
              <PermissionGuard permission="pet.invoice.create">
                <button type="button" onClick={beginCreateInvoice} className="ui-primary-button">
                  Issue invoice
                </button>
              </PermissionGuard>
              <PermissionGuard permission="pet.dashboard.read">
                <Link href="/pet/insights" className="ui-secondary-button">
                  Open business insights
                </Link>
              </PermissionGuard>
            </div>
          )}
        />

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SnapshotCard
            label="Invoices in scope"
            value={new Intl.NumberFormat('pt-BR').format(totalItems)}
            detail={activeFilterCount > 0
              ? 'Results reflect the current finance filters.'
              : 'Full PetFlow invoice list for this tenant.'}
          />
          <SnapshotCard
            label="Visible invoiced value"
            value={formatCurrency(visibleTotalInvoiced)}
            detail="Gross amount represented in the current page view."
          />
          <SnapshotCard
            label="Open balance"
            value={formatCurrency(visibleOpenBalance)}
            detail="Amount still expected from the visible invoice slice."
            tone={visibleOpenBalance > 0 ? 'warning' : 'default'}
          />
          <SnapshotCard
            label="Operational attention"
            value={String(overdueCount)}
            detail={`${paymentCount} payment record${paymentCount === 1 ? '' : 's'} currently visible.`}
            tone={overdueCount > 0 ? 'danger' : 'default'}
          />
        </div>

        <PageSection
          tone="muted"
          title="Invoice filters"
          description="Refine the finance list by client or lifecycle without losing the commercial story behind each document."
        >
          <div className={sharedFilterToolbarClass}>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)_minmax(0,0.7fr)] xl:items-end">
              <SearchBar
                label="Search"
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Client name, context, or internal reference"
              />
              <FormSelect
                label="Client"
                value={clientFilterId}
                options={clientOptions}
                onChange={setClientFilterId}
                disabled={clientsLookupUnavailable}
              />
              <FormSelect
                label="Lifecycle"
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
                Apply filters
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
                Clear filters
              </button>
            </div>
          </div>
        </PageSection>

        <PetLookupFeedback issues={lookupIssues} />

        <div id="pet-invoice-form-section">
          <PageSection
            title={editingId ? 'Update invoice' : 'Issue invoice'}
            description="Connect the service delivered, customer charge, and finance record in one step."
          >
            <PermissionGuard permission={editingId ? 'pet.invoice.update' : 'pet.invoice.create'}>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2">
                  <FormSelect
                    label="Client"
                    value={clientId}
                    options={formClientOptions}
                    onChange={setClientId}
                    disabled={clientsLookupUnavailable}
                  />
                  <FormInput
                    label="Total amount"
                    value={totalAmount}
                    onChange={setTotalAmount}
                    type="number"
                    required
                  />
                  <FormSelect
                    label="Lifecycle"
                    value={status}
                    options={formStatusOptions}
                    onChange={setStatus}
                  />
                  <DateTimeInput
                    label="Issued at"
                    value={issuedAt}
                    onChange={setIssuedAt}
                    required={status !== 'DRAFT'}
                  />
                  <DateTimeInput
                    label="Due at"
                    value={dueAt}
                    onChange={setDueAt}
                  />
                  <FormInput
                    label="Operational description"
                    value={description}
                    onChange={setDescription}
                    placeholder="Consultation package, surgery deposit, grooming bundle..."
                  />
                </div>

                <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-4">
                  <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Lifecycle reminder</p>
                  <p className={`mt-1 ${sharedCompactTextClass}`}>
                    Draft keeps the invoice internal only. Issued and canceled documents should carry an issue date so finance and support teams can reconstruct the full timeline.
                  </p>
                </div>

                {clientsLookupUnavailable ? (
                  <div className="ui-notice-warning">
                    Client lookup access is required before issuing or editing invoices safely.
                  </div>
                ) : null}

                <div className={sharedFormActionsClass}>
                  <button
                    type="submit"
                    disabled={submitting || clientsLookupUnavailable}
                    className="ui-primary-button"
                  >
                    {submitting ? 'Saving invoice...' : editingId ? 'Update invoice' : 'Issue invoice'}
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="ui-secondary-button"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </form>
            </PermissionGuard>
          </PageSection>
        </div>

        <PageSection
          title="Billing pipeline"
          description="Review invoice status, open balance, and the finance record behind each PetFlow charge."
        >
          <DataTable
            columns={columns}
            rows={rows}
            getRowKey={(row) => row.id}
            loading={loading}
            loadingTitle="Loading invoice operations"
            loadingDescription="Preparing the latest PetFlow invoice lifecycle and payment posture for this tenant."
            emptyState={{
              title: 'No invoices yet',
              description: 'Issue the first invoice after an appointment or service so the finance story becomes visible.',
              action: hasPermission('pet.invoice.create') ? (
                <button type="button" onClick={beginCreateInvoice} className="ui-primary-button">
                  Issue first invoice
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
              title="Linked finance view"
              description="Use this panel to explain invoice status, payments, and cash movements without leaving PetFlow."
              actions={(
                <button
                  type="button"
                  onClick={() => {
                    setReviewInvoiceId(null);
                    resetPaymentForm();
                  }}
                  className="ui-secondary-button"
                >
                  Close finance view
                </button>
              )}
            >
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">
                        {reviewedInvoice.clientName ?? reviewedInvoice.clientId}
                      </p>
                      <p className={`mt-1 ${sharedCompactTextClass}`}>
                        {reviewedInvoice.businessContextLabel ?? reviewedInvoice.description ?? 'Manual invoice with no business label yet'}
                      </p>
                    </div>
                    <StatusBadge status={reviewedInvoice.status} />
                  </div>

                  <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                        Total amount
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-[color:var(--app-shell-heading)]">
                        {formatCurrency(reviewedInvoice.totalAmount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                        Outstanding
                      </dt>
                      <dd className="mt-1 text-lg font-semibold text-[color:var(--app-shell-heading)]">
                        {formatCurrency(reviewedInvoice.outstandingAmount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                        Paid amount
                      </dt>
                      <dd className="mt-1 text-sm text-[color:var(--app-shell-text)]">
                        {formatCurrency(reviewedInvoice.paidAmount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                        Linked finance invoice
                      </dt>
                      <dd className="mt-1 text-sm text-[color:var(--app-shell-text)]">
                        {reviewedInvoice.financeInvoiceId}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5">
                  <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">Lifecycle checkpoints</p>
                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                        Issued at
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--app-shell-text)]">
                        {formatDateTime(reviewedInvoice.issuedAt, 'Still in draft mode')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                        Due at
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--app-shell-text)]">
                        {formatDateTime(reviewedInvoice.dueAt, 'No due date defined')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                        Paid at
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--app-shell-text)]">
                        {formatDateTime(reviewedInvoice.paidAt, 'Awaiting settlement')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                        Canceled at
                      </p>
                      <p className="mt-1 text-sm text-[color:var(--app-shell-text)]">
                        {formatDateTime(reviewedInvoice.canceledAt, 'Invoice still active')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {financeLoading ? (
                <div className="ui-notice-neutral">Loading linked finance context...</div>
              ) : null}

              {financeError ? (
                <div className="ui-notice-warning">{financeError}</div>
              ) : null}

              {financeInvoice ? (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5">
                    <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">Linked finance document</p>
                    <p className={`mt-1 ${sharedCompactTextClass}`}>
                      Source {financeInvoice.sourceModule} • Currency {financeInvoice.currency}
                    </p>

                    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                          Counterparty
                        </dt>
                        <dd className="mt-1 text-sm text-[color:var(--app-shell-text)]">
                          {financeInvoice.counterpartyName ?? 'Tenant-side customer not labeled'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                          Document number
                        </dt>
                        <dd className="mt-1 text-sm text-[color:var(--app-shell-text)]">
                          {financeInvoice.documentNumber ?? 'Not assigned'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                          Finance status
                        </dt>
                        <dd className="mt-1 text-sm text-[color:var(--app-shell-text)]">
                          {financeInvoice.status}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                          Outstanding amount
                        </dt>
                        <dd className="mt-1 text-sm text-[color:var(--app-shell-text)]">
                          {formatCurrency(financeInvoice.outstandingAmount, financeInvoice.currency)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5">
                    <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">Finance baseline</p>
                    <p className={`mt-1 ${sharedCompactTextClass}`}>
                      This is the backend financial source of truth attached to the PetFlow invoice.
                    </p>

                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                          Business context
                        </p>
                        <p className="mt-1 text-sm text-[color:var(--app-shell-text)]">
                          {financeInvoice.businessContextLabel ?? financeInvoice.description ?? 'No business label recorded'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                          Recipient
                        </p>
                        <p className="mt-1 text-sm text-[color:var(--app-shell-text)]">
                          {financeInvoice.recipientLegalName ?? financeInvoice.recipientEmail ?? 'Recipient details not captured yet'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                          Fiscal reference
                        </p>
                        <p className="mt-1 text-sm text-[color:var(--app-shell-text)]">
                          {financeInvoice.fiscalReference ?? financeInvoice.fiscalStatus ?? 'No fiscal provider reference attached'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                {paymentInvoice?.id === reviewedInvoice.id ? (
                  <form onSubmit={handlePaymentSubmit} className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">Register payment</p>
                        <p className={`mt-1 ${sharedCompactTextClass}`}>
                          Use the real received amount and timestamp so the shared finance ledger remains trustworthy.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={resetPaymentForm}
                        className="ui-secondary-button"
                      >
                        Close payment form
                      </button>
                    </div>

                    <div className="mt-5 grid gap-4">
                      <FormInput
                        label="Received amount"
                        value={paymentAmount}
                        onChange={setPaymentAmount}
                        type="number"
                        required
                      />
                      <FormSelect
                        label="Method"
                        value={paymentMethod}
                        options={paymentMethodOptions}
                        onChange={setPaymentMethod}
                      />
                      <DateTimeInput
                        label="Received at"
                        value={paymentReceivedAt}
                        onChange={setPaymentReceivedAt}
                        required
                      />
                      <FormInput
                        label="Reference code"
                        value={paymentReferenceCode}
                        onChange={setPaymentReferenceCode}
                        placeholder="PIX code, receipt number, card auth..."
                      />
                      <FormInput
                        label="Operator notes"
                        value={paymentNotes}
                        onChange={setPaymentNotes}
                        placeholder="Anything support or finance might need to explain later"
                      />
                    </div>

                    <p className={`mt-4 ${sharedFieldHintClass}`}>
                      Open balance before this payment: {formatCurrency(reviewedInvoice.outstandingAmount)}
                    </p>

                    <div className={sharedFormActionsClass}>
                      <button
                        type="submit"
                        disabled={paymentSubmitting}
                        className="ui-primary-button"
                      >
                        {paymentSubmitting ? 'Recording payment...' : 'Confirm payment'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5">
                    <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">Next collection action</p>
                    <p className={`mt-1 ${sharedCompactTextClass}`}>
                      Use the payment form when cash has actually been received. That keeps invoice status, payment history, and the tenant ledger aligned.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <PermissionGuard permission="pet.invoice.update">
                        {reviewedInvoice.status !== 'PAID' && reviewedInvoice.status !== 'CANCELED' && reviewedInvoice.outstandingAmount > 0 ? (
                          <button
                            type="button"
                            onClick={() => beginPayment(reviewedInvoice)}
                            className="ui-primary-button"
                          >
                            Register payment
                          </button>
                        ) : null}
                      </PermissionGuard>
                      <PermissionGuard permission="pet.invoice.update">
                        <button
                          type="button"
                          onClick={() => beginEdit(reviewedInvoice)}
                          className="ui-secondary-button"
                        >
                          Review invoice data
                        </button>
                      </PermissionGuard>
                    </div>
                  </div>
                )}

                <div className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5">
                  <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">Payment history</p>
                  <p className={`mt-1 ${sharedCompactTextClass}`}>
                    These records reflect settlement events already attached to the selected invoice.
                  </p>

                  <div className="mt-4 space-y-3">
                    {reviewedInvoice.payments.length === 0 ? (
                      <div className="ui-notice-warning">
                        No payment has been recorded for this invoice yet.
                      </div>
                    ) : (
                      reviewedInvoice.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">
                                {formatCurrency(payment.amount)} via {formatMethodLabel(payment.method)}
                              </p>
                              <p className={`mt-1 ${sharedCompactTextClass}`}>
                                Received {formatDateTime(payment.receivedAt)}
                              </p>
                            </div>
                            <StatusBadge status={payment.status} />
                          </div>
                          {payment.referenceCode ? (
                            <p className={`mt-3 ${sharedCompactTextClass}`}>
                              Reference {payment.referenceCode}
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

              <div className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">Cash movement visibility</p>
                    <p className={`mt-1 ${sharedCompactTextClass}`}>
                      Review how this invoice affected the tenant cash ledger without leaving the PetFlow workflow.
                    </p>
                  </div>
                  {canReadFinanceCash ? <StatusBadge status="info" /> : <StatusBadge status="restricted" />}
                </div>

                {!canReadFinanceCash ? (
                  <div className="ui-notice-neutral mt-4">
                    Finance cash visibility requires the <strong>finance.cash.read</strong> permission.
                  </div>
                ) : cashMovements.length === 0 ? (
                  <div className="ui-notice-warning mt-4">
                    No cash movement has been generated for this invoice yet.
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {cashMovements.map((movement) => (
                      <div
                        key={movement.id}
                        className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">
                              {formatDirectionLabel(movement.direction)} • {formatCurrency(movement.amount, movement.currency)}
                            </p>
                            <p className={`mt-1 ${sharedCompactTextClass}`}>
                              {formatCategoryLabel(movement.category)} on {formatDateTime(movement.occurredAt)}
                            </p>
                          </div>
                          <StatusBadge status={movement.direction === 'IN' ? 'paid' : 'canceled'} />
                        </div>
                        <p className={`mt-3 ${sharedCompactTextClass}`}>
                          {movement.description ?? 'No operator description captured for this cash movement.'}
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
          title="Delete invoice?"
          description="The linked finance record remains part of the audit trail. Use this only when the tenant invoice itself should be removed from active operations."
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
