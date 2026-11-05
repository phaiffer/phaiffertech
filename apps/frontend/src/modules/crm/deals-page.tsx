'use client';

import { type DragEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { petCommercialPermissions } from '@/shared/auth/pet-commercial-permissions';
import { sharedFormActionsClass, sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatCurrencyForLocale, formatDateForLocale } from '@/shared/i18n/formatters';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import {
  petCommercialService,
  type CreatePetCommercialDealInput,
  type UpdatePetCommercialDealInput
} from '@/shared/services/pet-commercial-service';
import { financeService } from '@/shared/services/finance-service';
import { FinanceInvoice } from '@/shared/types/finance';
import { PageResponse } from '@/shared/types/common';
import {
  PetCommercialAccount,
  PetCommercialDeal,
  PetCommercialLead,
  PetCommercialPipelineStage,
  PetCommercialSupportContact
} from '@/shared/types/pet-commercial';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DateInput } from '@/shared/ui/date-input';
import { FilterChip } from '@/shared/ui/filter-chip';
import { FormInput } from '@/shared/ui/form-input';
import { FormSection } from '@/shared/ui/form-section';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 50;
const pipelinePath = '/pet/commercial?tab=pipeline';
const initialPage: PageResponse<PetCommercialDeal> = { items: [], totalItems: 0, totalPages: 0, page: 0, size: pageSize };

type CommercialCopy = AppMessages['screens']['petCommercial'];

function resolveFinanceStatus(invoice: FinanceInvoice | undefined, copy: CommercialCopy) {
  if (!invoice) {
    return { label: copy.invoiceNone, tone: 'waiting' };
  }
  switch (invoice.status) {
    case 'PAID':
      return { label: copy.invoicePaid, tone: 'done' };
    case 'ISSUED':
      return { label: copy.invoiceIssued, tone: 'warn' };
    case 'DRAFT':
      return { label: copy.invoiceDraft, tone: 'waiting' };
    case 'CANCELED':
      return { label: copy.invoiceCanceled, tone: 'danger' };
    default:
      return { label: copy.invoicePending, tone: 'waiting' };
  }
}

