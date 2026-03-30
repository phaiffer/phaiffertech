'use client';

import { FormEventHandler } from 'react';
import { petMedicalRoutePermissions } from '@/modules/pet/pet-medical-permissions';
import { resolvePetLookupLabel } from '@/modules/pet/pet-lookup-feedback';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import {
  sharedCompactTextClass,
  sharedFilterToolbarClass,
  sharedFormActionsClass,
  sharedInlineActionsClass
} from '@/shared/components/public-visual-system';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { PageResponse } from '@/shared/types/common';
import {
  PetClinicalTimeline,
  PetClinicalTimelineEvent,
  PetMedicalRecord,
  PetPrescription,
  PetProfessional,
  PetProfile,
  PetVaccination
} from '@/shared/types/pet';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { DateTimeInput } from '@/shared/ui/datetime-input';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { FormTextarea } from '@/shared/ui/form-textarea';
import { Pagination } from '@/shared/ui/pagination';
import { PageSection } from '@/shared/ui/page-section';
import { SearchBar } from '@/shared/ui/search-bar';

export type PetSelectOption = {
  value: string;
  label: string;
};

function renderClinicalAppointmentLabel(
  appointmentServiceName?: string,
  appointmentScheduledAt?: string
) {
  if (!appointmentServiceName && !appointmentScheduledAt) {
    return 'Fluxo avulso';
  }

  const appointmentDate = appointmentScheduledAt
    ? new Date(appointmentScheduledAt).toLocaleString('pt-BR')
    : 'Data não informada';

  return (
    <div>
      <div className="font-medium text-slate-900">
        {appointmentServiceName ?? 'Atendimento vinculado'}
      </div>
      <div className="text-xs text-[color:var(--app-shell-muted)]">{appointmentDate}</div>
    </div>
  );
}

function resolveClinicalEventLabel(eventType: string) {
  switch (eventType) {
    case 'MEDICAL_RECORD':
      return 'Prontuario';
    case 'VACCINATION':
      return 'Vacinacao';
    case 'PRESCRIPTION':
      return 'Prescricao';
    default:
      return 'Evento clinico';
  }
}

function resolveClinicalEventBadgeClass(eventType: string) {
  switch (eventType) {
    case 'MEDICAL_RECORD':
      return 'border-info/30 bg-info-muted text-info';
    case 'VACCINATION':
      return 'border-success/30 bg-success-muted text-success';
    case 'PRESCRIPTION':
      return 'border-warning/30 bg-warning-muted text-warning';
    default:
      return 'border-border bg-surface-inset text-muted';
  }
}

function renderClinicalContextSummary(data: PetClinicalTimeline) {
  if (data.appointmentId) {
    return (
      <div className="ui-notice-info">
        <div className="font-medium">Timeline clinica do atendimento atual.</div>
        <div>
          {data.appointmentServiceName ?? 'Atendimento vinculado'}
          {data.petName ? ` para ${data.petName}` : ''}
          {data.appointmentScheduledAt ? ` em ${new Date(data.appointmentScheduledAt).toLocaleString('pt-BR')}` : ''}
          {data.appointmentStatus ? ` (${data.appointmentStatus})` : ''}.
        </div>
      </div>
    );
  }

  if (data.petName || data.petId) {
    return (
      <div className="ui-notice-neutral">
        <span className="font-medium">Timeline clinica do pet:</span>{' '}
        {data.petName ?? data.petId}
      </div>
    );
  }

  return null;
}

type PetClinicalTimelineSectionProps = {
  data: PetClinicalTimeline | null;
  loading: boolean;
  error?: string | null;
  ready: boolean;
};

