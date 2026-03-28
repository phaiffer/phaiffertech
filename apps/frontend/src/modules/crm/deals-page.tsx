'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import {
  sharedFilterToolbarClass,
  sharedFormActionsClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { crmService, CreateDealInput, UpdateDealInput } from '@/shared/services/crm-service';
import { financeService } from '@/shared/services/finance-service';
import { CrmCompany, CrmContact, CrmDeal, CrmLead, CrmPipelineStage } from '@/shared/types/crm';
import { FinanceInvoice } from '@/shared/types/finance';
import { PageResponse } from '@/shared/types/common';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DateInput } from '@/shared/ui/date-input';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 50;
const statusOptions = [
  { value: '', label: 'All' },
  { value: 'OPEN', label: 'OPEN' },
  { value: 'WON', label: 'WON' },
  { value: 'LOST', label: 'LOST' }
];
const formStatusOptions = statusOptions.filter((option) => option.value);
const initialPage: PageResponse<CrmDeal> = { items: [], totalItems: 0, totalPages: 0, page: 0, size: pageSize };

/* ─── Finance status helpers ─────────────────────────────────────────────── */

function resolveFinanceStatus(invoice: FinanceInvoice | undefined): { label: string; className: string } {
  if (!invoice) return { label: 'No invoice', className: 'text-[color:var(--app-shell-muted)]' };
  if (invoice.status === 'PAID') return { label: 'Payment completed', className: 'text-emerald-600 dark:text-emerald-400' };
  if (invoice.status === 'ISSUED') return { label: 'Awaiting payment', className: 'text-amber-600 dark:text-amber-400' };
  if (invoice.status === 'DRAFT') return { label: 'Draft invoice', className: 'text-blue-600 dark:text-blue-400' };
  if (invoice.status === 'CANCELED') return { label: 'Invoice canceled', className: 'text-[color:var(--app-shell-muted)] line-through' };
  return { label: 'Invoice pending', className: 'text-[color:var(--app-shell-muted)]' };
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export function CrmDealsPage() {
  const [pageData, setPageData] = useState<PageResponse<CrmDeal>>(initialPage);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [stages, setStages] = useState<CrmPipelineStage[]>([]);
  const [invoicesByDealId, setInvoicesByDealId] = useState<Map<string, FinanceInvoice>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CrmDeal | null>(null);

  // Kanban & Drawer state
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
        crmService.listCompanies(0, 100),
        crmService.listContacts(0, 100),
        crmService.listLeads(0, 100),
        crmService.listPipelineStages(0, 100)
      ]);
      setCompanies(resolvePageItems(companiesPage));
      setContacts(resolvePageItems(contactsPage));
      setLeads(resolvePageItems(leadsPage));
      setStages(resolvePageItems(stagesPage).sort((a, b) => a.position - b.position));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load deal dependencies for the CRM workspace.');
    }
  }, []);

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
      // Finance context is non-critical — silently ignore errors
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
      const result = await crmService.listDeals(page, pageSize, currentSearch, {
        status: currentStatus || undefined,
        companyId: currentCompanyId || undefined
      });
      setPageData(result);
      await loadInvoices();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load CRM deals.');
    } finally {
      setLoading(false);
    }
  }, [loadInvoices]);

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

  function beginEditDeal(row: CrmDeal) {
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
      setError('Title, company, and pipeline stage are required.');
      return;
    }

    const payload: CreateDealInput | UpdateDealInput = {
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
        await crmService.updateDeal(editingId, payload as UpdateDealInput);
      } else {
        await crmService.createDeal(payload);
      }
      setIsEditorOpen(false);
      resetForm();
      await load(pageData.page, search, statusFilter, companyFilterId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to save the deal.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteCandidate) return;
    try {
      await crmService.deleteDeal(deleteCandidate.id);
      setDeleteCandidate(null);
      setIsEditorOpen(false);
      await load(pageData.page, search, statusFilter, companyFilterId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to delete the selected deal.');
    }
  }

  async function handleGenerateInvoice(deal: CrmDeal) {
    if (generatingInvoice) return;
    setGeneratingInvoice(true);
    setError(null);
    try {
      const company = companies.find((c) => c.id === deal.companyId);
      await financeService.createInvoice({
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
      setError(err instanceof ApiClientError ? err.message : 'Unable to generate invoice for this deal.');
    } finally {
      setGeneratingInvoice(false);
    }
  }

  async function handleDropDeal(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    if (!dealId || isDragUpdating) return;

    const deal = rows.find(d => d.id === dealId);
    if (!deal || deal.pipelineStageId === stageId) return;

    setIsDragUpdating(true);
    try {
      const payload: UpdateDealInput = {
        title: deal.title,
        description: deal.description ?? undefined,
        amount: String(deal.amount) ? Number(deal.amount) : undefined,
        currency: deal.currency,
        status: deal.status,
        companyId: deal.companyId,
        pipelineStageId: stageId,
        contactId: deal.contactId ?? undefined,
        leadId: deal.leadId ?? undefined,
        expectedCloseDate: deal.expectedCloseDate ?? undefined
      };

      await crmService.updateDeal(dealId, payload);
      await load(pageData.page, search, statusFilter, companyFilterId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to move deal.');
    } finally {
      setIsDragUpdating(false);
    }
  }

  function handleDragStart(e: React.DragEvent, dealId: string) {
    e.dataTransfer.setData('dealId', dealId);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  const activeFilterCount = [search, statusFilter, companyFilterId].filter(Boolean).length;
  const companyOptions = [{ value: '', label: 'Select a company' }, ...companies.map((item) => ({ value: item.id, label: item.name }))];
  const filterCompanyOptions = [{ value: '', label: 'All companies' }, ...companies.map((item) => ({ value: item.id, label: item.name }))];
  const stageOptions = [{ value: '', label: 'Select a pipeline stage' }, ...stages.map((item) => ({ value: item.id, label: `${item.position}. ${item.name}` }))];
  const contactOptions = [{ value: '', label: 'No linked contact' }, ...contacts.map((item) => ({ value: item.id, label: `${item.firstName} ${item.lastName ?? ''}`.trim() }))];
  const leadOptions = [{ value: '', label: 'No linked lead' }, ...leads.map((item) => ({ value: item.id, label: item.name }))];
  const companyName = (id?: string) => companies.find((item) => item.id === id)?.name ?? '-';

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const openDealsOnPage = rows.filter((row) => row.status === 'OPEN').length;

  function formatDealAmount(row: CrmDeal) {
    if (!row.amount) return 'No amount defined';
    return formatCurrency(row.amount, row.currency);
  }

  const columnsData = stages.map(stage => ({
    stage,
    deals: rows.filter(r => r.pipelineStageId === stage.id)
  }));
  const uncategorizedDeals = rows.filter(r => !stages.some(s => s.id === r.pipelineStageId));
  if (uncategorizedDeals.length > 0) {
    columnsData.push({ stage: { id: '', name: 'Uncategorized', position: 99, color: '#475569' } as CrmPipelineStage, deals: uncategorizedDeals });
  }

  return (
    <PermissionGuard
      permission="crm.deal.read"
      fallback={<div className="ui-notice-warning">You do not have permission to view CRM deals.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="CRM workspace"
          title="Deals"
          description="Track opportunities on a single board without turning the page into a reporting layer."
          actions={(
            <PermissionGuard permission="crm.deal.create">
              <button type="button" onClick={beginCreateDeal} className="ui-primary-button">
                Add deal
              </button>
            </PermissionGuard>
          )}
        />

        <PageSection
          tone="muted"
          title="Filters"
          description="Focus the board by search, lifecycle, and account."
        >
          <div className={sharedFilterToolbarClass}>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_220px_260px] xl:items-end">
              <SearchBar
                label="Search"
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Title, summary, or currency"
              />
              <FormSelect label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
              <FormSelect label="Company" value={companyFilterId} options={filterCompanyOptions} onChange={setCompanyFilterId} />
            </div>

            <div className={sharedFormActionsClass}>
              <button type="button" onClick={() => setSearch(searchInput)} className="ui-primary-button">
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setStatusFilter('');
                  setCompanyFilterId('');
                }}
                className="ui-secondary-button"
              >
                Clear
              </button>
              <p className="text-sm text-[color:var(--app-shell-muted)]">
                {activeFilterCount > 0
                  ? `${activeFilterCount} filter(s) updating the board view.`
                  : 'No active filters.'}
              </p>
            </div>
          </div>
        </PageSection>

        {error ? <div className="ui-notice-error">{error}</div> : null}

        <PageSection
          title="Pipeline board"
          description="Move opportunities by stage and open a deal only when you need details."
          actions={(
            <p className="text-sm text-[color:var(--app-shell-muted)]">
              {openDealsOnPage} open deal(s) · {stages.length} stage(s) · {totalItems} total
            </p>
          )}
        >
          <div className="flex gap-6 overflow-x-auto pb-8 pt-1">
            {loading && rows.length === 0 ? (
              <div className="w-full py-20 text-center text-[color:var(--app-shell-muted)]">
                Loading pipeline data...
              </div>
            ) : stages.length === 0 && !loading ? (
              <div className="ui-notice-neutral w-full">
                The Kanban board requires at least one pipeline stage to be configured.
                <div className="mt-3 flex gap-2">
                  <Link href="/crm/pipeline" className="ui-secondary-button">Configure pipeline stages</Link>
                </div>
              </div>
            ) : (
              columnsData.map(({ stage, deals }) => (
                <div
                  key={stage.id || 'uncat'}
                  className="flex min-w-[320px] max-w-[320px] shrink-0 flex-col rounded-xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-3"
                  onDragOver={handleDragOver}
                  onDrop={(e) => stage.id ? handleDropDeal(e, stage.id) : undefined}
                >
                  <div className="mb-4 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color || '#94a3b8' }} />
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--app-shell-heading)]">{stage.name}</h3>
                    </div>
                    <span className="rounded-full border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-surface)] px-2.5 py-0.5 text-xs font-medium text-[color:var(--app-shell-muted)]">
                      {deals.length}
                    </span>
                  </div>

                  <div className="flex min-h-[150px] flex-col gap-3">
                    {deals.map((deal) => {
                      const invoice = invoicesByDealId.get(deal.id);
                      const fs = resolveFinanceStatus(invoice);
                      return (
                        <div
                          key={deal.id}
                          draggable={!isDragUpdating}
                          onDragStart={(e) => handleDragStart(e, deal.id)}
                          onClick={() => beginEditDeal(deal)}
                          className="group cursor-grab rounded-lg border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-surface)] p-4 shadow-sm transition-all duration-200 hover:border-blue-500/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:cursor-grabbing"
                          tabIndex={0}
                          role="button"
                        >
                          <div className="mb-3 flex items-start justify-between gap-2">
                            <p className="line-clamp-2 font-semibold leading-tight text-[color:var(--app-shell-heading)]">{deal.title}</p>
                            {deal.status !== 'OPEN' ? <StatusBadge status={deal.status} /> : null}
                          </div>

                          <div className="space-y-2">
                            <p className="line-clamp-1 text-sm font-medium text-[color:var(--app-shell-muted)]">
                              {companyName(deal.companyId)}
                            </p>

                            <div className="flex items-center justify-between border-t border-[color:var(--app-shell-border)] pt-2 text-sm">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatDealAmount(deal)}
                              </span>
                              <span className={new Date(deal.expectedCloseDate || '2099') < new Date()
                                ? 'text-xs font-medium text-red-500'
                                : 'text-xs text-[color:var(--app-shell-muted)]'}>
                                {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'No date'}
                              </span>
                            </div>

                            <p className={`text-[11px] font-medium ${fs.className}`}>
                              {fs.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {deals.length === 0 ? (
                      <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-[color:var(--app-shell-border)] bg-transparent">
                        <span className="text-sm text-[color:var(--app-shell-muted)] opacity-60">Drop deals here</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </PageSection>

        {pageData.totalPages > 1 && (
          <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={totalItems} onPageChange={(nextPage) => void load(nextPage, search, statusFilter, companyFilterId)} />
        )}

        {/* SIDE DRAWER */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-xl h-full overflow-y-auto bg-[color:var(--app-shell-surface)] p-[var(--space-6)] shadow-2xl animate-in slide-in-from-right duration-300 border-l border-[color:var(--app-shell-border)]">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-[color:var(--app-shell-heading)]">
                    {editingId ? 'Edit deal' : 'Create deal'}
                  </h2>
                  <p className="text-sm mt-1 text-[color:var(--app-shell-muted)]">
                    {editingId ? 'Update opportunity details and forecast.' : 'Add a new opportunity to the pipeline.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-full p-2 text-[color:var(--app-shell-muted)] hover:bg-[color:var(--app-shell-panel-muted)] hover:text-[color:var(--app-shell-heading)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close panel"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-6">
                <PermissionGuard permission={editingId ? 'crm.deal.update' : 'crm.deal.create'} fallback={<div className="ui-notice-error">Missing permissions to save this deal.</div>}>
                  <form className="space-y-6 flex flex-col h-full" onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <FormInput label="Deal title" placeholder="e.g. Enterprise License Expansion" value={title} onChange={setTitle} required />
                      </div>

                      <div className="sm:col-span-2">
                        <FormInput label="Commercial summary" value={description} onChange={setDescription} />
                      </div>

                      <FormSelect label="Company" value={companyId} options={companyOptions} onChange={setCompanyId} />
                      <FormSelect label="Pipeline stage" value={pipelineStageId} options={stageOptions} onChange={setPipelineStageId} />

                      <FormInput label="Amount" value={amount} onChange={setAmount} type="number" />
                      <FormSelect label="Currency" value={currency} options={[{ value: 'BRL', label: 'BRL' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} onChange={setCurrency} />

                      <DateInput label="Expected close date" value={expectedCloseDate} onChange={setExpectedCloseDate} />
                      <FormSelect label="Status" value={status} options={formStatusOptions} onChange={setStatus} />

                      <div className="sm:col-span-2 pt-4 border-t border-[color:var(--app-shell-border)] grid gap-5 sm:grid-cols-2">
                        <h3 className="sm:col-span-2 text-sm font-semibold uppercase tracking-wider text-[color:var(--app-shell-muted)]">Optional Linkages</h3>
                        <FormSelect label="Primary contact" value={contactId} options={contactOptions} onChange={setContactId} />
                        <FormSelect label="Source lead" value={leadId} options={leadOptions} onChange={setLeadId} />
                      </div>

                      {/* Finance section — visible only when editing an existing deal */}
                      {editingId && (() => {
                        const deal = rows.find(r => r.id === editingId);
                        const invoice = invoicesByDealId.get(editingId);
                        const fs = resolveFinanceStatus(invoice);
                        return (
                          <div className="sm:col-span-2 pt-4 border-t border-[color:var(--app-shell-border)] space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--app-shell-muted)]">Finance</h3>
                              {invoice && (
                                <Link
                                  href="/finance/invoices"
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                  onClick={() => setIsEditorOpen(false)}
                                >
                                  View in Finance →
                                </Link>
                              )}
                            </div>

                            {invoice ? (
                              <div className="rounded-xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className={`text-sm font-medium ${fs.className}`}>{fs.label}</span>
                                  {invoice.totalAmount > 0 && (
                                    <span className="text-sm font-semibold text-[color:var(--app-shell-heading)]">
                                      {formatCurrency(invoice.totalAmount, invoice.currency)}
                                    </span>
                                  )}
                                </div>
                                {invoice.outstandingAmount > 0 && invoice.status !== 'PAID' && (
                                  <p className="text-xs text-[color:var(--app-shell-muted)]">
                                    Outstanding: {formatCurrency(invoice.outstandingAmount, invoice.currency)}
                                  </p>
                                )}
                                {invoice.paidAt && (
                                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                    Paid on {new Date(invoice.paidAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-4 space-y-3">
                                {deal?.amount ? (
                                  <>
                                    <p className="text-sm text-[color:var(--app-shell-muted)]">
                                      No invoice yet for this deal.
                                    </p>
                                    <PermissionGuard permission="finance.invoice.create">
                                      <button
                                        type="button"
                                        disabled={generatingInvoice}
                                        onClick={() => deal && void handleGenerateInvoice(deal)}
                                        className="ui-secondary-button text-sm"
                                      >
                                        {generatingInvoice ? 'Generating...' : 'Generate invoice'}
                                      </button>
                                    </PermissionGuard>
                                  </>
                                ) : (
                                  <p className="text-sm text-[color:var(--app-shell-muted)]">
                                    Set a deal amount to enable invoice generation.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    <div className="mt-8 pt-6 border-t border-[color:var(--app-shell-border)] flex flex-wrap items-center justify-between gap-4">
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={saving || !title.trim() || !companyId || !pipelineStageId}
                          className="ui-primary-button"
                        >
                          {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add to board'}
                        </button>
                        <button type="button" onClick={() => setIsEditorOpen(false)} className="ui-secondary-button">
                          Cancel
                        </button>
                      </div>

                      {editingId && (
                        <PermissionGuard permission="crm.deal.delete">
                          <button type="button" onClick={() => setDeleteCandidate(rows.find(r => r.id === editingId) || null)} className="text-red-600 hover:text-red-700 font-medium text-sm px-3 py-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30">
                            Delete deal
                          </button>
                        </PermissionGuard>
                      )}
                    </div>
                  </form>
                </PermissionGuard>
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Delete opportunity"
          description={deleteCandidate ? `Are you sure you want to permanently remove "${deleteCandidate.title}" from the pipeline? This action cannot be undone.` : undefined}
          confirmLabel="Delete forever"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </PermissionGuard>
  );
}
