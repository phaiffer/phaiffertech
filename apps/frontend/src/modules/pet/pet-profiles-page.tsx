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
import { formatDateForLocale } from '@/shared/i18n/formatters';
import type { AppLocale } from '@/shared/i18n/app-i18n-provider';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import type { PageResponse } from '@/shared/types/common';
import type { PetClient, PetProfile } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';

type PetProfilesPageProps = {
  initialView?: 'list' | 'create';
};

const pageSize = 14;

const initialPage: PageResponse<PetProfile> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

type PetProfilesCopy = AppMessages['screens']['petProfiles'];

function buildGenderOptions(copy: PetProfilesCopy) {
  return [
    { value: '', label: copy.notProvided },
    { value: 'MALE', label: copy.sexMale },
    { value: 'FEMALE', label: copy.sexFemale }
  ];
}

function buildSizeOptions(copy: PetProfilesCopy) {
  return [
    { value: '', label: copy.notProvided },
    { value: 'TOY', label: copy.sizeToy },
    { value: 'SMALL', label: copy.sizeSmall },
    { value: 'MEDIUM', label: copy.sizeMedium },
    { value: 'LARGE', label: copy.sizeLarge },
    { value: 'GIANT', label: copy.sizeGiant }
  ];
}

function resolveSizeLabel(copy: PetProfilesCopy, size?: string | null): string | undefined {
  if (!size) {
    return undefined;
  }
  return buildSizeOptions(copy).find((option) => option.value === size)?.label ?? size;
}

