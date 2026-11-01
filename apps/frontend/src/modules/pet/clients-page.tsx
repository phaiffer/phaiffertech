'use client';

import type { FormEvent, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  sharedFormActionsClass,
  sharedInlineActionsClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { buildCsv, downloadCsv } from '@/shared/lib/csv';
import {
  formatPetClientDocumentDisplay,
  formatPetClientDocumentInput,
  inferPetClientDocumentType,
  isValidPetClientDocument,
  normalizePetClientDocumentNumber,
  normalizePetClientDocumentType
} from '@/shared/lib/pet-client-document';
import { resolvePetClientPrimaryResponsible } from '@/shared/lib/pet-client-primary-responsible';
import { formatPhoneDisplay, maskPhoneInput, stripPhoneMask } from '@/shared/lib/phone';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import type { PageResponse } from '@/shared/types/common';
import type { PetClient, PetClientDocumentType, PetProfile } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';

type PetClientsPageProps = {
  initialView?: 'list' | 'create';
};

const pageSize = 14;
const CLIENT_PETS_LIMIT = 50;

type PetClientsCopy = AppMessages['screens']['petClients'];

function buildStatusOptions(copy: PetClientsCopy) {
  return [
    { value: '', label: copy.filterAll },
    { value: 'ACTIVE', label: copy.statusActive },
    { value: 'INACTIVE', label: copy.statusInactive }
  ];
}

function buildFormStatusOptions(copy: PetClientsCopy) {
  return [
    { value: 'ACTIVE', label: copy.statusActive },
    { value: 'INACTIVE', label: copy.statusInactive }
  ];
}

function buildDocumentTypeOptions(copy: PetClientsCopy) {
  return [
    { value: '', label: copy.documentTypePlaceholder },
    { value: 'CPF', label: 'CPF' },
    { value: 'RG', label: 'RG' }
  ];
}

const initialPage: PageResponse<PetClient> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function clientName(client: PetClient) {
  return client.name ?? client.fullName ?? '-';
}

/** Search term passed by the sidebar "/" search (/pet/clients?search=...). */
function readInitialSearch() {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('search')?.trim() ?? '';
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-[color:var(--line)] pt-4">
      <legend className="pr-2 text-sm font-semibold text-[var(--ink)]">{title}</legend>
      <div className="mt-2 grid gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

// Comanda v2 "Clientes": dense table with count in the title, inline search and a
// dashed status filter, bulk selection with CSV export, record range pagination.
export function PetClientsPage({ initialView = 'list' }: PetClientsPageProps) {
  const copy = useAppMessages().screens.petClients;
  const router = useRouter();
  const isCreateRoute = initialView === 'create';

  const [pageData, setPageData] = useState<PageResponse<PetClient>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState(readInitialSearch);
  const [search, setSearch] = useState(readInitialSearch);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isEditorOpen, setIsEditorOpen] = useState(isCreateRoute);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [documentType, setDocumentType] = useState<PetClientDocumentType | ''>('');
  const [document, setDocument] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [submitting, setSubmitting] = useState(false);
  const [clientPets, setClientPets] = useState<PetProfile[]>([]);
  const [clientPetsLoading, setClientPetsLoading] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetClient | null>(null);

  const load = useCallback(async (page: number, currentSearch: string, currentStatus: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await petService.listClients(page, pageSize, currentSearch, {
        status: currentStatus || undefined
      });
      setPageData(result);
      setSelectedIds(new Set());
    } catch (err) {
      const message = resolveApiErrorMessage(err, copy.loadError);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [copy]);

  useEffect(() => {
    load(0, search, statusFilter);
  }, [load, search, statusFilter]);

  // Pets of the client being edited (read-only list with links to the pet profile).
  useEffect(() => {
    if (!editingId) {
      setClientPets([]);
      return;
    }

    let active = true;
    setClientPetsLoading(true);
    petService.listProfiles(0, CLIENT_PETS_LIMIT, '', { clientId: editingId })
      .then((result) => {
        if (active) setClientPets(resolvePageItems(result));
      })
      .catch(() => {
        if (active) setClientPets([]);
      })
      .finally(() => {
        if (active) setClientPetsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [editingId]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setEmail('');
    setPhone('');
    setDocumentType('');
    setDocument('');
    setAddress('');
    setNotes('');
    setStatus('ACTIVE');
  }

  useEffect(() => {
    if (!isCreateRoute) {
      return;
    }

    resetForm();
    setSuccess(null);
    setError(null);
    setIsEditorOpen(true);
  }, [isCreateRoute]);

  function beginEdit(client: PetClient) {
    const resolvedDocumentType = inferPetClientDocumentType(client.documentType, client.document);
    const primaryResponsible = resolvePetClientPrimaryResponsible(client);
    setEditingId(client.id);
    setName(primaryResponsible.name ?? client.name ?? client.fullName ?? '');
    setEmail(primaryResponsible.email ?? '');
    setPhone(primaryResponsible.phone ? formatPhoneDisplay(primaryResponsible.phone) : '');
    setDocumentType(resolvedDocumentType);
    setDocument(formatPetClientDocumentInput(resolvedDocumentType, client.document ?? ''));
    setAddress(client.address ?? '');
    setNotes(client.notes ?? '');
    setStatus(client.status);
    setSuccess(null);
    setError(null);
    setIsEditorOpen(true);
  }

  function handleDocumentTypeChange(value: string) {
    const nextDocumentType = normalizePetClientDocumentType(value);
    setDocumentType(nextDocumentType);
    setDocument((currentDocument) => formatPetClientDocumentInput(nextDocumentType, currentDocument));
  }

  function closeEditor() {
    resetForm();

    if (isCreateRoute) {
      router.push('/pet/clients');
      return;
    }

    setIsEditorOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const normalizedDocumentType = normalizePetClientDocumentType(documentType);
    const normalizedDocument = normalizePetClientDocumentNumber(normalizedDocumentType, document);

    if (!normalizedDocumentType) {
      setSubmitting(false);
      setError(copy.documentTypeRequired);
      return;
    }

    if (!normalizedDocument) {
      setSubmitting(false);
      setError(copy.documentNumberRequired);
      return;
    }

    if (!isValidPetClientDocument(normalizedDocumentType, normalizedDocument)) {
      setSubmitting(false);
      setError(
        normalizedDocumentType === 'CPF'
          ? copy.invalidCpf
          : copy.invalidRg
      );
      return;
    }

    try {
      const normalizedPhone = stripPhoneMask(phone) || undefined;

      if (editingId) {
        await petService.updateClient(editingId, {
          name,
          email: email || undefined,
          phone: normalizedPhone,
          primaryResponsibleName: name,
          primaryResponsibleEmail: email || undefined,
          primaryResponsiblePhone: normalizedPhone,
          documentType: normalizedDocumentType,
          document: normalizedDocument,
          address: address || undefined,
          notes: notes || undefined,
          status
        });
        setSuccess(copy.updated);
        setIsEditorOpen(false);
      } else {
        await petService.createClient({
          name,
          email: email || undefined,
          phone: normalizedPhone,
          primaryResponsibleName: name,
          primaryResponsibleEmail: email || undefined,
          primaryResponsiblePhone: normalizedPhone,
          documentType: normalizedDocumentType,
          document: normalizedDocument,
          address: address || undefined,
          notes: notes || undefined,
          status
        });

        if (isCreateRoute) {
          router.push('/pet/clients');
          return;
        }

        setSuccess(copy.created);
        setIsEditorOpen(false);
      }

      resetForm();
      await load(pageData.page, search, statusFilter);
    } catch (err) {
      const message = resolveApiErrorMessage(err, copy.saveError);
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
      setSuccess(copy.deleted);
      await load(pageData.page, search, statusFilter);
    } catch (err) {
      const message = resolveApiErrorMessage(err, copy.deleteError);
      setError(message);
    }
  }

  const rows = useMemo(() => resolvePageItems(pageData), [pageData]);
  const totalItems = resolveTotalItems(pageData);
  const hasActiveFilters = Boolean(search || statusFilter);
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.has(row.id));
  const selectedRows = rows.filter((row) => selectedIds.has(row.id));

  function toggleRow(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds(allSelected ? new Set() : new Set(rows.map((row) => row.id)));
  }

  function exportSelected() {
    const header = [copy.client, copy.document, copy.columnPhone, copy.columnEmail, copy.status];
    const body = selectedRows.map((client) => {
      const responsible = resolvePetClientPrimaryResponsible(client);
      return [
        clientName(client),
        formatPetClientDocumentDisplay(client.documentType, client.document) ?? '',
        responsible.phone ? formatPhoneDisplay(responsible.phone) : '',
        responsible.email ?? '',
        client.status
      ];
    });
    downloadCsv('clientes.csv', buildCsv([header, ...body]));
  }

  const columns: DataTableColumn<PetClient>[] = [
    {
      key: 'select',
      header: '',
      className: 'w-10',
      render: (client) => (
        <label className="inline-flex h-6 w-6 items-center justify-center">
          <span className="sr-only">{copy.selectRow.replace('{name}', clientName(client))}</span>
          <input
            type="checkbox"
            checked={selectedIds.has(client.id)}
            onChange={() => toggleRow(client.id)}
            className="h-4 w-4 accent-[var(--ink)]"
          />
        </label>
      )
    },
    {
      key: 'client',
      header: copy.client,
      render: (client) => {
        const formattedDocument = client.document
          ? [inferPetClientDocumentType(client.documentType, client.document), formatPetClientDocumentDisplay(client.documentType, client.document)].filter(Boolean).join(' ')
          : null;
        return (
          <div className="min-w-0">
            <PermissionGuard
              permission="pet.client.update"
              fallback={<span className="font-medium text-[var(--ink)]">{clientName(client)}</span>}
            >
              <button
                type="button"
                onClick={() => beginEdit(client)}
                className="max-w-[18rem] truncate text-left font-medium text-[var(--ink)] underline-offset-2 hover:underline"
              >
                {clientName(client)}
              </button>
            </PermissionGuard>
            {formattedDocument ? <p className="ui-mono text-xs text-[var(--muted)]">{formattedDocument}</p> : null}
          </div>
        );
      }
    },
    {
      key: 'phone',
      header: copy.columnPhone,
      className: 'whitespace-nowrap',
      render: (client) => {
        const responsible = resolvePetClientPrimaryResponsible(client);
        return responsible.phone
          ? <span className="ui-mono">{formatPhoneDisplay(responsible.phone)}</span>
          : <span className="text-[var(--faint)]">{copy.noPhone}</span>;
      }
    },
    {
      key: 'email',
      header: copy.columnEmail,
      render: (client) => {
        const responsible = resolvePetClientPrimaryResponsible(client);
        return responsible.email
          ? <span className="block max-w-[16rem] truncate">{responsible.email}</span>
          : <span className="text-[var(--faint)]">{copy.noEmail}</span>;
      }
    },
    {
      key: 'status',
      header: copy.status,
      render: (client) => <StatusBadge status={client.status} />
    },
    {
      key: 'actions',
      header: copy.actions,
      className: 'text-right',
      render: (client) => (
        <div className={`${sharedInlineActionsClass} justify-end`}>
          <PermissionGuard permission="pet.client.update">
            <button type="button" onClick={() => beginEdit(client)} className="ui-inline-button">
              {copy.edit}
            </button>
          </PermissionGuard>

          <PermissionGuard permission="pet.client.delete">
            <button type="button" onClick={() => setDeleteCandidate(client)} className="ui-inline-danger-button">
              {copy.remove}
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.client.read"
      fallback={<div className="ui-notice-warning">{copy.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          title={isCreateRoute ? copy.newClient : copy.title}
          count={isCreateRoute || loading ? undefined : totalItems}
          description={isCreateRoute ? copy.descriptionCreate : copy.descriptionList}
          actions={isCreateRoute ? (
            <Link href="/pet/clients" className="ui-secondary-button">
              {copy.backToClients}
            </Link>
          ) : (
            <>
              <PermissionGuard permission="crm.contact.read">
                <Link href="/pet/clients/contacts" className="ui-secondary-button">
                  {copy.supportContacts}
                </Link>
              </PermissionGuard>
              <PermissionGuard permission="pet.client.create">
                <Link href="/pet/clients/new" className="ui-primary-button">
                  {copy.newClient}
                </Link>
              </PermissionGuard>
            </>
          )}
        />

        {!isCreateRoute ? (
          <form
            role="search"
            aria-label={copy.filters}
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchInput.trim());
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <label className="ui-field-shell flex min-h-9 min-w-[16rem] flex-1 items-center gap-2 rounded-md border border-[color:var(--control)] px-3 md:max-w-md">
              <Search className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" aria-hidden="true" />
              <span className="sr-only">{copy.search}</span>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={copy.searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
              />
            </label>
            <label className="ui-filter-chip" data-active={statusFilter ? 'true' : 'false'}>
              <span>{copy.status}</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="bg-transparent font-medium text-[var(--ink)] outline-none"
              >
                {buildStatusOptions(copy).map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="ui-secondary-button">{copy.search}</button>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setStatusFilter('');
                }}
                className="inline-flex min-h-9 items-center gap-1 px-1 text-sm text-[var(--ink-2)] hover:text-[var(--ink)]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {copy.clear}
              </button>
            ) : null}
          </form>
        ) : null}

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        {isEditorOpen ? (
          <PermissionGuard permission={editingId ? 'pet.client.update' : 'pet.client.create'}>
            <section
              aria-labelledby="client-editor-title"
              className="grid gap-5 rounded-md border border-[color:var(--line)] p-4 lg:grid-cols-[minmax(0,1fr)_280px]"
            >
              <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="client-editor-title" className="text-sm font-semibold text-[var(--ink)]">
                    {editingId ? copy.editClient : copy.newClient}
                  </h2>
                  <p className="text-xs text-[var(--muted)]">{copy.formDescription}</p>
                </div>

                <FormSection title={copy.sectionResponsible}>
                  <FormInput
                    id="client-name"
                    name="name"
                    label={copy.responsibleName}
                    value={name}
                    onChange={setName}
                    autoComplete="name"
                    required
                  />
                  <FormSelect label={copy.status} value={status} options={buildFormStatusOptions(copy)} onChange={setStatus} />
                  <FormSelect
                    label={copy.documentType}
                    value={documentType}
                    options={buildDocumentTypeOptions(copy)}
                    onChange={handleDocumentTypeChange}
                  />
                  <FormInput
                    id="client-document"
                    name="document"
                    label={copy.document}
                    value={document}
                    onChange={(value) => setDocument(formatPetClientDocumentInput(documentType, value))}
                    placeholder={
                      documentType === 'CPF'
                        ? '000.000.000-00'
                        : documentType === 'RG'
                          ? 'MG 12.345.678'
                          : copy.documentNumberPlaceholder
                    }
                    description={
                      documentType === 'CPF'
                        ? copy.cpfHint
                        : documentType === 'RG'
                          ? copy.rgHint
                          : copy.documentTypeHint
                    }
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                  />
                </FormSection>

                <FormSection title={copy.sectionContact}>
                  <FormInput
                    id="client-email"
                    name="clientEmail"
                    label={copy.responsibleEmail}
                    value={email}
                    onChange={setEmail}
                    type="email"
                    autoComplete="section-client email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                  />
                  <FormInput
                    id="client-phone"
                    name="clientPhone"
                    label={copy.responsiblePhone}
                    value={phone}
                    onChange={(v) => setPhone(maskPhoneInput(v))}
                    type="tel"
                    autoComplete="section-client tel"
                    inputMode="tel"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                  />
                </FormSection>

                <FormSection title={copy.sectionAddress}>
                  <FormInput
                    id="client-address"
                    name="address"
                    label={copy.address}
                    value={address}
                    onChange={setAddress}
                    autoComplete="street-address"
                    wrapperClassName="md:col-span-2"
                  />
                  <FormInput
                    id="client-notes"
                    name="notes"
                    label={copy.notes}
                    value={notes}
                    onChange={setNotes}
                    placeholder={copy.notesPlaceholder}
                    wrapperClassName="md:col-span-2"
                  />
                </FormSection>

                <div className={sharedFormActionsClass}>
                  <button type="submit" disabled={submitting} className="ui-primary-button">
                    {submitting ? copy.saving : editingId ? copy.updateClient : copy.addClient}
                  </button>
                  <button type="button" onClick={closeEditor} className="ui-secondary-button">
                    {copy.cancel}
                  </button>
                </div>
              </form>

              {editingId ? (
                <aside aria-labelledby="client-pets-title" className="min-w-0 border-t border-[color:var(--line)] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <h3 id="client-pets-title" className="text-sm font-semibold text-[var(--ink)]">
                      {copy.petsTitle} <span className="ui-mono font-normal text-[var(--muted)]">{clientPets.length}</span>
                    </h3>
                    <PermissionGuard permission="pet.profile.create">
                      <Link href="/pet/pets/new" className="text-sm font-medium text-[var(--ink)] underline-offset-2 hover:underline">
                        {copy.addPet}
                      </Link>
                    </PermissionGuard>
                  </div>
                  {clientPetsLoading ? (
                    <p className="text-sm text-[var(--muted)]">{copy.petsLoading}</p>
                  ) : clientPets.length === 0 ? (
                    <p className="text-sm text-[var(--muted)]">{copy.noPets}</p>
                  ) : (
                    <ul>
                      {clientPets.map((pet) => (
                        <li key={pet.id} className="border-t border-[color:var(--line-soft)] py-2">
                          <Link href={`/pet/pets/${pet.id}/timeline`} className="font-medium text-[var(--ink)] underline-offset-2 hover:underline">
                            {pet.name}
                          </Link>
                          {pet.breed ? <span className="text-sm text-[var(--muted)]"> · {pet.breed}</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </aside>
              ) : null}
            </section>
          </PermissionGuard>
        ) : null}

        {!isCreateRoute ? (
          <div className="space-y-2">
            {selectedRows.length > 0 ? (
              <div
                role="region"
                aria-label={copy.selectedCount.replace('{n}', String(selectedRows.length))}
                className="flex flex-wrap items-center gap-3 rounded-md border border-[var(--ink)] px-3 py-2 text-sm"
              >
                <span className="font-medium">{copy.selectedCount.replace('{n}', String(selectedRows.length))}</span>
                <button type="button" onClick={exportSelected} className="ui-inline-button">
                  {copy.exportCsv}
                </button>
                <button type="button" onClick={() => setSelectedIds(new Set())} className="text-[var(--ink-2)] underline-offset-2 hover:underline">
                  {copy.clearSelection}
                </button>
              </div>
            ) : null}

            {rows.length > 0 ? (
              <label className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-[var(--ink)]" />
                {copy.selectAll}
              </label>
            ) : null}

            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              loading={loading}
              loadingTitle={copy.loadingTitle}
              loadingDescription={copy.loadingDescription}
              emptyState={{
                title: copy.emptyTitle,
                description: copy.emptyDescription,
                action: (
                  <PermissionGuard permission="pet.client.create">
                    <Link href="/pet/clients/new" className="ui-primary-button">
                      {copy.createFirst}
                    </Link>
                  </PermissionGuard>
                )
              }}
            />

            <Pagination
              page={pageData.page}
              totalPages={pageData.totalPages}
              totalElements={totalItems}
              pageSize={pageSize}
              onPageChange={(nextPage) => load(nextPage, search, statusFilter)}
            />
          </div>
        ) : null}

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title={copy.removeConfirmTitle}
          description={deleteCandidate ? copy.removeConfirmDescription.replace('{name}', deleteCandidate.name ?? deleteCandidate.fullName ?? copy.thisClient) : undefined}
          confirmLabel={copy.remove}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
