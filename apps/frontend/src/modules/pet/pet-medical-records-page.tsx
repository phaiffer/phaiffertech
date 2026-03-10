'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  petMedicalRecordPermissions,
  petMedicalRoutePermissions,
  petPrescriptionPermissions,
  petVaccinationPermissions
} from '@/modules/pet/pet-medical-permissions';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import {
  PetMedicalRecord,
  PetPrescription,
  PetProfessional,
  PetProfile,
  PetVaccination
} from '@/shared/types/pet';
import {
  PetLookupFeedback,
  PetLookupIssue,
  resolvePetLookupIssue,
  resolvePetLookupLabel
} from '@/modules/pet/pet-lookup-feedback';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { DateTimeInput } from '@/shared/ui/datetime-input';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 5;

const emptyMedicalRecordsPage: PageResponse<PetMedicalRecord> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

const emptyVaccinationsPage: PageResponse<PetVaccination> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

const emptyPrescriptionsPage: PageResponse<PetPrescription> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
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

export function PetMedicalRecordsPage() {
  const { hasAnyPermission, hasPermission } = usePermissions();
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [professionals, setProfessionals] = useState<PetProfessional[]>([]);
  const [lookupIssues, setLookupIssues] = useState<PetLookupIssue[]>([]);

  const [recordsPageData, setRecordsPageData] = useState<PageResponse<PetMedicalRecord>>(emptyMedicalRecordsPage);
  const [vaccinationsPageData, setVaccinationsPageData] = useState<PageResponse<PetVaccination>>(emptyVaccinationsPage);
  const [prescriptionsPageData, setPrescriptionsPageData] = useState<PageResponse<PetPrescription>>(emptyPrescriptionsPage);

  const [recordsLoading, setRecordsLoading] = useState(false);
  const [vaccinationsLoading, setVaccinationsLoading] = useState(false);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [petFilterId, setPetFilterId] = useState('');
  const [professionalFilterId, setProfessionalFilterId] = useState('');

  const [recordsPage, setRecordsPage] = useState(0);
  const [vaccinationsPage, setVaccinationsPage] = useState(0);
  const [prescriptionsPage, setPrescriptionsPage] = useState(0);

  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [recordPetId, setRecordPetId] = useState('');
  const [recordProfessionalId, setRecordProfessionalId] = useState('');
  const [recordDescription, setRecordDescription] = useState('');
  const [recordDiagnosis, setRecordDiagnosis] = useState('');
  const [recordTreatment, setRecordTreatment] = useState('');
  const [recordSubmitting, setRecordSubmitting] = useState(false);

  const [editingVaccinationId, setEditingVaccinationId] = useState<string | null>(null);
  const [vaccinationPetId, setVaccinationPetId] = useState('');
  const [vaccineName, setVaccineName] = useState('');
  const [appliedAt, setAppliedAt] = useState('');
  const [nextDueAt, setNextDueAt] = useState('');
  const [vaccinationNotes, setVaccinationNotes] = useState('');
  const [vaccinationSubmitting, setVaccinationSubmitting] = useState(false);

  const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(null);
  const [prescriptionPetId, setPrescriptionPetId] = useState('');
  const [prescriptionProfessionalId, setPrescriptionProfessionalId] = useState('');
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [prescriptionSubmitting, setPrescriptionSubmitting] = useState(false);

  const [deleteRecordCandidate, setDeleteRecordCandidate] = useState<PetMedicalRecord | null>(null);
  const [deleteVaccinationCandidate, setDeleteVaccinationCandidate] = useState<PetVaccination | null>(null);
  const [deletePrescriptionCandidate, setDeletePrescriptionCandidate] = useState<PetPrescription | null>(null);

  const canReadPets = hasPermission('pet.profile.read');
  const canReadProfessionals = hasPermission('pet.professional.read');
  const canReadMedicalRecords = hasPermission('pet.medical-record.read');
  const canReadVaccinations = hasPermission('pet.vaccination.read');
  const canReadPrescriptions = hasPermission('pet.prescription.read');

  const canAccessMedicalRecords = hasAnyPermission(petMedicalRecordPermissions);
  const canAccessVaccinations = hasAnyPermission(petVaccinationPermissions);
  const canAccessPrescriptions = hasAnyPermission(petPrescriptionPermissions);
  const canAccessAnyMedical = hasAnyPermission(petMedicalRoutePermissions);
  const needsProfessionalLookup = canAccessMedicalRecords || canAccessPrescriptions;
  const showProfessionalFilter = canReadMedicalRecords || canReadPrescriptions;

  const petOptions = useMemo(() => {
    return [
      { value: '', label: 'Todos' },
      ...pets.map((pet) => ({ value: pet.id, label: pet.name }))
    ];
  }, [pets]);

  const professionalOptions = useMemo(() => {
    return [
      { value: '', label: 'Todos' },
      ...professionals.map((professional) => ({ value: professional.id, label: professional.name }))
    ];
  }, [professionals]);

  const formPetOptions = useMemo(() => {
    return [{ value: '', label: 'Selecione um pet' }, ...petOptions.filter((item) => item.value)];
  }, [petOptions]);

  const formProfessionalOptions = useMemo(() => {
    return [{ value: '', label: 'Selecione um profissional' }, ...professionalOptions.filter((item) => item.value)];
  }, [professionalOptions]);

  const loadReferences = useCallback(async () => {
    const [petsPage, professionalsPage] = await Promise.allSettled([
      canReadPets && canAccessAnyMedical ? petService.listProfiles(0, 200, '') : Promise.resolve(null),
      canReadProfessionals && needsProfessionalLookup ? petService.listProfessionals(0, 200, '') : Promise.resolve(null)
    ]);

    const issues: PetLookupIssue[] = [];

    if (!canReadPets && canAccessAnyMedical) {
      setPets([]);
      issues.push({ key: 'pets', label: 'Pets', message: resolvePetLookupIssue(null, 'pet.profile.read') });
    } else if (petsPage.status === 'fulfilled' && petsPage.value) {
      setPets(resolvePageItems(petsPage.value));
    } else if (canAccessAnyMedical) {
      setPets([]);
      issues.push({ key: 'pets', label: 'Pets', message: resolvePetLookupIssue(petsPage.status === 'rejected' ? petsPage.reason : null) });
    } else {
      setPets([]);
    }

    if (!canReadProfessionals && needsProfessionalLookup) {
      setProfessionals([]);
      issues.push({
        key: 'professionals',
        label: 'Profissionais',
        message: resolvePetLookupIssue(null, 'pet.professional.read')
      });
    } else if (professionalsPage.status === 'fulfilled' && professionalsPage.value) {
      setProfessionals(resolvePageItems(professionalsPage.value));
    } else if (needsProfessionalLookup) {
      setProfessionals([]);
      issues.push({
        key: 'professionals',
        label: 'Profissionais',
        message: resolvePetLookupIssue(professionalsPage.status === 'rejected' ? professionalsPage.reason : null)
      });
    } else {
      setProfessionals([]);
    }

    setLookupIssues(issues);
  }, [canAccessAnyMedical, canReadPets, canReadProfessionals, needsProfessionalLookup]);

  const loadRecords = useCallback(async (page: number, currentSearch: string, currentPetId: string, currentProfessionalId: string) => {
    if (!canReadMedicalRecords) {
      setRecordsPageData(emptyMedicalRecordsPage);
      setRecordsLoading(false);
      return;
    }

    setRecordsLoading(true);
    try {
      const result = await petService.listMedicalRecords(page, pageSize, currentSearch, {
        petId: currentPetId || undefined,
        professionalId: currentProfessionalId || undefined
      });
      setRecordsPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar prontuários.');
    } finally {
      setRecordsLoading(false);
    }
  }, [canReadMedicalRecords]);

  const loadVaccinations = useCallback(async (page: number, currentSearch: string, currentPetId: string) => {
    if (!canReadVaccinations) {
      setVaccinationsPageData(emptyVaccinationsPage);
      setVaccinationsLoading(false);
      return;
    }

    setVaccinationsLoading(true);
    try {
      const result = await petService.listVaccinations(page, pageSize, currentSearch, {
        petId: currentPetId || undefined
      });
      setVaccinationsPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar vacinações.');
    } finally {
      setVaccinationsLoading(false);
    }
  }, [canReadVaccinations]);

  const loadPrescriptions = useCallback(async (page: number, currentSearch: string, currentPetId: string, currentProfessionalId: string) => {
    if (!canReadPrescriptions) {
      setPrescriptionsPageData(emptyPrescriptionsPage);
      setPrescriptionsLoading(false);
      return;
    }

    setPrescriptionsLoading(true);
    try {
      const result = await petService.listPrescriptions(page, pageSize, currentSearch, {
        petId: currentPetId || undefined,
        professionalId: currentProfessionalId || undefined
      });
      setPrescriptionsPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar prescrições.');
    } finally {
      setPrescriptionsLoading(false);
    }
  }, [canReadPrescriptions]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    setRecordsPage(0);
    setVaccinationsPage(0);
    setPrescriptionsPage(0);
  }, [search, petFilterId, professionalFilterId]);

  useEffect(() => {
    loadRecords(recordsPage, search, petFilterId, professionalFilterId);
  }, [loadRecords, recordsPage, search, petFilterId, professionalFilterId]);

  useEffect(() => {
    loadVaccinations(vaccinationsPage, search, petFilterId);
  }, [loadVaccinations, vaccinationsPage, search, petFilterId]);

  useEffect(() => {
    loadPrescriptions(prescriptionsPage, search, petFilterId, professionalFilterId);
  }, [loadPrescriptions, prescriptionsPage, search, petFilterId, professionalFilterId]);

  function resetRecordForm() {
    setEditingRecordId(null);
    setRecordPetId('');
    setRecordProfessionalId('');
    setRecordDescription('');
    setRecordDiagnosis('');
    setRecordTreatment('');
  }

  function resetVaccinationForm() {
    setEditingVaccinationId(null);
    setVaccinationPetId('');
    setVaccineName('');
    setAppliedAt('');
    setNextDueAt('');
    setVaccinationNotes('');
  }

  function resetPrescriptionForm() {
    setEditingPrescriptionId(null);
    setPrescriptionPetId('');
    setPrescriptionProfessionalId('');
    setMedication('');
    setDosage('');
    setInstructions('');
  }

  function beginEditRecord(item: PetMedicalRecord) {
    setEditingRecordId(item.id);
    setRecordPetId(item.petId);
    setRecordProfessionalId(item.professionalId);
    setRecordDescription(item.description);
    setRecordDiagnosis(item.diagnosis ?? '');
    setRecordTreatment(item.treatment ?? '');
    setError(null);
    setSuccess(null);
  }

  function beginEditVaccination(item: PetVaccination) {
    setEditingVaccinationId(item.id);
    setVaccinationPetId(item.petId);
    setVaccineName(item.vaccineName);
    setAppliedAt(toDateTimeLocal(item.appliedAt));
    setNextDueAt(toDateTimeLocal(item.nextDueAt));
    setVaccinationNotes(item.notes ?? '');
    setError(null);
    setSuccess(null);
  }

  function beginEditPrescription(item: PetPrescription) {
    setEditingPrescriptionId(item.id);
    setPrescriptionPetId(item.petId);
    setPrescriptionProfessionalId(item.professionalId);
    setMedication(item.medication);
    setDosage(item.dosage ?? '');
    setInstructions(item.instructions ?? '');
    setError(null);
    setSuccess(null);
  }

  async function handleSubmitRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recordPetId || !recordProfessionalId) {
      setError('Selecione pet e profissional para o prontuário.');
      return;
    }

    setRecordSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        petId: recordPetId,
        professionalId: recordProfessionalId,
        description: recordDescription,
        diagnosis: recordDiagnosis || undefined,
        treatment: recordTreatment || undefined
      };

      if (editingRecordId) {
        await petService.updateMedicalRecord(editingRecordId, payload);
        setSuccess('Prontuário atualizado com sucesso.');
      } else {
        await petService.createMedicalRecord(payload);
        setSuccess('Prontuário criado com sucesso.');
      }

      resetRecordForm();
      await loadRecords(recordsPage, search, petFilterId, professionalFilterId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar prontuário.');
    } finally {
      setRecordSubmitting(false);
    }
  }

  async function handleSubmitVaccination(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isoAppliedAt = toIsoDate(appliedAt);
    const isoNextDueAt = toIsoDate(nextDueAt);
    if (!vaccinationPetId || !isoAppliedAt) {
      setError('Selecione o pet e informe a data de aplicação.');
      return;
    }

    setVaccinationSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        petId: vaccinationPetId,
        vaccineName,
        appliedAt: isoAppliedAt,
        nextDueAt: isoNextDueAt,
        notes: vaccinationNotes || undefined
      };

      if (editingVaccinationId) {
        await petService.updateVaccination(editingVaccinationId, payload);
        setSuccess('Vacinação atualizada com sucesso.');
      } else {
        await petService.createVaccination(payload);
        setSuccess('Vacinação criada com sucesso.');
      }

      resetVaccinationForm();
      await loadVaccinations(vaccinationsPage, search, petFilterId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar vacinação.');
    } finally {
      setVaccinationSubmitting(false);
    }
  }

  async function handleSubmitPrescription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prescriptionPetId || !prescriptionProfessionalId) {
      setError('Selecione pet e profissional para a prescrição.');
      return;
    }

    setPrescriptionSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        petId: prescriptionPetId,
        professionalId: prescriptionProfessionalId,
        medication,
        dosage: dosage || undefined,
        instructions: instructions || undefined
      };

      if (editingPrescriptionId) {
        await petService.updatePrescription(editingPrescriptionId, payload);
        setSuccess('Prescrição atualizada com sucesso.');
      } else {
        await petService.createPrescription(payload);
        setSuccess('Prescrição criada com sucesso.');
      }

      resetPrescriptionForm();
      await loadPrescriptions(prescriptionsPage, search, petFilterId, professionalFilterId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar prescrição.');
    } finally {
      setPrescriptionSubmitting(false);
    }
  }

  async function handleDeleteRecord() {
    if (!deleteRecordCandidate) {
      return;
    }

    try {
      await petService.deleteMedicalRecord(deleteRecordCandidate.id);
      setDeleteRecordCandidate(null);
      setSuccess('Prontuário removido com sucesso.');
      await loadRecords(recordsPage, search, petFilterId, professionalFilterId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir prontuário.');
    }
  }

  async function handleDeleteVaccination() {
    if (!deleteVaccinationCandidate) {
      return;
    }

    try {
      await petService.deleteVaccination(deleteVaccinationCandidate.id);
      setDeleteVaccinationCandidate(null);
      setSuccess('Vacinação removida com sucesso.');
      await loadVaccinations(vaccinationsPage, search, petFilterId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir vacinação.');
    }
  }

  async function handleDeletePrescription() {
    if (!deletePrescriptionCandidate) {
      return;
    }

    try {
      await petService.deletePrescription(deletePrescriptionCandidate.id);
      setDeletePrescriptionCandidate(null);
      setSuccess('Prescrição removida com sucesso.');
      await loadPrescriptions(prescriptionsPage, search, petFilterId, professionalFilterId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir prescrição.');
    }
  }

  const medicalRecordColumns: DataTableColumn<PetMedicalRecord>[] = [
    {
      key: 'pet',
      header: 'Pet',
      render: (item) => resolvePetLookupLabel(pets, item.petId, (pet) => pet.name, 'Pet', lookupIssues.some((issue) => issue.key === 'pets'))
    },
    {
      key: 'professional',
      header: 'Profissional',
      render: (item) =>
        resolvePetLookupLabel(
          professionals,
          item.professionalId,
          (professional) => professional.name,
          'Profissional',
          lookupIssues.some((issue) => issue.key === 'professionals')
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
              onClick={() => beginEditRecord(item)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.medical-record.delete">
            <button
              type="button"
              onClick={() => setDeleteRecordCandidate(item)}
              className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700"
            >
              Excluir
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  const vaccinationColumns: DataTableColumn<PetVaccination>[] = [
    {
      key: 'pet',
      header: 'Pet',
      render: (item) => resolvePetLookupLabel(pets, item.petId, (pet) => pet.name, 'Pet', lookupIssues.some((issue) => issue.key === 'pets'))
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
              onClick={() => beginEditVaccination(item)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.vaccination.delete">
            <button
              type="button"
              onClick={() => setDeleteVaccinationCandidate(item)}
              className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700"
            >
              Excluir
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  const prescriptionColumns: DataTableColumn<PetPrescription>[] = [
    {
      key: 'pet',
      header: 'Pet',
      render: (item) => resolvePetLookupLabel(pets, item.petId, (pet) => pet.name, 'Pet', lookupIssues.some((issue) => issue.key === 'pets'))
    },
    { key: 'medication', header: 'Medicamento', render: (item) => item.medication },
    {
      key: 'professional',
      header: 'Profissional',
      render: (item) =>
        resolvePetLookupLabel(
          professionals,
          item.professionalId,
          (professional) => professional.name,
          'Profissional',
          lookupIssues.some((issue) => issue.key === 'professionals')
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
              onClick={() => beginEditPrescription(item)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.prescription.delete">
            <button
              type="button"
              onClick={() => setDeletePrescriptionCandidate(item)}
              className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700"
            >
              Excluir
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  const petLookupUnavailable = lookupIssues.some((issue) => issue.key === 'pets');
  const professionalsLookupUnavailable = lookupIssues.some((issue) => issue.key === 'professionals');
  const medicalRecordFormReady = !petLookupUnavailable && !professionalsLookupUnavailable;
  const vaccinationFormReady = !petLookupUnavailable;
  const prescriptionFormReady = !petLookupUnavailable && !professionalsLookupUnavailable;

  return (
    <PermissionGuard
      anyOf={petMedicalRoutePermissions}
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar workflows médicos do Pet.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="Medical Records" description="Prontuários, vacinações e prescrições do módulo PET." />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_240px_240px_auto_auto]">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Descrição, diagnóstico, medicação ou vacina" />
          <FormSelect label="Pet" value={petFilterId} options={petOptions} onChange={setPetFilterId} disabled={petLookupUnavailable} />
          {showProfessionalFilter ? (
            <FormSelect
              label="Profissional"
              value={professionalFilterId}
              options={professionalOptions}
              onChange={setProfessionalFilterId}
              disabled={professionalsLookupUnavailable}
            />
          ) : null}
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
              setPetFilterId('');
              setProfessionalFilterId('');
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Limpar
          </button>
        </div>

        <PetLookupFeedback issues={lookupIssues} />

        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

        {canAccessMedicalRecords ? (
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Medical Records</h3>
            <p className="text-sm text-slate-600">Histórico clínico e evoluções por pet.</p>
          </div>

          <PermissionGuard permission={editingRecordId ? 'pet.medical-record.update' : 'pet.medical-record.create'}>
            <form onSubmit={handleSubmitRecord} className="grid gap-3 md:grid-cols-2">
              <FormSelect label="Pet" value={recordPetId} options={formPetOptions} onChange={setRecordPetId} disabled={petLookupUnavailable} />
              <FormSelect
                label="Profissional"
                value={recordProfessionalId}
                options={formProfessionalOptions}
                onChange={setRecordProfessionalId}
                disabled={professionalsLookupUnavailable}
              />
              <TextAreaField label="Descrição" value={recordDescription} onChange={setRecordDescription} required />
              <TextAreaField label="Diagnóstico" value={recordDiagnosis} onChange={setRecordDiagnosis} />
              <TextAreaField label="Tratamento" value={recordTreatment} onChange={setRecordTreatment} />

              <div className="md:col-span-2 flex gap-2">
                {!medicalRecordFormReady ? (
                  <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    O formulário de prontuário depende das referências de pets e profissionais.
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={recordSubmitting || !medicalRecordFormReady}
                  className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {recordSubmitting ? 'Salvando...' : editingRecordId ? 'Atualizar prontuário' : 'Criar prontuário'}
                </button>
                {editingRecordId ? (
                  <button
                    type="button"
                    onClick={resetRecordForm}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    Cancelar edição
                  </button>
                ) : null}
              </div>
            </form>
          </PermissionGuard>

          <PermissionGuard permission="pet.medical-record.read">
            <DataTable columns={medicalRecordColumns} rows={resolvePageItems(recordsPageData)} getRowKey={(row) => row.id} loading={recordsLoading} emptyMessage="Nenhum prontuário encontrado." />
            <Pagination page={recordsPageData.page} totalPages={recordsPageData.totalPages} totalElements={resolveTotalItems(recordsPageData)} onPageChange={setRecordsPage} />
          </PermissionGuard>
          </section>
        ) : null}

        {canAccessVaccinations ? (
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Vaccinations</h3>
            <p className="text-sm text-slate-600">Controle de aplicações e próximos reforços.</p>
          </div>

          <PermissionGuard permission={editingVaccinationId ? 'pet.vaccination.update' : 'pet.vaccination.create'}>
            <form onSubmit={handleSubmitVaccination} className="grid gap-3 md:grid-cols-2">
              <FormSelect label="Pet" value={vaccinationPetId} options={formPetOptions} onChange={setVaccinationPetId} disabled={petLookupUnavailable} />
              <FormInput label="Vacina" value={vaccineName} onChange={setVaccineName} required />
              <DateTimeInput label="Aplicada em" value={appliedAt} onChange={setAppliedAt} required />
              <DateTimeInput label="Próximo reforço" value={nextDueAt} onChange={setNextDueAt} />
              <TextAreaField label="Notas" value={vaccinationNotes} onChange={setVaccinationNotes} />

              <div className="md:col-span-2 flex gap-2">
                {!vaccinationFormReady ? (
                  <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    O formulário de vacinação depende da referência de pets.
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={vaccinationSubmitting || !vaccinationFormReady}
                  className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {vaccinationSubmitting ? 'Salvando...' : editingVaccinationId ? 'Atualizar vacinação' : 'Criar vacinação'}
                </button>
                {editingVaccinationId ? (
                  <button
                    type="button"
                    onClick={resetVaccinationForm}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    Cancelar edição
                  </button>
                ) : null}
              </div>
            </form>
          </PermissionGuard>

          <PermissionGuard permission="pet.vaccination.read">
            <DataTable columns={vaccinationColumns} rows={resolvePageItems(vaccinationsPageData)} getRowKey={(row) => row.id} loading={vaccinationsLoading} emptyMessage="Nenhuma vacinação encontrada." />
            <Pagination page={vaccinationsPageData.page} totalPages={vaccinationsPageData.totalPages} totalElements={resolveTotalItems(vaccinationsPageData)} onPageChange={setVaccinationsPage} />
          </PermissionGuard>
          </section>
        ) : null}

        {canAccessPrescriptions ? (
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Prescriptions</h3>
            <p className="text-sm text-slate-600">Prescrições vinculadas ao histórico do atendimento.</p>
          </div>

          <PermissionGuard permission={editingPrescriptionId ? 'pet.prescription.update' : 'pet.prescription.create'}>
            <form onSubmit={handleSubmitPrescription} className="grid gap-3 md:grid-cols-2">
              <FormSelect label="Pet" value={prescriptionPetId} options={formPetOptions} onChange={setPrescriptionPetId} disabled={petLookupUnavailable} />
              <FormSelect
                label="Profissional"
                value={prescriptionProfessionalId}
                options={formProfessionalOptions}
                onChange={setPrescriptionProfessionalId}
                disabled={professionalsLookupUnavailable}
              />
              <FormInput label="Medicamento" value={medication} onChange={setMedication} required />
              <FormInput label="Dosagem" value={dosage} onChange={setDosage} />
              <div className="md:col-span-2">
                <TextAreaField label="Instruções" value={instructions} onChange={setInstructions} />
              </div>

              <div className="md:col-span-2 flex gap-2">
                {!prescriptionFormReady ? (
                  <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    O formulário de prescrição depende das referências de pets e profissionais.
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={prescriptionSubmitting || !prescriptionFormReady}
                  className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {prescriptionSubmitting ? 'Salvando...' : editingPrescriptionId ? 'Atualizar prescrição' : 'Criar prescrição'}
                </button>
                {editingPrescriptionId ? (
                  <button
                    type="button"
                    onClick={resetPrescriptionForm}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                  >
                    Cancelar edição
                  </button>
                ) : null}
              </div>
            </form>
          </PermissionGuard>

          <PermissionGuard permission="pet.prescription.read">
            <DataTable columns={prescriptionColumns} rows={resolvePageItems(prescriptionsPageData)} getRowKey={(row) => row.id} loading={prescriptionsLoading} emptyMessage="Nenhuma prescrição encontrada." />
            <Pagination page={prescriptionsPageData.page} totalPages={prescriptionsPageData.totalPages} totalElements={resolveTotalItems(prescriptionsPageData)} onPageChange={setPrescriptionsPage} />
          </PermissionGuard>
          </section>
        ) : null}

        <ConfirmDialog
          open={deleteRecordCandidate !== null}
          title="Excluir prontuário?"
          description="A entrada clínica será removida."
          onConfirm={handleDeleteRecord}
          onCancel={() => setDeleteRecordCandidate(null)}
        />

        <ConfirmDialog
          open={deleteVaccinationCandidate !== null}
          title="Excluir vacinação?"
          description="O registro de vacinação será removido."
          onConfirm={handleDeleteVaccination}
          onCancel={() => setDeleteVaccinationCandidate(null)}
        />

        <ConfirmDialog
          open={deletePrescriptionCandidate !== null}
          title="Excluir prescrição?"
          description="O registro de prescrição será removido."
          onConfirm={handleDeletePrescription}
          onCancel={() => setDeletePrescriptionCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
