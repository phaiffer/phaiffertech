'use client';

import { FormEventHandler, ReactNode } from 'react';
import { ClinicEventType } from '@/modules/pet/clinic-shared';
import { resolvePetLookupLabel } from '@/modules/pet/pet-lookup-feedback';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { sharedFormActionsClass, sharedInlineActionsClass } from '@/shared/components/public-visual-system';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatDateTimeForLocale } from '@/shared/i18n/formatters';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { PageResponse } from '@/shared/types/common';
import {
  PetClinicalTimeline,
  PetMedicalRecord,
  PetPrescription,
  PetProfessional,
  PetProfile,
  PetVaccination
} from '@/shared/types/pet';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { DateTimeInput } from '@/shared/ui/datetime-input';
import { FilterChip } from '@/shared/ui/filter-chip';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { FormTextarea } from '@/shared/ui/form-textarea';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

export type PetSelectOption = {
  value: string;
  label: string;
};

type MedicalCopy = AppMessages['screens']['petMedical'];
type AppLocale = ReturnType<typeof useAppI18n>['locale'];

type ColumnContext = {
  copy: MedicalCopy;
  locale: AppLocale;
};

function renderClinicalAppointment(
  { copy, locale }: ColumnContext,
  serviceName?: string,
  scheduledAt?: string
) {
  if (!serviceName && !scheduledAt) {
    return <span className="text-[var(--muted)]">{copy.standalone}</span>;
  }

  return (
    <div>
      <div className="text-[var(--ink)]">{serviceName ?? copy.linkedAppointment}</div>
      {scheduledAt ? (
        <div className="ui-mono text-xs text-[var(--ink-2)]">{formatDateTimeForLocale(locale, scheduledAt)}</div>
      ) : null}
    </div>
  );
}

function renderRowActions(
  copy: MedicalCopy,
  updatePermission: string,
  deletePermission: string,
  onEdit: () => void,
  onDelete: () => void
) {
  return (
    <div className={sharedInlineActionsClass}>
      <PermissionGuard permission={updatePermission}>
        <button type="button" onClick={onEdit} className="ui-inline-button">{copy.edit}</button>
      </PermissionGuard>
      <PermissionGuard permission={deletePermission}>
        <button type="button" onClick={onDelete} className="ui-inline-danger-button">{copy.delete}</button>
      </PermissionGuard>
    </div>
  );
}

type PetClinicalTimelineSectionProps = {
  data: PetClinicalTimeline | null;
  loading: boolean;
  error?: string | null;
  ready: boolean;
};

