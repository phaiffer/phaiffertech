'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  petMedicalRecordPermissions,
  petMedicalRoutePermissions,
  petPrescriptionPermissions,
  petVaccinationPermissions
} from '@/modules/pet/pet-medical-permissions';
import {
  createPetMedicalRecordColumns,
  createPetPrescriptionColumns,
  createPetVaccinationColumns,
  PetMedicalFilters,
  PetMedicalPageFallback,
  PetMedicalRecordSection,
  PetPrescriptionSection,
  PetVaccinationSection
} from '@/modules/pet/pet-medical-sections';
import { toDateTimeLocal, toIsoDate } from '@/modules/pet/pet-date-time';
import {
  PetLookupFeedback,
  PetLookupIssue,
  resolvePetLookupIssue
} from '@/modules/pet/pet-lookup-feedback';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import {
  PetMedicalRecord,
  PetPrescription,
  PetProfessional,
  PetProfile,
  PetVaccination
} from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { PageTitle } from '@/shared/ui/page-title';

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
      issues.push({
        key: 'pets',
        label: 'Pets',
        message: resolvePetLookupIssue(petsPage.status === 'rejected' ? petsPage.reason : null)
      });
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
  }, [petFilterId, professionalFilterId, search]);

  useEffect(() => {
    loadRecords(recordsPage, search, petFilterId, professionalFilterId);
  }, [loadRecords, petFilterId, professionalFilterId, recordsPage, search]);

  useEffect(() => {
    loadVaccinations(vaccinationsPage, search, petFilterId);
  }, [loadVaccinations, petFilterId, search, vaccinationsPage]);

  useEffect(() => {
    loadPrescriptions(prescriptionsPage, search, petFilterId, professionalFilterId);
  }, [loadPrescriptions, petFilterId, prescriptionsPage, professionalFilterId, search]);

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

  const petLookupUnavailable = lookupIssues.some((issue) => issue.key === 'pets');
  const professionalsLookupUnavailable = lookupIssues.some((issue) => issue.key === 'professionals');
  const medicalRecordFormReady = !petLookupUnavailable && !professionalsLookupUnavailable;
  const vaccinationFormReady = !petLookupUnavailable;
  const prescriptionFormReady = !petLookupUnavailable && !professionalsLookupUnavailable;

  const medicalRecordColumns = useMemo(() => createPetMedicalRecordColumns({
    pets,
    professionals,
    petLookupUnavailable,
    professionalsLookupUnavailable,
    onEdit: beginEditRecord,
    onDelete: setDeleteRecordCandidate
  }), [petLookupUnavailable, pets, professionals, professionalsLookupUnavailable]);

  const vaccinationColumns = useMemo(() => createPetVaccinationColumns({
    pets,
    petLookupUnavailable,
    onEdit: beginEditVaccination,
    onDelete: setDeleteVaccinationCandidate
  }), [petLookupUnavailable, pets]);

  const prescriptionColumns = useMemo(() => createPetPrescriptionColumns({
    pets,
    professionals,
    petLookupUnavailable,
    professionalsLookupUnavailable,
    onEdit: beginEditPrescription,
    onDelete: setDeletePrescriptionCandidate
  }), [petLookupUnavailable, pets, professionals, professionalsLookupUnavailable]);

  return (
    <PermissionGuard anyOf={petMedicalRoutePermissions} fallback={<PetMedicalPageFallback />}>
      <div className="space-y-5">
        <PageTitle title="Medical Records" description="Prontuários, vacinações e prescrições do módulo PET." />

        <PetMedicalFilters
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          petFilterId={petFilterId}
          onPetFilterIdChange={setPetFilterId}
          petOptions={petOptions}
          petLookupUnavailable={petLookupUnavailable}
          showProfessionalFilter={showProfessionalFilter}
          professionalFilterId={professionalFilterId}
          onProfessionalFilterIdChange={setProfessionalFilterId}
          professionalOptions={professionalOptions}
          professionalsLookupUnavailable={professionalsLookupUnavailable}
          onSearch={() => setSearch(searchInput)}
          onClear={() => {
            setSearchInput('');
            setSearch('');
            setPetFilterId('');
            setProfessionalFilterId('');
          }}
        />

        <PetLookupFeedback issues={lookupIssues} />

        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

        {canAccessMedicalRecords ? (
          <PetMedicalRecordSection
            editingId={editingRecordId}
            onSubmit={handleSubmitRecord}
            petId={recordPetId}
            onPetIdChange={setRecordPetId}
            professionalId={recordProfessionalId}
            onProfessionalIdChange={setRecordProfessionalId}
            description={recordDescription}
            onDescriptionChange={setRecordDescription}
            diagnosis={recordDiagnosis}
            onDiagnosisChange={setRecordDiagnosis}
            treatment={recordTreatment}
            onTreatmentChange={setRecordTreatment}
            formPetOptions={formPetOptions}
            formProfessionalOptions={formProfessionalOptions}
            petLookupUnavailable={petLookupUnavailable}
            professionalsLookupUnavailable={professionalsLookupUnavailable}
            formReady={medicalRecordFormReady}
            submitting={recordSubmitting}
            onCancelEdit={resetRecordForm}
            columns={medicalRecordColumns}
            pageData={recordsPageData}
            loading={recordsLoading}
            onPageChange={setRecordsPage}
          />
        ) : null}

        {canAccessVaccinations ? (
          <PetVaccinationSection
            editingId={editingVaccinationId}
            onSubmit={handleSubmitVaccination}
            petId={vaccinationPetId}
            onPetIdChange={setVaccinationPetId}
            vaccineName={vaccineName}
            onVaccineNameChange={setVaccineName}
            appliedAt={appliedAt}
            onAppliedAtChange={setAppliedAt}
            nextDueAt={nextDueAt}
            onNextDueAtChange={setNextDueAt}
            notes={vaccinationNotes}
            onNotesChange={setVaccinationNotes}
            formPetOptions={formPetOptions}
            petLookupUnavailable={petLookupUnavailable}
            formReady={vaccinationFormReady}
            submitting={vaccinationSubmitting}
            onCancelEdit={resetVaccinationForm}
            columns={vaccinationColumns}
            pageData={vaccinationsPageData}
            loading={vaccinationsLoading}
            onPageChange={setVaccinationsPage}
          />
        ) : null}

        {canAccessPrescriptions ? (
          <PetPrescriptionSection
            editingId={editingPrescriptionId}
            onSubmit={handleSubmitPrescription}
            petId={prescriptionPetId}
            onPetIdChange={setPrescriptionPetId}
            professionalId={prescriptionProfessionalId}
            onProfessionalIdChange={setPrescriptionProfessionalId}
            medication={medication}
            onMedicationChange={setMedication}
            dosage={dosage}
            onDosageChange={setDosage}
            instructions={instructions}
            onInstructionsChange={setInstructions}
            formPetOptions={formPetOptions}
            formProfessionalOptions={formProfessionalOptions}
            petLookupUnavailable={petLookupUnavailable}
            professionalsLookupUnavailable={professionalsLookupUnavailable}
            formReady={prescriptionFormReady}
            submitting={prescriptionSubmitting}
            onCancelEdit={resetPrescriptionForm}
            columns={prescriptionColumns}
            pageData={prescriptionsPageData}
            loading={prescriptionsLoading}
            onPageChange={setPrescriptionsPage}
          />
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
