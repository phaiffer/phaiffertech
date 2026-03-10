'use client';

import { FormEventHandler } from 'react';
import Link from 'next/link';
import { petMedicalRoutePermissions } from '@/modules/pet/pet-medical-permissions';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { DataTableColumn } from '@/shared/ui/data-table';
import { DateTimeInput } from '@/shared/ui/datetime-input';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PetAppointment, PetClient, PetProfessional, PetProfile } from '@/shared/types/pet';
import { resolvePetLookupLabel } from '@/modules/pet/pet-lookup-feedback';
import { SearchBar } from '@/shared/ui/search-bar';

export type PetSelectOption = {
  value: string;
  label: string;
};

export const petAppointmentStatusOptions: PetSelectOption[] = [
  { value: '', label: 'Todos' },
  { value: 'SCHEDULED', label: 'SCHEDULED' },
  { value: 'CONFIRMED', label: 'CONFIRMED' },
  { value: 'IN_PROGRESS', label: 'IN_PROGRESS' },
  { value: 'COMPLETED', label: 'COMPLETED' },
  { value: 'CANCELED', label: 'CANCELED' },
  { value: 'NO_SHOW', label: 'NO_SHOW' }
];

export const petAppointmentFormStatusOptions = petAppointmentStatusOptions.filter((option) => option.value);

function resolveAppointmentCareState(appointment: PetAppointment) {
  const medicalRecordCount = appointment.medicalRecordCount ?? 0;
  const vaccinationCount = appointment.vaccinationCount ?? 0;
  const prescriptionCount = appointment.prescriptionCount ?? 0;

  if (medicalRecordCount > 0) {
    return 'DOCUMENTED';
  }

  if (vaccinationCount > 0 || prescriptionCount > 0) {
    return 'IN_PROGRESS';
  }

  return 'PENDING';
}

function resolveAppointmentCareActionLabel(appointment: PetAppointment) {
  return resolveAppointmentCareState(appointment) === 'PENDING'
    ? 'Iniciar atendimento'
    : 'Continuar atendimento';
}

type PetAppointmentsFiltersProps = {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  clientFilterId: string;
  onClientFilterIdChange: (value: string) => void;
  clientOptions: PetSelectOption[];
  clientsLookupUnavailable: boolean;
  petFilterId: string;
  onPetFilterIdChange: (value: string) => void;
  petOptions: PetSelectOption[];
  profilesLookupUnavailable: boolean;
  serviceFilterId: string;
  onServiceFilterIdChange: (value: string) => void;
  serviceOptions: PetSelectOption[];
  servicesLookupUnavailable: boolean;
  professionalFilterId: string;
  onProfessionalFilterIdChange: (value: string) => void;
  professionalOptions: PetSelectOption[];
  professionalsLookupUnavailable: boolean;
  onSearch: () => void;
  onClear: () => void;
};

export function PetAppointmentsFilters({
  searchInput,
  onSearchInputChange,
  statusFilter,
  onStatusFilterChange,
  clientFilterId,
  onClientFilterIdChange,
  clientOptions,
  clientsLookupUnavailable,
  petFilterId,
  onPetFilterIdChange,
  petOptions,
  profilesLookupUnavailable,
  serviceFilterId,
  onServiceFilterIdChange,
  serviceOptions,
  servicesLookupUnavailable,
  professionalFilterId,
  onProfessionalFilterIdChange,
  professionalOptions,
  professionalsLookupUnavailable,
  onSearch,
  onClear
}: PetAppointmentsFiltersProps) {
  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_220px_220px_220px_220px_auto_auto]">
      <SearchBar value={searchInput} onChange={onSearchInputChange} placeholder="Serviço, status, notas" />
      <FormSelect label="Status" value={statusFilter} options={petAppointmentStatusOptions} onChange={onStatusFilterChange} />
      <FormSelect label="Cliente" value={clientFilterId} options={clientOptions} onChange={onClientFilterIdChange} disabled={clientsLookupUnavailable} />
      <FormSelect label="Pet" value={petFilterId} options={petOptions} onChange={onPetFilterIdChange} disabled={profilesLookupUnavailable} />
      <FormSelect label="Serviço" value={serviceFilterId} options={serviceOptions} onChange={onServiceFilterIdChange} disabled={servicesLookupUnavailable} />
      <FormSelect
        label="Profissional"
        value={professionalFilterId}
        options={professionalOptions}
        onChange={onProfessionalFilterIdChange}
        disabled={professionalsLookupUnavailable}
      />
      <button
        type="button"
        onClick={onSearch}
        className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white"
      >
        Buscar
      </button>
      <button
        type="button"
        onClick={onClear}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
      >
        Limpar
      </button>
    </div>
  );
}

type PetAppointmentFormProps = {
  editingId: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  clientId: string;
  onClientIdChange: (value: string) => void;
  formClientOptions: PetSelectOption[];
  clientsLookupUnavailable: boolean;
  petId: string;
  onPetIdChange: (value: string) => void;
  formPetOptions: PetSelectOption[];
  profilesLookupUnavailable: boolean;
  serviceId: string;
  onServiceIdChange: (value: string) => void;
  formServiceOptions: PetSelectOption[];
  servicesLookupUnavailable: boolean;
  professionalId: string;
  onProfessionalIdChange: (value: string) => void;
  formProfessionalOptions: PetSelectOption[];
  professionalsLookupUnavailable: boolean;
  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  submitting: boolean;
  appointmentReferencesReady: boolean;
  onCancelEdit: () => void;
};

