'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  PetClinicalTimelineSection,
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
  PetAppointment,
  PetClinicalTimeline,
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
  const searchParams = useSearchParams();
  const { hasAnyPermission, hasPermission } = usePermissions();
  const appointmentContextId = searchParams.get('appointmentId');
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [professionals, setProfessionals] = useState<PetProfessional[]>([]);
  const [lookupIssues, setLookupIssues] = useState<PetLookupIssue[]>([]);
  const [appointmentContext, setAppointmentContext] = useState<PetAppointment | null>(null);
  const [appointmentContextLoading, setAppointmentContextLoading] = useState(false);
  const [appointmentContextError, setAppointmentContextError] = useState<string | null>(null);
  const [clinicalTimeline, setClinicalTimeline] = useState<PetClinicalTimeline | null>(null);
  const [clinicalTimelineLoading, setClinicalTimelineLoading] = useState(false);
  const [clinicalTimelineError, setClinicalTimelineError] = useState<string | null>(null);

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
  const [recordAppointmentId, setRecordAppointmentId] = useState(appointmentContextId ?? '');
  const [recordPetId, setRecordPetId] = useState('');
  const [recordProfessionalId, setRecordProfessionalId] = useState('');
  const [recordDescription, setRecordDescription] = useState('');
  const [recordDiagnosis, setRecordDiagnosis] = useState('');
  const [recordTreatment, setRecordTreatment] = useState('');
  const [recordSubmitting, setRecordSubmitting] = useState(false);

  const [editingVaccinationId, setEditingVaccinationId] = useState<string | null>(null);
  const [vaccinationAppointmentId, setVaccinationAppointmentId] = useState(appointmentContextId ?? '');
  const [vaccinationPetId, setVaccinationPetId] = useState('');
  const [vaccineName, setVaccineName] = useState('');
  const [appliedAt, setAppliedAt] = useState('');
  const [nextDueAt, setNextDueAt] = useState('');
  const [vaccinationNotes, setVaccinationNotes] = useState('');
  const [vaccinationSubmitting, setVaccinationSubmitting] = useState(false);

  const [editingPrescriptionId, setEditingPrescriptionId] = useState<string | null>(null);
  const [prescriptionAppointmentId, setPrescriptionAppointmentId] = useState(appointmentContextId ?? '');
  const [prescriptionPetId, setPrescriptionPetId] = useState('');
  const [prescriptionProfessionalId, setPrescriptionProfessionalId] = useState('');
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [prescriptionSubmitting, setPrescriptionSubmitting] = useState(false);

  const [deleteRecordCandidate, setDeleteRecordCandidate] = useState<PetMedicalRecord | null>(null);
  const [deleteVaccinationCandidate, setDeleteVaccinationCandidate] = useState<PetVaccination | null>(null);
  const [deletePrescriptionCandidate, setDeletePrescriptionCandidate] = useState<PetPrescription | null>(null);

  const canReadAppointments = hasPermission('pet.appointment.read');
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
  const activeAppointmentContextId = appointmentContextId ?? undefined;

  const petOptions = useMemo(() => {
    const appointmentPetOption = appointmentContext
      ? { value: appointmentContext.petId, label: appointmentContext.petName ?? appointmentContext.petId }
      : null;
    const options = pets.map((pet) => ({ value: pet.id, label: pet.name }));

    if (appointmentPetOption && !options.some((option) => option.value === appointmentPetOption.value)) {
      options.push(appointmentPetOption);
    }

    return [
      { value: '', label: 'Todos' },
      ...options
    ];
  }, [appointmentContext, pets]);

  const professionalOptions = useMemo(() => {
    const appointmentProfessionalOption = appointmentContext
      ? {
          value: appointmentContext.professionalId,
          label: appointmentContext.professionalName ?? appointmentContext.professionalId
        }
      : null;
    const options = professionals.map((professional) => ({ value: professional.id, label: professional.name }));

    if (
      appointmentProfessionalOption &&
      !options.some((option) => option.value === appointmentProfessionalOption.value)
    ) {
      options.push(appointmentProfessionalOption);
    }

    return [
      { value: '', label: 'Todos' },
      ...options
    ];
  }, [appointmentContext, professionals]);

  const formPetOptions = useMemo(() => {
    return [{ value: '', label: 'Selecione um pet' }, ...petOptions.filter((item) => item.value)];
  }, [petOptions]);

  const formProfessionalOptions = useMemo(() => {
    return [{ value: '', label: 'Selecione um profissional' }, ...professionalOptions.filter((item) => item.value)];
  }, [professionalOptions]);

  const loadAppointmentContext = useCallback(async () => {
    if (!appointmentContextId || !canReadAppointments) {
      setAppointmentContext(null);
      setAppointmentContextError(null);
      setAppointmentContextLoading(false);
      return;
    }

    setAppointmentContextLoading(true);
    setAppointmentContextError(null);

    try {
      const result = await petService.getAppointment(appointmentContextId);
      setAppointmentContext(result);
    } catch (err) {
      setAppointmentContext(null);
      setAppointmentContextError(
        err instanceof ApiClientError
          ? err.message
          : 'Erro ao carregar o atendimento selecionado para o fluxo clínico.'
      );
    } finally {
      setAppointmentContextLoading(false);
    }
  }, [appointmentContextId, canReadAppointments]);

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

  const loadClinicalTimeline = useCallback(async (currentPetId: string, currentAppointmentId?: string) => {
    if (!canReadMedicalRecords) {
      setClinicalTimeline(null);
      setClinicalTimelineError(null);
      setClinicalTimelineLoading(false);
      return;
    }

    if (!currentPetId && !currentAppointmentId) {
      setClinicalTimeline(null);
      setClinicalTimelineError(null);
      setClinicalTimelineLoading(false);
      return;
    }

    setClinicalTimelineLoading(true);
    setClinicalTimelineError(null);

    try {
      const result = await petService.getClinicalTimeline({
        petId: currentAppointmentId ? undefined : currentPetId || undefined,
        appointmentId: currentAppointmentId || undefined,
        limit: 20
      });
      setClinicalTimeline(result);
    } catch (err) {
      setClinicalTimeline(null);
      setClinicalTimelineError(
        err instanceof ApiClientError
          ? err.message
          : 'Erro ao carregar a timeline clinica consolidada.'
      );
    } finally {
      setClinicalTimelineLoading(false);
    }
  }, [canReadMedicalRecords]);

  const loadRecords = useCallback(async (
    page: number,
    currentSearch: string,
    currentPetId: string,
    currentProfessionalId: string,
    currentAppointmentId?: string | null
  ) => {
    if (!canReadMedicalRecords) {
      setRecordsPageData(emptyMedicalRecordsPage);
      setRecordsLoading(false);
      return;
    }

    setRecordsLoading(true);
    try {
      const result = await petService.listMedicalRecords(page, pageSize, currentSearch, {
        petId: currentPetId || undefined,
        professionalId: currentProfessionalId || undefined,
        appointmentId: currentAppointmentId || undefined
      });
      setRecordsPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar prontuários.');
    } finally {
      setRecordsLoading(false);
    }
  }, [canReadMedicalRecords]);

  const loadVaccinations = useCallback(async (
    page: number,
    currentSearch: string,
    currentPetId: string,
    currentAppointmentId?: string | null
  ) => {
    if (!canReadVaccinations) {
      setVaccinationsPageData(emptyVaccinationsPage);
      setVaccinationsLoading(false);
      return;
    }

    setVaccinationsLoading(true);
    try {
      const result = await petService.listVaccinations(page, pageSize, currentSearch, {
        petId: currentPetId || undefined,
        appointmentId: currentAppointmentId || undefined
      });
      setVaccinationsPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar vacinações.');
    } finally {
      setVaccinationsLoading(false);
    }
  }, [canReadVaccinations]);

  const loadPrescriptions = useCallback(async (
    page: number,
    currentSearch: string,
    currentPetId: string,
    currentProfessionalId: string,
    currentAppointmentId?: string | null
  ) => {
    if (!canReadPrescriptions) {
      setPrescriptionsPageData(emptyPrescriptionsPage);
      setPrescriptionsLoading(false);
      return;
    }

    setPrescriptionsLoading(true);
    try {
      const result = await petService.listPrescriptions(page, pageSize, currentSearch, {
        petId: currentPetId || undefined,
        professionalId: currentProfessionalId || undefined,
        appointmentId: currentAppointmentId || undefined
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
    loadAppointmentContext();
  }, [loadAppointmentContext]);

  useEffect(() => {
    if (!appointmentContext) {
      return;
    }

    setPetFilterId((currentValue) => currentValue || appointmentContext.petId);
    setProfessionalFilterId((currentValue) => currentValue || appointmentContext.professionalId);
    setRecordPetId((currentValue) => currentValue || appointmentContext.petId);
    setRecordProfessionalId((currentValue) => currentValue || appointmentContext.professionalId);
    setVaccinationPetId((currentValue) => currentValue || appointmentContext.petId);
    setPrescriptionPetId((currentValue) => currentValue || appointmentContext.petId);
    setPrescriptionProfessionalId((currentValue) => currentValue || appointmentContext.professionalId);
  }, [appointmentContext]);

  useEffect(() => {
    if (!activeAppointmentContextId) {
      return;
    }

    setRecordAppointmentId((currentValue) => currentValue || activeAppointmentContextId);
    setVaccinationAppointmentId((currentValue) => currentValue || activeAppointmentContextId);
    setPrescriptionAppointmentId((currentValue) => currentValue || activeAppointmentContextId);
  }, [activeAppointmentContextId]);

  useEffect(() => {
    setRecordsPage(0);
    setVaccinationsPage(0);
    setPrescriptionsPage(0);
  }, [activeAppointmentContextId, petFilterId, professionalFilterId, search]);

  useEffect(() => {
    loadRecords(recordsPage, search, petFilterId, professionalFilterId, activeAppointmentContextId);
  }, [activeAppointmentContextId, loadRecords, petFilterId, professionalFilterId, recordsPage, search]);

  useEffect(() => {
    loadVaccinations(vaccinationsPage, search, petFilterId, activeAppointmentContextId);
  }, [activeAppointmentContextId, loadVaccinations, petFilterId, search, vaccinationsPage]);

  useEffect(() => {
    loadPrescriptions(prescriptionsPage, search, petFilterId, professionalFilterId, activeAppointmentContextId);
  }, [activeAppointmentContextId, loadPrescriptions, petFilterId, prescriptionsPage, professionalFilterId, search]);

  useEffect(() => {
    loadClinicalTimeline(activeAppointmentContextId ? '' : petFilterId, activeAppointmentContextId);
  }, [activeAppointmentContextId, loadClinicalTimeline, petFilterId]);

  function resetRecordForm() {
    setEditingRecordId(null);
    setRecordAppointmentId(activeAppointmentContextId ?? '');
    setRecordPetId(appointmentContext?.petId ?? '');
    setRecordProfessionalId(appointmentContext?.professionalId ?? '');
    setRecordDescription('');
    setRecordDiagnosis('');
    setRecordTreatment('');
  }

  function resetVaccinationForm() {
    setEditingVaccinationId(null);
    setVaccinationAppointmentId(activeAppointmentContextId ?? '');
    setVaccinationPetId(appointmentContext?.petId ?? '');
    setVaccineName('');
    setAppliedAt('');
    setNextDueAt('');
    setVaccinationNotes('');
  }

  function resetPrescriptionForm() {
    setEditingPrescriptionId(null);
    setPrescriptionAppointmentId(activeAppointmentContextId ?? '');
    setPrescriptionPetId(appointmentContext?.petId ?? '');
    setPrescriptionProfessionalId(appointmentContext?.professionalId ?? '');
    setMedication('');
    setDosage('');
    setInstructions('');
  }

  function beginEditRecord(item: PetMedicalRecord) {
    setEditingRecordId(item.id);
    setRecordAppointmentId(item.appointmentId ?? '');
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
    setVaccinationAppointmentId(item.appointmentId ?? '');
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
    setPrescriptionAppointmentId(item.appointmentId ?? '');
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
        appointmentId: activeAppointmentContextId || recordAppointmentId || undefined,
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
      await loadRecords(recordsPage, search, petFilterId, professionalFilterId, activeAppointmentContextId);
      await loadClinicalTimeline(activeAppointmentContextId ? '' : petFilterId, activeAppointmentContextId);
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
        appointmentId: activeAppointmentContextId || vaccinationAppointmentId || undefined,
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
      await loadVaccinations(vaccinationsPage, search, petFilterId, activeAppointmentContextId);
      await loadClinicalTimeline(activeAppointmentContextId ? '' : petFilterId, activeAppointmentContextId);
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
        appointmentId: activeAppointmentContextId || prescriptionAppointmentId || undefined,
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
      await loadPrescriptions(
        prescriptionsPage,
        search,
        petFilterId,
        professionalFilterId,
        activeAppointmentContextId
      );
      await loadClinicalTimeline(activeAppointmentContextId ? '' : petFilterId, activeAppointmentContextId);
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
      await loadRecords(recordsPage, search, petFilterId, professionalFilterId, activeAppointmentContextId);
      await loadClinicalTimeline(activeAppointmentContextId ? '' : petFilterId, activeAppointmentContextId);
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
      await loadVaccinations(vaccinationsPage, search, petFilterId, activeAppointmentContextId);
      await loadClinicalTimeline(activeAppointmentContextId ? '' : petFilterId, activeAppointmentContextId);
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
      await loadPrescriptions(
        prescriptionsPage,
        search,
        petFilterId,
        professionalFilterId,
        activeAppointmentContextId
      );
      await loadClinicalTimeline(activeAppointmentContextId ? '' : petFilterId, activeAppointmentContextId);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir prescrição.');
    }
  }

  const petLookupUnavailable = lookupIssues.some((issue) => issue.key === 'pets');
  const professionalsLookupUnavailable = lookupIssues.some((issue) => issue.key === 'professionals');
  const medicalRecordFormReady = appointmentContext ? true : !petLookupUnavailable && !professionalsLookupUnavailable;
  const vaccinationFormReady = appointmentContext ? true : !petLookupUnavailable;
  const prescriptionFormReady = appointmentContext ? true : !petLookupUnavailable && !professionalsLookupUnavailable;
  const clinicalTimelineReady = Boolean(activeAppointmentContextId || petFilterId);
  const appointmentContextDescription = appointmentContext
    ? `Fluxo vinculado ao atendimento ${appointmentContext.serviceName} de ${appointmentContext.petName ?? appointmentContext.petId} com ${appointmentContext.professionalName ?? appointmentContext.professionalId}.`
    : null;

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
            setPetFilterId(appointmentContext?.petId ?? '');
            setProfessionalFilterId(appointmentContext?.professionalId ?? '');
          }}
        />

        {appointmentContextLoading ? (
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            Carregando contexto clínico do atendimento selecionado...
          </div>
        ) : null}

        {appointmentContext ? (
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            <div className="font-medium">Atendimento em contexto clínico ativo.</div>
            <div>
              {appointmentContext.serviceName} para {appointmentContext.petName ?? appointmentContext.petId}
              {appointmentContext.clientName ? ` (${appointmentContext.clientName})` : ''}
              {' '}com {appointmentContext.professionalName ?? appointmentContext.professionalId} em{' '}
              {new Date(appointmentContext.scheduledAt).toLocaleString('pt-BR')}.
            </div>
            <Link href="/pet/medical-records" className="mt-2 inline-flex text-sm font-medium text-action">
              Ver histórico completo
            </Link>
          </div>
        ) : null}

        {appointmentContextError ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {appointmentContextError}
          </div>
        ) : null}

        <PetLookupFeedback issues={lookupIssues} />

        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

        {canReadMedicalRecords ? (
          <PetClinicalTimelineSection
            data={clinicalTimeline}
            loading={clinicalTimelineLoading}
            error={clinicalTimelineError}
            ready={clinicalTimelineReady}
          />
        ) : null}

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
            lockPetSelection={Boolean(appointmentContext)}
            lockProfessionalSelection={Boolean(appointmentContext)}
            appointmentContextDescription={appointmentContextDescription}
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
            lockPetSelection={Boolean(appointmentContext)}
            appointmentContextDescription={appointmentContextDescription}
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
            lockPetSelection={Boolean(appointmentContext)}
            lockProfessionalSelection={Boolean(appointmentContext)}
            appointmentContextDescription={appointmentContextDescription}
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
