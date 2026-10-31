'use client';

import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, PawPrint, Users } from 'lucide-react';
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
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import type { PageResponse } from '@/shared/types/common';
import type { PetClient, PetProfile } from '@/shared/types/pet';
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

type PetProfilesPageProps = {
  initialView?: 'list' | 'create';
};

const pageSize = 10;

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

function formatDate(copy: AppMessages['screens']['petProfiles'], value?: string) {
  if (!value) {
    return copy.notProvided;
  }

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value));
}

export function PetProfilesPage({ initialView = 'list' }: PetProfilesPageProps) {
  const copy = useAppMessages().screens.petProfiles;
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
      const message = err instanceof ApiClientError ? err.message : copy.loadErrorPets;
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
      const message = err instanceof ApiClientError ? err.message : copy.saveErrorPet;
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
      const message = err instanceof ApiClientError ? err.message : copy.deleteErrorPet;
      setError(message);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const activeFilterCount = [search, clientFilterId].filter(Boolean).length;
  const linkedClientsCount = new Set(rows.map((profile) => profile.clientId)).size;
  const withBirthDateCount = rows.filter((profile) => Boolean(profile.birthDate)).length;
  const speciesCount = new Set(rows.map((profile) => profile.species)).size;

  const columns: DataTableColumn<PetProfile>[] = [
    {
      key: 'pet',
      header: 'Pet',
      render: (profile) => (
        <div>
          <p className="font-medium text-slate-900">{profile.name}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {[profile.species, profile.breed].filter(Boolean).join(' - ')}
          </p>
          <p className={sharedCompactTextClass}>
            {[resolveSizeLabel(copy, profile.size), profile.coatType].filter(Boolean).join(' - ') || copy.sizeCoatMissing}
          </p>
        </div>
      )
    },
    {
      key: 'client',
      header: copy.client,
      render: (profile) => {
        const client = clients.find((entry) => entry.id === profile.clientId);

        return (
          <div>
            <p className="font-medium text-slate-900">{client?.name ?? client?.fullName ?? profile.clientId}</p>
            <p className={`mt-1 ${sharedCompactTextClass}`}>{copy.birthLabel} {formatDate(copy, profile.birthDate)}</p>
          </div>
        );
      }
    },
    {
      key: 'details',
      header: copy.columnGrooming,
      render: (profile) => (
        <div>
          <p className="font-medium text-slate-900">{profile.color ?? copy.colorMissing}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {profile.weight === undefined ? copy.weightMissing : `${profile.weight} kg`}
          </p>
          <p className={sharedCompactTextClass}>
            {profile.behavior ?? profile.restrictions ?? copy.noBehaviorAlert}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      header: copy.actions,
      render: (profile) => (
        <div className={sharedInlineActionsClass}>
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
          eyebrow="Gestão Pet"
          title={isCreateRoute ? copy.newPet : copy.titlePets}
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: copy.metricTotalPets, value: totalItems, icon: PawPrint },
              { label: copy.metricLinkedClients, value: linkedClientsCount, icon: Users },
              { label: copy.metricWithBirthDate, value: withBirthDateCount, icon: CalendarDays },
              { label: copy.metricSpecies, value: speciesCount, icon: PawPrint }
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
          <PageSection tone="muted" title={copy.filters} description={copy.filtersDescriptionPets}>
            <div className={sharedFilterToolbarClass}>
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_260px] xl:items-end">
                <SearchBar value={searchInput} onChange={setSearchInput} placeholder={copy.searchPlaceholderPets} />
                <FormSelect label={copy.client} value={clientFilterId} options={clientOptions} onChange={setClientFilterId} />
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
                    setClientFilterId('');
                  }}
                  className="ui-inline-button"
                >
                  {copy.clear}
                </button>
                <p className="text-sm text-slate-700">
                  {activeFilterCount > 0
                    ? copy.activeFiltersCountPets.replace('{count}', String(activeFilterCount))
                    : copy.noActiveFiltersPets}
                </p>
              </div>
            </div>
          </PageSection>
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
            <PageSection
              title={editingId ? copy.editPet : copy.newPet}
              description={copy.formDescriptionPet}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2">
                  <FormSelect label={copy.client} value={clientId} options={formClientOptions} onChange={setClientId} />
                  <FormInput label={copy.name} value={name} onChange={setName} required />
                  <FormInput label={copy.species} value={species} onChange={setSpecies} required />
                  <FormInput label={copy.breed} value={breed} onChange={setBreed} />
                  <FormInput label={copy.birthDate} value={birthDate} onChange={setBirthDate} type="date" />
                  <FormSelect label={copy.sex} value={gender} options={buildGenderOptions(copy)} onChange={setGender} />
                  <FormSelect label={copy.size} value={size} options={buildSizeOptions(copy)} onChange={setSize} />
                  <FormInput label={copy.weight} value={weight} onChange={setWeight} type="number" />
                  <FormInput label={copy.coatType} value={coatType} onChange={setCoatType} placeholder={copy.coatTypePlaceholder} />
                  <FormInput label={copy.behavior} value={behavior} onChange={setBehavior} placeholder={copy.behaviorPlaceholder} />
                  <FormInput label={copy.color} value={color} onChange={setColor} />
                  <FormInput label={copy.restrictions} value={restrictions} onChange={setRestrictions} placeholder={copy.restrictionsPlaceholder} wrapperClassName="xl:col-span-2" />
                  <FormInput label={copy.groomingNotes} value={groomingNotes} onChange={setGroomingNotes} placeholder={copy.groomingNotesPlaceholder} wrapperClassName="xl:col-span-2" />
                  <FormInput label={copy.generalNotes} value={notes} onChange={setNotes} wrapperClassName="xl:col-span-2" />
                </div>

                <div className={sharedFormActionsClass}>
                  <button type="submit" disabled={submitting || clients.length === 0} className="ui-primary-button">
                    {submitting ? copy.saving : editingId ? copy.updatePet : copy.addPet}
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
            title={copy.listTitlePets}
            description={copy.listDescriptionPets}
            actions={<p className="text-sm text-slate-700">{copy.totalOf} {totalItems} {copy.petsCount}</p>}
          >
            <div className="space-y-5">
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
                onPageChange={(nextPage) => load(nextPage, search, clientFilterId)}
              />
            </div>
          </PageSection>
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