export function PetClinicalTimelineSection({ data, loading, error, ready }: PetClinicalTimelineSectionProps) {
  const { locale } = useAppI18n();
  const copy = useAppMessages().screens.petMedical;
  const events = data?.events ?? [];
  const settled = ready && !loading && !error;

  return (
    <section aria-labelledby="clinical-history" className="space-y-3">
      <div>
        <h2 id="clinical-history" className="text-sm font-semibold text-[var(--ink)]">{copy.timelineTitle}</h2>
        <p className="text-xs text-[var(--muted)]">{copy.timelineDescription}</p>
      </div>

      {!ready ? <div className="ui-notice-neutral">{copy.timelineSelectHint}</div> : null}
      {ready && loading ? <div className="ui-notice-info">{copy.timelineLoading}</div> : null}
      {ready && !loading && error ? <div className="ui-notice-error">{error}</div> : null}

      {settled && data?.appointmentId ? (
        <div className="ui-notice-info">
          <div className="font-medium">{copy.timelineAppointment}</div>
          <div>
            {copy.timelineAppointmentDetail
              .replace('{service}', data.appointmentServiceName ?? copy.linkedAppointment)
              .replace('{pet}', data.petName ?? '-')}
            {data.appointmentScheduledAt ? ` · ${formatDateTimeForLocale(locale, data.appointmentScheduledAt)}` : ''}
          </div>
        </div>
      ) : null}

      {settled && data && !data.appointmentId && data.petName ? (
        <p className="text-sm text-[var(--ink-2)]">{copy.timelinePet.replace('{pet}', data.petName)}</p>
      ) : null}

      {settled && events.length > 0 ? (
        <ul className="divide-y divide-[color:var(--line-soft)]">
          {events.map((event) => (
            <li key={event.eventId} className="grid gap-1 py-2 text-sm sm:grid-cols-[10rem_8rem_minmax(0,1fr)] sm:gap-3">
              <span className="ui-mono text-xs text-[var(--ink-2)]">{formatDateTimeForLocale(locale, event.occurredAt)}</span>
              <ClinicEventType type={event.eventType} />
              <div className="min-w-0">
                <p className="font-medium text-[var(--ink)]">{event.title}</p>
                {event.summary ? <p className="text-[var(--ink-2)]">{event.summary}</p> : null}
                <p className="text-xs text-[var(--muted)]">
                  {[event.petName, event.professionalName, event.appointmentServiceName ?? copy.standalone]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {settled && data && events.length === 0 ? <p className="text-sm text-[var(--muted)]">{copy.timelineEmpty}</p> : null}

      {settled && data && data.totalEvents > events.length ? (
        <p className="text-xs text-[var(--muted)]">
          {copy.timelinePartial
            .replace('{shown}', String(events.length))
            .replace('{total}', String(data.totalEvents))}
        </p>
      ) : null}
    </section>
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
  const copy = useAppMessages().screens.petMedical;

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <div className="min-w-[14rem] flex-1">
        <SearchBar value={searchInput} onChange={onSearchInputChange} placeholder={copy.searchPlaceholder} />
      </div>
      <FilterChip
        label={copy.filterPet}
        value={petFilterId}
        options={petOptions}
        onChange={onPetFilterIdChange}
        disabled={petLookupUnavailable}
      />
      {showProfessionalFilter ? (
        <FilterChip
          label={copy.filterProfessional}
          value={professionalFilterId}
          options={professionalOptions}
          onChange={onProfessionalFilterIdChange}
          disabled={professionalsLookupUnavailable}
        />
      ) : null}
      <button type="submit" className="ui-secondary-button">{copy.searchAction}</button>
      <button type="button" onClick={onClear} className="ui-inline-button">{copy.clearAction}</button>
    </form>
  );
}

type CreatePetMedicalRecordColumnsArgs = ColumnContext & {
  pets: PetProfile[];
  professionals: PetProfessional[];
  petLookupUnavailable: boolean;
  professionalsLookupUnavailable: boolean;
  onEdit: (item: PetMedicalRecord) => void;
  onDelete: (item: PetMedicalRecord) => void;
};

export function createPetMedicalRecordColumns({
  copy,
  locale,
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
      header: copy.columnPet,
      render: (item) =>
        item.petName ?? resolvePetLookupLabel(pets, item.petId, (pet) => pet.name, copy.columnPet, petLookupUnavailable)
    },
    {
      key: 'professional',
      header: copy.columnProfessional,
      render: (item) =>
        item.professionalName ??
        resolvePetLookupLabel(
          professionals,
          item.professionalId,
          (professional) => professional.name,
          copy.columnProfessional,
          professionalsLookupUnavailable
        )
    },
    {
      key: 'appointment',
      header: copy.columnAppointment,
      render: (item) => renderClinicalAppointment({ copy, locale }, item.appointmentServiceName, item.appointmentScheduledAt)
    },
    { key: 'description', header: copy.columnDescription, render: (item) => <span className="line-clamp-2">{item.description}</span> },
    {
      key: 'actions',
      header: copy.columnActions,
      render: (item) => renderRowActions(copy, 'pet.medical-record.update', 'pet.medical-record.delete', () => onEdit(item), () => onDelete(item))
    }
  ];
}

type CreatePetVaccinationColumnsArgs = ColumnContext & {
  pets: PetProfile[];
  petLookupUnavailable: boolean;
  onEdit: (item: PetVaccination) => void;
  onDelete: (item: PetVaccination) => void;
};

export function createPetVaccinationColumns({
  copy,
  locale,
  pets,
  petLookupUnavailable,
  onEdit,
  onDelete
}: CreatePetVaccinationColumnsArgs): DataTableColumn<PetVaccination>[] {
  return [
    {
      key: 'pet',
      header: copy.columnPet,
      render: (item) =>
        item.petName ?? resolvePetLookupLabel(pets, item.petId, (pet) => pet.name, copy.columnPet, petLookupUnavailable)
    },
    { key: 'vaccineName', header: copy.columnVaccine, render: (item) => item.vaccineName },
    {
      key: 'appliedAt',
      header: copy.columnAppliedAt,
      render: (item) => <span className="ui-mono whitespace-nowrap">{formatDateTimeForLocale(locale, item.appliedAt)}</span>
    },
    {
      key: 'nextDueAt',
      header: copy.columnNextDueAt,
      render: (item) => <span className="ui-mono whitespace-nowrap">{item.nextDueAt ? formatDateTimeForLocale(locale, item.nextDueAt) : '-'}</span>
    },
    {
      key: 'appointment',
      header: copy.columnAppointment,
      render: (item) => renderClinicalAppointment({ copy, locale }, item.appointmentServiceName, item.appointmentScheduledAt)
    },
    {
      key: 'actions',
      header: copy.columnActions,
      render: (item) => renderRowActions(copy, 'pet.vaccination.update', 'pet.vaccination.delete', () => onEdit(item), () => onDelete(item))
    }
  ];
}

type CreatePetPrescriptionColumnsArgs = ColumnContext & {
  pets: PetProfile[];
  professionals: PetProfessional[];
  petLookupUnavailable: boolean;
  professionalsLookupUnavailable: boolean;
  onEdit: (item: PetPrescription) => void;
  onDelete: (item: PetPrescription) => void;
};

export function createPetPrescriptionColumns({
  copy,
  locale,
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
      header: copy.columnPet,
      render: (item) =>
        item.petName ?? resolvePetLookupLabel(pets, item.petId, (pet) => pet.name, copy.columnPet, petLookupUnavailable)
    },
    { key: 'medication', header: copy.columnMedication, render: (item) => item.medication },
    {
      key: 'professional',
      header: copy.columnProfessional,
      render: (item) =>
        item.professionalName ??
        resolvePetLookupLabel(
          professionals,
          item.professionalId,
          (professional) => professional.name,
          copy.columnProfessional,
          professionalsLookupUnavailable
        )
    },
    {
      key: 'appointment',
      header: copy.columnAppointment,
      render: (item) => renderClinicalAppointment({ copy, locale }, item.appointmentServiceName, item.appointmentScheduledAt)
    },
    {
      key: 'actions',
      header: copy.columnActions,
      render: (item) => renderRowActions(copy, 'pet.prescription.update', 'pet.prescription.delete', () => onEdit(item), () => onDelete(item))
    }
  ];
}

type ClinicalListSectionProps<T> = {
  headingId: string;
  title: string;
  newLabel: string;
  createPermission: string;
  readPermission: string;
  editorOpen: boolean;
  onNew: () => void;
  editor: ReactNode;
  columns: DataTableColumn<T>[];
  pageData: PageResponse<T>;
  pageSize: number;
  loading: boolean;
  emptyTitle: string;
  onPageChange: (page: number) => void;
  getRowKey: (row: T) => string;
};

function ClinicalListSection<T>({
  headingId,
  title,
  newLabel,
  createPermission,
  readPermission,
  editorOpen,
  onNew,
  editor,
  columns,
  pageData,
  pageSize,
  loading,
  emptyTitle,
  onPageChange,
  getRowKey
}: ClinicalListSectionProps<T>) {
  const total = resolveTotalItems(pageData);

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id={headingId} className="text-sm font-semibold text-[var(--ink)]">
          {title} <span className="ui-mono font-normal text-[var(--ink-2)]">{total}</span>
        </h2>
        {!editorOpen ? (
          <PermissionGuard permission={createPermission}>
            <button type="button" onClick={onNew} className="ui-primary-button">{newLabel}</button>
          </PermissionGuard>
        ) : null}
      </div>

      {editorOpen ? editor : null}

      <PermissionGuard permission={readPermission}>
        <div className="space-y-3">
          <DataTable
            columns={columns}
            rows={resolvePageItems(pageData)}
            getRowKey={getRowKey}
            loading={loading}
            emptyState={{ title: emptyTitle, description: '' }}
          />
          <Pagination
            page={pageData.page}
            totalPages={pageData.totalPages}
            totalElements={total}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </div>
      </PermissionGuard>
    </section>
  );
}

type ClinicalEditorProps = {
  permission: string;
  title: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
  appointmentContextDescription?: string | null;
  blockedMessage: string;
  formReady: boolean;
  submitting: boolean;
  submitLabel: string;
  onCancel: () => void;
};

function ClinicalEditor({
  permission,
  title,
  onSubmit,
  children,
  appointmentContextDescription,
  blockedMessage,
  formReady,
  submitting,
  submitLabel,
  onCancel
}: ClinicalEditorProps) {
  const copy = useAppMessages().screens.petMedical;

  return (
    <PermissionGuard permission={permission}>
      <form
        onSubmit={onSubmit}
        aria-label={title}
        className="grid gap-4 rounded-md border border-[color:var(--line)] p-4 md:grid-cols-2"
      >
        {children}
        <div className="space-y-3 md:col-span-2">
          {appointmentContextDescription ? <div className="ui-notice-info">{appointmentContextDescription}</div> : null}
          {!formReady ? <div className="ui-notice-warning">{blockedMessage}</div> : null}
          <div className={sharedFormActionsClass}>
            <button type="submit" disabled={submitting || !formReady} className="ui-primary-button">
              {submitting ? copy.saving : submitLabel}
            </button>
            <button type="button" onClick={onCancel} className="ui-secondary-button">{copy.cancel}</button>
          </div>
        </div>
      </form>
    </PermissionGuard>
  );
}

type SharedSectionProps<T> = {
  editingId: string | null;
  editorOpen: boolean;
  onNew: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  formPetOptions: PetSelectOption[];
  petId: string;
  onPetIdChange: (value: string) => void;
  petLookupUnavailable: boolean;
  lockPetSelection: boolean;
  appointmentContextDescription?: string | null;
  formReady: boolean;
  submitting: boolean;
  onCancelEdit: () => void;
  columns: DataTableColumn<T>[];
  pageData: PageResponse<T>;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
};

type PetMedicalRecordSectionProps = SharedSectionProps<PetMedicalRecord> & {
  professionalId: string;
  onProfessionalIdChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  diagnosis: string;
  onDiagnosisChange: (value: string) => void;
  treatment: string;
  onTreatmentChange: (value: string) => void;
  formProfessionalOptions: PetSelectOption[];
  professionalsLookupUnavailable: boolean;
  lockProfessionalSelection: boolean;
};

export function PetMedicalRecordSection(props: PetMedicalRecordSectionProps) {
  const copy = useAppMessages().screens.petMedical;
  const { editingId } = props;

  return (
    <ClinicalListSection
      headingId="medical-records-list"
      title={copy.recordsTitle}
      newLabel={copy.newRecord}
      createPermission="pet.medical-record.create"
      readPermission="pet.medical-record.read"
      editorOpen={props.editorOpen}
      onNew={props.onNew}
      columns={props.columns}
      pageData={props.pageData}
      pageSize={props.pageSize}
      loading={props.loading}
      emptyTitle={copy.recordsEmpty}
      onPageChange={props.onPageChange}
      getRowKey={(row) => row.id}
      editor={(
        <ClinicalEditor
          permission={editingId ? 'pet.medical-record.update' : 'pet.medical-record.create'}
          title={editingId ? copy.updateRecord : copy.newRecord}
          onSubmit={props.onSubmit}
          appointmentContextDescription={props.appointmentContextDescription}
          blockedMessage={copy.recordFormBlocked}
          formReady={props.formReady}
          submitting={props.submitting}
          submitLabel={editingId ? copy.updateRecord : copy.createRecord}
          onCancel={props.onCancelEdit}
        >
          <FormSelect
            label={copy.filterPet}
            value={props.petId}
            options={props.formPetOptions}
            onChange={props.onPetIdChange}
            disabled={props.petLookupUnavailable || props.lockPetSelection}
          />
          <FormSelect
            label={copy.filterProfessional}
            value={props.professionalId}
            options={props.formProfessionalOptions}
            onChange={props.onProfessionalIdChange}
            disabled={props.professionalsLookupUnavailable || props.lockProfessionalSelection}
          />
          <FormTextarea
            label={copy.fieldDescription}
            value={props.description}
            onChange={props.onDescriptionChange}
            required
            rows={4}
            wrapperClassName="md:col-span-2"
          />
          <FormTextarea label={copy.fieldDiagnosis} value={props.diagnosis} onChange={props.onDiagnosisChange} rows={4} />
          <FormTextarea label={copy.fieldTreatment} value={props.treatment} onChange={props.onTreatmentChange} rows={4} />
        </ClinicalEditor>
      )}
    />
  );
}

type PetVaccinationSectionProps = SharedSectionProps<PetVaccination> & {
  vaccineName: string;
  onVaccineNameChange: (value: string) => void;
  appliedAt: string;
  onAppliedAtChange: (value: string) => void;
  nextDueAt: string;
  onNextDueAtChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
};

export function PetVaccinationSection(props: PetVaccinationSectionProps) {
  const copy = useAppMessages().screens.petMedical;
  const { editingId } = props;

  return (
    <ClinicalListSection
      headingId="vaccinations-list"
      title={copy.vaccinationsTitle}
      newLabel={copy.newVaccination}
      createPermission="pet.vaccination.create"
      readPermission="pet.vaccination.read"
      editorOpen={props.editorOpen}
      onNew={props.onNew}
      columns={props.columns}
      pageData={props.pageData}
      pageSize={props.pageSize}
      loading={props.loading}
      emptyTitle={copy.vaccinationsEmpty}
      onPageChange={props.onPageChange}
      getRowKey={(row) => row.id}
      editor={(
        <ClinicalEditor
          permission={editingId ? 'pet.vaccination.update' : 'pet.vaccination.create'}
          title={editingId ? copy.updateVaccination : copy.newVaccination}
          onSubmit={props.onSubmit}
          appointmentContextDescription={props.appointmentContextDescription}
          blockedMessage={copy.vaccinationFormBlocked}
          formReady={props.formReady}
          submitting={props.submitting}
          submitLabel={editingId ? copy.updateVaccination : copy.createVaccination}
          onCancel={props.onCancelEdit}
        >
          <FormSelect
            label={copy.filterPet}
            value={props.petId}
            options={props.formPetOptions}
            onChange={props.onPetIdChange}
            disabled={props.petLookupUnavailable || props.lockPetSelection}
          />
          <FormInput label={copy.fieldVaccine} value={props.vaccineName} onChange={props.onVaccineNameChange} required />
          <DateTimeInput label={copy.fieldAppliedAt} value={props.appliedAt} onChange={props.onAppliedAtChange} required />
          <DateTimeInput label={copy.fieldNextDueAt} value={props.nextDueAt} onChange={props.onNextDueAtChange} />
          <FormTextarea
            label={copy.fieldNotes}
            value={props.notes}
            onChange={props.onNotesChange}
            rows={4}
            wrapperClassName="md:col-span-2"
          />
        </ClinicalEditor>
      )}
    />
  );
}

type PetPrescriptionSectionProps = SharedSectionProps<PetPrescription> & {
  professionalId: string;
  onProfessionalIdChange: (value: string) => void;
  medication: string;
  onMedicationChange: (value: string) => void;
  dosage: string;
  onDosageChange: (value: string) => void;
  instructions: string;
  onInstructionsChange: (value: string) => void;
  formProfessionalOptions: PetSelectOption[];
  professionalsLookupUnavailable: boolean;
  lockProfessionalSelection: boolean;
};

export function PetPrescriptionSection(props: PetPrescriptionSectionProps) {
  const copy = useAppMessages().screens.petMedical;
  const { editingId } = props;

  return (
    <ClinicalListSection
      headingId="prescriptions-list"
      title={copy.prescriptionsTitle}
      newLabel={copy.newPrescription}
      createPermission="pet.prescription.create"
      readPermission="pet.prescription.read"
      editorOpen={props.editorOpen}
      onNew={props.onNew}
      columns={props.columns}
      pageData={props.pageData}
      pageSize={props.pageSize}
      loading={props.loading}
      emptyTitle={copy.prescriptionsEmpty}
      onPageChange={props.onPageChange}
      getRowKey={(row) => row.id}
      editor={(
        <ClinicalEditor
          permission={editingId ? 'pet.prescription.update' : 'pet.prescription.create'}
          title={editingId ? copy.updatePrescription : copy.newPrescription}
          onSubmit={props.onSubmit}
          appointmentContextDescription={props.appointmentContextDescription}
          blockedMessage={copy.prescriptionFormBlocked}
          formReady={props.formReady}
          submitting={props.submitting}
          submitLabel={editingId ? copy.updatePrescription : copy.createPrescription}
          onCancel={props.onCancelEdit}
        >
          <FormSelect
            label={copy.filterPet}
            value={props.petId}
            options={props.formPetOptions}
            onChange={props.onPetIdChange}
            disabled={props.petLookupUnavailable || props.lockPetSelection}
          />
          <FormSelect
            label={copy.filterProfessional}
            value={props.professionalId}
            options={props.formProfessionalOptions}
            onChange={props.onProfessionalIdChange}
            disabled={props.professionalsLookupUnavailable || props.lockProfessionalSelection}
          />
          <FormInput label={copy.fieldMedication} value={props.medication} onChange={props.onMedicationChange} required />
          <FormInput label={copy.fieldDosage} value={props.dosage} onChange={props.onDosageChange} />
          <FormTextarea
            label={copy.fieldInstructions}
            value={props.instructions}
            onChange={props.onInstructionsChange}
            rows={4}
            wrapperClassName="md:col-span-2"
          />
        </ClinicalEditor>
      )}
    />
  );
}

export function PetMedicalPageFallback() {
  const copy = useAppMessages().screens.petMedical;

  return <div className="ui-notice-warning">{copy.noPermission}</div>;
}
