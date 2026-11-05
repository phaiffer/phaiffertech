'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { sharedInlineActionsClass, sharedPageStackClass } from '@/shared/components/public-visual-system';
import { petCommercialPermissions } from '@/shared/auth/pet-commercial-permissions';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatDateTimeForLocale } from '@/shared/i18n/formatters';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petCommercialService } from '@/shared/services/pet-commercial-service';
import { PageResponse } from '@/shared/types/common';
import { PetCommercialAccount, PetCommercialLead, PetCommercialSupportContact } from '@/shared/types/pet-commercial';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FilterChip } from '@/shared/ui/filter-chip';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 14;
const basePath = '/pet/commercial/leads';

const initialPage: PageResponse<PetCommercialLead> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function contactLabel(contact: PetCommercialSupportContact) {
  return `${contact.firstName} ${contact.lastName ?? ''}`.trim();
}

export function CrmLeadsPage() {
  const { locale } = useAppI18n();
  const copy = useAppMessages().screens.petCommercial;
  const commercialService = petCommercialService;
  const leadPermissions = petCommercialPermissions.leads;
  const [pageData, setPageData] = useState<PageResponse<PetCommercialLead>>(initialPage);
  const [companies, setCompanies] = useState<PetCommercialAccount[]>([]);
  const [contacts, setContacts] = useState<PetCommercialSupportContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [companyFilterId, setCompanyFilterId] = useState('');
  const [contactFilterId, setContactFilterId] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<PetCommercialLead | null>(null);

  useEffect(() => {
    let active = true;

    setLoadingCompanies(true);
    commercialService.listCompanies(0, 100)
      .then((companiesPage) => {
        if (active) {
          setCompanies(resolvePageItems(companiesPage));
        }
      })
      .catch((err) => {
        if (active) {
          const message = resolveApiErrorMessage(err, copy.accountsLoadError);
          setError((current) => current ?? message);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingCompanies(false);
        }
      });

    return () => {
      active = false;
    };
  }, [commercialService, copy.accountsLoadError]);

  useEffect(() => {
    let active = true;

    setLoadingContacts(true);
    commercialService.listContacts(0, 100, '', {
      companyId: companyFilterId || undefined
    })
      .then((contactsPage) => {
        if (active) {
          setContacts(resolvePageItems(contactsPage));
        }
      })
      .catch((err) => {
        if (active) {
          const message = resolveApiErrorMessage(err, copy.contactsLoadError);
          setError((current) => current ?? message);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingContacts(false);
        }
      });

    return () => {
      active = false;
    };
  }, [commercialService, companyFilterId, copy.contactsLoadError]);

  const load = useCallback(async (
    page: number,
    currentSearch: string,
    currentStatus: string,
    currentSource: string,
    currentCompanyId: string,
    currentContactId: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await commercialService.listLeads(page, pageSize, currentSearch, {
        status: currentStatus || undefined,
        source: currentSource || undefined,
        companyId: currentCompanyId || undefined,
        contactId: currentContactId || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.leadsLoadError));
    } finally {
      setLoading(false);
    }
  }, [commercialService, copy.leadsLoadError]);

  useEffect(() => {
    void load(0, search, statusFilter, sourceFilter, companyFilterId, contactFilterId);
  }, [companyFilterId, contactFilterId, load, search, sourceFilter, statusFilter]);

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await commercialService.deleteLead(deleteCandidate.id);
      setDeleteCandidate(null);
      await load(pageData.page, search, statusFilter, sourceFilter, companyFilterId, contactFilterId);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.leadDeleteError));
    }
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setStatusFilter('');
    setSourceFilter('');
    setCompanyFilterId('');
    setContactFilterId('');
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const sourceLabels: Record<string, string> = {
    WEBSITE: copy.sourceWebsite,
    EVENT: copy.sourceEvent,
    REFERRAL: copy.sourceReferral
  };
  const statusOptions = [
    { value: '', label: copy.all },
    { value: 'NEW', label: copy.statusNew },
    { value: 'QUALIFIED', label: copy.statusQualified },
    { value: 'NEGOTIATION', label: copy.statusNegotiation },
    { value: 'WON', label: copy.statusWon },
    { value: 'LOST', label: copy.statusLost }
  ];
  const sourceOptions = [
    { value: '', label: copy.all },
    ...Object.entries(sourceLabels).map(([value, label]) => ({ value, label }))
  ];
  const companyName = (companyId?: string) => companies.find((company) => company.id === companyId)?.name ?? '-';
  const contactName = (contactId?: string) => {
    const contact = contacts.find((item) => item.id === contactId);
    return contact ? contactLabel(contact) : '-';
  };

  const columns: DataTableColumn<PetCommercialLead>[] = [
    {
      key: 'lead',
      header: copy.columnLead,
      render: (lead) => (
        <div>
          <p className="font-medium text-[var(--ink)]">{lead.name}</p>
          <p className="text-xs text-[var(--ink-2)]">
            {lead.email ?? copy.noEmail}
            {lead.phone ? ` · ${lead.phone}` : ''}
          </p>
        </div>
      )
    },
    {
      key: 'source',
      header: copy.columnSource,
      render: (lead) => (lead.source ? sourceLabels[lead.source] ?? lead.source : copy.noSource)
    },
    {
      key: 'account',
      header: copy.columnAccount,
      render: (lead) => (
        <div>
          <p className="text-[var(--ink)]">{companyName(lead.companyId)}</p>
          <p className="text-xs text-[var(--ink-2)]">{contactName(lead.contactId)}</p>
        </div>
      )
    },
    {
      key: 'updatedAt',
      header: copy.columnUpdatedAt,
      render: (lead) => (
        <span className="ui-mono whitespace-nowrap text-[var(--ink-2)]">{formatDateTimeForLocale(locale, lead.updatedAt)}</span>
      )
    },
    {
      key: 'status',
      header: copy.columnStatus,
      render: (lead) => <StatusBadge status={lead.status} />
    },
    {
      key: 'actions',
      header: copy.columnActions,
      render: (lead) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission={leadPermissions.update}>
            <Link href={`${basePath}/${lead.id}`} className="ui-inline-button">{copy.edit}</Link>
          </PermissionGuard>
          <PermissionGuard permission={leadPermissions.delete}>
            <button type="button" onClick={() => setDeleteCandidate(lead)} className="ui-inline-danger-button">
              {copy.delete}
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  const newLeadLink = (
    <PermissionGuard permission={leadPermissions.create}>
      <Link href={`${basePath}/new`} className="ui-primary-button">{copy.newLead}</Link>
    </PermissionGuard>
  );

  return (
    <PermissionGuard
      permission={leadPermissions.read}
      fallback={<div className="ui-notice-warning">{copy.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          title={copy.leadsTitle}
          description={copy.leadsDescription}
          count={totalItems}
          actions={newLeadLink}
        />

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput);
          }}
        >
          <div className="min-w-[14rem] flex-1">
            <SearchBar value={searchInput} onChange={setSearchInput} placeholder={copy.leadsSearchPlaceholder} />
          </div>
          <FilterChip label={copy.filterStatus} value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
          <FilterChip label={copy.filterSource} value={sourceFilter} options={sourceOptions} onChange={setSourceFilter} />
          <FilterChip
            label={copy.filterAccount}
            value={companyFilterId}
            options={[{ value: '', label: copy.all }, ...companies.map((company) => ({ value: company.id, label: company.name }))]}
            onChange={(value) => {
              setCompanyFilterId(value);
              setContactFilterId('');
            }}
            disabled={loadingCompanies}
          />
          <FilterChip
            label={copy.filterContact}
            value={contactFilterId}
            options={[{ value: '', label: copy.all }, ...contacts.map((contact) => ({ value: contact.id, label: contactLabel(contact) }))]}
            onChange={setContactFilterId}
            disabled={loadingContacts}
          />
          <button type="submit" className="ui-secondary-button">{copy.search}</button>
          <button type="button" onClick={clearFilters} className="ui-inline-button">{copy.clear}</button>
        </form>

        {error ? <div className="ui-notice-error">{error}</div> : null}

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          emptyState={{ title: copy.leadsEmptyTitle, description: copy.leadsEmptyDescription, action: newLeadLink }}
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          pageSize={pageSize}
          onPageChange={(nextPage) => void load(nextPage, search, statusFilter, sourceFilter, companyFilterId, contactFilterId)}
        />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title={copy.leadDeleteTitle}
          description={deleteCandidate ? copy.leadDeleteDescription.replace('{name}', deleteCandidate.name) : undefined}
          confirmLabel={copy.leadDeleteConfirm}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
