'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  PetAppointmentForm,
  PetAppointmentsFilters,
  createPetAppointmentColumns
} from '@/modules/pet/pet-appointments-sections';
import { toDateTimeLocal, toIsoDate } from '@/modules/pet/pet-date-time';
import {
  PetLookupFeedback,
  PetLookupIssue,
  resolvePetLookupIssue
} from '@/modules/pet/pet-lookup-feedback';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import {
  PetAppointment,
  PetClient,
  PetProfessional,
  PetProfile,
  PetServiceCatalog
} from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable } from '@/shared/ui/data-table';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 10;

const initialPage: PageResponse<PetAppointment> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

export function PetAppointmentsPage() {
  const { hasPermission } = usePermissions();
  const [pageData, setPageData] = useState<PageResponse<PetAppointment>>(initialPage);
  const [clients, setClients] = useState<PetClient[]>([]);
  const [profiles, setProfiles] = useState<PetProfile[]>([]);
  const [services, setServices] = useState<PetServiceCatalog[]>([]);
  const [professionals, setProfessionals] = useState<PetProfessional[]>([]);
  const [lookupIssues, setLookupIssues] = useState<PetLookupIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilterId, setClientFilterId] = useState('');
  const [petFilterId, setPetFilterId] = useState('');
  const [serviceFilterId, setServiceFilterId] = useState('');
  const [professionalFilterId, setProfessionalFilterId] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [petId, setPetId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [status, setStatus] = useState('SCHEDULED');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetAppointment | null>(null);

  const canReadClients = hasPermission('pet.client.read');
  const canReadProfiles = hasPermission('pet.profile.read');
  const canReadServices = hasPermission('pet.service.read');
  const canReadProfessionals = hasPermission('pet.professional.read');

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

  const serviceOptions = useMemo(() => {
    return [
      { value: '', label: 'Todos' },
      ...services.map((service) => ({ value: service.id, label: service.name }))
    ];
  }, [services]);

  const professionalOptions = useMemo(() => {
    return [
      { value: '', label: 'Todos' },
      ...professionals.map((professional) => ({ value: professional.id, label: professional.name }))
    ];
  }, [professionals]);

  const formPetOptions = useMemo(() => {
    return [
      { value: '', label: 'Selecione um pet' },
      ...filteredProfiles.map((profile) => ({ value: profile.id, label: profile.name }))
    ];
  }, [filteredProfiles]);

  const formServiceOptions = useMemo(() => {
    return [
      { value: '', label: 'Selecione um serviço' },
      ...services.map((service) => ({ value: service.id, label: service.name }))
    ];
  }, [services]);

  const formProfessionalOptions = useMemo(() => {
    return [
      { value: '', label: 'Selecione um profissional' },
      ...professionals.map((professional) => ({ value: professional.id, label: professional.name }))
    ];
  }, [professionals]);

  const loadReferences = useCallback(async () => {
    const [clientPage, profilePage, servicePage, professionalPage] = await Promise.allSettled([
      canReadClients ? petService.listClients(0, 200, '') : Promise.resolve(null),
      canReadProfiles ? petService.listProfiles(0, 200, '') : Promise.resolve(null),
      canReadServices ? petService.listServices(0, 200, '') : Promise.resolve(null),
      canReadProfessionals ? petService.listProfessionals(0, 200, '') : Promise.resolve(null)
    ]);

    const issues: PetLookupIssue[] = [];

    if (!canReadClients) {
      setClients([]);
      issues.push({ key: 'clients', label: 'Clientes', message: resolvePetLookupIssue(null, 'pet.client.read') });
    } else if (clientPage.status === 'fulfilled' && clientPage.value) {
      setClients(resolvePageItems(clientPage.value));
    } else {
      setClients([]);
      issues.push({
        key: 'clients',
        label: 'Clientes',
        message: resolvePetLookupIssue(clientPage.status === 'rejected' ? clientPage.reason : null)
      });
    }

    if (!canReadProfiles) {
      setProfiles([]);
      issues.push({ key: 'profiles', label: 'Pets', message: resolvePetLookupIssue(null, 'pet.profile.read') });
    } else if (profilePage.status === 'fulfilled' && profilePage.value) {
      setProfiles(resolvePageItems(profilePage.value));
    } else {
      setProfiles([]);
      issues.push({
        key: 'profiles',
        label: 'Pets',
        message: resolvePetLookupIssue(profilePage.status === 'rejected' ? profilePage.reason : null)
      });
    }

    if (!canReadServices) {
      setServices([]);
      issues.push({ key: 'services', label: 'Serviços', message: resolvePetLookupIssue(null, 'pet.service.read') });
    } else if (servicePage.status === 'fulfilled' && servicePage.value) {
      setServices(resolvePageItems(servicePage.value));
    } else {
      setServices([]);
      issues.push({
        key: 'services',
        label: 'Serviços',
        message: resolvePetLookupIssue(servicePage.status === 'rejected' ? servicePage.reason : null)
      });
    }

    if (!canReadProfessionals) {
      setProfessionals([]);
      issues.push({
        key: 'professionals',
        label: 'Profissionais',
        message: resolvePetLookupIssue(null, 'pet.professional.read')
      });
    } else if (professionalPage.status === 'fulfilled' && professionalPage.value) {
      setProfessionals(resolvePageItems(professionalPage.value));
    } else {
      setProfessionals([]);
      issues.push({
        key: 'professionals',
        label: 'Profissionais',
        message: resolvePetLookupIssue(professionalPage.status === 'rejected' ? professionalPage.reason : null)
      });
    }

    setLookupIssues(issues);
  }, [canReadClients, canReadProfessionals, canReadProfiles, canReadServices]);

  const load = useCallback(async (
    page: number,
    currentSearch: string,
    currentStatus: string,
    currentClientId: string,
    currentPetId: string,
    currentServiceId: string,
    currentProfessionalId: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const result = await petService.listAppointments(page, pageSize, currentSearch, {
        status: currentStatus || undefined,
        clientId: currentClientId || undefined,
        petId: currentPetId || undefined,
        serviceId: currentServiceId || undefined,
        professionalId: currentProfessionalId || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar atendimentos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    load(0, search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId);
  }, [clientFilterId, load, petFilterId, professionalFilterId, search, serviceFilterId, statusFilter]);

  function resetForm() {
    setEditingId(null);
    setClientId('');
    setPetId('');
    setServiceId('');
    setProfessionalId('');
    setScheduledAt('');
    setStatus('SCHEDULED');
    setNotes('');
  }

  function beginEdit(appointment: PetAppointment) {
    setEditingId(appointment.id);
    setClientId(appointment.clientId);
    setPetId(appointment.petId);
    setServiceId(appointment.serviceId);
    setProfessionalId(appointment.professionalId);
    setScheduledAt(toDateTimeLocal(appointment.scheduledAt));
    setStatus(appointment.status);
    setNotes(appointment.notes ?? '');
    setSuccess(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clientId || !petId || !serviceId || !professionalId) {
      setError('Selecione cliente, pet, serviço e profissional para o atendimento.');
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
      serviceId,
      professionalId,
      scheduledAt: isoScheduledAt,
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
      await load(pageData.page, search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar atendimento.');
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
      await load(pageData.page, search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir atendimento.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const clientsLookupUnavailable = lookupIssues.some((issue) => issue.key === 'clients');
  const profilesLookupUnavailable = lookupIssues.some((issue) => issue.key === 'profiles');
  const servicesLookupUnavailable = lookupIssues.some((issue) => issue.key === 'services');
  const professionalsLookupUnavailable = lookupIssues.some((issue) => issue.key === 'professionals');
  const appointmentReferencesReady = !clientsLookupUnavailable && !profilesLookupUnavailable && !servicesLookupUnavailable && !professionalsLookupUnavailable;

  const columns = useMemo(() => createPetAppointmentColumns({
    clients,
    professionals,
    profiles,
    clientsLookupUnavailable,
    professionalsLookupUnavailable,
    profilesLookupUnavailable,
    onEdit: beginEdit,
    onDelete: setDeleteCandidate
  }), [
    clients,
    clientsLookupUnavailable,
    professionals,
    professionalsLookupUnavailable,
    profiles,
    profilesLookupUnavailable
  ]);

  return (
    <PermissionGuard
      permission="pet.appointment.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar atendimentos.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="Pet Appointments" description="Agenda de atendimentos com filtros e gerenciamento completo." />

        <PetAppointmentsFilters
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          clientFilterId={clientFilterId}
          onClientFilterIdChange={setClientFilterId}
          clientOptions={clientOptions}
          clientsLookupUnavailable={clientsLookupUnavailable}
          petFilterId={petFilterId}
          onPetFilterIdChange={setPetFilterId}
          petOptions={petOptions}
          profilesLookupUnavailable={profilesLookupUnavailable}
          serviceFilterId={serviceFilterId}
          onServiceFilterIdChange={setServiceFilterId}
          serviceOptions={serviceOptions}
          servicesLookupUnavailable={servicesLookupUnavailable}
          professionalFilterId={professionalFilterId}
          onProfessionalFilterIdChange={setProfessionalFilterId}
          professionalOptions={professionalOptions}
          professionalsLookupUnavailable={professionalsLookupUnavailable}
          onSearch={() => setSearch(searchInput)}
          onClear={() => {
            setSearchInput('');
            setSearch('');
            setStatusFilter('');
            setClientFilterId('');
            setPetFilterId('');
            setServiceFilterId('');
            setProfessionalFilterId('');
          }}
        />

        <PetLookupFeedback issues={lookupIssues} />

        <PetAppointmentForm
          editingId={editingId}
          onSubmit={handleSubmit}
          clientId={clientId}
          onClientIdChange={setClientId}
          formClientOptions={formClientOptions}
          clientsLookupUnavailable={clientsLookupUnavailable}
          petId={petId}
          onPetIdChange={setPetId}
          formPetOptions={formPetOptions}
          profilesLookupUnavailable={profilesLookupUnavailable}
          serviceId={serviceId}
          onServiceIdChange={setServiceId}
          formServiceOptions={formServiceOptions}
          servicesLookupUnavailable={servicesLookupUnavailable}
          professionalId={professionalId}
          onProfessionalIdChange={setProfessionalId}
          formProfessionalOptions={formProfessionalOptions}
          professionalsLookupUnavailable={professionalsLookupUnavailable}
          scheduledAt={scheduledAt}
          onScheduledAtChange={setScheduledAt}
          status={status}
          onStatusChange={setStatus}
          notes={notes}
          onNotesChange={setNotes}
          submitting={submitting}
          appointmentReferencesReady={appointmentReferencesReady}
          onCancelEdit={resetForm}
        />

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
          onPageChange={(nextPage) =>
            load(
              nextPage,
              search,
              statusFilter,
              clientFilterId,
              petFilterId,
              serviceFilterId,
              professionalFilterId
            )}
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
