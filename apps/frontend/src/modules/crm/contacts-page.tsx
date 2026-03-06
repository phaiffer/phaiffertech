'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { crmService } from '@/shared/services/crm-service';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { CrmContact } from '@/shared/types/crm';
import { PageResponse } from '@/shared/types/common';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchInput } from '@/shared/ui/search-input';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { PermissionGate } from '@/shared/permissions/permission-gate';

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
      const result = await crmService.listContacts(page, pageSize, currentSearch, {
        status: currentStatus || undefined
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
    load(0, search, statusFilter);
  }, [load, search, statusFilter]);

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await crmService.deleteContact(deleteCandidate.id);
      setDeleteCandidate(null);
      await load(pageData.page, search, statusFilter);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao excluir contato.';
      setError(message);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

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
          <PermissionGate permission="crm.contact.update">
            <Link
              href={`/crm/contacts/${contact.id}`}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </Link>
          </PermissionGate>

          <PermissionGate permission="crm.contact.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(contact)}
              className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700"
            >
              Excluir
            </button>
          </PermissionGate>
        </div>
      )
    }
  ];

  return (
    <PermissionGate
      permission="crm.contact.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar contatos.</div>}
    >
      <div className="space-y-5">
        <PageTitle
          title="CRM Contacts"
          description="Listagem de contatos com busca, filtros e ações controladas por permissão."
        />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_auto_auto]">
          <SearchInput
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
          <button
            type="button"
            onClick={() => setSearch(searchInput)}
            className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
              setStatusFilter('');
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Limpar
          </button>
        </div>

        <div className="flex justify-end">
          <PermissionGate permission="crm.contact.create">
            <Link
              href="/crm/contacts/new"
              className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white"
            >
              Novo contato
            </Link>
          </PermissionGate>
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
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
          onPageChange={(nextPage) => load(nextPage, search, statusFilter)}
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
    </PermissionGate>
  );
}
