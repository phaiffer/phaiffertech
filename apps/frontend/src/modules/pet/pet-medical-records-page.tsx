'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ClinicTabs } from '@/modules/pet/clinic-shared';
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
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatDateTimeForLocale } from '@/shared/i18n/formatters';
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
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';

const pageSize = 14;

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

function tabClass(active: boolean) {
  return `rounded-md px-2.5 py-1 text-sm ${
    active ? 'bg-[var(--selected)] font-medium text-[var(--ink)]' : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
  }`;
}

export function PetMedicalRecordsPage() {
  const searchParams = useSearchParams();
  const { locale } = useAppI18n();
  const copy = useAppMessages().screens.petMedical;
  const { hasAnyPermission, hasPermission } = usePermissions();
  const appointmentContextId = searchParams.get('appointmentId');
  const requestedNewRecord = searchParams.get('tab') === 'records'
    && searchParams.get('novo') === '1'
    && hasPermission('pet.medical-record.create');
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [professionals, setProfessionals] = useState<PetProfessional[]>([]);
  const [lookupIssues, setLookupIssues] = useState<PetLookupIssue[]>([]);
  const [appointmentContext, setAppointmentContext] = useState<PetAppointment | null>(null);
  const [appointmentContextLoading, setAppointmentContextLoading] = useState(false);
  const [appointmentContextError, setAppointmentContextError] = useState<string | null>(null);
  const [clinicalTimeline, setClinicalTimeline] = useState<PetClinicalTimeline | null>(null);

  const [activeTab, setActiveTab] = useState<'timeline' | 'records' | 'vaccinations' | 'prescriptions'>(() => {
    if (requestedNewRecord) return 'records';
    if (hasPermission('pet.medical-record.read')) return 'timeline';
    if (hasAnyPermission(petMedicalRecordPermissions)) return 'records';
    if (hasAnyPermission(petVaccinationPermissions)) return 'vaccinations';
    if (hasAnyPermission(petPrescriptionPermissions)) return 'prescriptions';
    return 'timeline';
  });
  const [clinicalTimelineLoading, setClinicalTimelineLoading] = useState(false);
  const [clinicalTimelineError, setClinicalTimelineError] = useState<string | null>(null);

  const [recordsPageData, setRecordsPageData] = useState<PageResponse<PetMedicalRecord>>(emptyMedicalRecordsPage);
  const [vaccinationsPageData, setVaccinationsPageData] = useState<PageResponse<PetVaccination>>(emptyVaccinationsPage);
  const [prescriptionsPageData, setPrescriptionsPageData] = useState<PageResponse<PetPrescription>>(emptyPrescriptionsPage);

  const [recordsLoading, setRecordsLoading] = useState(false);
  const [vaccinationsLoading, setVaccinationsLoading] = useState(false);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  // One entry per list, so a list that reloads fine stops showing its own failure.
  const [listErrors, setListErrors] = useState<Partial<Record<'records' | 'vaccinations' | 'prescriptions', string>>>({});
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [petFilterId, setPetFilterId] = useState('');
  const [professionalFilterId, setProfessionalFilterId] = useState('');

  const [recordsPage, setRecordsPage] = useState(0);
  const [vaccinationsPage, setVaccinationsPage] = useState(0);
  const [prescriptionsPage, setPrescriptionsPage] = useState(0);

  const [recordEditorOpen, setRecordEditorOpen] = useState(requestedNewRecord);
  const [vaccinationEditorOpen, setVaccinationEditorOpen] = useState(false);
  const [prescriptionEditorOpen, setPrescriptionEditorOpen] = useState(false);

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
      { value: '', label: copy.all },
      ...options
    ];
  }, [appointmentContext, copy.all, pets]);

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
      { value: '', label: copy.all },
      ...options
    ];
  }, [appointmentContext, copy.all, professionals]);

  const formPetOptions = useMemo(() => {
    return [{ value: '', label: copy.selectPet }, ...petOptions.filter((item) => item.value)];
  }, [copy.selectPet, petOptions]);

  const formProfessionalOptions = useMemo(() => {
    return [{ value: '', label: copy.selectProfessional }, ...professionalOptions.filter((item) => item.value)];
  }, [copy.selectProfessional, professionalOptions]);

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
      setAppointmentContextError(resolveApiErrorMessage(err, copy.contextLoadError));
    } finally {
      setAppointmentContextLoading(false);
    }
  }, [appointmentContextId, canReadAppointments, copy.contextLoadError]);

  const loadReferences = useCallback(async () => {
    const [petsPage, professionalsPage] = await Promise.allSettled([
      canReadPets && canAccessAnyMedical ? petService.listProfiles(0, 200, '') : Promise.resolve(null),
      canReadProfessionals && needsProfessionalLookup ? petService.listProfessionals(0, 200, '') : Promise.resolve(null)
    ]);

    const issues: PetLookupIssue[] = [];

    if (!canReadPets && canAccessAnyMedical) {
      setPets([]);
      issues.push({ key: 'pets', label: copy.lookupPets, message: resolvePetLookupIssue(null, 'pet.profile.read') });
    } else if (petsPage.status === 'fulfilled' && petsPage.value) {
      setPets(resolvePageItems(petsPage.value));
    } else if (canAccessAnyMedical) {
      setPets([]);
      issues.push({
        key: 'pets',
        label: copy.lookupPets,
        message: resolvePetLookupIssue(petsPage.status === 'rejected' ? petsPage.reason : null)
      });
    } else {
      setPets([]);
    }

    if (!canReadProfessionals && needsProfessionalLookup) {
      setProfessionals([]);
      issues.push({
        key: 'professionals',
        label: copy.lookupProfessionals,
        message: resolvePetLookupIssue(null, 'pet.professional.read')
      });
    } else if (professionalsPage.status === 'fulfilled' && professionalsPage.value) {
      setProfessionals(resolvePageItems(professionalsPage.value));
    } else if (needsProfessionalLookup) {
      setProfessionals([]);
      issues.push({
        key: 'professionals',
        label: copy.lookupProfessionals,
        message: resolvePetLookupIssue(professionalsPage.status === 'rejected' ? professionalsPage.reason : null)
      });
    } else {
      setProfessionals([]);
    }

    setLookupIssues(issues);
  }, [canAccessAnyMedical, canReadPets, canReadProfessionals, copy.lookupPets, copy.lookupProfessionals, needsProfessionalLookup]);

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
      setClinicalTimelineError(resolveApiErrorMessage(err, copy.timelineLoadError));
    } finally {
      setClinicalTimelineLoading(false);
    }
  }, [canReadMedicalRecords, copy.timelineLoadError]);

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
      setListErrors((current) => ({ ...current, records: undefined }));
    } catch (err) {
      setListErrors((current) => ({ ...current, records: resolveApiErrorMessage(err, copy.recordsLoadError) }));
    } finally {
      setRecordsLoading(false);
    }
  }, [canReadMedicalRecords, copy.recordsLoadError]);

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
      setListErrors((current) => ({ ...current, vaccinations: undefined }));
    } catch (err) {
      setListErrors((current) => ({ ...current, vaccinations: resolveApiErrorMessage(err, copy.vaccinationsLoadError) }));
    } finally {
      setVaccinationsLoading(false);
    }
  }, [canReadVaccinations, copy.vaccinationsLoadError]);

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
      setListErrors((current) => ({ ...current, prescriptions: undefined }));
    } catch (err) {
      setListErrors((current) => ({ ...current, prescriptions: resolveApiErrorMessage(err, copy.prescriptionsLoadError) }));
    } finally {
      setPrescriptionsLoading(false);
    }
  }, [canReadPrescriptions, copy.prescriptionsLoadError]);

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
    setRecordEditorOpen(false);
    setEditingRecordId(null);
    setRecordAppointmentId(activeAppointmentContextId ?? '');
    setRecordPetId(appointmentContext?.petId ?? '');
    setRecordProfessionalId(appointmentContext?.professionalId ?? '');
    setRecordDescription('');
    setRecordDiagnosis('');
    setRecordTreatment('');
  }

  function resetVaccinationForm() {
    setVaccinationEditorOpen(false);
    setEditingVaccinationId(null);
    setVaccinationAppointmentId(activeAppointmentContextId ?? '');
    setVaccinationPetId(appointmentContext?.petId ?? '');
    setVaccineName('');
    setAppliedAt('');
    setNextDueAt('');
    setVaccinationNotes('');
  }

  function resetPrescriptionForm() {
    setPrescriptionEditorOpen(false);
    setEditingPrescriptionId(null);
    setPrescriptionAppointmentId(activeAppointmentContextId ?? '');
    setPrescriptionPetId(appointmentContext?.petId ?? '');
    setPrescriptionProfessionalId(appointmentContext?.professionalId ?? '');
    setMedication('');
    setDosage('');
    setInstructions('');
  }

  function beginEditRecord(item: PetMedicalRecord) {
    setRecordEditorOpen(true);
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
    setVaccinationEditorOpen(true);
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
    setPrescriptionEditorOpen(true);
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
      setError(copy.recordRequired);
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
        setSuccess(copy.recordUpdated);
      } else {
        await petService.createMedicalRecord(payload);
        setSuccess(copy.recordCreated);
      }

      resetRecordForm();
      await loadRecords(recordsPage, search, petFilterId, professionalFilterId, activeAppointmentContextId);
      await loadClinicalTimeline(activeAppointmentContextId ? '' : petFilterId, activeAppointmentContextId);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.recordSaveError));
    } finally {
      setRecordSubmitting(false);
    }
  }

  async function handleSubmitVaccination(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isoAppliedAt = toIsoDate(appliedAt);
    const isoNextDueAt = toIsoDate(nextDueAt);
    if (!vaccinationPetId || !isoAppliedAt) {
      setError(copy.vaccinationRequired);
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
        setSuccess(copy.vaccinationUpdated);
      } else {
        await petService.createVaccination(payload);
        setSuccess(copy.vaccinationCreated);
      }

      resetVaccinationForm();
      await loadVaccinations(vaccinationsPage, search, petFilterId, activeAppointmentContextId);
      await loadClinicalTimeline(activeAppointmentContextId ? '' : petFilterId, activeAppointmentContextId);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.vaccinationSaveError));
    } finally {
      setVaccinationSubmitting(false);
    }
  }

  async function handleSubmitPrescription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prescriptionPetId || !prescriptionProfessionalId) {
      setError(copy.prescriptionRequired);
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
        setSuccess(copy.prescriptionUpdated);
      } else {
        await petService.createPrescription(payload);
        setSuccess(copy.prescriptionCreated);
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
      setError(resolveApiErrorMessage(err, copy.prescriptionSaveError));
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
      setSuccess(copy.recordDeleted);
      await loadRecords(recordsPage, search, petFilterId, professionalFilterId, activeAppointmentContextId);
      await loadClinicalTimeline(activeAppointmentContextId ? '' : petFilterId, activeAppointmentContextId);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.recordDeleteError));
    }
  }

  async function handleDeleteVaccination() {
    if (!deleteVaccinationCandidate) {
      return;
    }

    try {
      await petService.deleteVaccination(deleteVaccinationCandidate.id);
      setDeleteVaccinationCandidate(null);
      setSuccess(copy.vaccinationDeleted);
      await loadVaccinations(vaccinationsPage, search, petFilterId, activeAppointmentContextId);
      await loadClinicalTimeline(activeAppointmentContextId ? '' : petFilterId, activeAppointmentContextId);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.vaccinationDeleteError));
    }
  }

  async function handleDeletePrescription() {
    if (!deletePrescriptionCandidate) {
      return;
    }

    try {
      await petService.deletePrescription(deletePrescriptionCandidate.id);
      setDeletePrescriptionCandidate(null);
      setSuccess(copy.prescriptionDeleted);
      await loadPrescriptions(
        prescriptionsPage,
        search,
        petFilterId,
        professionalFilterId,
        activeAppointmentContextId
      );
      await loadClinicalTimeline(activeAppointmentContextId ? '' : petFilterId, activeAppointmentContextId);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.prescriptionDeleteError));
    }
  }

  const petLookupUnavailable = lookupIssues.some((issue) => issue.key === 'pets');
  const professionalsLookupUnavailable = lookupIssues.some((issue) => issue.key === 'professionals');
  const medicalRecordFormReady = appointmentContext ? true : !petLookupUnavailable && !professionalsLookupUnavailable;
  const vaccinationFormReady = appointmentContext ? true : !petLookupUnavailable;
  const prescriptionFormReady = appointmentContext ? true : !petLookupUnavailable && !professionalsLookupUnavailable;
  const clinicalTimelineReady = Boolean(activeAppointmentContextId || petFilterId);
  const appointmentContextDescription = appointmentContext
    ? copy.contextForm
        .replace('{service}', appointmentContext.serviceName)
        .replace('{pet}', appointmentContext.petName ?? appointmentContext.petId)
        .replace('{professional}', appointmentContext.professionalName ?? appointmentContext.professionalId)
    : null;

  const medicalRecordColumns = useMemo(() => createPetMedicalRecordColumns({
    copy,
    locale,
    pets,
    professionals,
    petLookupUnavailable,
    professionalsLookupUnavailable,
    onEdit: beginEditRecord,
    onDelete: setDeleteRecordCandidate
  }), [copy, locale, petLookupUnavailable, pets, professionals, professionalsLookupUnavailable]);

  const vaccinationColumns = useMemo(() => createPetVaccinationColumns({
    copy,
    locale,
    pets,
    petLookupUnavailable,
    onEdit: beginEditVaccination,
    onDelete: setDeleteVaccinationCandidate
  }), [copy, locale, petLookupUnavailable, pets]);

  const prescriptionColumns = useMemo(() => createPetPrescriptionColumns({
    copy,
    locale,
    pets,
    professionals,
    petLookupUnavailable,
    professionalsLookupUnavailable,
    onEdit: beginEditPrescription,
    onDelete: setDeletePrescriptionCandidate
  }), [copy, locale, petLookupUnavailable, pets, professionals, professionalsLookupUnavailable]);

  return (
    <PermissionGuard anyOf={petMedicalRoutePermissions} fallback={<PetMedicalPageFallback />}>
      <div className={sharedPageStackClass}>
        <PetModuleSubnav />
        <ClinicTabs />

        <PageTitle
          title={copy.title}
          description={copy.description}
          actions={appointmentContext ? (
            <Link href="/pet/medical-records" className="ui-secondary-button">
              {copy.viewFullHistory}
            </Link>
          ) : undefined}
        />

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

        {appointmentContextLoading ? <div className="ui-notice-info">{copy.contextLoading}</div> : null}

        {appointmentContext ? (
          <div className="ui-notice-info">
            <div className="font-medium">{copy.contextActive}</div>
            <div>
              {copy.contextDetail
                .replace('{service}', appointmentContext.serviceName)
                .replace('{pet}', appointmentContext.petName ?? appointmentContext.petId)
                .replace('{client}', appointmentContext.clientName ? ` (${appointmentContext.clientName})` : '')
                .replace('{professional}', appointmentContext.professionalName ?? appointmentContext.professionalId)
                .replace('{date}', formatDateTimeForLocale(locale, appointmentContext.scheduledAt))}
            </div>
          </div>
        ) : null}

        {appointmentContextError ? <div className="ui-notice-error">{appointmentContextError}</div> : null}

        <PetLookupFeedback issues={lookupIssues} />

        {Array.from(new Set(Object.values(listErrors).filter(Boolean))).map((message) => (
          <div key={message} className="ui-notice-error">{message}</div>
        ))}
        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <div role="group" aria-label={copy.tabsLabel} className="flex flex-wrap gap-1.5">
          {canReadMedicalRecords && (
            <button
              type="button"
              aria-pressed={activeTab === 'timeline'}
              onClick={() => setActiveTab('timeline')}
              className={tabClass(activeTab === 'timeline')}
            >
              {copy.tabHistory}
            </button>
          )}
          {canAccessMedicalRecords && (
            <button
              type="button"
              aria-pressed={activeTab === 'records'}
              onClick={() => setActiveTab('records')}
              className={tabClass(activeTab === 'records')}
            >
              {copy.tabRecords}
            </button>
          )}
          {canAccessVaccinations && (
            <button
              type="button"
              aria-pressed={activeTab === 'vaccinations'}
              onClick={() => setActiveTab('vaccinations')}
              className={tabClass(activeTab === 'vaccinations')}
            >
              {copy.tabVaccinations}
            </button>
          )}
          {canAccessPrescriptions && (
            <button
              type="button"
              aria-pressed={activeTab === 'prescriptions'}
              onClick={() => setActiveTab('prescriptions')}
              className={tabClass(activeTab === 'prescriptions')}
            >
              {copy.tabPrescriptions}
            </button>
          )}
        </div>

        {activeTab === 'timeline' && canReadMedicalRecords ? (
          <PetClinicalTimelineSection
            data={clinicalTimeline}
            loading={clinicalTimelineLoading}
            error={clinicalTimelineError}
            ready={clinicalTimelineReady}
          />
        ) : null}

        {activeTab === 'records' && canAccessMedicalRecords ? (
          <PetMedicalRecordSection
            editorOpen={recordEditorOpen}
            onNew={() => setRecordEditorOpen(true)}
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
            pageSize={pageSize}
            loading={recordsLoading}
            onPageChange={setRecordsPage}
          />
        ) : null}

        {activeTab === 'vaccinations' && canAccessVaccinations ? (
          <PetVaccinationSection
            editorOpen={vaccinationEditorOpen}
            onNew={() => setVaccinationEditorOpen(true)}
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
            pageSize={pageSize}
            loading={vaccinationsLoading}
            onPageChange={setVaccinationsPage}
          />
        ) : null}

        {activeTab === 'prescriptions' && canAccessPrescriptions ? (
          <PetPrescriptionSection
            editorOpen={prescriptionEditorOpen}
            onNew={() => setPrescriptionEditorOpen(true)}
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
            pageSize={pageSize}
            loading={prescriptionsLoading}
            onPageChange={setPrescriptionsPage}
          />
        ) : null}

        <ConfirmDialog
          open={deleteRecordCandidate !== null}
          title={copy.recordDeleteTitle}
          description={copy.recordDeleteDescription}
          onConfirm={handleDeleteRecord}
          onCancel={() => setDeleteRecordCandidate(null)}
        />

        <ConfirmDialog
          open={deleteVaccinationCandidate !== null}
          title={copy.vaccinationDeleteTitle}
          description={copy.vaccinationDeleteDescription}
          onConfirm={handleDeleteVaccination}
          onCancel={() => setDeleteVaccinationCandidate(null)}
        />

        <ConfirmDialog
          open={deletePrescriptionCandidate !== null}
          title={copy.prescriptionDeleteTitle}
          description={copy.prescriptionDeleteDescription}
          onConfirm={handleDeletePrescription}
          onCancel={() => setDeletePrescriptionCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
