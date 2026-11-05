'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { sharedInlineActionsClass, sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petClientContactSupportService } from '@/shared/services/pet-client-contact-support-service';
import { PageResponse } from '@/shared/types/common';
import { CrmContact } from '@/shared/types/crm';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FilterChip } from '@/shared/ui/filter-chip';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 14;
const basePath = '/pet/clients/contacts';

const initialPage: PageResponse<CrmContact> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

export function CrmContactsPage() {
  const copy = useAppMessages().screens.petSupportContacts;
  const [pageData, setPageData] = useState<PageResponse<CrmContact>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<CrmContact | null>(null);

  const load = useCallback(async (page: number, currentSearch: string, currentStatus: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petClientContactSupportService.listContacts(page, pageSize, currentSearch, {
        status: currentStatus || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.loadError));
    } finally {
      setLoading(false);
    }
  }, [copy.loadError]);

  useEffect(() => {
    void load(0, search, statusFilter);
  }, [load, search, statusFilter]);

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await petClientContactSupportService.deleteContact(deleteCandidate.id);
      setDeleteCandidate(null);
      await load(pageData.page, search, statusFilter);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.deleteError));
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const hasFilters = Boolean(search || statusFilter);

  const columns: DataTableColumn<CrmContact>[] = [
    {
      key: 'contact',
      header: copy.columnContact,
      render: (contact) => (
        <div>
          <p className="font-medium text-[var(--ink)]">{`${contact.firstName} ${contact.lastName ?? ''}`.trim()}</p>
          <p className="text-xs text-[var(--ink-2)]">{contact.phone ?? copy.noPhone}</p>
        </div>
      )
    },
    {
      key: 'email',
      header: copy.columnEmail,
      render: (contact) => contact.email ?? copy.noEmail
    },
    {
      key: 'status',
      header: copy.filterStatus,
      render: (contact) => <StatusBadge status={contact.status} />
    },
    {
      key: 'actions',
      header: copy.columnActions,
      render: (contact) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="crm.contact.update">
            <Link href={`${basePath}/${contact.id}`} className="ui-inline-button">{copy.edit}</Link>
          </PermissionGuard>
          <PermissionGuard permission="crm.contact.delete">
            <button type="button" onClick={() => setDeleteCandidate(contact)} className="ui-inline-danger-button">
              {copy.delete}
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  const newContactLink = (
    <PermissionGuard permission="crm.contact.create">
      <Link href={`${basePath}/new`} className="ui-primary-button">{copy.newContact}</Link>
    </PermissionGuard>
  );

  return (
    <PermissionGuard
      permission="crm.contact.read"
      fallback={<div className="ui-notice-warning">{copy.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          title={copy.title}
          description={copy.description}
          count={loading ? undefined : totalItems}
          actions={newContactLink}
        />

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput);
          }}
        >
          <div className="min-w-[14rem] flex-1">
            <SearchBar label={copy.search} value={searchInput} onChange={setSearchInput} placeholder={copy.searchPlaceholder} />
          </div>
          <FilterChip
            label={copy.filterStatus}
            value={statusFilter}
            options={[
              { value: '', label: copy.all },
              { value: 'ACTIVE', label: copy.statusActive },
              { value: 'INACTIVE', label: copy.statusInactive }
            ]}
            onChange={setStatusFilter}
          />
          <button type="submit" className="ui-secondary-button">{copy.search}</button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setStatusFilter('');
            }}
            className="ui-inline-button"
          >
            {copy.clear}
          </button>
        </form>

        {error ? <div className="ui-notice-error">{error}</div> : null}

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          emptyState={{
            title: copy.emptyTitle,
            description: hasFilters ? copy.emptyFiltered : copy.emptyDescription,
            action: newContactLink
          }}
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          pageSize={pageSize}
          onPageChange={(nextPage) => void load(nextPage, search, statusFilter)}
        />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title={copy.deleteTitle}
          description={deleteCandidate ? copy.deleteDescription.replace('{name}', deleteCandidate.firstName) : undefined}
          confirmLabel={copy.delete}
          cancelLabel={copy.cancel}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