function formatDate(copy: PetProfilesCopy, locale: AppLocale, value?: string) {
  if (!value) {
    return copy.notProvided;
  }

  return formatDateForLocale(locale, value);
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-[color:var(--line)] pt-4">
      <legend className="pr-2 text-sm font-semibold text-[var(--ink)]">{title}</legend>
      <div className="mt-2 grid gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export function PetProfilesPage({ initialView = 'list' }: PetProfilesPageProps) {
  const copy = useAppMessages().screens.petProfiles;
  const { locale } = useAppI18n();
  const router = useRouter();
  const isCreateRoute = initialView === 'create';

  const [pageData, setPageData] = useState<PageResponse<PetProfile>>(initialPage);
  const [clients, setClients] = useState<PetClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [clientFilterId, setClientFilterId] = useState('');

  const [isEditorOpen, setIsEditorOpen] = useState(isCreateRoute);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [size, setSize] = useState('');
  const [coatType, setCoatType] = useState('');
  const [behavior, setBehavior] = useState('');
  const [color, setColor] = useState('');
  const [restrictions, setRestrictions] = useState('');
  const [groomingNotes, setGroomingNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetProfile | null>(null);

  const clientOptions = useMemo(() => [
    { value: '', label: copy.allClients },
    ...clients.map((client) => ({
      value: client.id,
      label: client.name ?? client.fullName ?? client.id
    }))
  ], [clients, copy]);

  const formClientOptions = useMemo(() => [
    { value: '', label: copy.selectClient },
    ...clients.map((client) => ({
      value: client.id,
      label: client.name ?? client.fullName ?? client.id
    }))
  ], [clients, copy]);

  const loadClients = useCallback(async () => {
    try {
      const result = await petService.listClients(0, 200, '');
      setClients(resolvePageItems(result));
    } catch {
      setClients([]);
    }
  }, []);

  const load = useCallback(async (page: number, currentSearch: string, currentClientId: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await petService.listProfiles(page, pageSize, currentSearch, {
        clientId: currentClientId || undefined
      });
      setPageData(result);
    } catch (err) {
      const message = resolveApiErrorMessage(err, copy.loadErrorPets);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [copy]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    load(0, search, clientFilterId);
  }, [load, search, clientFilterId]);

  function resetForm() {
    setEditingId(null);
    setClientId('');
    setName('');
    setSpecies('');
    setBreed('');
    setBirthDate('');
    setGender('');
    setWeight('');
    setSize('');
    setCoatType('');
    setBehavior('');
    setColor('');
    setRestrictions('');
    setGroomingNotes('');
    setNotes('');
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

  function beginEdit(profile: PetProfile) {
    setEditingId(profile.id);
    setClientId(profile.clientId);
    setName(profile.name);
    setSpecies(profile.species);
    setBreed(profile.breed ?? '');
    setBirthDate(profile.birthDate ?? '');
    setGender(profile.gender ?? '');
    setWeight(profile.weight === undefined ? '' : String(profile.weight));
    setSize(profile.size ?? '');
    setCoatType(profile.coatType ?? '');
    setBehavior(profile.behavior ?? '');
    setColor(profile.color ?? '');
    setRestrictions(profile.restrictions ?? '');
    setGroomingNotes(profile.groomingNotes ?? '');
    setNotes(profile.notes ?? '');
    setSuccess(null);
    setError(null);
    setIsEditorOpen(true);
  }

  function closeEditor() {
    resetForm();

    if (isCreateRoute) {
      router.push('/pet/pets');
      return;
    }

    setIsEditorOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clientId) {
      setError(copy.clientRequired);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const parsedWeight = weight.trim() ? Number(weight) : undefined;

    if (weight.trim() && Number.isNaN(parsedWeight)) {
      setSubmitting(false);
      setError(copy.invalidWeight);
      return;
    }

    const payload = {
      clientId,
      name,
      species,
      breed: breed || undefined,
      birthDate: birthDate || undefined,
      gender: gender || undefined,
      weight: parsedWeight,
      size: size || undefined,
      coatType: coatType || undefined,
      behavior: behavior || undefined,
      color: color || undefined,
      restrictions: restrictions || undefined,
      groomingNotes: groomingNotes || undefined,
      notes: notes || undefined
    };

    try {
      if (editingId) {
        await petService.updateProfile(editingId, payload);
        setSuccess(copy.petUpdated);
        setIsEditorOpen(false);
      } else {
        await petService.createProfile(payload);

        if (isCreateRoute) {
          router.push('/pet/pets');
          return;
        }

        setSuccess(copy.petCreated);
        setIsEditorOpen(false);
      }

      resetForm();
      await load(pageData.page, search, clientFilterId);
    } catch (err) {
      const message = resolveApiErrorMessage(err, copy.saveErrorPet);
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
      await petService.deleteProfile(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess(copy.petDeleted);
      await load(pageData.page, search, clientFilterId);
    } catch (err) {
      const message = resolveApiErrorMessage(err, copy.deleteErrorPet);
      setError(message);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const hasActiveFilters = Boolean(search || clientFilterId);

  const columns: DataTableColumn<PetProfile>[] = [
    {
      key: 'pet',
      header: copy.columnPet,
      render: (profile) => (
        <div className="min-w-0">
          <Link
            href={`/pet/pets/${profile.id}/timeline`}
            className="font-medium text-[var(--ink)] underline-offset-2 hover:underline"
          >
            {profile.name}
          </Link>
          <p className="truncate text-xs text-[var(--muted)]">
            {[profile.species, profile.breed].filter(Boolean).join(' · ')}
          </p>
        </div>
      )
    },
    {
      key: 'client',
      header: copy.client,
      render: (profile) => {
        const client = clients.find((entry) => entry.id === profile.clientId);
        return <span className="block max-w-[14rem] truncate">{client?.name ?? client?.fullName ?? profile.clientId}</span>;
      }
    },
    {
      key: 'size',
      header: copy.size,
      render: (profile) => {
        const sizeCoat = [resolveSizeLabel(copy, profile.size), profile.coatType].filter(Boolean).join(' · ');
        return sizeCoat
          ? <span>{sizeCoat}</span>
          : <span className="text-[var(--faint)]">{copy.sizeCoatMissing}</span>;
      }
    },
    {
      key: 'birth',
      header: copy.birthDate,
      className: 'whitespace-nowrap',
      render: (profile) => <span className="ui-mono">{formatDate(copy, locale, profile.birthDate)}</span>
    },
    {
      key: 'weight',
      header: copy.weight,
      className: 'text-right',
      render: (profile) => (
        profile.weight === undefined || profile.weight === null
          ? <span className="text-[var(--faint)]">{copy.weightMissing}</span>
          : <span className="ui-mono">{profile.weight} kg</span>
      )
    },
    {
      key: 'behavior',
      header: copy.behavior,
      render: (profile) => {
        const alert = profile.behavior ?? profile.restrictions;
        return alert
          ? <span className="block max-w-[16rem] truncate text-[var(--warn)]" title={alert}>{alert}</span>
          : <span className="text-[var(--faint)]">{copy.noBehaviorAlert}</span>;
      }
    },
    {
      key: 'actions',
      header: copy.actions,
      className: 'text-right',
      render: (profile) => (
        <div className={`${sharedInlineActionsClass} justify-end`}>
          <PermissionGuard permission="pet.profile.update">
            <button type="button" onClick={() => beginEdit(profile)} className="ui-inline-button">
              {copy.edit}
            </button>
          </PermissionGuard>

          <PermissionGuard permission="pet.profile.delete">
            <button type="button" onClick={() => setDeleteCandidate(profile)} className="ui-inline-danger-button">
              {copy.remove}
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.profile.read"
      fallback={<div className="ui-notice-warning">{copy.noPermissionPets}</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          title={isCreateRoute ? copy.newPet : copy.titlePets}
          count={isCreateRoute || loading ? undefined : totalItems}
          description={
            isCreateRoute
              ? copy.descriptionCreatePet
              : copy.descriptionListPet
          }
          actions={isCreateRoute ? (
            <Link href="/pet/pets" className="ui-secondary-button">
              {copy.backToPets}
            </Link>
          ) : (
            <PermissionGuard permission="pet.profile.create">
              <Link href="/pet/pets/new" className="ui-primary-button">
                {copy.newPet}
              </Link>
            </PermissionGuard>
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
                placeholder={copy.searchPlaceholderPets}
                className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
              />
            </label>
            <label className="ui-filter-chip max-w-full" data-active={clientFilterId ? 'true' : 'false'}>
              <span>{copy.client}</span>
              <select
                value={clientFilterId}
                onChange={(event) => setClientFilterId(event.target.value)}
                className="max-w-[12rem] truncate bg-transparent font-medium text-[var(--ink)] outline-none"
              >
                {clientOptions.map((option) => (
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
                  setClientFilterId('');
                }}
                className="inline-flex min-h-9 items-center gap-1 px-1 text-sm text-[var(--ink-2)] hover:text-[var(--ink)]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                {copy.clear}
              </button>
            ) : null}
          </form>
        ) : null}

        {clients.length === 0 ? (
          <div className="ui-notice-warning">
            {copy.createClientFirst}
          </div>
        ) : null}

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        {isEditorOpen ? (
          <PermissionGuard permission={editingId ? 'pet.profile.update' : 'pet.profile.create'}>
            <section aria-labelledby="pet-editor-title" className="rounded-md border border-[color:var(--line)] p-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="pet-editor-title" className="text-sm font-semibold text-[var(--ink)]">
                    {editingId ? copy.editPet : copy.newPet}
                  </h2>
                  <p className="text-xs text-[var(--muted)]">{copy.formDescriptionPet}</p>
                </div>

                <FormSection title={copy.sectionIdentity}>
                  <FormSelect label={copy.client} value={clientId} options={formClientOptions} onChange={setClientId} />
                  <FormInput label={copy.name} value={name} onChange={setName} required />
                  <FormInput label={copy.species} value={species} onChange={setSpecies} required />
                  <FormInput label={copy.breed} value={breed} onChange={setBreed} />
                  <FormInput label={copy.birthDate} value={birthDate} onChange={setBirthDate} type="date" />
                  <FormSelect label={copy.sex} value={gender} options={buildGenderOptions(copy)} onChange={setGender} />
                </FormSection>

                <FormSection title={copy.sectionSizeCoat}>
                  <FormSelect label={copy.size} value={size} options={buildSizeOptions(copy)} onChange={setSize} />
                  <FormInput label={copy.weight} value={weight} onChange={setWeight} type="number" />
                  <FormInput label={copy.coatType} value={coatType} onChange={setCoatType} placeholder={copy.coatTypePlaceholder} />
                  <FormInput label={copy.color} value={color} onChange={setColor} />
                </FormSection>

                <FormSection title={copy.sectionCare}>
                  <FormInput label={copy.behavior} value={behavior} onChange={setBehavior} placeholder={copy.behaviorPlaceholder} wrapperClassName="md:col-span-2" />
                  <FormInput label={copy.restrictions} value={restrictions} onChange={setRestrictions} placeholder={copy.restrictionsPlaceholder} wrapperClassName="md:col-span-2" />
                  <FormInput label={copy.groomingNotes} value={groomingNotes} onChange={setGroomingNotes} placeholder={copy.groomingNotesPlaceholder} wrapperClassName="md:col-span-2" />
                  <FormInput label={copy.generalNotes} value={notes} onChange={setNotes} wrapperClassName="md:col-span-2" />
                </FormSection>

                <div className={sharedFormActionsClass}>
                  <button type="submit" disabled={submitting || clients.length === 0} className="ui-primary-button">
                    {submitting ? copy.saving : editingId ? copy.updatePet : copy.addPet}
                  </button>
                  <button type="button" onClick={closeEditor} className="ui-secondary-button">
                    {copy.cancel}
                  </button>
                </div>
              </form>
            </section>
          </PermissionGuard>
        ) : null}

        {!isCreateRoute ? (
          <div>
            <div className="space-y-2">
              <DataTable
                columns={columns}
                rows={rows}
                getRowKey={(row) => row.id}
                loading={loading}
                loadingTitle={copy.loadingTitlePets}
                loadingDescription={copy.loadingDescriptionPets}
                emptyState={{
                  title: copy.emptyTitlePets,
                  description: copy.emptyDescriptionPets,
                  action: (
                    <PermissionGuard permission="pet.profile.create">
                      <Link href="/pet/pets/new" className="ui-primary-button">
                        {copy.createFirstPet}
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
                onPageChange={(nextPage) => load(nextPage, search, clientFilterId)}
              />
            </div>
          </div>
        ) : null}

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title={copy.removePetConfirmTitle}
          description={deleteCandidate ? copy.removePetConfirmDescription.replace('{name}', deleteCandidate.name) : undefined}
          confirmLabel={copy.remove}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