export function PetClinicalTimelineSection({
  data,
  loading,
  error,
  ready
}: PetClinicalTimelineSectionProps) {
  const events = data?.events ?? [];
  const hiddenCount = data ? Math.max(data.totalEvents - events.length, 0) : 0;

  return (
    <PageSection
      title="Linha do Tempo Clínica"
      description="Leitura consolidada do historico recente por pet e atendimento."
      contentClassName="space-y-4"
    >
      {!ready ? (
        <div className="ui-notice-neutral">
          Selecione um pet ou abra um atendimento para visualizar a timeline clinica consolidada.
        </div>
      ) : null}

      {ready && loading ? (
        <div className="ui-notice-info">
          Carregando timeline clinica...
        </div>
      ) : null}

      {ready && !loading && error ? (
        <div className="ui-notice-error">
          {error}
        </div>
      ) : null}

      {ready && !loading && !error && data ? renderClinicalContextSummary(data) : null}

      {ready && !loading && !error && events.length > 0 ? (
        <div className="space-y-3">
          {hiddenCount > 0 ? (
            <div className="text-xs text-[color:var(--app-shell-muted)]">
              Exibindo os {events.length} eventos mais recentes de um total de {data?.totalEvents}.
            </div>
          ) : null}

          <div className="space-y-3">
            {events.map((event) => (
              <ClinicalTimelineEventCard key={event.eventId} event={event} />
            ))}
          </div>
        </div>
      ) : null}

      {ready && !loading && !error && data && events.length === 0 ? (
        <div className="ui-notice-neutral">
          Nenhum evento clinico encontrado para o contexto atual.
        </div>
      ) : null}
    </PageSection>
  );
}

