'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  sharedCompactTextClass,
  sharedFilterToolbarClass,
  sharedFormActionsClass,
  sharedInlineActionsClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { crmService } from '@/shared/services/crm-service';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { CrmCompany, CrmContact } from '@/shared/types/crm';
import { PageResponse } from '@/shared/types/common';
import { DashboardSummaryCard } from '@/shared/types/dashboard';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';

const pageSize = 10;
const statusOptions = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'INACTIVE', label: 'INACTIVE' }
];

const initialPage: PageResponse<CrmContact> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

export function CrmContactsPage() {
  const [pageData, setPageData] = useState<PageResponse<CrmContact>>(initialPage);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilterId, setCompanyFilterId] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<CrmContact | null>(null);

  useEffect(() => {
    let active = true;

    setLoadingCompanies(true);
    crmService.listCompanies(0, 100)
      .then((companiesPage) => {
        if (!active) {
          return;
        }
        setCompanies(resolvePageItems(companiesPage));
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const message = err instanceof ApiClientError ? err.message : 'Unable to load companies for the contact filter.';
        setError((current) => current ?? message);
      })
      .finally(() => {
        if (active) {
          setLoadingCompanies(false);
        }
      });

    return () => {
      active = false;
    };
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
      const result = await crmService.listContacts(page, pageSize, currentSearch, {
        status: currentStatus || undefined,
        companyId: currentCompanyId || undefined
      });
      setPageData(result);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Unable to load CRM contacts.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0, search, statusFilter, companyFilterId);
  }, [companyFilterId, load, search, statusFilter]);

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await crmService.deleteContact(deleteCandidate.id);
      setDeleteCandidate(null);
      await load(pageData.page, search, statusFilter, companyFilterId);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Unable to delete the selected contact.';
      setError(message);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const activeFilterCount = [search, statusFilter, companyFilterId].filter(Boolean).length;
  const activeContactsOnPage = rows.filter((contact) => contact.status === 'ACTIVE').length;
  const companyOptions = [
    { value: '', label: loadingCompanies ? 'Loading companies...' : 'All companies' },
    ...companies.map((company) => ({
      value: company.id,
      label: company.name
    }))
  ];
  const summaryCards: DashboardSummaryCard[] = [
    {
      key: 'contacts-in-scope',
      label: 'Contacts in scope',
      value: totalItems,
      trend: activeFilterCount > 0
        ? 'Results reflect the active CRM filters.'
        : 'Full contact directory for this workspace.'
    },
    {
      key: 'active-contacts-on-page',
      label: 'Active on page',
      value: activeContactsOnPage,
      trend: 'Visible records currently marked active.'
    },
    {
      key: 'companies-loaded',
      label: 'Companies loaded',
      value: companies.length,
      trend: loadingCompanies
        ? 'Refreshing account context for the filter bar.'
        : 'Available account context for linking and filtering contacts.'
    },
    {
      key: 'contact-filters',
      label: 'Active filters',
      value: activeFilterCount,
      trend: activeFilterCount > 0
        ? 'The commercial view is narrowed to a focused segment.'
        : 'No filters are limiting the current view.'
    }
  ];

  const columns: DataTableColumn<CrmContact>[] = [
    {
      key: 'contact',
      header: 'Contact',
      render: (contact) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">
            {`${contact.firstName} ${contact.lastName ?? ''}`.trim()}
          </p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>{contact.phone ?? 'No phone recorded'}</p>
        </div>
      )
    },
    {
      key: 'company',
      header: 'Company',
      render: (contact) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{contact.company ?? 'Unlinked contact'}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {contact.companyId ? 'Linked to an account record' : 'Managed without company context'}
          </p>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Primary email',
      render: (contact) => contact.email ?? 'No email recorded'
    },
    {
      key: 'status',
      header: 'Lifecycle',
      render: (contact) => <StatusBadge status={contact.status} />
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (contact) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="crm.contact.update">
            <Link
              href={`/crm/contacts/${contact.id}`}
              className="ui-inline-button"
            >
              Edit
            </Link>
          </PermissionGuard>

          <PermissionGuard permission="crm.contact.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(contact)}
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
      permission="crm.contact.read"
      fallback={<div className="ui-notice-warning">You do not have permission to view CRM contacts.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="CRM workspace"
          title="CRM Contacts"
          description="Commercial contact management with stronger filtering, clearer account context, and a more demo-ready first-use surface."
          actions={(
            <PermissionGuard permission="crm.contact.create">
              <Link
                href="/crm/contacts/new"
                className="ui-primary-button"
              >
                Add contact
              </Link>
            </PermissionGuard>
          )}
        />

        <MetricGrid cards={summaryCards} columns="md:grid-cols-2 xl:grid-cols-4" />

        <PageSection
          tone="muted"
          title="Contact filters"
          description="Refine the relationship directory by search, lifecycle status, and account context without compressing the toolbar."
        >
          <div className={sharedFilterToolbarClass}>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_220px_260px] xl:items-end">
              <SearchBar
                label="Search"
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Name, email, phone, or company"
              />
              <FormSelect
                label="Status"
                value={statusFilter}
                options={statusOptions}
                onChange={setStatusFilter}
              />
              <FormSelect
                label="Company"
                value={companyFilterId}
                options={companyOptions}
                onChange={setCompanyFilterId}
                disabled={loadingCompanies}
              />
            </div>

            <div className={sharedFormActionsClass}>
              <button
                type="button"
                onClick={() => setSearch(searchInput)}
                className="ui-primary-button"
              >
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
                  ? `${activeFilterCount} active filter(s) shaping the CRM directory.`
                  : 'No active filters. Showing the broader contact base.'}
              </p>
            </div>

            {!loadingCompanies && companies.length === 0 ? (
              <div className="ui-notice-neutral">
                No companies are available for linking or filtering yet. You can still create standalone contacts and connect them later as account data grows.
              </div>
            ) : null}
          </div>
        </PageSection>

        {error ? (
          <div className="ui-notice-error">{error}</div>
        ) : null}

        <PageSection
          title="Contact directory"
          description="The table keeps people, account context, and action controls readable during demos, onboarding, and day-to-day CRM follow-up."
          actions={<p className="text-sm text-[color:var(--app-shell-muted)]">Total {totalItems} contact(s)</p>}
        >
          <div className="space-y-5">
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              loading={loading}
              loadingTitle="Loading contacts"
              loadingDescription="Preparing the CRM contact directory with account context and lifecycle signals."
              emptyState={{
                title: 'No contacts found',
                description: activeFilterCount > 0
                  ? 'Adjust the filters or add a new contact to keep the commercial workspace moving.'
                  : 'Create the first contact to start building the relationship base for this CRM workspace.',
                action: (
                  <PermissionGuard permission="crm.contact.create">
                    <Link href="/crm/contacts/new" className="ui-primary-button">
                      Create first contact
                    </Link>
                  </PermissionGuard>
                )
              }}
            />

            <Pagination
              page={pageData.page}
              totalPages={pageData.totalPages}
              totalElements={totalItems}
              onPageChange={(nextPage) => load(nextPage, search, statusFilter, companyFilterId)}
            />
          </div>
        </PageSection>

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Delete contact"
          description={deleteCandidate ? `Delete ${deleteCandidate.firstName} from the CRM directory?` : undefined}
          confirmLabel="Delete"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
