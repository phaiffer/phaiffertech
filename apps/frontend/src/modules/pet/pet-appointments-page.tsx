'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { PetAppointment, PetClient, PetProfile } from '@/shared/types/pet';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
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
  { value: 'SCHEDULED', label: 'SCHEDULED' },
  { value: 'CONFIRMED', label: 'CONFIRMED' },
  { value: 'COMPLETED', label: 'COMPLETED' },
  { value: 'CANCELED', label: 'CANCELED' }
];

const formStatusOptions = statusOptions.filter((option) => option.value);

const initialPage: PageResponse<PetAppointment> = {
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

export function PetAppointmentsPage() {
  const [pageData, setPageData] = useState<PageResponse<PetAppointment>>(initialPage);
  const [clients, setClients] = useState<PetClient[]>([]);
  const [profiles, setProfiles] = useState<PetProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilterId, setClientFilterId] = useState('');
  const [petFilterId, setPetFilterId] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [petId, setPetId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [status, setStatus] = useState('SCHEDULED');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetAppointment | null>(null);

  const clientOptions = useMemo(() => {
    return [
      { value: '', label: 'Todos' },
      ...clients.map((client) => ({
        value: client.id,
        label: client.name ?? client.fullName ?? client.id
      }))
    ];
  }, [clients]);

  const formClientOptions = useMemo(() => {
    return [
      { value: '', label: 'Selecione um cliente' },
      ...clients.map((client) => ({
        value: client.id,
        label: client.name ?? client.fullName ?? client.id
      }))
    ];
  }, [clients]);

  const filteredProfiles = useMemo(() => {
    if (!clientId) {
      return profiles;
    }
    return profiles.filter((profile) => profile.clientId === clientId);
  }, [clientId, profiles]);

  const petOptions = useMemo(() => {
    return [
      { value: '', label: 'Todos' },
      ...profiles.map((profile) => ({ value: profile.id, label: profile.name }))
    ];
  }, [profiles]);

  const formPetOptions = useMemo(() => {
    return [
      { value: '', label: 'Selecione um pet' },
      ...filteredProfiles.map((profile) => ({ value: profile.id, label: profile.name }))
    ];
  }, [filteredProfiles]);

  const loadReferences = useCallback(async () => {
    try {
      const [clientPage, profilePage] = await Promise.all([
        petService.listClients(0, 200, ''),
        petService.listProfiles(0, 200, '')
      ]);

      setClients(resolvePageItems(clientPage));
      setProfiles(resolvePageItems(profilePage));
    } catch {
      setClients([]);
      setProfiles([]);
    }
  }, []);

  const load = useCallback(async (
    page: number,
    currentSearch: string,
    currentStatus: string,
    currentClientId: string,
    currentPetId: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await petService.listAppointments(page, pageSize, currentSearch, {
        status: currentStatus || undefined,
        clientId: currentClientId || undefined,
        petId: currentPetId || undefined
      });
      setPageData(result);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar atendimentos.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    load(0, search, statusFilter, clientFilterId, petFilterId);
  }, [load, search, statusFilter, clientFilterId, petFilterId]);

  function resetForm() {
    setEditingId(null);
    setClientId('');
    setPetId('');
    setScheduledAt('');
    setServiceName('');
    setStatus('SCHEDULED');
    setNotes('');
  }

  function beginEdit(appointment: PetAppointment) {
    setEditingId(appointment.id);
    setClientId(appointment.clientId);
    setPetId(appointment.petId);
    setScheduledAt(toDateTimeLocal(appointment.scheduledAt));
    setServiceName(appointment.serviceName);
    setStatus(appointment.status);
    setNotes(appointment.notes ?? '');
    setSuccess(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clientId || !petId) {
      setError('Selecione cliente e pet para o atendimento.');
      return;
    }

    const isoScheduledAt = toIsoDate(scheduledAt);
    if (!isoScheduledAt) {
      setError('Informe data e hora do atendimento.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      clientId,
      petId,
      scheduledAt: isoScheduledAt,
      serviceName,
      status,
      notes: notes || undefined
    };

    try {
      if (editingId) {
        await petService.updateAppointment(editingId, payload);
        setSuccess('Atendimento atualizado com sucesso.');
      } else {
        await petService.createAppointment(payload);
        setSuccess('Atendimento criado com sucesso.');
      }

      resetForm();
      await load(pageData.page, search, statusFilter, clientFilterId, petFilterId);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao salvar atendimento.';
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
      await petService.deleteAppointment(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess('Atendimento removido com sucesso.');
      await load(pageData.page, search, statusFilter, clientFilterId, petFilterId);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao excluir atendimento.';
      setError(message);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);

  const columns: DataTableColumn<PetAppointment>[] = [
    {
      key: 'serviceName',
      header: 'Serviço',
      render: (appointment) => appointment.serviceName
    },
    {
      key: 'scheduledAt',
      header: 'Agendado para',
      render: (appointment) => new Date(appointment.scheduledAt).toLocaleString('pt-BR')
    },
    {
      key: 'status',
      header: 'Status',
      render: (appointment) => appointment.status
    },
    {
      key: 'client',
      header: 'Cliente',
      render: (appointment) => {
        const client = clients.find((entry) => entry.id === appointment.clientId);
        return client?.name ?? client?.fullName ?? appointment.clientId;
      }
    },
    {
      key: 'pet',
      header: 'Pet',
      render: (appointment) => {
        const profile = profiles.find((entry) => entry.id === appointment.petId);
        return profile?.name ?? appointment.petId;
      }
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (appointment) => (
        <div className="flex gap-2">
          <PermissionGuard permission="pet.appointment.update">
            <button
              type="button"
              onClick={() => beginEdit(appointment)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>

          <PermissionGuard permission="pet.appointment.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(appointment)}
              className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700"
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
      permission="pet.appointment.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar atendimentos.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="Pet Appointments" description="Agenda de atendimentos com filtros e gerenciamento completo." />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_240px_240px_auto_auto]">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Serviço, status, notas" />
          <FormSelect label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
          <FormSelect label="Cliente" value={clientFilterId} options={clientOptions} onChange={setClientFilterId} />
          <FormSelect label="Pet" value={petFilterId} options={petOptions} onChange={setPetFilterId} />
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
              setClientFilterId('');
              setPetFilterId('');
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Limpar
          </button>
        </div>

        <PermissionGuard permission={editingId ? 'pet.appointment.update' : 'pet.appointment.create'}>
          <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
            <FormSelect label="Cliente" value={clientId} options={formClientOptions} onChange={setClientId} />
            <FormSelect label="Pet" value={petId} options={formPetOptions} onChange={setPetId} />
            <DateTimeInput label="Data e hora" value={scheduledAt} onChange={setScheduledAt} required />
            <FormInput label="Serviço" value={serviceName} onChange={setServiceName} required />
            <FormSelect label="Status" value={status} options={formStatusOptions} onChange={setStatus} />
            <FormInput label="Notas" value={notes} onChange={setNotes} />

            <div className="md:col-span-3 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? 'Salvando...' : editingId ? 'Atualizar atendimento' : 'Criar atendimento'}
              </button>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Cancelar edição
                </button>
              ) : null}
            </div>
          </form>
        </PermissionGuard>

        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          emptyMessage="Nenhum atendimento encontrado."
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          onPageChange={(nextPage) => load(nextPage, search, statusFilter, clientFilterId, petFilterId)}
        />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir atendimento"
          description={deleteCandidate ? `Confirma a exclusão do atendimento ${deleteCandidate.serviceName}?` : undefined}
          confirmLabel="Excluir"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
