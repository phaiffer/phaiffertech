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
  sharedPageStackClass
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

const genderOptions = [
  { value: '', label: 'Nao informado' },
  { value: 'MALE', label: 'Macho' },
  { value: 'FEMALE', label: 'Femea' }
];

function formatDate(value?: string) {
  if (!value) {
    return 'Nao informado';
  }

  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value));
}

export function PetProfilesPage({ initialView = 'list' }: PetProfilesPageProps) {
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
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetProfile | null>(null);

  const clientOptions = useMemo(() => [
    { value: '', label: 'Todos os clientes' },
    ...clients.map((client) => ({
      value: client.id,
      label: client.name ?? client.fullName ?? client.id
    }))
  ], [clients]);

  const formClientOptions = useMemo(() => [
    { value: '', label: 'Selecione um cliente' },
    ...clients.map((client) => ({
      value: client.id,
      label: client.name ?? client.fullName ?? client.id
    }))
  ], [clients]);

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
      const message = err instanceof ApiClientError ? err.message : 'Nao foi possivel carregar os pets.';
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
    setColor(profile.color ?? '');
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
        setSuccess('Pet atualizado.');
        setIsEditorOpen(false);
      } else {
        await petService.createProfile(payload);

        if (isCreateRoute) {
          router.push('/pet/pets');
          return;
        }

        setSuccess('Pet adicionado.');
        setIsEditorOpen(false);
      }

      resetForm();
      await load(pageData.page, search, clientFilterId);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Nao foi possivel salvar o pet.';
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
      setSuccess('Pet removido.');
      await load(pageData.page, search, clientFilterId);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Nao foi possivel remover o pet.';
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
            {profile.species}{profile.breed ? ` · ${profile.breed}` : ''}
          </p>
        </div>
      )
    },
    {
      key: 'client',
      header: 'Cliente',
      render: (profile) => {
        const client = clients.find((entry) => entry.id === profile.clientId);

        return (
          <div>
            <p className="font-medium text-slate-900">{client?.name ?? client?.fullName ?? profile.clientId}</p>
            <p className={`mt-1 ${sharedCompactTextClass}`}>Nascimento: {formatDate(profile.birthDate)}</p>
          </div>
        );
      }
    },
    {
      key: 'details',
      header: 'Detalhes',
      render: (profile) => (
        <div>
          <p className="font-medium text-slate-900">{profile.color ?? 'Cor nao informada'}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {profile.weight === undefined ? 'Peso nao informado' : `${profile.weight} kg`}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Acoes',
      render: (profile) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="pet.profile.update">
            <button type="button" onClick={() => beginEdit(profile)} className="ui-inline-button">
              Editar
            </button>
          </PermissionGuard>

          <PermissionGuard permission="pet.profile.delete">
            <button type="button" onClick={() => setDeleteCandidate(profile)} className="ui-inline-danger-button">
              Remover
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.profile.read"
      fallback={<div className="ui-notice-warning">Voce nao tem permissao para visualizar pets.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="PetFlow workspace"
          title={isCreateRoute ? 'Novo pet' : 'Pets'}
          description={
            isCreateRoute
              ? 'Cadastre o pet dentro de um cliente para que atendimentos, planos e cobranca fiquem ligados ao registro certo.'
              : 'Cadastre cada pet dentro de um cliente para que atendimentos e cobranca mantenham o contexto correto.'
          }
          actions={isCreateRoute ? (
            <Link href="/pet/pets" className="ui-secondary-button">
              Voltar para pets
            </Link>
          ) : (
            <PermissionGuard permission="pet.profile.create">
              <Link href="/pet/pets/new" className="ui-primary-button">
                Novo pet
              </Link>
            </PermissionGuard>
          )}
        />

        {!isCreateRoute ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total de pets', value: totalItems, icon: PawPrint },
              { label: 'Clientes vinculados', value: linkedClientsCount, icon: Users },
              { label: 'Com nascimento', value: withBirthDateCount, icon: CalendarDays },
              { label: 'Espécies ativas', value: speciesCount, icon: PawPrint }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.16)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
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
          <PageSection tone="muted" title="Filtros" description="Busque por pet, especie ou cliente vinculado.">
            <div className={sharedFilterToolbarClass}>
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_260px] xl:items-end">
                <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Pet, especie ou raca" />
                <FormSelect label="Cliente" value={clientFilterId} options={clientOptions} onChange={setClientFilterId} />
              </div>
              <div className={sharedFormActionsClass}>
                <button type="button" onClick={() => setSearch(searchInput)} className="ui-primary-button">
                  Buscar
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
                  Limpar
                </button>
                <p className="text-sm text-slate-700">
                  {activeFilterCount > 0
                    ? `${activeFilterCount} filtro(s) ativos na lista de pets.`
                    : 'Sem filtros ativos na base de pets.'}
                </p>
              </div>
            </div>
          </PageSection>
        ) : null}

        {clients.length === 0 ? (
          <div className="ui-notice-warning">
            Crie um cliente antes de cadastrar o primeiro pet.
          </div>
        ) : null}

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        {isEditorOpen ? (
          <PermissionGuard permission={editingId ? 'pet.profile.update' : 'pet.profile.create'}>
            <PageSection
              title={editingId ? 'Editar pet' : 'Novo pet'}
              description="Mantenha o cadastro simples: cliente, identificacao e os detalhes necessarios para agendar e cobrar corretamente."
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2">
                  <FormSelect label="Cliente" value={clientId} options={formClientOptions} onChange={setClientId} />
                  <FormInput label="Nome" value={name} onChange={setName} required />
                  <FormInput label="Especie" value={species} onChange={setSpecies} required />
                  <FormInput label="Raca" value={breed} onChange={setBreed} />
                  <FormInput label="Nascimento" value={birthDate} onChange={setBirthDate} type="date" />
                  <FormSelect label="Genero" value={gender} options={genderOptions} onChange={setGender} />
                  <FormInput label="Peso (kg)" value={weight} onChange={setWeight} type="number" />
                  <FormInput label="Cor" value={color} onChange={setColor} />
                  <FormInput label="Observacoes" value={notes} onChange={setNotes} wrapperClassName="xl:col-span-2" />
                </div>

                <div className={sharedFormActionsClass}>
                  <button type="submit" disabled={submitting || clients.length === 0} className="ui-primary-button">
                    {submitting ? 'Salvando...' : editingId ? 'Atualizar pet' : 'Adicionar pet'}
                  </button>
                  <button type="button" onClick={closeEditor} className="ui-secondary-button">
                    Cancelar
                  </button>
                </div>
              </form>
            </PageSection>
          </PermissionGuard>
        ) : null}

        {!isCreateRoute ? (
          <PageSection
            title="Base de pets"
            description="Lista conectada a clientes, atendimentos e cobranca."
            actions={<p className="text-sm text-slate-700">Total de {totalItems} pet(s)</p>}
          >
            <div className="space-y-5">
              <DataTable
                columns={columns}
                rows={rows}
                getRowKey={(row) => row.id}
                loading={loading}
                loadingTitle="Carregando pets"
                loadingDescription="Preparando os pets vinculados aos clientes deste workspace."
                emptyState={{
                  title: 'Nenhum pet ainda',
                  description: 'Cadastre o primeiro pet depois de criar um cliente para deixar agenda e cobranca com o contexto certo.',
                  action: (
                    <PermissionGuard permission="pet.profile.create">
                      <Link href="/pet/pets/new" className="ui-primary-button">
                        Criar primeiro pet
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
          title="Remover pet?"
          description={deleteCandidate ? `"${deleteCandidate.name}" sera removido deste workspace.` : undefined}
          confirmLabel="Remover"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
