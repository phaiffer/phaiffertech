'use client';

import { FormEventHandler } from 'react';
import { petMedicalRoutePermissions } from '@/modules/pet/pet-medical-permissions';
import { resolvePetLookupLabel } from '@/modules/pet/pet-lookup-feedback';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { PageResponse } from '@/shared/types/common';
import { PetMedicalRecord, PetPrescription, PetProfessional, PetProfile, PetVaccination } from '@/shared/types/pet';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { DateTimeInput } from '@/shared/ui/datetime-input';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

export type PetSelectOption = {
  value: string;
  label: string;
};

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

function TextAreaField({ label, value, onChange, required = false }: TextAreaFieldProps) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        rows={3}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-action focus:outline-none"
      />
    </label>
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
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_240px_240px_auto_auto]">
      <SearchBar value={searchInput} onChange={onSearchInputChange} placeholder="Descrição, diagnóstico, medicação ou vacina" />
      <FormSelect label="Pet" value={petFilterId} options={petOptions} onChange={onPetFilterIdChange} disabled={petLookupUnavailable} />
      {showProfessionalFilter ? (
        <FormSelect
          label="Profissional"
          value={professionalFilterId}
          options={professionalOptions}
          onChange={onProfessionalFilterIdChange}
          disabled={professionalsLookupUnavailable}
        />
      ) : null}
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
    { key: 'description', header: 'Descrição', render: (item) => item.description },
    {
      key: 'actions',
      header: 'Ações',
      render: (item) => (
        <div className="flex gap-2">
          <PermissionGuard permission="pet.medical-record.update">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.medical-record.delete">
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700"
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
        <div className="flex gap-2">
          <PermissionGuard permission="pet.vaccination.update">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.vaccination.delete">
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700"
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
      key: 'actions',
      header: 'Ações',
      render: (item) => (
        <div className="flex gap-2">
          <PermissionGuard permission="pet.prescription.update">
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.prescription.delete">
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700"
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
  formReady,
  submitting,
  onCancelEdit,
  columns,
  pageData,
  loading,
  onPageChange
}: PetMedicalRecordSectionProps) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Medical Records</h3>
        <p className="text-sm text-slate-600">Histórico clínico e evoluções por pet.</p>
      </div>

      <PermissionGuard permission={editingId ? 'pet.medical-record.update' : 'pet.medical-record.create'}>
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <FormSelect label="Pet" value={petId} options={formPetOptions} onChange={onPetIdChange} disabled={petLookupUnavailable} />
          <FormSelect
            label="Profissional"
            value={professionalId}
            options={formProfessionalOptions}
            onChange={onProfessionalIdChange}
            disabled={professionalsLookupUnavailable}
          />
          <TextAreaField label="Descrição" value={description} onChange={onDescriptionChange} required />
          <TextAreaField label="Diagnóstico" value={diagnosis} onChange={onDiagnosisChange} />
          <TextAreaField label="Tratamento" value={treatment} onChange={onTreatmentChange} />

          <div className="md:col-span-2 flex gap-2">
            {!formReady ? (
              <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                O formulário de prontuário depende das referências de pets e profissionais.
              </div>
            ) : null}
            <button
              type="submit"
              disabled={submitting || !formReady}
              className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {submitting ? 'Salvando...' : editingId ? 'Atualizar prontuário' : 'Criar prontuário'}
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

      <PermissionGuard permission="pet.medical-record.read">
        <DataTable columns={columns} rows={resolvePageItems(pageData)} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhum prontuário encontrado." />
        <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={resolveTotalItems(pageData)} onPageChange={onPageChange} />
      </PermissionGuard>
    </section>
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
  formReady,
  submitting,
  onCancelEdit,
  columns,
  pageData,
  loading,
  onPageChange
}: PetVaccinationSectionProps) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Vaccinations</h3>
        <p className="text-sm text-slate-600">Controle de aplicações e próximos reforços.</p>
      </div>

      <PermissionGuard permission={editingId ? 'pet.vaccination.update' : 'pet.vaccination.create'}>
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <FormSelect label="Pet" value={petId} options={formPetOptions} onChange={onPetIdChange} disabled={petLookupUnavailable} />
          <FormInput label="Vacina" value={vaccineName} onChange={onVaccineNameChange} required />
          <DateTimeInput label="Aplicada em" value={appliedAt} onChange={onAppliedAtChange} required />
          <DateTimeInput label="Próximo reforço" value={nextDueAt} onChange={onNextDueAtChange} />
          <TextAreaField label="Notas" value={notes} onChange={onNotesChange} />

          <div className="md:col-span-2 flex gap-2">
            {!formReady ? (
              <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                O formulário de vacinação depende da referência de pets.
              </div>
            ) : null}
            <button
              type="submit"
              disabled={submitting || !formReady}
              className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {submitting ? 'Salvando...' : editingId ? 'Atualizar vacinação' : 'Criar vacinação'}
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

      <PermissionGuard permission="pet.vaccination.read">
        <DataTable columns={columns} rows={resolvePageItems(pageData)} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhuma vacinação encontrada." />
        <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={resolveTotalItems(pageData)} onPageChange={onPageChange} />
      </PermissionGuard>
    </section>
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
  formReady,
  submitting,
  onCancelEdit,
  columns,
  pageData,
  loading,
  onPageChange
}: PetPrescriptionSectionProps) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Prescriptions</h3>
        <p className="text-sm text-slate-600">Prescrições vinculadas ao histórico do atendimento.</p>
      </div>

      <PermissionGuard permission={editingId ? 'pet.prescription.update' : 'pet.prescription.create'}>
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <FormSelect label="Pet" value={petId} options={formPetOptions} onChange={onPetIdChange} disabled={petLookupUnavailable} />
          <FormSelect
            label="Profissional"
            value={professionalId}
            options={formProfessionalOptions}
            onChange={onProfessionalIdChange}
            disabled={professionalsLookupUnavailable}
          />
          <FormInput label="Medicamento" value={medication} onChange={onMedicationChange} required />
          <FormInput label="Dosagem" value={dosage} onChange={onDosageChange} />
          <div className="md:col-span-2">
            <TextAreaField label="Instruções" value={instructions} onChange={onInstructionsChange} />
          </div>

          <div className="md:col-span-2 flex gap-2">
            {!formReady ? (
              <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                O formulário de prescrição depende das referências de pets e profissionais.
              </div>
            ) : null}
            <button
              type="submit"
              disabled={submitting || !formReady}
              className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {submitting ? 'Salvando...' : editingId ? 'Atualizar prescrição' : 'Criar prescrição'}
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

      <PermissionGuard permission="pet.prescription.read">
        <DataTable columns={columns} rows={resolvePageItems(pageData)} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhuma prescrição encontrada." />
        <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={resolveTotalItems(pageData)} onPageChange={onPageChange} />
      </PermissionGuard>
    </section>
  );
}

export function PetMedicalPageFallback() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
      Você não possui permissão para visualizar workflows médicos do Pet.
    </div>
  );
}

export const petMedicalRouteGuardPermissions = petMedicalRoutePermissions;