function ClinicalTimelineEventCard({ event }: { event: PetClinicalTimelineEvent }) {
  return (
    <article className="ui-surface-muted rounded-2xl p-4 lg:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-1 text-xs font-medium ${resolveClinicalEventBadgeClass(event.eventType)}`}>
              {resolveClinicalEventLabel(event.eventType)}
            </span>
            <h4 className="text-sm font-semibold text-[color:var(--app-shell-heading)]">{event.title}</h4>
          </div>

          {event.summary ? <p className="text-sm text-[color:var(--app-shell-text)]">{event.summary}</p> : null}

          <div className="flex flex-wrap gap-3 text-xs text-[color:var(--app-shell-muted)]">
            <span>{new Date(event.occurredAt).toLocaleString('pt-BR')}</span>
            {event.petName ? <span>Pet: {event.petName}</span> : null}
            {event.professionalName ? <span>Profissional: {event.professionalName}</span> : null}
            {event.appointmentServiceName ? (
              <span>
                Atendimento: {event.appointmentServiceName}
                {event.appointmentScheduledAt ? ` (${new Date(event.appointmentScheduledAt).toLocaleString('pt-BR')})` : ''}
              </span>
            ) : (
              <span>Fluxo avulso</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  wrapperClassName?: string;
  rows?: number;
  description?: string;
};

function TextAreaField({
  label,
  value,
  onChange,
  required = false,
  wrapperClassName,
  rows = 4,
  description
}: TextAreaFieldProps) {
  return (
    <FormTextarea
      label={label}
      value={value}
      onChange={onChange}
      required={required}
      rows={rows}
      wrapperClassName={wrapperClassName}
      description={description}
    />
  );
}

type PetMedicalFiltersProps = {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  petFilterId: string;
  onPetFilterIdChange: (value: string) => void;
  petOptions: PetSelectOption[];
  petLookupUnavailable: boolean;
  showProfessionalFilter: boolean;
  professionalFilterId: string;
  onProfessionalFilterIdChange: (value: string) => void;
  professionalOptions: PetSelectOption[];
  professionalsLookupUnavailable: boolean;
  onSearch: () => void;
  onClear: () => void;
};

export function PetMedicalFilters({
  searchInput,
  onSearchInputChange,
  petFilterId,
  onPetFilterIdChange,
  petOptions,
  petLookupUnavailable,
  showProfessionalFilter,
  professionalFilterId,
  onProfessionalFilterIdChange,
  professionalOptions,
  professionalsLookupUnavailable,
  onSearch,
  onClear
}: PetMedicalFiltersProps) {
  return (
    <PageSection
      tone="muted"
      title="Clinical filters"
      description="Refine the shared clinical workspace by pet, professional, and text search without collapsing the controls into a crowded toolbar."
    >
      <div className={sharedFilterToolbarClass}>
        <div
          className={
            showProfessionalFilter
              ? 'grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_240px_240px] xl:items-end'
              : 'grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_240px] xl:items-end'
          }
        >
          <SearchBar
            value={searchInput}
            onChange={onSearchInputChange}
            placeholder="Descrição, diagnóstico, medicação ou vacina"
          />
          <FormSelect
            label="Pet"
            value={petFilterId}
            options={petOptions}
            onChange={onPetFilterIdChange}
            disabled={petLookupUnavailable}
          />
          {showProfessionalFilter ? (
            <FormSelect
              label="Profissional"
              value={professionalFilterId}
              options={professionalOptions}
              onChange={onProfessionalFilterIdChange}
              disabled={professionalsLookupUnavailable}
            />
          ) : null}
        </div>
        <div className={sharedFormActionsClass}>
          <button
            type="button"
            onClick={onSearch}
            className="ui-primary-button"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={onClear}
            className="ui-secondary-button"
          >
            Limpar
          </button>
        </div>
      </div>
    </PageSection>
  );
}

type CreatePetMedicalRecordColumnsArgs = {
  pets: PetProfile[];
  professionals: PetProfessional[];
  petLookupUnavailable: boolean;
  professionalsLookupUnavailable: boolean;
  onEdit: (item: PetMedicalRecord) => void;
  onDelete: (item: PetMedicalRecord) => void;
};

export function createPetMedicalRecordColumns({
  pets,
  professionals,
  petLookupUnavailable,
  professionalsLookupUnavailable,
  onEdit,
  onDelete
}: CreatePetMedicalRecordColumnsArgs): DataTableColumn<PetMedicalRecord>[] {
  return [
    {
      key: 'pet',
      header: 'Pet',
      render: (item) =>
        item.petName ?? resolvePetLookupLabel(pets, item.petId, (pet) => pet.name, 'Pet', petLookupUnavailable)
    },
    {
      key: 'professional',
      header: 'Profissional',
      render: (item) =>
        item.professionalName ??
        resolvePetLookupLabel(
          professionals,
          item.professionalId,
          (professional) => professional.name,
          'Profissional',
          professionalsLookupUnavailable
        )
    },
    {
      key: 'appointment',
      header: 'Atendimento',
      render: (item) => renderClinicalAppointmentLabel(item.appointmentServiceName, item.appointmentScheduledAt)
    },
    { key: 'description', header: 'Descrição', render: (item) => item.description },
    {
      key: 'actions',
      header: 'Ações',
      render: (item) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="pet.medical-record.update">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="ui-inline-button"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.medical-record.delete">
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="ui-inline-danger-button"
            >
              Excluir
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];
}

type CreatePetVaccinationColumnsArgs = {
  pets: PetProfile[];
  petLookupUnavailable: boolean;
  onEdit: (item: PetVaccination) => void;
  onDelete: (item: PetVaccination) => void;
};

export function createPetVaccinationColumns({
  pets,
  petLookupUnavailable,
  onEdit,
  onDelete
}: CreatePetVaccinationColumnsArgs): DataTableColumn<PetVaccination>[] {
  return [
    {
      key: 'pet',
      header: 'Pet',
      render: (item) =>
        item.petName ?? resolvePetLookupLabel(pets, item.petId, (pet) => pet.name, 'Pet', petLookupUnavailable)
    },
    {
      key: 'appointment',
      header: 'Atendimento',
      render: (item) => renderClinicalAppointmentLabel(item.appointmentServiceName, item.appointmentScheduledAt)
    },
    { key: 'vaccineName', header: 'Vacina', render: (item) => item.vaccineName },
    {
      key: 'appliedAt',
      header: 'Aplicada em',
      render: (item) => new Date(item.appliedAt).toLocaleString('pt-BR')
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (item) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="pet.vaccination.update">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="ui-inline-button"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.vaccination.delete">
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="ui-inline-danger-button"
            >
              Excluir
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];
}

type CreatePetPrescriptionColumnsArgs = {
  pets: PetProfile[];
  professionals: PetProfessional[];
  petLookupUnavailable: boolean;
  professionalsLookupUnavailable: boolean;
  onEdit: (item: PetPrescription) => void;
  onDelete: (item: PetPrescription) => void;
};

export function createPetPrescriptionColumns({
  pets,
  professionals,
  petLookupUnavailable,
  professionalsLookupUnavailable,
  onEdit,
  onDelete
}: CreatePetPrescriptionColumnsArgs): DataTableColumn<PetPrescription>[] {
  return [
    {
      key: 'pet',
      header: 'Pet',
      render: (item) =>
        item.petName ?? resolvePetLookupLabel(pets, item.petId, (pet) => pet.name, 'Pet', petLookupUnavailable)
    },
    { key: 'medication', header: 'Medicamento', render: (item) => item.medication },
    {
      key: 'professional',
      header: 'Profissional',
      render: (item) =>
        item.professionalName ??
        resolvePetLookupLabel(
          professionals,
          item.professionalId,
          (professional) => professional.name,
          'Profissional',
          professionalsLookupUnavailable
        )
    },
    {
      key: 'appointment',
      header: 'Atendimento',
      render: (item) => renderClinicalAppointmentLabel(item.appointmentServiceName, item.appointmentScheduledAt)
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (item) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="pet.prescription.update">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="ui-inline-button"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.prescription.delete">
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="ui-inline-danger-button"
            >
              Excluir
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];
}

type PetMedicalRecordSectionProps = {
  editingId: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  petId: string;
  onPetIdChange: (value: string) => void;
  professionalId: string;
  onProfessionalIdChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  diagnosis: string;
  onDiagnosisChange: (value: string) => void;
  treatment: string;
  onTreatmentChange: (value: string) => void;
  formPetOptions: PetSelectOption[];
  formProfessionalOptions: PetSelectOption[];
  petLookupUnavailable: boolean;
  professionalsLookupUnavailable: boolean;
  lockPetSelection: boolean;
  lockProfessionalSelection: boolean;
  appointmentContextDescription?: string | null;
  formReady: boolean;
  submitting: boolean;
  onCancelEdit: () => void;
  columns: DataTableColumn<PetMedicalRecord>[];
  pageData: PageResponse<PetMedicalRecord>;
  loading: boolean;
  onPageChange: (page: number) => void;
};

export function PetMedicalRecordSection({
  editingId,
  onSubmit,
  petId,
  onPetIdChange,
  professionalId,
  onProfessionalIdChange,
  description,
  onDescriptionChange,
  diagnosis,
  onDiagnosisChange,
  treatment,
  onTreatmentChange,
  formPetOptions,
  formProfessionalOptions,
  petLookupUnavailable,
  professionalsLookupUnavailable,
  lockPetSelection,
  lockProfessionalSelection,
  appointmentContextDescription,
  formReady,
  submitting,
  onCancelEdit,
  columns,
  pageData,
  loading,
  onPageChange
}: PetMedicalRecordSectionProps) {
  return (
    <PageSection
      title="Prontuários"
      description="Histórico clínico e evoluções por pet."
      contentClassName="space-y-5"
    >
      <PermissionGuard permission={editingId ? 'pet.medical-record.update' : 'pet.medical-record.create'}>
        <div className="ui-surface-muted rounded-2xl p-4 lg:p-5">
          <form onSubmit={onSubmit} className="grid gap-4 xl:grid-cols-2">
            <FormSelect
              label="Pet"
              value={petId}
              options={formPetOptions}
              onChange={onPetIdChange}
              disabled={petLookupUnavailable || lockPetSelection}
            />
            <FormSelect
              label="Profissional"
              value={professionalId}
              options={formProfessionalOptions}
              onChange={onProfessionalIdChange}
              disabled={professionalsLookupUnavailable || lockProfessionalSelection}
            />
            <TextAreaField
              label="Descrição"
              value={description}
              onChange={onDescriptionChange}
              required
              wrapperClassName="xl:col-span-2"
              rows={4}
            />
            <TextAreaField label="Diagnóstico" value={diagnosis} onChange={onDiagnosisChange} rows={4} />
            <TextAreaField label="Tratamento" value={treatment} onChange={onTreatmentChange} rows={4} />

            <div className="space-y-3 xl:col-span-2">
              {appointmentContextDescription ? (
                <div className="ui-notice-info">
                  {appointmentContextDescription}
                </div>
              ) : null}
              {!formReady ? (
                <div className="ui-notice-warning">
                  O formulário de prontuário depende das referências de pets e profissionais.
                </div>
              ) : null}
              <div className={sharedFormActionsClass}>
                <button
                  type="submit"
                  disabled={submitting || !formReady}
                  className="ui-primary-button"
                >
                  {submitting ? 'Salvando...' : editingId ? 'Atualizar prontuário' : 'Criar prontuário'}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="ui-secondary-button"
                  >
                    Cancelar edição
                  </button>
                ) : null}
              </div>
            </div>
          </form>
        </div>
      </PermissionGuard>

      <PermissionGuard permission="pet.medical-record.read">
        <div className="space-y-4">
          <DataTable columns={columns} rows={resolvePageItems(pageData)} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhum prontuário encontrado." />
          <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={resolveTotalItems(pageData)} onPageChange={onPageChange} />
        </div>
      </PermissionGuard>
    </PageSection>
  );
}

type PetVaccinationSectionProps = {
  editingId: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  petId: string;
  onPetIdChange: (value: string) => void;
  vaccineName: string;
  onVaccineNameChange: (value: string) => void;
  appliedAt: string;
  onAppliedAtChange: (value: string) => void;
  nextDueAt: string;
  onNextDueAtChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  formPetOptions: PetSelectOption[];
  petLookupUnavailable: boolean;
  lockPetSelection: boolean;
  appointmentContextDescription?: string | null;
  formReady: boolean;
  submitting: boolean;
  onCancelEdit: () => void;
  columns: DataTableColumn<PetVaccination>[];
  pageData: PageResponse<PetVaccination>;
  loading: boolean;
  onPageChange: (page: number) => void;
};

export function PetVaccinationSection({
  editingId,
  onSubmit,
  petId,
  onPetIdChange,
  vaccineName,
  onVaccineNameChange,
  appliedAt,
  onAppliedAtChange,
  nextDueAt,
  onNextDueAtChange,
  notes,
  onNotesChange,
  formPetOptions,
  petLookupUnavailable,
  lockPetSelection,
  appointmentContextDescription,
  formReady,
  submitting,
  onCancelEdit,
  columns,
  pageData,
  loading,
  onPageChange
}: PetVaccinationSectionProps) {
  return (
    <PageSection
      title="Vacinações"
      description="Controle de aplicações e próximos reforços."
      contentClassName="space-y-5"
    >
      <PermissionGuard permission={editingId ? 'pet.vaccination.update' : 'pet.vaccination.create'}>
        <div className="ui-surface-muted rounded-2xl p-4 lg:p-5">
          <form onSubmit={onSubmit} className="grid gap-4 xl:grid-cols-2">
            <FormSelect
              label="Pet"
              value={petId}
              options={formPetOptions}
              onChange={onPetIdChange}
              disabled={petLookupUnavailable || lockPetSelection}
            />
            <FormInput label="Vacina" value={vaccineName} onChange={onVaccineNameChange} required />
            <DateTimeInput label="Aplicada em" value={appliedAt} onChange={onAppliedAtChange} required />
            <DateTimeInput label="Próximo reforço" value={nextDueAt} onChange={onNextDueAtChange} />
            <TextAreaField label="Notas" value={notes} onChange={onNotesChange} wrapperClassName="xl:col-span-2" />

            <div className="space-y-3 xl:col-span-2">
              {appointmentContextDescription ? (
                <div className="ui-notice-info">
                  {appointmentContextDescription}
                </div>
              ) : null}
              {!formReady ? (
                <div className="ui-notice-warning">
                  O formulário de vacinação depende da referência de pets.
                </div>
              ) : null}
              <div className={sharedFormActionsClass}>
                <button
                  type="submit"
                  disabled={submitting || !formReady}
                  className="ui-primary-button"
                >
                  {submitting ? 'Salvando...' : editingId ? 'Atualizar vacinação' : 'Criar vacinação'}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="ui-secondary-button"
                  >
                    Cancelar edição
                  </button>
                ) : null}
              </div>
            </div>
          </form>
        </div>
      </PermissionGuard>

      <PermissionGuard permission="pet.vaccination.read">
        <div className="space-y-4">
          <DataTable columns={columns} rows={resolvePageItems(pageData)} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhuma vacinação encontrada." />
          <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={resolveTotalItems(pageData)} onPageChange={onPageChange} />
        </div>
      </PermissionGuard>
    </PageSection>
  );
}

type PetPrescriptionSectionProps = {
  editingId: string | null;
  onSubmit: FormEventHandler<HTMLFormElement>;
  petId: string;
  onPetIdChange: (value: string) => void;
  professionalId: string;
  onProfessionalIdChange: (value: string) => void;
  medication: string;
  onMedicationChange: (value: string) => void;
  dosage: string;
  onDosageChange: (value: string) => void;
  instructions: string;
  onInstructionsChange: (value: string) => void;
  formPetOptions: PetSelectOption[];
  formProfessionalOptions: PetSelectOption[];
  petLookupUnavailable: boolean;
  professionalsLookupUnavailable: boolean;
  lockPetSelection: boolean;
  lockProfessionalSelection: boolean;
  appointmentContextDescription?: string | null;
  formReady: boolean;
  submitting: boolean;
  onCancelEdit: () => void;
  columns: DataTableColumn<PetPrescription>[];
  pageData: PageResponse<PetPrescription>;
  loading: boolean;
  onPageChange: (page: number) => void;
};

export function PetPrescriptionSection({
  editingId,
  onSubmit,
  petId,
  onPetIdChange,
  professionalId,
  onProfessionalIdChange,
  medication,
  onMedicationChange,
  dosage,
  onDosageChange,
  instructions,
  onInstructionsChange,
  formPetOptions,
  formProfessionalOptions,
  petLookupUnavailable,
  professionalsLookupUnavailable,
  lockPetSelection,
  lockProfessionalSelection,
  appointmentContextDescription,
  formReady,
  submitting,
  onCancelEdit,
  columns,
  pageData,
  loading,
  onPageChange
}: PetPrescriptionSectionProps) {
  return (
    <PageSection
      title="Prescriptions"
      description="Prescrições vinculadas ao histórico do atendimento."
      contentClassName="space-y-5"
    >
      <PermissionGuard permission={editingId ? 'pet.prescription.update' : 'pet.prescription.create'}>
        <div className="ui-surface-muted rounded-2xl p-4 lg:p-5">
          <form onSubmit={onSubmit} className="grid gap-4 xl:grid-cols-2">
            <FormSelect
              label="Pet"
              value={petId}
              options={formPetOptions}
              onChange={onPetIdChange}
              disabled={petLookupUnavailable || lockPetSelection}
            />
            <FormSelect
              label="Profissional"
              value={professionalId}
              options={formProfessionalOptions}
              onChange={onProfessionalIdChange}
              disabled={professionalsLookupUnavailable || lockProfessionalSelection}
            />
            <FormInput label="Medicamento" value={medication} onChange={onMedicationChange} required />
            <FormInput label="Dosagem" value={dosage} onChange={onDosageChange} />
            <TextAreaField
              label="Instruções"
              value={instructions}
              onChange={onInstructionsChange}
              wrapperClassName="xl:col-span-2"
            />

            <div className="space-y-3 xl:col-span-2">
              {appointmentContextDescription ? (
                <div className="ui-notice-info">
                  {appointmentContextDescription}
                </div>
              ) : null}
              {!formReady ? (
                <div className="ui-notice-warning">
                  O formulário de prescrição depende das referências de pets e profissionais.
                </div>
              ) : null}
              <div className={sharedFormActionsClass}>
                <button
                  type="submit"
                  disabled={submitting || !formReady}
                  className="ui-primary-button"
                >
                  {submitting ? 'Salvando...' : editingId ? 'Atualizar prescrição' : 'Criar prescrição'}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="ui-secondary-button"
                  >
                    Cancelar edição
                  </button>
                ) : null}
              </div>
            </div>
          </form>
        </div>
      </PermissionGuard>

      <PermissionGuard permission="pet.prescription.read">
        <div className="space-y-4">
          <DataTable columns={columns} rows={resolvePageItems(pageData)} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhuma prescrição encontrada." />
          <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={resolveTotalItems(pageData)} onPageChange={onPageChange} />
        </div>
      </PermissionGuard>
    </PageSection>
  );
}

export function PetMedicalPageFallback() {
  return (
    <div className="ui-notice-warning">
      Você não possui permissão para visualizar workflows médicos do Pet.
    </div>
  );
}

export const petMedicalRouteGuardPermissions = petMedicalRoutePermissions;