// Calendar dates arrive without a time; reading them in local time would show the previous day in Brazil.
function todayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function CrmDealsPage() {
  const { locale } = useAppI18n();
  const copy = useAppMessages().screens.petCommercial;
  const commercialService = petCommercialService;
  const dealPermissions = petCommercialPermissions.deals;
  const [pageData, setPageData] = useState<PageResponse<PetCommercialDeal>>(initialPage);
  const [companies, setCompanies] = useState<PetCommercialAccount[]>([]);
  const [contacts, setContacts] = useState<PetCommercialSupportContact[]>([]);
  const [leads, setLeads] = useState<PetCommercialLead[]>([]);
  const [stages, setStages] = useState<PetCommercialPipelineStage[]>([]);
  const [invoicesByDealId, setInvoicesByDealId] = useState<Map<string, FinanceInvoice>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<PetCommercialDeal | null>(null);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isDragUpdating, setIsDragUpdating] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [companyFilterId, setCompanyFilterId] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [status, setStatus] = useState('OPEN');
  const [companyId, setCompanyId] = useState('');
  const [pipelineStageId, setPipelineStageId] = useState('');
  const [contactId, setContactId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');

  const loadSupportingData = useCallback(async () => {
    try {
      const [companiesPage, contactsPage, leadsPage, stagesPage] = await Promise.all([
        commercialService.listCompanies(0, 100),
        commercialService.listContacts(0, 100),
        commercialService.listLeads(0, 100),
        commercialService.listPipelineStages(0, 100)
      ]);
      setCompanies(resolvePageItems(companiesPage));
      setContacts(resolvePageItems(contactsPage));
      setLeads(resolvePageItems(leadsPage));
      setStages([...resolvePageItems(stagesPage)].sort((a, b) => a.position - b.position));
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.dealsSupportLoadError));
    }
  }, [commercialService, copy.dealsSupportLoadError]);

  const loadInvoices = useCallback(async () => {
    try {
      const invoicesPage = await financeService.listInvoices(0, 200, { sourceModule: 'CRM' });
      const map = new Map<string, FinanceInvoice>();
      for (const invoice of (invoicesPage.items ?? [])) {
        if (invoice.businessContextId) {
          map.set(invoice.businessContextId, invoice);
        }
      }
      setInvoicesByDealId(map);
    } catch {
      // The finance status is optional context: users without finance access still see the funnel.
    }
  }, []);

  const load = useCallback(async (
    page: number,
    currentSearch: string,
    currentStatus: string,
    currentCompanyId: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await commercialService.listDeals(page, pageSize, currentSearch, {
        status: currentStatus || undefined,
        companyId: currentCompanyId || undefined
      });
      setPageData(result);
      await loadInvoices();
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.dealsLoadError));
    } finally {
      setLoading(false);
    }
  }, [commercialService, copy.dealsLoadError, loadInvoices]);

  useEffect(() => {
    void loadSupportingData();
  }, [loadSupportingData]);

  useEffect(() => {
    void load(0, search, statusFilter, companyFilterId);
  }, [companyFilterId, load, search, statusFilter]);

  function resetForm() {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setAmount('');
    setCurrency('BRL');
    setStatus('OPEN');
    setCompanyId('');
    setPipelineStageId('');
    setContactId('');
    setLeadId('');
    setExpectedCloseDate('');
  }

  function beginCreateDeal() {
    resetForm();
    setIsEditorOpen(true);
  }

  function beginEditDeal(row: PetCommercialDeal) {
    setEditingId(row.id);
    setTitle(row.title);
    setDescription(row.description ?? '');
    setAmount(row.amount ? String(row.amount) : '');
    setCurrency(row.currency);
    setStatus(row.status);
    setCompanyId(row.companyId);
    setPipelineStageId(row.pipelineStageId);
    setContactId(row.contactId ?? '');
    setLeadId(row.leadId ?? '');
    setExpectedCloseDate(row.expectedCloseDate ?? '');
    setIsEditorOpen(true);
  }

  async function handleSubmit() {
    if (!companyId || !pipelineStageId || !title.trim()) {
      setError(copy.dealRequired);
      return;
    }

    const payload: CreatePetCommercialDealInput | UpdatePetCommercialDealInput = {
      title,
      description: description || undefined,
      amount: amount ? Number(amount) : undefined,
      currency,
      status,
      companyId,
      pipelineStageId,
      contactId: contactId || undefined,
      leadId: leadId || undefined,
      expectedCloseDate: expectedCloseDate || undefined
    };

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await commercialService.updateDeal(editingId, payload as UpdatePetCommercialDealInput);
      } else {
        await commercialService.createDeal(payload);
      }
      setIsEditorOpen(false);
      resetForm();
      await load(pageData.page, search, statusFilter, companyFilterId);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.dealSaveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteCandidate) return;
    try {
      await commercialService.deleteDeal(deleteCandidate.id);
      setDeleteCandidate(null);
      setIsEditorOpen(false);
      await load(pageData.page, search, statusFilter, companyFilterId);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.dealDeleteError));
    }
  }

  async function handleGenerateInvoice(deal: PetCommercialDeal) {
    if (generatingInvoice) return;
    setGeneratingInvoice(true);
    setError(null);
    try {
      const company = companies.find((c) => c.id === deal.companyId);
      await financeService.createInvoice({
        // Historical finance records still use CRM source tags until the
        // backend commercial ownership is migrated safely.
        sourceModule: 'CRM',
        businessContextType: 'CRM.DEAL',
        businessContextId: deal.id,
        description: deal.title,
        currency: deal.currency,
        totalAmount: deal.amount ?? 0,
        counterpartyName: company?.name
      });
      await loadInvoices();
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.invoiceGenerateError));
    } finally {
      setGeneratingInvoice(false);
    }
  }

  const rows = resolvePageItems(pageData);

  async function handleDropDeal(e: DragEvent, stageId: string) {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    if (!dealId || isDragUpdating) return;

    const deal = rows.find((d) => d.id === dealId);
    if (!deal || deal.pipelineStageId === stageId) return;

    setIsDragUpdating(true);
    try {
      const payload: UpdatePetCommercialDealInput = {
        title: deal.title,
        description: deal.description ?? undefined,
        amount: deal.amount ?? undefined,
        currency: deal.currency,
        status: deal.status,
        companyId: deal.companyId,
        pipelineStageId: stageId,
        contactId: deal.contactId ?? undefined,
        leadId: deal.leadId ?? undefined,
        expectedCloseDate: deal.expectedCloseDate ?? undefined
      };

      await commercialService.updateDeal(dealId, payload);
      await load(pageData.page, search, statusFilter, companyFilterId);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.dealMoveError));
    } finally {
      setIsDragUpdating(false);
    }
  }

  const statusOptions = [
    { value: 'OPEN', label: copy.statusOpen },
    { value: 'WON', label: copy.statusWon },
    { value: 'LOST', label: copy.statusLost }
  ];
  const companyName = (id?: string) => companies.find((item) => item.id === id)?.name ?? '-';
  const totalItems = resolveTotalItems(pageData);
  const today = todayKey();

  function formatDealDate(value: string) {
    return formatDateForLocale(locale, value, '', { timeZone: 'UTC' });
  }

  const columnsData = stages.map((stage) => ({
    stage,
    deals: rows.filter((row) => row.pipelineStageId === stage.id)
  }));
  const uncategorizedDeals = rows.filter((row) => !stages.some((stage) => stage.id === row.pipelineStageId));
  const boardColumns = uncategorizedDeals.length > 0
    ? [...columnsData, { stage: null, deals: uncategorizedDeals }]
    : columnsData;
  const editingDeal = editingId ? rows.find((row) => row.id === editingId) : undefined;
  const editingInvoice = editingId ? invoicesByDealId.get(editingId) : undefined;
  const editingFinance = resolveFinanceStatus(editingInvoice, copy);

  return (
    <PermissionGuard
      permission={dealPermissions.read}
      fallback={<div className="ui-notice-warning">{copy.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          title={copy.dealsTitle}
          description={copy.dealsDescription}
          count={totalItems}
          actions={(
            <PermissionGuard permission={dealPermissions.create}>
              <button type="button" onClick={beginCreateDeal} className="ui-primary-button">{copy.newDeal}</button>
            </PermissionGuard>
          )}
        />

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput);
          }}
        >
          <div className="min-w-[14rem] flex-1">
            <SearchBar value={searchInput} onChange={setSearchInput} placeholder={copy.dealsSearchPlaceholder} />
          </div>
          <FilterChip
            label={copy.filterStatus}
            value={statusFilter}
            options={[{ value: '', label: copy.all }, ...statusOptions]}
            onChange={setStatusFilter}
          />
          <FilterChip
            label={copy.filterAccount}
            value={companyFilterId}
            options={[{ value: '', label: copy.all }, ...companies.map((item) => ({ value: item.id, label: item.name }))]}
            onChange={setCompanyFilterId}
          />
          <button type="submit" className="ui-secondary-button">{copy.search}</button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setStatusFilter('');
              setCompanyFilterId('');
            }}
            className="ui-inline-button"
          >
            {copy.clear}
          </button>
        </form>

        {error ? <div className="ui-notice-error">{error}</div> : null}

        {loading && rows.length === 0 ? (
          <div className="ui-notice-neutral">{copy.dealsLoading}</div>
        ) : stages.length === 0 && !loading ? (
          <div className="ui-notice-neutral">
            {copy.dealsSetupRequired}
            <div className="mt-3">
              <Link href={pipelinePath} className="ui-secondary-button">{copy.dealsSetupAction}</Link>
            </div>
          </div>
        ) : (
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-3">
            {boardColumns.map(({ stage, deals }) => (
              <section
                key={stage?.id ?? 'no-stage'}
                aria-label={stage?.name ?? copy.noStage}
                className="flex w-72 shrink-0 flex-col gap-2 rounded-md bg-[var(--bg-subtle)] p-2"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => (stage ? void handleDropDeal(event, stage.id) : undefined)}
              >
                <div className="flex items-center justify-between gap-2 px-1">
                  <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: stage?.color || 'var(--muted)' }} aria-hidden="true" />
                    <span className="truncate">{stage?.name ?? copy.noStage}</span>
                  </h2>
                  <span className="ui-mono text-xs text-[var(--ink-2)]">{deals.length}</span>
                </div>

                <div className="flex min-h-24 flex-col gap-2">
                  {deals.map((deal) => {
                    const finance = resolveFinanceStatus(invoicesByDealId.get(deal.id), copy);
                    const overdue = deal.status === 'OPEN'
                      && Boolean(deal.expectedCloseDate)
                      && (deal.expectedCloseDate ?? '').slice(0, 10) < today;

                    return (
                      <button
                        key={deal.id}
                        type="button"
                        draggable={!isDragUpdating}
                        onDragStart={(event) => event.dataTransfer.setData('dealId', deal.id)}
                        onClick={() => beginEditDeal(deal)}
                        className="block w-full cursor-grab rounded-md border border-[color:var(--line)] bg-[var(--bg)] p-3 text-left text-sm hover:border-[color:var(--ink-2)] active:cursor-grabbing"
                      >
                        <span className="flex items-start justify-between gap-2">
                          <span className="line-clamp-2 font-medium text-[var(--ink)]">{deal.title}</span>
                          {deal.status !== 'OPEN' ? <StatusBadge status={deal.status} /> : null}
                        </span>
                        <span className="mt-1 block truncate text-xs text-[var(--ink-2)]">{companyName(deal.companyId)}</span>
                        <span className="mt-2 flex items-center justify-between gap-2 border-t border-dashed border-[color:var(--line)] pt-2 text-xs">
                          <span className="ui-mono font-semibold text-[var(--ink)]">
                            {deal.amount ? formatCurrencyForLocale(locale, deal.amount, deal.currency) : copy.noAmount}
                          </span>
                          <span className={`ui-mono ${overdue ? 'text-[var(--danger)]' : 'text-[var(--ink-2)]'}`}>
                            {deal.expectedCloseDate ? formatDealDate(deal.expectedCloseDate) : copy.noDate}
                          </span>
                        </span>
                        <span className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-[var(--ink-2)]">
                          <span className="ui-status-dot" data-status={finance.tone} aria-hidden="true" />
                          {finance.label}
                        </span>
                      </button>
                    );
                  })}
                  {deals.length === 0 ? (
                    <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-[color:var(--line)]">
                      <span className="text-xs text-[var(--muted)]">{copy.dropHere}</span>
                    </div>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        )}

        {pageData.totalPages > 1 ? (
          <Pagination
            page={pageData.page}
            totalPages={pageData.totalPages}
            totalElements={totalItems}
            pageSize={pageSize}
            onPageChange={(nextPage) => void load(nextPage, search, statusFilter, companyFilterId)}
          />
        ) : null}

        {isEditorOpen ? (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="deal-editor-title"
              className="h-full w-full max-w-xl overflow-y-auto border-l border-[color:var(--line)] bg-[var(--bg)] p-5"
            >
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 id="deal-editor-title" className="text-lg font-semibold text-[var(--ink)]">
                  {editingId ? copy.editDeal : copy.newDeal}
                </h2>
                <button type="button" onClick={() => setIsEditorOpen(false)} className="ui-secondary-button">
                  {copy.closePanel}
                </button>
              </div>

              <PermissionGuard
                permission={editingId ? dealPermissions.update : dealPermissions.create}
                fallback={<div className="ui-notice-error">{copy.dealSaveNoPermission}</div>}
              >
                <form
                  className="space-y-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSubmit();
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <FormInput
                        label={copy.fieldDealTitle}
                        placeholder={copy.fieldDealTitlePlaceholder}
                        value={title}
                        onChange={setTitle}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <FormInput label={copy.fieldSummary} value={description} onChange={setDescription} />
                    </div>
                    <FormSelect
                      label={copy.fieldAccount}
                      value={companyId}
                      options={[{ value: '', label: copy.selectAccount }, ...companies.map((item) => ({ value: item.id, label: item.name }))]}
                      onChange={setCompanyId}
                    />
                    <FormSelect
                      label={copy.fieldStage}
                      value={pipelineStageId}
                      options={[{ value: '', label: copy.selectStage }, ...stages.map((item) => ({ value: item.id, label: `${item.position}. ${item.name}` }))]}
                      onChange={setPipelineStageId}
                    />
                    <FormInput label={copy.fieldAmount} value={amount} onChange={setAmount} type="number" />
                    <FormSelect
                      label={copy.fieldCurrency}
                      value={currency}
                      options={[{ value: 'BRL', label: 'BRL' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]}
                      onChange={setCurrency}
                    />
                    <DateInput label={copy.fieldExpectedClose} value={expectedCloseDate} onChange={setExpectedCloseDate} />
                    <FormSelect label={copy.filterStatus} value={status} options={statusOptions} onChange={setStatus} />
                  </div>

                  <FormSection title={copy.sectionLinks}>
                    <FormSelect
                      label={copy.fieldContact}
                      value={contactId}
                      options={[
                        { value: '', label: copy.noLinkedContact },
                        ...contacts.map((item) => ({ value: item.id, label: `${item.firstName} ${item.lastName ?? ''}`.trim() }))
                      ]}
                      onChange={setContactId}
                    />
                    <FormSelect
                      label={copy.fieldSourceLead}
                      value={leadId}
                      options={[{ value: '', label: copy.noLinkedLead }, ...leads.map((item) => ({ value: item.id, label: item.name }))]}
                      onChange={setLeadId}
                    />
                  </FormSection>

                  {editingId ? (
                    <section aria-labelledby="deal-finance" className="space-y-2 border-t border-[color:var(--line)] pt-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 id="deal-finance" className="text-sm font-semibold text-[var(--ink)]">{copy.sectionFinance}</h3>
                        {editingInvoice ? (
                          <Link
                            href="/finance/invoices"
                            onClick={() => setIsEditorOpen(false)}
                            className="text-sm text-[var(--ink-2)] underline-offset-2 hover:text-[var(--ink)] hover:underline"
                          >
                            {copy.viewInFinance}
                          </Link>
                        ) : null}
                      </div>

                      {editingInvoice ? (
                        <div className="space-y-1 text-sm">
                          <p className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-[var(--ink)]">
                              <span className="ui-status-dot" data-status={editingFinance.tone} aria-hidden="true" />
                              {editingFinance.label}
                            </span>
                            {editingInvoice.totalAmount > 0 ? (
                              <span className="ui-mono font-semibold text-[var(--ink)]">
                                {formatCurrencyForLocale(locale, editingInvoice.totalAmount, editingInvoice.currency)}
                              </span>
                            ) : null}
                          </p>
                          {editingInvoice.outstandingAmount > 0 && editingInvoice.status !== 'PAID' ? (
                            <p className="text-xs text-[var(--ink-2)]">
                              {copy.invoiceOutstanding}{' '}
                              <span className="ui-mono">{formatCurrencyForLocale(locale, editingInvoice.outstandingAmount, editingInvoice.currency)}</span>
                            </p>
                          ) : null}
                          {editingInvoice.paidAt ? (
                            <p className="text-xs text-[var(--ink-2)]">
                              {copy.invoicePaidOn.replace('{date}', formatDateForLocale(locale, editingInvoice.paidAt))}
                            </p>
                          ) : null}
                        </div>
                      ) : editingDeal?.amount ? (
                        <div className="space-y-2">
                          <p className="text-sm text-[var(--ink-2)]">{copy.invoiceMissing}</p>
                          <PermissionGuard permission="finance.invoice.create">
                            <button
                              type="button"
                              disabled={generatingInvoice}
                              onClick={() => void handleGenerateInvoice(editingDeal)}
                              className="ui-secondary-button"
                            >
                              {generatingInvoice ? copy.generatingInvoice : copy.generateInvoice}
                            </button>
                          </PermissionGuard>
                        </div>
                      ) : (
                        <p className="text-sm text-[var(--ink-2)]">{copy.invoiceNeedsAmount}</p>
                      )}
                    </section>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--line)] pt-4">
                    <div className={sharedFormActionsClass}>
                      <button
                        type="submit"
                        disabled={saving || !title.trim() || !companyId || !pipelineStageId}
                        className="ui-primary-button"
                      >
                        {saving ? copy.saving : editingId ? copy.saveDeal : copy.addDeal}
                      </button>
                      <button type="button" onClick={() => setIsEditorOpen(false)} className="ui-secondary-button">
                        {copy.cancel}
                      </button>
                    </div>

                    {editingDeal ? (
                      <PermissionGuard permission={dealPermissions.delete}>
                        <button type="button" onClick={() => setDeleteCandidate(editingDeal)} className="ui-inline-danger-button">
                          {copy.deleteDeal}
                        </button>
                      </PermissionGuard>
                    ) : null}
                  </div>
                </form>
              </PermissionGuard>
            </div>
          </div>
        ) : null}

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title={copy.dealDeleteTitle}
          description={deleteCandidate ? copy.dealDeleteDescription.replace('{title}', deleteCandidate.title) : undefined}
          confirmLabel={copy.dealDeleteConfirm}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </PermissionGuard>
  );
}
