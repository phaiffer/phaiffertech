'use client';

import { FormEventHandler } from 'react';
import Link from 'next/link';
import { petMedicalRoutePermissions } from '@/modules/pet/pet-medical-permissions';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { StatusBadge } from '@/shared/dashboard/status-badge';
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
  { value: '', label: 'All' },
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
    ? 'Start visit'
    : 'Continue visit';
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
    <div className="grid gap-3 ui-surface-panel p-4 md:grid-cols-[1fr_180px_220px_220px_220px_220px_auto_auto]">
      <SearchBar value={searchInput} onChange={onSearchInputChange} placeholder="Service, status, notes" />
      <FormSelect label="Status" value={statusFilter} options={petAppointmentStatusOptions} onChange={onStatusFilterChange} />
      <FormSelect label="Client" value={clientFilterId} options={clientOptions} onChange={onClientFilterIdChange} disabled={clientsLookupUnavailable} />
      <FormSelect label="Pet" value={petFilterId} options={petOptions} onChange={onPetFilterIdChange} disabled={profilesLookupUnavailable} />
      <FormSelect label="Service" value={serviceFilterId} options={serviceOptions} onChange={onServiceFilterIdChange} disabled={servicesLookupUnavailable} />
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
        className="ui-primary-button"
      >
        Search
      </button>
      <button
        type="button"
        onClick={onClear}
        className="ui-secondary-button"
      >
        Clear
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
  extrasAmount: string;
  onExtrasAmountChange: (value: string) => void;
  extrasDescription: string;
  onExtrasDescriptionChange: (value: string) => void;
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
  extrasAmount,
  onExtrasAmountChange,
  extrasDescription,
  onExtrasDescriptionChange,
  submitting,
  appointmentReferencesReady,
  onCancelEdit
}: PetAppointmentFormProps) {
  return (
    <PermissionGuard permission={editingId ? 'pet.appointment.update' : 'pet.appointment.create'}>
      <form onSubmit={onSubmit} className="grid gap-3 ui-surface-panel p-4 md:grid-cols-3">
        <FormSelect label="Client" value={clientId} options={formClientOptions} onChange={onClientIdChange} disabled={clientsLookupUnavailable} />
        <FormSelect label="Pet" value={petId} options={formPetOptions} onChange={onPetIdChange} disabled={profilesLookupUnavailable} />
        <FormSelect label="Service" value={serviceId} options={formServiceOptions} onChange={onServiceIdChange} disabled={servicesLookupUnavailable} />
        <FormSelect
          label="Professional"
          value={professionalId}
          options={formProfessionalOptions}
          onChange={onProfessionalIdChange}
          disabled={professionalsLookupUnavailable}
        />
        <DateTimeInput label="Date & time" value={scheduledAt} onChange={onScheduledAtChange} required />
        <FormSelect label="Status" value={status} options={petAppointmentFormStatusOptions} onChange={onStatusChange} />
        <FormInput label="Notes" value={notes} onChange={onNotesChange} />
        <FormInput label="Extras amount" value={extrasAmount} onChange={onExtrasAmountChange} type="number" placeholder="0.00" />
        <FormInput label="Extras description" value={extrasDescription} onChange={onExtrasDescriptionChange} placeholder="e.g. Pet taxi + nail trim" />

        <div className="md:col-span-3 flex gap-2">
          {!appointmentReferencesReady ? (
            <div className="w-full ui-notice-warning">
              Appointments need clients, pet profiles, services, and professionals available first. Load or create those records, then return here to book the visit.
            </div>
          ) : null}
          <button
            type="submit"
            disabled={submitting || !appointmentReferencesReady}
            className="ui-primary-button"
          >
            {submitting ? 'Saving...' : editingId ? 'Update appointment' : 'Book appointment'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="ui-secondary-button"
            >
              Cancel
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
      header: 'Service',
      render: (appointment) => appointment.serviceName
    },
    {
      key: 'scheduledAt',
      header: 'Scheduled',
      render: (appointment) => new Date(appointment.scheduledAt).toLocaleString()
    },
    {
      key: 'status',
      header: 'Status',
      render: (appointment) => <StatusBadge status={appointment.status} />
    },
    {
      key: 'planSessions',
      header: 'Plan',
      render: (appointment) => {
        if (!appointment.clientPlanId) {
          return <span className="text-xs text-[color:var(--app-shell-muted)]">One-time</span>;
        }
        const remaining = appointment.planRemainingSessions;
        if (remaining == null) {
          return <span className="text-xs text-[color:var(--app-shell-muted)]">Plan</span>;
        }
        const isLow = remaining <= 2;
        return (
          <span
            title={`Plan sessions remaining: ${remaining}`}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              isLow
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isLow ? '⚠' : '✓'} {remaining} left
          </span>
        );
      }
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (appointment) => {
        const due = appointment.finalAmountDue;
        if (due == null) {
          return <span className="text-xs text-[color:var(--app-shell-muted)]">—</span>;
        }
        return (
          <div>
            <div className="text-xs font-medium">
              {appointment.planCovered ? (
                <span className="text-emerald-700">Plan covered</span>
              ) : null}
              {' '}R$ {due.toFixed(2)}
            </div>
            {appointment.extrasDescription ? (
              <div className="text-xs text-[color:var(--app-shell-muted)]">{appointment.extrasDescription}</div>
            ) : null}
          </div>
        );
      }
    },
    {
      key: 'careState',
      header: 'Care',
      render: (appointment) => {
        const medicalRecordCount = appointment.medicalRecordCount ?? 0;
        const vaccinationCount = appointment.vaccinationCount ?? 0;
        const prescriptionCount = appointment.prescriptionCount ?? 0;

        return (
          <div>
            <div>
              <StatusBadge status={resolveAppointmentCareState(appointment)} />
            </div>
            <div className="text-xs text-[color:var(--app-shell-muted)]">
              Records {medicalRecordCount} | Vaccines {vaccinationCount} | Prescriptions {prescriptionCount}
            </div>
          </div>
        );
      }
    },
    {
      key: 'client',
      header: 'Client',
      render: (appointment) => {
        if (appointment.clientName) {
          return appointment.clientName;
        }

        return resolvePetLookupLabel(
          clients,
          appointment.clientId,
          (client) => client.name ?? client.fullName,
          'Client',
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
      header: 'Professional',
      render: (appointment) =>
        appointment.professionalName ??
        resolvePetLookupLabel(
          professionals,
          appointment.professionalId,
          (professional) => professional.name,
          'Professional',
          professionalsLookupUnavailable
        )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (appointment) => (
        <div className="flex gap-2">
          <PermissionGuard permission="pet.appointment.update">
            <button
              type="button"
              onClick={() => onEdit(appointment)}
              className="ui-inline-button"
            >
              Edit
            </button>
          </PermissionGuard>

          <PermissionGuard permission="pet.appointment.delete">
            <button
              type="button"
              onClick={() => onDelete(appointment)}
              className="ui-inline-danger-button"
            >
              Delete
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
