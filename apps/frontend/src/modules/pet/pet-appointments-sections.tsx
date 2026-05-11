'use client';

import { FormEventHandler } from 'react';
import Link from 'next/link';
import { petMedicalRoutePermissions } from '@/modules/pet/pet-medical-permissions';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import type { AppLocale } from '@/shared/i18n/app-i18n-provider';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatCurrencyForLocale, formatDateTimeForLocale } from '@/shared/i18n/formatters';
import { DataTableColumn } from '@/shared/ui/data-table';
import { DateTimeInput } from '@/shared/ui/datetime-input';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { ClientPlan, PetAppointment, PetClient, PetProfessional, PetProfile } from '@/shared/types/pet';
import { resolvePetLookupLabel } from '@/modules/pet/pet-lookup-feedback';
import { SearchBar } from '@/shared/ui/search-bar';

export type PetSelectOption = {
  value: string;
  label: string;
};

export type PetAppointmentServiceSummary = {
  title: string;
  description: string;
  headline: string;
  selectedServicesLabel: string;
  emptySelectionLabel: string;
  addServiceLabel: string;
  removeServiceLabel: string;
  details: Array<{
    label: string;
    value: string;
  }>;
  notices: string[];
};

export type PetAppointmentSelectedService = {
  serviceId: string;
  label: string;
  note?: string;
  inventoryPreview?: string;
  professionalId: string;
  professionalName?: string | null;
  professionalPending: boolean;
  commissionContext?: string;
  commissionTone?: 'neutral' | 'accent' | 'warning';
  removable: boolean;
};

function buildPetAppointmentStatusOptions(messages: ReturnType<typeof useAppMessages>['petAppointments']): PetSelectOption[] {
  return [
    { value: '', label: messages.statuses.all },
    { value: 'SCHEDULED', label: messages.statuses.scheduled },
    { value: 'CONFIRMED', label: messages.statuses.confirmed },
    { value: 'IN_PROGRESS', label: messages.statuses.inProgress },
    { value: 'COMPLETED', label: messages.statuses.completed },
    { value: 'CANCELED', label: messages.statuses.canceled },
    { value: 'NO_SHOW', label: messages.statuses.noShow }
  ];
}

function hasPetTaxi(appointment: PetAppointment) {
  return /taxi/i.test(appointment.extrasDescription ?? '');
}

