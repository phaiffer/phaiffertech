'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import {
  sharedCompactTextClass,
  sharedFilterToolbarClass,
  sharedFormActionsClass,
  sharedInlineActionsClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { crmService, CreateDealInput, UpdateDealInput } from '@/shared/services/crm-service';
import { CrmCompany, CrmContact, CrmDeal, CrmLead, CrmPipelineStage } from '@/shared/types/crm';
import { PageResponse } from '@/shared/types/common';
import { DashboardSummaryCard } from '@/shared/types/dashboard';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { DateInput } from '@/shared/ui/date-input';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;
const statusOptions = [
  { value: '', label: 'All' },
  { value: 'OPEN', label: 'OPEN' },
  { value: 'WON', label: 'WON' },
  { value: 'LOST', label: 'LOST' }
];
const formStatusOptions = statusOptions.filter((option) => option.value);
const initialPage: PageResponse<CrmDeal> = { items: [], totalItems: 0, totalPages: 0, page: 0, size: pageSize };

export function CrmDealsPage() {
  const [pageData, setPageData] = useState<PageResponse<CrmDeal>>(initialPage);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [stages, setStages] = useState<CrmPipelineStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CrmDeal | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  useEffect(() => {
    void loadSupportingData();
  }, []);

  useEffect(() => {
    void load(0, search, statusFilter, companyFilterId);
  }, [search, statusFilter, companyFilterId]);

  async function loadSupportingData() {
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
      setStages(resolvePageItems(stagesPage));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load deal dependencies for the CRM workspace.');
    }
  }

  async function load(page: number, currentSearch: string, currentStatus: string, currentCompanyId: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await crmService.listDeals(page, pageSize, currentSearch, {
        status: currentStatus || undefined,
        companyId: currentCompanyId || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load CRM deals.');
    } finally {
      setLoading(false);
    }
  }

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
      await load(pageData.page, search, statusFilter, companyFilterId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to delete the selected deal.');
    }
  }

  const activeFilterCount = [search, statusFilter, companyFilterId].filter(Boolean).length;
  const companyOptions = [{ value: '', label: 'Select a company' }, ...companies.map((item) => ({ value: item.id, label: item.name }))];
  const filterCompanyOptions = [{ value: '', label: 'All companies' }, ...companies.map((item) => ({ value: item.id, label: item.name }))];
  const stageOptions = [{ value: '', label: 'Select a pipeline stage' }, ...stages.map((item) => ({ value: item.id, label: `${item.position}. ${item.name}` }))];
  const contactOptions = [{ value: '', label: 'No linked contact' }, ...contacts.map((item) => ({ value: item.id, label: `${item.firstName} ${item.lastName ?? ''}`.trim() }))];
  const leadOptions = [{ value: '', label: 'No linked lead' }, ...leads.map((item) => ({ value: item.id, label: item.name }))];
  const companyName = (id?: string) => companies.find((item) => item.id === id)?.name ?? '-';
  const stageName = (id?: string) => stages.find((item) => item.id === id)?.name ?? '-';

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const openDealsOnPage = rows.filter((row) => row.status === 'OPEN').length;
  const summaryCards: DashboardSummaryCard[] = [
    {
      key: 'deals-in-scope',
      label: 'Deals in scope',
      value: totalItems,
      trend: activeFilterCount > 0
        ? 'Results reflect the current commercial filters.'
        : 'Full deal list for this CRM workspace.'
    },
    {
      key: 'open-deals-on-page',
      label: 'Open on page',
      value: openDealsOnPage,
      trend: 'Visible opportunities still moving through the pipeline.'
    },
    {
      key: 'pipeline-stages-ready',
      label: 'Stages ready',
      value: stages.length,
      trend: 'Pipeline stages currently available for qualification and forecast.'
    },
    {
      key: 'deal-filters',
      label: 'Active filters',
      value: activeFilterCount,
      trend: activeFilterCount > 0
        ? 'The workspace is focused on a narrower pipeline slice.'
        : 'No filters are limiting the current opportunity view.'
    }
  ];

  function scrollToDealForm() {
    document.getElementById('deal-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function beginCreateDeal() {
    resetForm();
    scrollToDealForm();
  }

  function formatDealAmount(row: CrmDeal) {
    if (!row.amount) {
      return 'No amount defined';
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: row.currency
      }).format(row.amount);
    } catch {
      return `${row.currency} ${row.amount}`;
    }
  }

  const columns: DataTableColumn<CrmDeal>[] = [
    {
      key: 'deal',
      header: 'Deal',
      render: (row) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{row.title}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>{row.description ?? 'No commercial summary recorded yet'}</p>
        </div>
      )
    },
    {
      key: 'account',
      header: 'Account',
      render: (row) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{companyName(row.companyId)}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>Stage: {stageName(row.pipelineStageId)}</p>
        </div>
      )
    },
    {
      key: 'forecast',
      header: 'Forecast',
      render: (row) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{formatDealAmount(row)}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {row.expectedCloseDate ? `Expected close: ${row.expectedCloseDate}` : 'No expected close date'}
          </p>
        </div>
      )
    },
    { key: 'status', header: 'Lifecycle', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="crm.deal.update">
            <button
              type="button"
              onClick={() => {
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
                scrollToDealForm();
              }}
              className="ui-inline-button"
            >
              Edit
            </button>
          </PermissionGuard>
          <PermissionGuard permission="crm.deal.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(row)}
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
      permission="crm.deal.read"
      fallback={<div className="ui-notice-warning">You do not have permission to view CRM deals.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="CRM workspace"
          title="CRM Deals"
          description="Opportunity management with clearer pipeline context, stronger first-step guidance, and a layout that feels more consistent during demos."
          actions={(
            <PermissionGuard permission="crm.deal.create">
              <button type="button" onClick={beginCreateDeal} className="ui-primary-button">
                Add deal
              </button>
            </PermissionGuard>
          )}
        />

        <MetricGrid cards={summaryCards} columns="md:grid-cols-2 xl:grid-cols-4" />

        <PageSection
          tone="muted"
          title="Deal filters"
          description="Focus the pipeline by search, lifecycle stage, and account context while keeping the toolbar balanced and readable."
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
                  ? `${activeFilterCount} active filter(s) focusing the commercial pipeline.`
                  : 'No active filters. Showing the broader opportunity list.'}
              </p>
            </div>
          </div>
        </PageSection>

        <PermissionGuard permission={editingId ? 'crm.deal.update' : 'crm.deal.create'}>
          <div id="deal-form-section">
            <PageSection
              title={editingId ? 'Edit deal' : 'Create deal'}
              description="Keep pipeline essentials together so sales, onboarding, and demo users always know the next record required to move the opportunity forward."
              actions={<p className="text-sm text-[color:var(--app-shell-muted)]">{editingId ? 'Editing an existing opportunity' : 'Ready for a new opportunity record'}</p>}
            >
              <div className="space-y-5">
                {companies.length === 0 || stages.length === 0 ? (
                  <div className="ui-notice-neutral">
                    Deals are easier to create after the workspace has at least one company and one pipeline stage.
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href="/crm/companies" className="ui-secondary-button">
                        Open companies
                      </Link>
                      <Link href="/crm/pipeline" className="ui-secondary-button">
                        Open pipeline
                      </Link>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 xl:grid-cols-2">
                  <FormInput label="Title" value={title} onChange={setTitle} required />
                  <FormInput label="Commercial summary" value={description} onChange={setDescription} />
                  <FormInput label="Amount" value={amount} onChange={setAmount} type="number" />
                  <FormInput label="Currency" value={currency} onChange={setCurrency} />
                  <FormSelect label="Status" value={status} options={formStatusOptions} onChange={setStatus} />
                  <DateInput label="Expected close date" value={expectedCloseDate} onChange={setExpectedCloseDate} />
                  <FormSelect label="Company" value={companyId} options={companyOptions} onChange={setCompanyId} />
                  <FormSelect label="Pipeline stage" value={pipelineStageId} options={stageOptions} onChange={setPipelineStageId} />
                  <FormSelect label="Primary contact" value={contactId} options={contactOptions} onChange={setContactId} />
                  <FormSelect label="Source lead" value={leadId} options={leadOptions} onChange={setLeadId} />
                </div>

                <div className={sharedFormActionsClass}>
                  <button
                    type="button"
                    disabled={saving || !title.trim()}
                    onClick={() => void handleSubmit()}
                    className="ui-primary-button"
                  >
                    {saving ? 'Saving...' : editingId ? 'Update deal' : 'Create deal'}
                  </button>
                  <button type="button" onClick={resetForm} className="ui-secondary-button">
                    {editingId ? 'Cancel edit' : 'Reset form'}
                  </button>
                </div>
              </div>
            </PageSection>
          </div>
        </PermissionGuard>

        {error ? <div className="ui-notice-error">{error}</div> : null}

        <PageSection
          title="Deal pipeline"
          description="The opportunity table keeps account, forecast, and lifecycle details readable without falling back to an older, denser layout."
          actions={<p className="text-sm text-[color:var(--app-shell-muted)]">Total {totalItems} deal(s)</p>}
        >
          <div className="space-y-5">
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              loading={loading}
              loadingTitle="Loading deals"
              loadingDescription="Preparing opportunity data with account, pipeline, and forecast context."
              emptyState={{
                title: 'No deals found',
                description: activeFilterCount > 0
                  ? 'Adjust the filters or create a new opportunity to keep the pipeline moving.'
                  : 'Create the first deal to start tracking pipeline movement for this workspace.',
                action: (
                  <PermissionGuard permission="crm.deal.create">
                    <button type="button" onClick={beginCreateDeal} className="ui-primary-button">
                      Create first deal
                    </button>
                  </PermissionGuard>
                )
              }}
            />

            <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={totalItems} onPageChange={(nextPage) => void load(nextPage, search, statusFilter, companyFilterId)} />
          </div>
        </PageSection>

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Delete deal"
          description={deleteCandidate ? `Delete ${deleteCandidate.title} from the pipeline?` : undefined}
          confirmLabel="Delete"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </PermissionGuard>
  );
}
