'use client';

import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Mail, Phone, Users } from 'lucide-react';
import {
  sharedCompactTextClass,
  sharedFilterToolbarClass,
  sharedFormActionsClass,
  sharedInlineActionsClass,
  sharedPageStackClass,
  sharedSummaryCardClass,
  sharedSummaryCardLabelClass
} from '@/shared/components/public-visual-system';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { ApiClientError } from '@/shared/lib/http';
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
import type { PetClient, PetClientDocumentType } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';

type PetClientsPageProps = {
  initialView?: 'list' | 'create';
};

const pageSize = 10;

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function PetClientsPage({ initialView = 'list' }: PetClientsPageProps) {
  const copy = useAppMessages().screens.petClients;
  const router = useRouter();
  const isCreateRoute = initialView === 'create';

  const [pageData, setPageData] = useState<PageResponse<PetClient>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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
      const message = err instanceof ApiClientError ? err.message : copy.loadError;
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [copy]);

  useEffect(() => {
    load(0, search, statusFilter);
  }, [load, search, statusFilter]);

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
      const message = err instanceof ApiClientError ? err.message : copy.saveError;
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
      const message = err instanceof ApiClientError ? err.message : copy.deleteError;
      setError(message);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const activeFilterCount = [search, statusFilter].filter(Boolean).length;
  const activeClients = rows.filter((client) => client.status === 'ACTIVE').length;
  const clientsWithEmail = rows.filter((client) => Boolean(resolvePetClientPrimaryResponsible(client).email)).length;
  const clientsWithPhone = rows.filter((client) => Boolean(resolvePetClientPrimaryResponsible(client).phone)).length;

  const columns: DataTableColumn<PetClient>[] = [
    {
      key: 'profile',
      header: copy.client,
      render: (client) => {
        const resolvedDocumentType = inferPetClientDocumentType(client.documentType, client.document);
        const formattedDocument = formatPetClientDocumentDisplay(client.documentType, client.document);

        return (
          <div>
            <p className="font-medium text-slate-900">{client.name ?? client.fullName ?? '-'}</p>
            <p className={`mt-1 ${sharedCompactTextClass}`}>
              {copy.documentLabel} {client.document
                ? [resolvedDocumentType, formattedDocument].filter(Boolean).join(' ')
                : copy.notProvided}
            </p>
          </div>
        );
      }
    },
    {
      key: 'contact',
      header: copy.columnPrimaryResponsible,
      render: (client) => {
        const primaryResponsible = resolvePetClientPrimaryResponsible(client);

        return (
          <div>
            <p className="font-medium text-slate-900">{primaryResponsible.name ?? copy.noPrimaryResponsible}</p>
            <p className={`mt-1 ${sharedCompactTextClass}`}>
              {primaryResponsible.email ?? copy.noEmail}
            </p>
            <p className={sharedCompactTextClass}>
              {primaryResponsible.phone ? formatPhoneDisplay(primaryResponsible.phone) : copy.noPhone}
            </p>
          </div>
        );
      }
    },
    {
      key: 'address',
      header: copy.columnAddressUpdated,
      render: (client) => (
        <div>
          <p className="font-medium text-slate-900">{client.address ?? copy.noAddress}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {client.notes
              ? copy.notesValue.replace('{notes}', client.notes)
              : copy.updatedOn.replace('{date}', formatDateTime(client.updatedAt))}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      header: copy.status,
      render: (client) => <StatusBadge status={client.status} />
    },
    {
      key: 'actions',
      header: copy.actions,
      render: (client) => (
        <div className={sharedInlineActionsClass}>
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
          eyebrow="Gestão Pet"
          title={isCreateRoute ? copy.newClient : copy.title}
          description={
            isCreateRoute
              ? copy.descriptionCreate
              : copy.descriptionList
          }
          actions={isCreateRoute ? (
            <Link href="/pet/clients" className="ui-secondary-button">
              {copy.backToClients}
            </Link>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
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
            </div>
          )}
        />

        {!isCreateRoute ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: copy.metricTotal, value: totalItems, icon: Users },
              { label: copy.metricActive, value: activeClients, icon: Users },
              { label: copy.metricWithEmail, value: clientsWithEmail, icon: Mail },
              { label: copy.metricWithPhone, value: clientsWithPhone, icon: Phone }
            ].map((item) => (
              <div key={item.label} className={sharedSummaryCardClass}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={sharedSummaryCardLabelClass}>{item.label}</p>
                    <p className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-900">{item.value}</p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
                    <item.icon className="h-5 w-5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!isCreateRoute ? (
          <PageSection tone="muted" title={copy.filters} description={copy.filtersDescription}>
            <div className={sharedFilterToolbarClass}>
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_220px] xl:items-end">
                <SearchBar value={searchInput} onChange={setSearchInput} placeholder={copy.searchPlaceholder} />
                <FormSelect label={copy.status} value={statusFilter} options={buildStatusOptions(copy)} onChange={setStatusFilter} />
              </div>
              <div className={sharedFormActionsClass}>
                <button type="button" onClick={() => setSearch(searchInput)} className="ui-primary-button">
                  {copy.search}
                </button>
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
                <p className="text-sm text-slate-700">
                  {activeFilterCount > 0
                    ? copy.activeFiltersCount.replace('{count}', String(activeFilterCount))
                    : copy.noActiveFilters}
                </p>
              </div>
            </div>
          </PageSection>
        ) : null}

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        {isEditorOpen ? (
          <PermissionGuard permission={editingId ? 'pet.client.update' : 'pet.client.create'}>
            <PageSection
              title={editingId ? copy.editClient : copy.newClient}
              description={copy.formDescription}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2">
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
                          ? 'RG aceita formato mais flexivel.'
                          : copy.documentTypeHint
                    }
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                  />
                  <div className="hidden xl:block" />
                  <FormInput
                    id="client-address"
                    name="address"
                    label={copy.address}
                    value={address}
                    onChange={setAddress}
                    autoComplete="street-address"
                    wrapperClassName="xl:col-span-2"
                  />
                  <FormInput
                    id="client-notes"
                    name="notes"
                    label={copy.notes}
                    value={notes}
                    onChange={setNotes}
                    placeholder={copy.notesPlaceholder}
                    wrapperClassName="xl:col-span-2"
                  />
                </div>

                <div className={sharedFormActionsClass}>
                  <button type="submit" disabled={submitting} className="ui-primary-button">
                    {submitting ? copy.saving : editingId ? copy.updateClient : copy.addClient}
                  </button>
                  <button type="button" onClick={closeEditor} className="ui-secondary-button">
                    {copy.cancel}
                  </button>
                </div>
              </form>
            </PageSection>
          </PermissionGuard>
        ) : null}

        {!isCreateRoute ? (
          <PageSection
            title={copy.listTitle}
            description={copy.listDescription}
            actions={<p className="text-sm text-slate-700">{copy.totalOf} {totalItems} {copy.clientsCount}</p>}
          >
            <div className="space-y-5">
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
                onPageChange={(nextPage) => load(nextPage, search, statusFilter)}
              />
            </div>
          </PageSection>
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