function AppointmentSignalPill({
  label,
  tone = 'neutral'
}: {
  label: string;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
}) {
  const toneClass = tone === 'accent'
    ? 'bg-teal-100 text-teal-800'
    : tone === 'success'
      ? 'bg-emerald-100 text-emerald-800'
      : tone === 'warning'
        ? 'bg-amber-100 text-amber-800'
        : tone === 'danger'
          ? 'bg-red-100 text-red-800'
          : 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneClass}`}>
      {label}
    </span>
  );
}

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
  const messages = resolveAppointmentCareState(appointment);
  return messages === 'PENDING'
    ? 'PENDING'
    : 'CONTINUE';
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
  activeFilterCount: number;
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
  activeFilterCount,
  onSearch,
  onClear
}: PetAppointmentsFiltersProps) {
  const commonButtons = useAppMessages().common.buttons;
  const t = useAppMessages().petAppointments;
  const statusOptions = buildPetAppointmentStatusOptions(t);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_repeat(2,minmax(0,0.9fr))]">
        <SearchBar value={searchInput} onChange={onSearchInputChange} placeholder={t.filters.searchPlaceholder} />
        <FormSelect label={t.filters.status} value={statusFilter} options={statusOptions} onChange={onStatusFilterChange} />
        <FormSelect label={t.filters.client} value={clientFilterId} options={clientOptions} onChange={onClientFilterIdChange} disabled={clientsLookupUnavailable} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto] xl:items-end">
        <FormSelect label={t.filters.pet} value={petFilterId} options={petOptions} onChange={onPetFilterIdChange} disabled={profilesLookupUnavailable} />
        <FormSelect label={t.filters.service} value={serviceFilterId} options={serviceOptions} onChange={onServiceFilterIdChange} disabled={servicesLookupUnavailable} />
        <FormSelect
          label={t.filters.professional}
          value={professionalFilterId}
          options={professionalOptions}
          onChange={onProfessionalFilterIdChange}
          disabled={professionalsLookupUnavailable}
        />
        <div className="flex items-end gap-2 pb-0.5">
          <button
            type="button"
            onClick={onSearch}
            className="ui-primary-button"
          >
            {commonButtons.search}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="ui-inline-button"
          >
            {commonButtons.clear}
          </button>
        </div>
      </div>

      <div className="text-sm text-[color:var(--app-shell-muted)]">
        {activeFilterCount > 0
          ? `${activeFilterCount} ${t.filters.activeCountSuffix}`
          : t.filters.noActive}
      </div>
    </div>
  );
}

type PetAppointmentFormProps = {
  editingId: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  // Booking fields
  clientId: string;
  onClientIdChange: (value: string) => void;
  formClientOptions: PetSelectOption[];
  clientsLookupUnavailable: boolean;
  petId: string;
  onPetIdChange: (value: string) => void;
  formPetOptions: PetSelectOption[];
  profilesLookupUnavailable: boolean;
  servicePickerId: string;
  onServicePickerIdChange: (value: string) => void;
  formServiceOptions: PetSelectOption[];
  servicesLookupUnavailable: boolean;
  selectedServices: PetAppointmentSelectedService[];
  onAddService: () => void;
  onRemoveService: (serviceId: string) => void;
  canAddSelectedService: boolean;
  professionalId: string;
  onProfessionalIdChange: (value: string) => void;
  formProfessionalOptions: PetSelectOption[];
  serviceLineProfessionalOptions: PetSelectOption[];
  onSelectedServiceProfessionalChange: (serviceId: string, professionalId: string) => void;
  professionalsLookupUnavailable: boolean;
  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  // Plan & checkout fields
  clientPlanId: string;
  onClientPlanIdChange: (value: string) => void;
  planOptions: PetSelectOption[];
  selectedClientPlan: ClientPlan | null;
  extrasAmount: string;
  onExtrasAmountChange: (value: string) => void;
  extrasDescription: string;
  onExtrasDescriptionChange: (value: string) => void;
  serviceSummaryTitle: string;
  serviceSummaryEmpty: string;
  selectedServiceSummary: PetAppointmentServiceSummary | null;
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
  servicePickerId,
  onServicePickerIdChange,
  formServiceOptions,
  servicesLookupUnavailable,
  selectedServices,
  onAddService,
  onRemoveService,
  canAddSelectedService,
  professionalId,
  onProfessionalIdChange,
  formProfessionalOptions,
  serviceLineProfessionalOptions,
  onSelectedServiceProfessionalChange,
  professionalsLookupUnavailable,
  scheduledAt,
  onScheduledAtChange,
  status,
  onStatusChange,
  notes,
  onNotesChange,
  clientPlanId,
  onClientPlanIdChange,
  planOptions,
  selectedClientPlan,
  extrasAmount,
  onExtrasAmountChange,
  extrasDescription,
  onExtrasDescriptionChange,
  serviceSummaryTitle,
  serviceSummaryEmpty,
  selectedServiceSummary,
  submitting,
  appointmentReferencesReady,
  onCancelEdit
}: PetAppointmentFormProps) {
  const { locale } = useAppI18n();
  const t = useAppMessages().petAppointments;
  const statusOptions = buildPetAppointmentStatusOptions(t).filter((option) => option.value);
  const hasPlanOptions = planOptions.length > 1; // more than just the "No plan" placeholder

  return (
    <PermissionGuard permission={editingId ? 'pet.appointment.update' : 'pet.appointment.create'}>
      <form onSubmit={onSubmit} className="space-y-6">

        {/* Section: Booking */}
        <div className="ui-surface-panel space-y-5 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">{t.form.bookingTitle}</p>
            <p className="mt-1 text-sm leading-6 text-[color:var(--app-shell-muted)]">{t.form.bookingDescription}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormSelect label={t.filters.client} value={clientId} options={formClientOptions} onChange={onClientIdChange} disabled={clientsLookupUnavailable} />
            <FormSelect label={t.filters.pet} value={petId} options={formPetOptions} onChange={onPetIdChange} disabled={profilesLookupUnavailable} />
          </div>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(260px,0.8fr)]">
            <div className="space-y-3">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <FormSelect
                  label={t.filters.service}
                  value={servicePickerId}
                  options={formServiceOptions}
                  onChange={onServicePickerIdChange}
                  disabled={servicesLookupUnavailable}
                />
                <button
                  type="button"
                  onClick={onAddService}
                  disabled={!canAddSelectedService || servicesLookupUnavailable}
                  className="ui-secondary-button whitespace-nowrap"
                >
                  {selectedServiceSummary?.addServiceLabel ?? 'Add service'}
                </button>
              </div>
              <div className="rounded-xl border border-[color:var(--app-shell-border)] bg-white/80 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--app-shell-muted)]">
                  {selectedServiceSummary?.selectedServicesLabel ?? 'Selected services'}
                </p>
                {selectedServices.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {selectedServices.map((service) => (
                      <div
                        key={service.serviceId}
                        className="flex items-start justify-between gap-3 rounded-lg border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">{service.label}</p>
                          {service.note ? (
                            <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">{service.note}</p>
                          ) : null}
                          {service.inventoryPreview ? (
                            <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">
                              {service.inventoryPreview}
                            </p>
                          ) : null}
                          <div className="mt-3 space-y-1.5">
                            <FormSelect
                              label={t.form.serviceLineProfessional}
                              value={service.professionalId}
                              options={serviceLineProfessionalOptions}
                              onChange={(value) => onSelectedServiceProfessionalChange(service.serviceId, value)}
                              disabled={professionalsLookupUnavailable}
                            />
                            <p className="text-[11px] text-[color:var(--app-shell-muted)]">
                              {service.professionalPending
                                ? t.form.serviceLineProfessionalPending
                                : service.professionalName}
                            </p>
                            <p className="text-[11px] text-[color:var(--app-shell-muted)]">
                              {t.form.serviceLineProfessionalHint}
                            </p>
                          </div>
                          {service.commissionContext ? (
                            <span
                              className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                service.commissionTone === 'accent'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : service.commissionTone === 'warning'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {service.commissionContext}
                            </span>
                          ) : null}
                        </div>
                        {service.removable ? (
                          <button
                            type="button"
                            onClick={() => onRemoveService(service.serviceId)}
                            className="ui-inline-button whitespace-nowrap"
                          >
                            {selectedServiceSummary?.removeServiceLabel ?? 'Remove'}
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-[color:var(--app-shell-muted)]">
                    {selectedServiceSummary?.emptySelectionLabel ?? 'Add at least one structured service before saving.'}
                  </p>
                )}
              </div>
            </div>
            <FormSelect
              label={t.filters.professional}
              value={professionalId}
              options={formProfessionalOptions}
              onChange={onProfessionalIdChange}
              disabled={professionalsLookupUnavailable}
            />
            <p className="text-xs text-[color:var(--app-shell-muted)]">
              {t.form.defaultProfessionalHint}
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--app-shell-muted)]">{serviceSummaryTitle}</p>
            {selectedServiceSummary ? (
              <>
                <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">{selectedServiceSummary.description}</p>
                <p className="mt-3 text-sm font-medium text-slate-900">{selectedServiceSummary.headline}</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {selectedServiceSummary.details.map((detail) => (
                    <div key={detail.label} className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--app-shell-muted)]">{detail.label}</p>
                      <p className="text-sm text-slate-900">{detail.value}</p>
                    </div>
                  ))}
                </div>
                {selectedServiceSummary.notices.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {selectedServiceSummary.notices.map((notice) => (
                      <div key={notice} className="rounded-md border border-[color:var(--app-shell-border)] bg-white/80 px-3 py-2 text-xs text-[color:var(--app-shell-muted)]">
                        {notice}
                      </div>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="mt-2 text-xs text-[color:var(--app-shell-muted)]">{serviceSummaryEmpty}</p>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <DateTimeInput label={t.form.dateTime} value={scheduledAt} onChange={onScheduledAtChange} required />
            <FormSelect label={t.filters.status} value={status} options={statusOptions} onChange={onStatusChange} />
          </div>
          <FormInput label={t.form.notes} value={notes} onChange={onNotesChange} placeholder={t.form.notesPlaceholder} />
        </div>

        {/* Section: Plan & Checkout */}
        <div className="ui-surface-panel space-y-5 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-900">{t.form.packageTitle}</p>
            <p className="mt-1 text-sm leading-6 text-[color:var(--app-shell-muted)]">{t.form.packageDescription}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
            <div>
              <FormSelect
                label={t.form.packageLabel}
                value={clientPlanId}
                options={planOptions}
                onChange={onClientPlanIdChange}
                disabled={!clientId || !hasPlanOptions}
              />
              {!clientId ? (
                <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">{t.form.packageSelectClient}</p>
              ) : !hasPlanOptions ? (
                <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">{t.form.packageUnavailable}</p>
              ) : null}
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-900">
              <p className="font-medium">{t.form.packageServiceRequiredTitle}</p>
              <p className="mt-1">{t.form.packageServiceRequiredDescription}</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label={t.form.extrasAmount}
              value={extrasAmount}
              onChange={onExtrasAmountChange}
              type="number"
              placeholder="0.00"
            />
            <FormInput
              label={t.form.extrasDescription}
              value={extrasDescription}
              onChange={onExtrasDescriptionChange}
              placeholder={t.form.extrasPlaceholder}
            />
          </div>

          {clientPlanId ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
              <p className="font-medium">{selectedClientPlan?.planName ?? t.form.packageSelectedTitle}</p>
              <p className="mt-1">
                {selectedClientPlan
                  ? t.form.packageRemainingSessions.replace('{count}', String(selectedClientPlan.remainingSessions))
                  : t.form.packageCoverageFull}
              </p>
              <p className="mt-1">{t.form.packageCoverageIntro}</p>
              <p className="mt-1">{t.form.packageServiceRequiredDescription}</p>
              {extrasAmount && parseFloat(extrasAmount) > 0 ? (
                <p className="mt-1">
                  {t.form.packageCoverageExtras.replace('{amount}', formatCurrencyForLocale(locale, parseFloat(extrasAmount)).replace(/^R\$\s?/, ''))}
                </p>
              ) : null}
            </div>
          ) : null}

          {!appointmentReferencesReady ? (
            <div className="ui-notice-warning">
              {t.form.referencesRequired}
            </div>
          ) : null}
        </div>

        <div className="flex gap-2 mt-1">
          <button
            type="submit"
            disabled={submitting || !appointmentReferencesReady}
            className="ui-primary-button"
          >
            {submitting ? t.form.save : editingId ? t.form.update : t.form.create}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="ui-secondary-button"
            >
              {t.form.cancel}
            </button>
          ) : null}
        </div>
      </form>
    </PermissionGuard>
  );
}

type CreatePetAppointmentColumnsArgs = {
  locale: AppLocale;
  messages: ReturnType<typeof useAppMessages>['petAppointments'];
  commonButtons: ReturnType<typeof useAppMessages>['common']['buttons'];
  clients: PetClient[];
  professionals: PetProfessional[];
  profiles: PetProfile[];
  clientsLookupUnavailable: boolean;
  professionalsLookupUnavailable: boolean;
  profilesLookupUnavailable: boolean;
  onEdit: (appointment: PetAppointment) => void;
  onDelete: (appointment: PetAppointment) => void;
  onPreparePickupMessage: (appointment: PetAppointment) => void;
  onDispatchPickupMessage: (appointment: PetAppointment) => void;
  preparingPickupAppointmentId: string | null;
  dispatchingPickupAppointmentId: string | null;
  preparedPickupAppointmentId: string | null;
  dispatchedPickupAppointmentId: string | null;
};

export function createPetAppointmentColumns({
  locale,
  messages,
  commonButtons,
  clients,
  professionals,
  profiles,
  clientsLookupUnavailable,
  professionalsLookupUnavailable,
  profilesLookupUnavailable,
  onEdit,
  onDelete,
  onPreparePickupMessage,
  onDispatchPickupMessage,
  preparingPickupAppointmentId,
  dispatchingPickupAppointmentId,
  preparedPickupAppointmentId,
  dispatchedPickupAppointmentId
}: CreatePetAppointmentColumnsArgs): DataTableColumn<PetAppointment>[] {
  const resolveClientEmail = (appointment: PetAppointment) => {
    return clients.find((client) => client.id === appointment.clientId)?.email ?? null;
  };

  const resolveServiceLineCount = (appointment: PetAppointment) =>
    appointment.appointmentServices?.length ?? appointment.serviceCount ?? 1;

  const resolveCommissionEligibleLineCount = (appointment: PetAppointment) =>
    appointment.appointmentServices?.length
      ? appointment.appointmentServices.filter((line) => line.commissionEligible === true).length
      : null;

  const resolveLineAssignments = (appointment: PetAppointment) =>
    appointment.appointmentServices?.map((line) => ({
      serviceId: line.serviceId,
      serviceName: line.serviceName,
      professionalName: line.professionalName ?? messages.columns.pendingProfessional
    })) ?? [];

  return [
    {
      key: 'serviceName',
      header: messages.columns.service,
      render: (appointment) => (
        <div className="space-y-1.5">
          <div className="font-medium text-sm">{appointment.serviceName}</div>
          {appointment.petName ? (
            <div className="text-xs text-[color:var(--app-shell-muted)]">{appointment.petName}</div>
          ) : null}
          {resolveServiceLineCount(appointment) > 1 && resolveCommissionEligibleLineCount(appointment) != null ? (
            <div className="text-xs text-[color:var(--app-shell-muted)]">
              {resolveServiceLineCount(appointment)} {messages.columns.serviceLines} · {resolveCommissionEligibleLineCount(appointment)} {messages.columns.commissionLines}
            </div>
          ) : null}
          <div className="text-xs text-[color:var(--app-shell-muted)]">
            {messages.columns.responsible}: {appointment.professionalName ??
              resolvePetLookupLabel(
                professionals,
                appointment.professionalId,
                (professional) => professional.name,
                'Professional',
                professionalsLookupUnavailable
              )}
          </div>
          {resolveLineAssignments(appointment).length > 0 ? (
            <div className="pt-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--app-shell-muted)]">
                {messages.columns.lineAssignments}
              </div>
              <div className="mt-1 space-y-1">
                {resolveLineAssignments(appointment).map((line) => (
                  <div key={`${appointment.id}-${line.serviceId}`} className="text-xs text-[color:var(--app-shell-muted)]">
                    {line.serviceName} · {line.professionalName}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {hasPetTaxi(appointment) ? (
            <div>
              <AppointmentSignalPill label={messages.columns.petTaxi} tone="accent" />
            </div>
          ) : null}
        </div>
      )
    },
    {
      key: 'scheduledAt',
      header: messages.columns.scheduled,
      render: (appointment) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">
            {formatDateTimeForLocale(locale, appointment.scheduledAt)}
          </p>
          <p className="text-xs text-[color:var(--app-shell-muted)]">
            {appointment.status.toUpperCase() === 'COMPLETED'
              ? messages.columns.petReady
              : messages.columns.checkoutAfterSlot}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      header: messages.columns.status,
      render: (appointment) => {
        const clientEmail = resolveClientEmail(appointment);
        const completed = appointment.status.toUpperCase() === 'COMPLETED';

        return (
          <div className="space-y-2">
            <StatusBadge status={appointment.status} />
            {completed ? (
              <p className="text-xs text-[color:var(--app-shell-muted)]">
                {clientEmail ? messages.columns.pickupSent : messages.columns.pickupSkipped}
              </p>
            ) : appointment.status.toUpperCase() === 'IN_PROGRESS' ? (
              <p className="text-xs text-[color:var(--app-shell-muted)]">
                {messages.columns.inProgressDetail}
              </p>
            ) : null}
          </div>
        );
      }
    },
    {
      key: 'planSessions',
      header: messages.columns.plan,
      render: (appointment) => {
        if (!appointment.clientPlanId) {
          return (
            <div className="space-y-1">
              <AppointmentSignalPill label={messages.columns.oneTime} />
              <p className="text-xs text-[color:var(--app-shell-muted)]">
                {messages.columns.chargeCheckout}
              </p>
            </div>
          );
        }
        const remaining = appointment.planRemainingSessions;
        if (remaining == null) {
          return (
            <div className="space-y-1">
              <AppointmentSignalPill label={messages.columns.activePlan} tone="accent" />
              <p className="text-xs text-[color:var(--app-shell-muted)]">
                {messages.columns.linkedPlan}
              </p>
            </div>
          );
        }
        const isLow = remaining <= 2;
        const isExhausted = remaining === 0;
        return (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1.5">
              <AppointmentSignalPill label={messages.columns.activePlan} tone="success" />
              <AppointmentSignalPill
                label={isExhausted ? messages.columns.allUsed : `${remaining} ${messages.columns.leftSuffix}`}
                tone={isExhausted ? 'danger' : isLow ? 'warning' : 'success'}
              />
            </div>
            {appointment.planCovered ? (
              <div className="text-xs text-emerald-700">{messages.columns.coveredByPlan}</div>
            ) : null}
            {appointment.planSessionConsumed ? (
              <div className="text-xs text-emerald-700">{messages.columns.sessionUsed}</div>
            ) : null}
            {appointment.planSessionConsumed && remaining === 2 ? (
              <div className="text-xs text-amber-700">{messages.columns.renewalTriggered}</div>
            ) : null}
          </div>
        );
      }
    },
    {
      key: 'payment',
      header: messages.columns.payment,
      render: (appointment) => {
        const due = appointment.finalAmountDue;
        const servicePrice = appointment.servicePrice;
        const extras = appointment.extrasAmount;
        const covered = appointment.planCovered;

        if (due == null && servicePrice == null) {
          return <span className="text-xs text-[color:var(--app-shell-muted)]">—</span>;
        }

        return (
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[color:var(--app-shell-muted)]">{messages.columns.serviceAmount}</span>
              {covered ? (
                <span className="font-medium text-emerald-700">{messages.columns.coveredByPlan}</span>
              ) : (
                <span className="font-medium">
                  {servicePrice != null ? formatCurrencyForLocale(locale, servicePrice) : '—'}
                </span>
              )}
            </div>
            {extras != null && extras > 0 ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-[color:var(--app-shell-muted)]">
                  {hasPetTaxi(appointment) ? messages.columns.petTaxiAmount : appointment.extrasDescription ?? messages.columns.extras}
                </span>
                <span className="font-medium">{formatCurrencyForLocale(locale, extras)}</span>
              </div>
            ) : null}
            {due != null ? (
              <div className="flex items-center justify-between gap-3 border-t border-border pt-0.5 mt-0.5">
                <span className="font-semibold text-foreground">{messages.columns.totalDue}</span>
                <span className={`font-semibold ${due === 0 ? 'text-emerald-700' : 'text-foreground'}`}>
                  {due === 0
                    ? (appointment.planCovered ? messages.columns.fullyCovered : formatCurrencyForLocale(locale, 0))
                    : formatCurrencyForLocale(locale, due)}
                </span>
              </div>
            ) : null}
          </div>
        );
      }
    },
    {
      key: 'careState',
      header: messages.columns.care,
      render: (appointment) => {
        const medicalRecordCount = appointment.medicalRecordCount ?? 0;
        const vaccinationCount = appointment.vaccinationCount ?? 0;
        const prescriptionCount = appointment.prescriptionCount ?? 0;

        return (
          <div>
            <div>
              <StatusBadge status={resolveAppointmentCareState(appointment)} />
            </div>
            <div className="text-xs text-[color:var(--app-shell-muted)] mt-0.5">
              {medicalRecordCount} {messages.columns.records} · {vaccinationCount} {messages.columns.vaccines} · {prescriptionCount} {messages.columns.prescriptions}
            </div>
          </div>
        );
      }
    },
    {
      key: 'client',
      header: messages.columns.client,
      render: (appointment) => {
        const clientLabel = appointment.clientName
          ? appointment.clientName
          : resolvePetLookupLabel(
            clients,
            appointment.clientId,
            (client) => client.name ?? client.fullName,
            'Client',
            clientsLookupUnavailable
          );

        if (appointment.clientName) {
          return (
            <div className="space-y-1">
              <p className="font-medium text-slate-900">{clientLabel}</p>
              <AppointmentSignalPill
                label={appointment.clientPlanId ? messages.columns.recurring : messages.columns.oneTime}
                tone={appointment.clientPlanId ? 'success' : 'neutral'}
              />
            </div>
          );
        }

        return (
          <div className="space-y-1">
            <p className="font-medium text-slate-900">{clientLabel}</p>
            <AppointmentSignalPill
              label={appointment.clientPlanId ? messages.columns.recurring : messages.columns.oneTime}
              tone={appointment.clientPlanId ? 'success' : 'neutral'}
            />
          </div>
        );
      }
    },
    {
      key: 'professional',
      header: messages.columns.professional,
      render: (appointment) => (
        <div className="space-y-1">
          <p className="font-medium text-slate-900">
            {appointment.professionalName ??
              resolvePetLookupLabel(
                professionals,
                appointment.professionalId,
                (professional) => professional.name,
                'Professional',
                professionalsLookupUnavailable
              )}
          </p>
          <p className="text-xs text-[color:var(--app-shell-muted)]">{messages.columns.professionalDetail}</p>
          {(() => {
            const commissionEligibleLineCount = resolveCommissionEligibleLineCount(appointment);
            return (
              <p className="text-xs text-[color:var(--app-shell-muted)]">
                {messages.columns.commission} {appointment.commissionAmount != null
                  ? formatCurrencyForLocale(locale, appointment.commissionAmount)
                  : commissionEligibleLineCount === 0
                    ? messages.columns.commissionExcluded
                    : messages.columns.pendingSetup}
              </p>
            );
          })()}
        </div>
      )
    },
    {
      key: 'actions',
      header: messages.columns.actions,
      render: (appointment) => (
        <div className="flex gap-2 flex-wrap">
          <PermissionGuard permission="pet.appointment.update">
            <button
              type="button"
              onClick={() => onEdit(appointment)}
              className="ui-inline-button"
            >
              {commonButtons.edit}
            </button>
          </PermissionGuard>

          <PermissionGuard permission="pet.appointment.delete">
            <button
              type="button"
              onClick={() => onDelete(appointment)}
              className="ui-inline-danger-button"
            >
              {commonButtons.delete}
            </button>
          </PermissionGuard>

          {appointment.status.toUpperCase() !== 'CANCELED' ? (
            <PermissionGuard anyOf={petMedicalRoutePermissions}>
              <Link
                href={`/pet/medical-records?appointmentId=${appointment.id}`}
                className="rounded-lg border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700"
              >
                {resolveAppointmentCareActionLabel(appointment) === 'PENDING'
                  ? messages.columns.careNotes
                  : messages.columns.continueCare}
              </Link>
            </PermissionGuard>
          ) : null}

          {appointment.status.toUpperCase() === 'COMPLETED' ? (
            <PermissionGuard permission="pet.appointment.read">
              <button
                type="button"
                onClick={() => onPreparePickupMessage(appointment)}
                className="rounded-lg border border-sky-300 px-2 py-1 text-xs font-medium text-sky-700"
                disabled={preparingPickupAppointmentId === appointment.id}
              >
                {preparingPickupAppointmentId === appointment.id ? 'Preparando...' : 'Pronto para retirada'}
              </button>
            </PermissionGuard>
          ) : null}
          {appointment.status.toUpperCase() === 'COMPLETED' ? (
            <PermissionGuard permission="pet.appointment.update">
              <button
                type="button"
                onClick={() => onDispatchPickupMessage(appointment)}
                className="rounded-lg border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700"
                disabled={dispatchingPickupAppointmentId === appointment.id}
              >
                {dispatchingPickupAppointmentId === appointment.id ? messages.preparedPickup.officialSending : messages.preparedPickup.officialSend}
              </button>
            </PermissionGuard>
          ) : null}
          {preparedPickupAppointmentId === appointment.id ? (
            <AppointmentSignalPill label="Mensagem preparada" tone="success" />
          ) : null}
          {dispatchedPickupAppointmentId === appointment.id ? (
            <AppointmentSignalPill label={messages.preparedPickup.officialSent} tone="success" />
          ) : null}
        </div>
      )
    }
  ];
}
