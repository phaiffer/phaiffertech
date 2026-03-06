'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { crmService } from '@/shared/services/crm-service';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { CrmLead } from '@/shared/types/crm';
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
  { value: 'NEW', label: 'NEW' },
  { value: 'QUALIFIED', label: 'QUALIFIED' },
  { value: 'WON', label: 'WON' },
  { value: 'LOST', label: 'LOST' }
];

const sourceOptions = [
  { value: '', label: 'Todas' },
  { value: 'WEBSITE', label: 'WEBSITE' },
  { value: 'EVENT', label: 'EVENT' },
  { value: 'REFERRAL', label: 'REFERRAL' }
];

const initialPage: PageResponse<CrmLead> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

export function CrmLeadsPage() {
  const [pageData, setPageData] = useState<PageResponse<CrmLead>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState<CrmLead | null>(null);

  const load = useCallback(async (page: number, currentSearch: string, currentStatus: string, currentSource: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await crmService.listLeads(page, pageSize, currentSearch, {
        status: currentStatus || undefined,
        source: currentSource || undefined
      });
      setPageData(result);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar leads.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0, search, statusFilter, sourceFilter);
  }, [load, search, statusFilter, sourceFilter]);

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await crmService.deleteLead(deleteCandidate.id);
      setDeleteCandidate(null);
      await load(pageData.page, search, statusFilter, sourceFilter);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao excluir lead.';
      setError(message);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

  const columns: DataTableColumn<CrmLead>[] = [
    {
      key: 'name',
      header: 'Nome',
      render: (lead) => lead.name
    },
    {
      key: 'source',
      header: 'Origem',
      render: (lead) => lead.source ?? '-'
    },
    {
      key: 'email',
      header: 'Email',
      render: (lead) => lead.email ?? '-'
    },
    {
      key: 'status',
      header: 'Status',
      render: (lead) => lead.status
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (lead) => (
        <div className="flex gap-2">
          <PermissionGate permission="crm.lead.update">
            <Link
              href={`/crm/leads/${lead.id}`}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </Link>
          </PermissionGate>

          <PermissionGate permission="crm.lead.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(lead)}
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
      permission="crm.lead.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar leads.</div>}
    >
      <div className="space-y-5">
        <PageTitle
          title="CRM Leads"
          description="Listagem de leads com filtros, paginação e controle de permissões."
        />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_180px_auto_auto]">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Nome, email, origem"
          />
          <FormSelect
            label="Status"
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
          />
          <FormSelect
            label="Origem"
            value={sourceFilter}
            options={sourceOptions}
            onChange={setSourceFilter}
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
              setSourceFilter('');
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Limpar
          </button>
        </div>

        <div className="flex justify-end">
          <PermissionGate permission="crm.lead.create">
            <Link
              href="/crm/leads/new"
              className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white"
            >
              Novo lead
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
          emptyMessage="Nenhum lead encontrado."
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          onPageChange={(nextPage) => load(nextPage, search, statusFilter, sourceFilter)}
        />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir lead"
          description={deleteCandidate ? `Confirma a exclusão de ${deleteCandidate.name}?` : undefined}
          confirmLabel="Excluir"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGate>
  );
}
