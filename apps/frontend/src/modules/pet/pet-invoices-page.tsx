'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import {
  PetLookupFeedback,
  PetLookupIssue,
  resolvePetLookupIssue,
  resolvePetLookupLabel
} from '@/modules/pet/pet-lookup-feedback';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { PetClient, PetInvoice } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { DateTimeInput } from '@/shared/ui/datetime-input';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'ISSUED', label: 'ISSUED' },
  { value: 'PAID', label: 'PAID' },
  { value: 'CANCELED', label: 'CANCELED' }
];

const formStatusOptions = statusOptions.filter((item) => item.value);

const initialPage: PageResponse<PetInvoice> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function toDateTimeLocal(isoValue?: string) {
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
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetInvoice | null>(null);
  const canReadClients = hasPermission('pet.client.read');

  const clientOptions = useMemo(() => {
    return [
      { value: '', label: 'Todos' },
      ...clients.map((client) => ({ value: client.id, label: client.name ?? client.fullName ?? client.id }))
    ];
  }, [clients]);

  const formClientOptions = useMemo(() => {
    return [
      { value: '', label: 'Selecione um cliente' },
      ...clients.map((client) => ({ value: client.id, label: client.name ?? client.fullName ?? client.id }))
    ];
  }, [clients]);

  const loadClients = useCallback(async () => {
    if (!canReadClients) {
      setClients([]);
      setLookupIssues([{ key: 'clients', label: 'Clientes', message: resolvePetLookupIssue(null, 'pet.client.read') }]);
      return;
    }

    try {
      const result = await petService.listClients(0, 200, '');
      setClients(resolvePageItems(result));
      setLookupIssues([]);
    } catch (err) {
      setClients([]);
      setLookupIssues([{ key: 'clients', label: 'Clientes', message: resolvePetLookupIssue(err) }]);
    }
  }, [canReadClients]);

  const load = useCallback(async (page: number, currentSearch: string, currentClientId: string, currentStatus: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listInvoices(page, pageSize, currentSearch, {
        clientId: currentClientId || undefined,
        status: currentStatus || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar faturas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    load(0, search, clientFilterId, statusFilter);
  }, [load, search, clientFilterId, statusFilter]);

  function resetForm() {
    setEditingId(null);
    setClientId('');
    setTotalAmount('');
    setStatus('ISSUED');
    setIssuedAt('');
  }

  function beginEdit(item: PetInvoice) {
    setEditingId(item.id);
    setClientId(item.clientId);
    setTotalAmount(String(item.totalAmount));
    setStatus(item.status);
    setIssuedAt(toDateTimeLocal(item.issuedAt));
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedTotal = Number(totalAmount);
    const isoIssuedAt = toIsoDate(issuedAt);
    if (!clientId || Number.isNaN(parsedTotal) || parsedTotal < 0 || !isoIssuedAt) {
      setError('Selecione um cliente e informe valor/data válidos.');
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
          issuedAt: isoIssuedAt
        });
        setSuccess('Fatura atualizada com sucesso.');
      } else {
        await petService.createInvoice({
          clientId,
          totalAmount: parsedTotal,
          status,
          issuedAt: isoIssuedAt
        });
        setSuccess('Fatura criada com sucesso.');
      }

      resetForm();
      await load(pageData.page, search, clientFilterId, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar fatura.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await petService.deleteInvoice(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess('Fatura removida com sucesso.');
      await load(pageData.page, search, clientFilterId, statusFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir fatura.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const clientsLookupUnavailable = lookupIssues.some((issue) => issue.key === 'clients');

  const columns: DataTableColumn<PetInvoice>[] = [
    {
      key: 'issuedAt',
      header: 'Emitida em',
      render: (item) => new Date(item.issuedAt).toLocaleString('pt-BR')
    },
    {
      key: 'client',
      header: 'Cliente',
      render: (item) =>
        item.clientName ??
        resolvePetLookupLabel(
          clients,
          item.clientId,
          (client) => client.name ?? client.fullName,
          'Cliente',
          clientsLookupUnavailable
        )
    },
    {
      key: 'totalAmount',
      header: 'Valor',
      render: (item) => item.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    { key: 'status', header: 'Status', render: (item) => item.status },
    {
      key: 'actions',
      header: 'Ações',
      render: (item) => (
        <div className="flex gap-2">
          <PermissionGuard permission="pet.invoice.update">
            <button
              type="button"
              onClick={() => beginEdit(item)}
              className="ui-inline-button"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.invoice.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(item)}
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
      permission="pet.invoice.read"
      fallback={<div className="ui-notice-warning">Você não possui permissão para visualizar faturas.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="Pet Invoices" description="Faturamento básico por cliente dentro do escopo comercial do PET." />

        <div className="grid gap-3 ui-surface-panel p-4 md:grid-cols-[1fr_240px_180px_auto_auto]">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Pesquisar por status" />
          <FormSelect label="Cliente" value={clientFilterId} options={clientOptions} onChange={setClientFilterId} disabled={clientsLookupUnavailable} />
          <FormSelect label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
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
              setClientFilterId('');
              setStatusFilter('');
            }}
            className="ui-secondary-button"
          >
            Limpar
          </button>
        </div>

        <PetLookupFeedback issues={lookupIssues} />

        <PermissionGuard permission={editingId ? 'pet.invoice.update' : 'pet.invoice.create'}>
          <form onSubmit={handleSubmit} className="grid gap-3 ui-surface-panel p-4 md:grid-cols-2">
            <FormSelect label="Cliente" value={clientId} options={formClientOptions} onChange={setClientId} disabled={clientsLookupUnavailable} />
            <FormInput label="Valor total" value={totalAmount} onChange={setTotalAmount} type="number" required />
            <FormSelect label="Status" value={status} options={formStatusOptions} onChange={setStatus} />
            <DateTimeInput label="Emitida em" value={issuedAt} onChange={setIssuedAt} required />

            <div className="md:col-span-2 flex gap-2">
              {clientsLookupUnavailable ? (
                <div className="w-full ui-notice-warning">
                  O formulário depende da referência de clientes para emitir ou editar faturas.
                </div>
              ) : null}
              <button
                type="submit"
                disabled={submitting || clientsLookupUnavailable}
                className="ui-primary-button"
              >
                {submitting ? 'Salvando...' : editingId ? 'Atualizar fatura' : 'Criar fatura'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="ui-secondary-button"
                >
                  Cancelar edição
                </button>
              ) : null}
            </div>
          </form>
        </PermissionGuard>

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhuma fatura encontrada." />
        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          onPageChange={(page) => load(page, search, clientFilterId, statusFilter)}
        />

        <ConfirmDialog
          open={deleteCandidate !== null}
          title="Excluir fatura?"
          description={deleteCandidate ? `A fatura ${deleteCandidate.id} será removida.` : undefined}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