export function PetAppointmentForm({
  editingId,
  onSubmit,
  clientId,
  onClientIdChange,
  formClientOptions,
  clientsLookupUnavailable,
  petId,
  onPetIdChange,
  formPetOptions,
  profilesLookupUnavailable,
  serviceId,
  onServiceIdChange,
  formServiceOptions,
  servicesLookupUnavailable,
  professionalId,
  onProfessionalIdChange,
  formProfessionalOptions,
  professionalsLookupUnavailable,
  scheduledAt,
  onScheduledAtChange,
  status,
  onStatusChange,
  notes,
  onNotesChange,
  submitting,
  appointmentReferencesReady,
  onCancelEdit
}: PetAppointmentFormProps) {
  return (
    <PermissionGuard permission={editingId ? 'pet.appointment.update' : 'pet.appointment.create'}>
      <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-3">
        <FormSelect label="Cliente" value={clientId} options={formClientOptions} onChange={onClientIdChange} disabled={clientsLookupUnavailable} />
        <FormSelect label="Pet" value={petId} options={formPetOptions} onChange={onPetIdChange} disabled={profilesLookupUnavailable} />
        <FormSelect label="Serviço" value={serviceId} options={formServiceOptions} onChange={onServiceIdChange} disabled={servicesLookupUnavailable} />
        <FormSelect
          label="Profissional"
          value={professionalId}
          options={formProfessionalOptions}
          onChange={onProfessionalIdChange}
          disabled={professionalsLookupUnavailable}
        />
        <DateTimeInput label="Data e hora" value={scheduledAt} onChange={onScheduledAtChange} required />
        <FormSelect label="Status" value={status} options={petAppointmentFormStatusOptions} onChange={onStatusChange} />
        <FormInput label="Notas" value={notes} onChange={onNotesChange} />

        <div className="md:col-span-3 flex gap-2">
          {!appointmentReferencesReady ? (
            <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              O formulário depende de clientes, pets, serviços e profissionais carregados para funcionar corretamente.
            </div>
          ) : null}
          <button
            type="submit"
            disabled={submitting || !appointmentReferencesReady}
            className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? 'Salvando...' : editingId ? 'Atualizar atendimento' : 'Criar atendimento'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancelar edição
            </button>
          ) : null}
        </div>
      </form>
    </PermissionGuard>
  );
}

type CreatePetAppointmentColumnsArgs = {
  clients: PetClient[];
  professionals: PetProfessional[];
  profiles: PetProfile[];
  clientsLookupUnavailable: boolean;
  professionalsLookupUnavailable: boolean;
  profilesLookupUnavailable: boolean;
  onEdit: (appointment: PetAppointment) => void;
  onDelete: (appointment: PetAppointment) => void;
};

export function createPetAppointmentColumns({
  clients,
  professionals,
  profiles,
  clientsLookupUnavailable,
  professionalsLookupUnavailable,
  profilesLookupUnavailable,
  onEdit,
  onDelete
}: CreatePetAppointmentColumnsArgs): DataTableColumn<PetAppointment>[] {
  return [
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
      key: 'careState',
      header: 'Fluxo clínico',
      render: (appointment) => {
        const medicalRecordCount = appointment.medicalRecordCount ?? 0;
        const vaccinationCount = appointment.vaccinationCount ?? 0;
        const prescriptionCount = appointment.prescriptionCount ?? 0;

        return (
          <div>
            <div className="font-medium text-slate-800">{resolveAppointmentCareState(appointment)}</div>
            <div className="text-xs text-slate-500">
              Prontuários {medicalRecordCount} | Vacinas {vaccinationCount} | Prescrições {prescriptionCount}
            </div>
          </div>
        );
      }
    },
    {
      key: 'client',
      header: 'Cliente',
      render: (appointment) => {
        if (appointment.clientName) {
          return appointment.clientName;
        }

        return resolvePetLookupLabel(
          clients,
          appointment.clientId,
          (client) => client.name ?? client.fullName,
          'Cliente',
          clientsLookupUnavailable
        );
      }
    },
    {
      key: 'pet',
      header: 'Pet',
      render: (appointment) =>
        appointment.petName ??
        resolvePetLookupLabel(profiles, appointment.petId, (profile) => profile.name, 'Pet', profilesLookupUnavailable)
    },
    {
      key: 'professional',
      header: 'Profissional',
      render: (appointment) =>
        appointment.professionalName ??
        resolvePetLookupLabel(
          professionals,
          appointment.professionalId,
          (professional) => professional.name,
          'Profissional',
          professionalsLookupUnavailable
        )
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (appointment) => (
        <div className="flex gap-2">
          <PermissionGuard permission="pet.appointment.update">
            <button
              type="button"
              onClick={() => onEdit(appointment)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>

          <PermissionGuard permission="pet.appointment.delete">
            <button
              type="button"
              onClick={() => onDelete(appointment)}
              className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700"
            >
              Excluir
            </button>
          </PermissionGuard>

          {appointment.status.toUpperCase() !== 'CANCELED' ? (
            <PermissionGuard anyOf={petMedicalRoutePermissions}>
              <Link
                href={`/pet/medical-records?appointmentId=${appointment.id}`}
                className="rounded-lg border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700"
              >
                {resolveAppointmentCareActionLabel(appointment)}
              </Link>
            </PermissionGuard>
          ) : null}
        </div>
      )
    }
  ];
}
