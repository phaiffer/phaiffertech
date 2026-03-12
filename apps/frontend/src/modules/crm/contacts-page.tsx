'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { crmService } from '@/shared/services/crm-service';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { CrmCompany, CrmContact } from '@/shared/types/crm';
import { PageResponse } from '@/shared/types/common';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';

const pageSize = 10;
const statusOptions = [
  { value: '', label: 'Todos' },
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
        const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar companies para filtro.';
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
      const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar contatos.';
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
      const message = err instanceof ApiClientError ? err.message : 'Erro ao excluir contato.';
      setError(message);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const companyOptions = [
    { value: '', label: loadingCompanies ? 'Carregando companies...' : 'Todas as companies' },
    ...companies.map((company) => ({
      value: company.id,
      label: company.name
    }))
  ];

  const columns: DataTableColumn<CrmContact>[] = [
    {
      key: 'name',
      header: 'Nome',
      render: (contact) => `${contact.firstName} ${contact.lastName ?? ''}`.trim()
    },
    {
      key: 'company',
      header: 'Empresa',
      render: (contact) => contact.company ?? '-'
    },
    {
      key: 'email',
      header: 'Email',
      render: (contact) => contact.email ?? '-'
    },
    {
      key: 'status',
      header: 'Status',
      render: (contact) => contact.status
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (contact) => (
        <div className="flex gap-2">
          <PermissionGuard permission="crm.contact.update">
            <Link
              href={`/crm/contacts/${contact.id}`}
              className="ui-inline-button"
            >
              Editar
            </Link>
          </PermissionGuard>

          <PermissionGuard permission="crm.contact.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(contact)}
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
      permission="crm.contact.read"
      fallback={<div className="ui-notice-warning">Você não possui permissão para visualizar contatos.</div>}
    >
      <div className="space-y-5">
        <PageTitle
          title="CRM Contacts"
          description="Listagem de contatos com busca, filtros e ações controladas por permissão."
        />

        <div className="grid gap-3 ui-surface-panel p-4 md:grid-cols-[1fr_180px_220px_auto_auto]">
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Nome, email, empresa"
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
          <button
            type="button"
            onClick={() => setSearch(searchInput)}
            className="ui-primary-button"
          >
            Buscar
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
            Limpar
          </button>
        </div>

        <div className="flex justify-end">
          <PermissionGuard permission="crm.contact.create">
            <Link
              href="/crm/contacts/new"
              className="ui-primary-button"
            >
              Novo contato
            </Link>
          </PermissionGuard>
        </div>

        {error ? (
          <div className="ui-notice-error">{error}</div>
        ) : null}

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          emptyMessage="Nenhum contato encontrado."
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          onPageChange={(nextPage) => load(nextPage, search, statusFilter, companyFilterId)}
        />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir contato"
          description={deleteCandidate ? `Confirma a exclusão de ${deleteCandidate.firstName}?` : undefined}
          confirmLabel="Excluir"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
