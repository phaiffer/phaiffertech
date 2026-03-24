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
  { value: '', label: 'All' },
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
      const message = err instanceof ApiClientError ? err.message : 'Unable to load clients.';
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
        setSuccess('Client updated.');
      } else {
        await petService.createClient({
          name,
          email: email || undefined,
          phone: phone || undefined,
          document: document || undefined,
          address: address || undefined,
          status
        });
        setSuccess('Client added.');
      }

      resetForm();
      await load(pageData.page, search, statusFilter);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Unable to save client.';
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
      setSuccess('Client removed.');
      await load(pageData.page, search, statusFilter);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Unable to delete client.';
      setError(message);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const activeFilterCount = [search, statusFilter].filter(Boolean).length;

  function scrollToClientForm() {
    globalThis.document.getElementById('pet-client-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const columns: DataTableColumn<PetClient>[] = [
    {
      key: 'profile',
      header: 'Cliente',
      render: (client) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{client.name ?? client.fullName ?? '-'}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>Document: {client.document ?? 'Not provided'}</p>
        </div>
      )
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (client) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{client.email ?? 'No email'}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>{client.phone ?? 'No phone'}</p>
        </div>
      )
    },
    {
      key: 'address',
      header: 'Address & updated',
      render: (client) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{client.address ?? 'No address'}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>Updated {formatDateTime(client.updatedAt)}</p>
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
      header: 'Actions',
      render: (client) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="pet.client.update">
            <button
              type="button"
              onClick={() => beginEdit(client)}
              className="ui-inline-button"
            >
              Edit
            </button>
          </PermissionGuard>

          <PermissionGuard permission="pet.client.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(client)}
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
      permission="pet.client.read"
      fallback={<div className="ui-notice-warning">You do not have permission to view clients.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="PetFlow workspace"
          title="Client Base"
          description="Capture pet owners and contact context before moving into pets, appointments, and billing."
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
          <div id="pet-client-form-section">
            <PageSection
              title={editingId ? 'Edit client' : 'Add or update client'}
              description="Keep the customer record ready for pet registration, scheduling, and follow-up."
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2">
                  <FormInput label="Name" value={name} onChange={setName} required />
                  <FormSelect label="Status" value={status} options={formStatusOptions} onChange={setStatus} />
                  <FormInput label="Email" value={email} onChange={setEmail} type="email" />
                  <FormInput label="Phone" value={phone} onChange={setPhone} />
                  <FormInput label="Document" value={document} onChange={setDocument} />
                  <div className="hidden xl:block" />
                  <FormInput label="Address" value={address} onChange={setAddress} wrapperClassName="xl:col-span-2" />
                </div>

                <div className={sharedFormActionsClass}>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="ui-primary-button"
                  >
                    {submitting ? 'Saving...' : editingId ? 'Update client' : 'Add client'}
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="ui-secondary-button"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>
            </PageSection>
          </div>
        </PermissionGuard>

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <PageSection
          title="Client directory"
          description="This is the first step in the PetFlow story and the base for pets, visits, and billing."
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
              loadingTitle="Loading clients"
              loadingDescription="Preparing the client base for this PetFlow workspace."
              emptyState={{
                title: 'No clients yet',
                description: 'Create the first client to unlock pet profiles and the rest of the PetFlow flow.',
                action: (
                  <PermissionGuard permission="pet.client.create">
                    <button type="button" onClick={scrollToClientForm} className="ui-primary-button">
                      Create first client
                    </button>
                  </PermissionGuard>
                )
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
          title="Remove client?"
          description={deleteCandidate ? `"${deleteCandidate.name ?? deleteCandidate.fullName ?? 'This client'}" will be removed from this workspace.` : undefined}
          confirmLabel="Remove"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
