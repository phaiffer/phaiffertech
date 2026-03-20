'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  sharedCompactTextClass,
  sharedFilterToolbarClass,
  sharedFormActionsClass,
  sharedInlineActionsClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { PetClient } from '@/shared/types/pet';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'INACTIVE', label: 'INACTIVE' }
];

const formStatusOptions = [
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'INACTIVE', label: 'INACTIVE' }
];

const initialPage: PageResponse<PetClient> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function PetClientsPage() {
  const [pageData, setPageData] = useState<PageResponse<PetClient>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [document, setDocument] = useState('');
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetClient | null>(null);

  const load = useCallback(async (page: number, currentSearch: string, currentStatus: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listClients(page, pageSize, currentSearch, {
        status: currentStatus || undefined
      });
      setPageData(result);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar clientes.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0, search, statusFilter);
  }, [load, search, statusFilter]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setEmail('');
    setPhone('');
    setDocument('');
    setAddress('');
    setStatus('ACTIVE');
  }

  function beginEdit(client: PetClient) {
    setEditingId(client.id);
    setName(client.name ?? client.fullName ?? '');
    setEmail(client.email ?? '');
    setPhone(client.phone ?? '');
    setDocument(client.document ?? '');
    setAddress(client.address ?? '');
    setStatus(client.status);
    setSuccess(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        await petService.updateClient(editingId, {
          name,
          email: email || undefined,
          phone: phone || undefined,
          document: document || undefined,
          address: address || undefined,
          status
        });
        setSuccess('Cliente atualizado com sucesso.');
      } else {
        await petService.createClient({
          name,
          email: email || undefined,
          phone: phone || undefined,
          document: document || undefined,
          address: address || undefined,
          status
        });
        setSuccess('Cliente criado com sucesso.');
      }

      resetForm();
      await load(pageData.page, search, statusFilter);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao salvar cliente.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await petService.deleteClient(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess('Cliente removido com sucesso.');
      await load(pageData.page, search, statusFilter);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao excluir cliente.';
      setError(message);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const activeFilterCount = [search, statusFilter].filter(Boolean).length;

  const columns: DataTableColumn<PetClient>[] = [
    {
      key: 'profile',
      header: 'Cliente',
      render: (client) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{client.name ?? client.fullName ?? '-'}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>Documento: {client.document ?? 'Não informado'}</p>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Contato',
      render: (client) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{client.email ?? 'Sem email cadastrado'}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>{client.phone ?? 'Sem telefone informado'}</p>
        </div>
      )
    },
    {
      key: 'address',
      header: 'Endereço e atualização',
      render: (client) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{client.address ?? 'Sem endereço informado'}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>Atualizado em {formatDateTime(client.updatedAt)}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (client) => <StatusBadge status={client.status} />
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (client) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="pet.client.update">
            <button
              type="button"
              onClick={() => beginEdit(client)}
              className="ui-inline-button"
            >
              Editar
            </button>
          </PermissionGuard>

          <PermissionGuard permission="pet.client.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(client)}
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
      permission="pet.client.read"
      fallback={<div className="ui-notice-warning">Você não possui permissão para visualizar clientes.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="PetFlow workspace"
          title="Clients"
          description="Gestão de clientes do módulo PET com busca, edição rápida e uma composição alinhada ao restante das áreas consolidadas da plataforma."
        />

        <PageSection
          tone="muted"
          title="Client filters"
          description="Refine the client directory by search and lifecycle status without compressing controls into an uneven toolbar."
        >
          <div className={sharedFilterToolbarClass}>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_220px] xl:items-end">
              <SearchBar
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Nome, email, telefone, endereço"
              />
              <FormSelect label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
            </div>
            <div className={sharedFormActionsClass}>
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
                }}
                className="ui-secondary-button"
              >
                Limpar
              </button>
              <p className="text-sm text-[color:var(--app-shell-muted)]">
                {activeFilterCount > 0
                  ? `${activeFilterCount} filtro(s) ativos na visão de clientes.`
                  : 'Sem filtros ativos na base de clientes.'}
              </p>
            </div>
          </div>
        </PageSection>

        <PermissionGuard permission={editingId ? 'pet.client.update' : 'pet.client.create'}>
          <PageSection
            title={editingId ? 'Edit client' : 'Register client'}
            description="Keep identity, contact data, and operational status grouped so inline editing stays fast without overpowering the page."
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 xl:grid-cols-2">
                <FormInput label="Nome" value={name} onChange={setName} required />
                <FormSelect label="Status" value={status} options={formStatusOptions} onChange={setStatus} />
                <FormInput label="Email" value={email} onChange={setEmail} type="email" />
                <FormInput label="Telefone" value={phone} onChange={setPhone} />
                <FormInput label="Documento" value={document} onChange={setDocument} />
                <div className="hidden xl:block" />
                <FormInput label="Endereço" value={address} onChange={setAddress} wrapperClassName="xl:col-span-2" />
              </div>

              <div className={sharedFormActionsClass}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="ui-primary-button"
                >
                  {submitting ? 'Salvando...' : editingId ? 'Atualizar cliente' : 'Criar cliente'}
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
          </PageSection>
        </PermissionGuard>

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <PageSection
          title="Client directory"
          description="The listing keeps contact data, address context, and lifecycle status readable across denser operational tables."
          actions={(
            <p className="text-sm text-[color:var(--app-shell-muted)]">Total {totalItems} client(s)</p>
          )}
        >
          <div className="space-y-5">
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              loading={loading}
              loadingTitle="Carregando clientes"
              loadingDescription="Preparando a base de clientes do PetFlow com status e dados operacionais."
              emptyState={{
                title: 'Nenhum cliente cadastrado',
                description: 'Crie o primeiro cliente para iniciar os cadastros clinicos e operacionais do PetFlow.'
              }}
            />

            <Pagination
              page={pageData.page}
              totalPages={pageData.totalPages}
              totalElements={totalItems}
              onPageChange={(nextPage) => load(nextPage, search, statusFilter)}
            />
          </div>
        </PageSection>

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir cliente"
          description={deleteCandidate ? `Confirma a exclusão de ${deleteCandidate.name ?? deleteCandidate.fullName ?? 'cliente'}?` : undefined}
          confirmLabel="Excluir"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
