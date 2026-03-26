'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { PetClient, PetProfile } from '@/shared/types/pet';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;

const initialPage: PageResponse<PetProfile> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

const genderOptions = [
  { value: '', label: 'Not specified' },
  { value: 'MALE', label: 'MALE' },
  { value: 'FEMALE', label: 'FEMALE' }
];

export function PetProfilesPage() {
  const [pageData, setPageData] = useState<PageResponse<PetProfile>>(initialPage);
  const [clients, setClients] = useState<PetClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [clientFilterId, setClientFilterId] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetProfile | null>(null);

  const clientOptions = useMemo(() => {
    return [
      { value: '', label: 'All' },
      ...clients.map((client) => ({
        value: client.id,
        label: client.name ?? client.fullName ?? client.id
      }))
    ];
  }, [clients]);

  const formClientOptions = useMemo(() => {
    return [
      { value: '', label: 'Select a client' },
      ...clients.map((client) => ({
        value: client.id,
        label: client.name ?? client.fullName ?? client.id
      }))
    ];
  }, [clients]);

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
      const message = err instanceof ApiClientError ? err.message : 'Unable to load pet profiles.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

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
    setColor('');
    setNotes('');
  }

  function beginEdit(profile: PetProfile) {
    setEditingId(profile.id);
    setClientId(profile.clientId);
    setName(profile.name);
    setSpecies(profile.species);
    setBreed(profile.breed ?? '');
    setBirthDate(profile.birthDate ?? '');
    setGender(profile.gender ?? '');
    setWeight(profile.weight === undefined ? '' : String(profile.weight));
    setColor(profile.color ?? '');
    setNotes(profile.notes ?? '');
    setSuccess(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clientId) {
      setError('Selecione um cliente para o pet.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const parsedWeight = weight.trim() ? Number(weight) : undefined;

    if (weight.trim() && Number.isNaN(parsedWeight)) {
      setSubmitting(false);
      setError('Peso inválido. Informe um número válido.');
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
      color: color || undefined,
      notes: notes || undefined
    };

    try {
      if (editingId) {
        await petService.updateProfile(editingId, payload);
        setSuccess('Pet profile updated.');
      } else {
        await petService.createProfile(payload);
        setSuccess('Pet profile added.');
      }

      resetForm();
      await load(pageData.page, search, clientFilterId);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Unable to save pet profile.';
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
      setSuccess('Pet profile removed.');
      await load(pageData.page, search, clientFilterId);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Unable to delete pet profile.';
      setError(message);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

  function scrollToProfileForm() {
    document.getElementById('pet-profile-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const columns: DataTableColumn<PetProfile>[] = [
    {
      key: 'name',
      header: 'Nome',
      render: (profile) => profile.name
    },
    {
      key: 'species',
      header: 'Espécie',
      render: (profile) => profile.species
    },
    {
      key: 'breed',
      header: 'Raça',
      render: (profile) => profile.breed ?? '-'
    },
    {
      key: 'color',
      header: 'Cor',
      render: (profile) => profile.color ?? '-'
    },
    {
      key: 'client',
      header: 'Cliente',
      render: (profile) => {
        const client = clients.find((entry) => entry.id === profile.clientId);
        return client?.name ?? client?.fullName ?? profile.clientId;
      }
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (profile) => (
        <div className="flex gap-2">
          <PermissionGuard permission="pet.profile.update">
            <button
              type="button"
              onClick={() => beginEdit(profile)}
              className="ui-inline-button"
            >
              Edit
            </button>
          </PermissionGuard>

          <PermissionGuard permission="pet.profile.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(profile)}
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
      permission="pet.profile.read"
      fallback={<div className="ui-notice-warning">You do not have permission to view pet profiles.</div>}
    >
      <div className="space-y-5">
        <PageTitle
          eyebrow="PetFlow workspace"
          title="Pet Profiles"
          description="Register each pet under a client so appointments, care history, and billing stay connected."
        />

        <div className="grid gap-3 ui-surface-panel p-4 md:grid-cols-[1fr_260px_auto]">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Name, species, breed" />
          <FormSelect label="Client" value={clientFilterId} options={clientOptions} onChange={setClientFilterId} />
          <div className="flex items-end gap-2 pb-0.5">
            <button
              type="button"
              onClick={() => setSearch(searchInput)}
              className="ui-primary-button"
            >
              Search
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
              Clear
            </button>
          </div>
        </div>

        <PermissionGuard permission={editingId ? 'pet.profile.update' : 'pet.profile.create'}>
          <form id="pet-profile-form-section" onSubmit={handleSubmit} className="grid gap-3 ui-surface-panel p-4 md:grid-cols-3">
            <FormSelect label="Client" value={clientId} options={formClientOptions} onChange={setClientId} />
            <FormInput label="Name" value={name} onChange={setName} required />
            <FormInput label="Species" value={species} onChange={setSpecies} required />
            <FormInput label="Breed" value={breed} onChange={setBreed} />
            <FormInput label="Birth date" value={birthDate} onChange={setBirthDate} type="date" />
            <FormSelect label="Gender" value={gender} options={genderOptions} onChange={setGender} />
            <FormInput label="Weight (kg)" value={weight} onChange={setWeight} />
            <FormInput label="Color" value={color} onChange={setColor} />
            <div className="md:col-span-2">
              <FormInput label="Notes" value={notes} onChange={setNotes} />
            </div>

            <div className="md:col-span-3 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="ui-primary-button"
              >
                {submitting ? 'Saving...' : editingId ? 'Update pet profile' : 'Add pet profile'}
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
        </PermissionGuard>

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          loadingTitle="Loading pet profiles"
          loadingDescription="Preparing pet profiles linked to clients in this workspace."
          emptyState={{
            title: 'No pet profiles yet',
            description: 'Add the first pet after creating a client so appointments and care records have the right patient.',
            action: (
              <PermissionGuard permission="pet.profile.create">
                <button type="button" onClick={scrollToProfileForm} className="ui-primary-button">
                  Create first pet profile
                </button>
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

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Remove pet profile?"
          description={deleteCandidate ? `"${deleteCandidate.name}" will be removed from this workspace.` : undefined}
          confirmLabel="Remove"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
