'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  PetAppointmentForm,
  PetAppointmentsFilters,
  createPetAppointmentColumns
} from '@/modules/pet/pet-appointments-sections';
import { PetAppointmentsCalendar } from '@/modules/pet/pet-appointments-calendar';
import { toDateTimeLocal, toIsoDate } from '@/modules/pet/pet-date-time';
import {
  PetLookupFeedback,
  PetLookupIssue,
  resolvePetLookupIssue
} from '@/modules/pet/pet-lookup-feedback';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import {
  PetAppointment,
  PetClient,
  PetProfessional,
  PetProfile,
  PetServiceCatalog
} from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable } from '@/shared/ui/data-table';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';

const pageSize = 10;

const initialPage: PageResponse<PetAppointment> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

export function PetAppointmentsPage() {
  const { hasPermission } = usePermissions();
  const [pageData, setPageData] = useState<PageResponse<PetAppointment>>(initialPage);
  const [calendarData, setCalendarData] = useState<PetAppointment[]>([]);
  
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [clients, setClients] = useState<PetClient[]>([]);
  const [profiles, setProfiles] = useState<PetProfile[]>([]);
  const [services, setServices] = useState<PetServiceCatalog[]>([]);
  const [professionals, setProfessionals] = useState<PetProfessional[]>([]);
  const [lookupIssues, setLookupIssues] = useState<PetLookupIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilterId, setClientFilterId] = useState('');
  const [petFilterId, setPetFilterId] = useState('');
  const [serviceFilterId, setServiceFilterId] = useState('');
  const [professionalFilterId, setProfessionalFilterId] = useState('');

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientId, setClientId] = useState('');
  const [petId, setPetId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [status, setStatus] = useState('SCHEDULED');
  const [notes, setNotes] = useState('');
  const [extrasAmount, setExtrasAmount] = useState('');
  const [extrasDescription, setExtrasDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetAppointment | null>(null);

  const canReadClients = hasPermission('pet.client.read');
  const canReadProfiles = hasPermission('pet.profile.read');
  const canReadServices = hasPermission('pet.service.read');
  const canReadProfessionals = hasPermission('pet.professional.read');
  const canCreateAppointments = hasPermission('pet.appointment.create');

  const clientOptions = useMemo(() => {
    return [
      { value: '', label: 'All' },
      ...clients.map((client) => ({
        value: client.id,
        label: client.name ?? client.fullName ?? client.id
      }))
    ];
  }, [clients]);

  const formClientOptions = useMemo(() => {
    return [
      { value: '', label: 'Select a client' },
      ...clients.map((client) => ({
        value: client.id,
        label: client.name ?? client.fullName ?? client.id
      }))
    ];
  }, [clients]);

  const filteredProfiles = useMemo(() => {
    if (!clientId) return profiles;
    return profiles.filter((profile) => profile.clientId === clientId);
  }, [clientId, profiles]);

  const petOptions = useMemo(() => {
    return [
      { value: '', label: 'All' },
      ...profiles.map((profile) => ({ value: profile.id, label: profile.name }))
    ];
  }, [profiles]);

  const serviceOptions = useMemo(() => {
    return [
      { value: '', label: 'All' },
      ...services.map((service) => ({ value: service.id, label: service.name }))
    ];
  }, [services]);

  const professionalOptions = useMemo(() => {
    return [
      { value: '', label: 'All' },
      ...professionals.map((professional) => ({ value: professional.id, label: professional.name }))
    ];
  }, [professionals]);

  const formPetOptions = useMemo(() => {
    return [
      { value: '', label: 'Select a pet' },
      ...filteredProfiles.map((profile) => ({ value: profile.id, label: profile.name }))
    ];
  }, [filteredProfiles]);

  const formServiceOptions = useMemo(() => {
    return [
      { value: '', label: 'Select a service' },
      ...services.map((service) => ({ value: service.id, label: service.name }))
    ];
  }, [services]);

  const formProfessionalOptions = useMemo(() => {
    return [
      { value: '', label: 'Select a professional' },
      ...professionals.map((professional) => ({ value: professional.id, label: professional.name }))
    ];
  }, [professionals]);

  const loadReferences = useCallback(async () => {
    const [clientPage, profilePage, servicePage, professionalPage] = await Promise.allSettled([
      canReadClients ? petService.listClients(0, 200, '') : Promise.resolve(null),
      canReadProfiles ? petService.listProfiles(0, 200, '') : Promise.resolve(null),
      canReadServices ? petService.listServices(0, 200, '') : Promise.resolve(null),
      canReadProfessionals ? petService.listProfessionals(0, 200, '') : Promise.resolve(null)
    ]);

    const issues: PetLookupIssue[] = [];

    if (!canReadClients) {
      setClients([]);
      issues.push({ key: 'clients', label: 'Clientes', message: resolvePetLookupIssue(null, 'pet.client.read') });
    } else if (clientPage.status === 'fulfilled' && clientPage.value) {
      setClients(resolvePageItems(clientPage.value));
    } else {
      setClients([]);
      issues.push({ key: 'clients', label: 'Clientes', message: resolvePetLookupIssue(clientPage.status === 'rejected' ? clientPage.reason : null) });
    }

    if (!canReadProfiles) {
      setProfiles([]);
      issues.push({ key: 'profiles', label: 'Pets', message: resolvePetLookupIssue(null, 'pet.profile.read') });
    } else if (profilePage.status === 'fulfilled' && profilePage.value) {
      setProfiles(resolvePageItems(profilePage.value));
    } else {
      setProfiles([]);
      issues.push({ key: 'profiles', label: 'Pets', message: resolvePetLookupIssue(profilePage.status === 'rejected' ? profilePage.reason : null) });
    }

    if (!canReadServices) {
      setServices([]);
      issues.push({ key: 'services', label: 'Serviços', message: resolvePetLookupIssue(null, 'pet.service.read') });
    } else if (servicePage.status === 'fulfilled' && servicePage.value) {
      setServices(resolvePageItems(servicePage.value));
    } else {
      setServices([]);
      issues.push({ key: 'services', label: 'Serviços', message: resolvePetLookupIssue(servicePage.status === 'rejected' ? servicePage.reason : null) });
    }

    if (!canReadProfessionals) {
      setProfessionals([]);
      issues.push({ key: 'professionals', label: 'Profissionais', message: resolvePetLookupIssue(null, 'pet.professional.read') });
    } else if (professionalPage.status === 'fulfilled' && professionalPage.value) {
      setProfessionals(resolvePageItems(professionalPage.value));
    } else {
      setProfessionals([]);
      issues.push({ key: 'professionals', label: 'Profissionais', message: resolvePetLookupIssue(professionalPage.status === 'rejected' ? professionalPage.reason : null) });
    }

    setLookupIssues(issues);
  }, [canReadClients, canReadProfessionals, canReadProfiles, canReadServices]);

  const loadData = useCallback(async (
    page: number,
    currentSearch: string,
    currentStatus: string,
    currentClientId: string,
    currentPetId: string,
    currentServiceId: string,
    currentProfessionalId: string,
    mode: 'list' | 'calendar',
    monthVal: Date
  ) => {
    setLoading(true);
    setError(null);

    try {
      const isCalendar = mode === 'calendar';
      
      let scheduledFrom: string | undefined = undefined;
      let scheduledTo: string | undefined = undefined;
      
      if (isCalendar) {
        // Fetch entire month for calendar
        const start = new Date(monthVal.getFullYear(), monthVal.getMonth(), 1);
        const end = new Date(monthVal.getFullYear(), monthVal.getMonth() + 1, 0, 23, 59, 59);
        scheduledFrom = start.toISOString();
        scheduledTo = end.toISOString();
      }

      const result = await petService.listAppointments(isCalendar ? 0 : page, isCalendar ? 100 : pageSize, currentSearch, {
        status: currentStatus || undefined,
        clientId: currentClientId || undefined,
        petId: currentPetId || undefined,
        serviceId: currentServiceId || undefined,
        professionalId: currentProfessionalId || undefined,
        scheduledFrom,
        scheduledTo
      });
      
      if (isCalendar) {
        setCalendarData(resolvePageItems(result));
      } else {
        setPageData(result);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to load appointments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    loadData(0, search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId, viewMode, currentMonth);
  }, [clientFilterId, loadData, petFilterId, professionalFilterId, search, serviceFilterId, statusFilter, viewMode, currentMonth]);

  function resetForm() {
    setEditingId(null);
    setClientId('');
    setPetId('');
    setServiceId('');
    setProfessionalId('');
    setScheduledAt('');
    setStatus('SCHEDULED');
    setNotes('');
    setExtrasAmount('');
    setExtrasDescription('');
  }

  function beginCreate(presetDate?: Date) {
    resetForm();
    if (presetDate) {
      // Add timezone offset to match local time in datetime-local
      setScheduledAt(toDateTimeLocal(presetDate.toISOString()));
    }
    setIsEditorOpen(true);
  }

  function beginEdit(appointment: PetAppointment) {
    setEditingId(appointment.id);
    setClientId(appointment.clientId);
    setPetId(appointment.petId);
    setServiceId(appointment.serviceId);
    setProfessionalId(appointment.professionalId);
    setScheduledAt(toDateTimeLocal(appointment.scheduledAt));
    setStatus(appointment.status);
    setNotes(appointment.notes ?? '');
    setExtrasAmount(appointment.extrasAmount != null ? String(appointment.extrasAmount) : '');
    setExtrasDescription(appointment.extrasDescription ?? '');
    setSuccess(null);
    setError(null);
    setIsEditorOpen(true);
  }

  function onCalendarEventClick(e: React.MouseEvent, apt: PetAppointment) {
    e.stopPropagation();
    beginEdit(apt);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clientId || !petId || !serviceId || !professionalId) {
      setError('Select client, pet, service, and professional to book the appointment.');
      return;
    }

    const isoScheduledAt = toIsoDate(scheduledAt);
    if (!isoScheduledAt) {
      setError('Please provide the appointment date and time.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const parsedExtrasAmount = extrasAmount ? parseFloat(extrasAmount) : undefined;
    const payload = {
      clientId,
      petId,
      serviceId,
      professionalId,
      scheduledAt: isoScheduledAt,
      status,
      notes: notes || undefined,
      extrasAmount: parsedExtrasAmount,
      extrasDescription: extrasDescription || undefined
    };

    try {
      if (editingId) {
        await petService.updateAppointment(editingId, payload);
        setSuccess('Appointment updated.');
      } else {
        await petService.createAppointment(payload);
        setSuccess('Appointment booked.');
      }

      setIsEditorOpen(false);
      await loadData(pageData.page, search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId, viewMode, currentMonth);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to save appointment.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) return;

    try {
      await petService.deleteAppointment(deleteCandidate.id);
      setDeleteCandidate(null);
      setIsEditorOpen(false); // Close drawer if deleting from inside
      setSuccess('Appointment removed.');
      await loadData(pageData.page, search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId, viewMode, currentMonth);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Unable to delete appointment.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const clientsLookupUnavailable = lookupIssues.some((issue) => issue.key === 'clients');
  const profilesLookupUnavailable = lookupIssues.some((issue) => issue.key === 'profiles');
  const servicesLookupUnavailable = lookupIssues.some((issue) => issue.key === 'services');
  const professionalsLookupUnavailable = lookupIssues.some((issue) => issue.key === 'professionals');
  const appointmentReferencesReady = !clientsLookupUnavailable && !profilesLookupUnavailable && !servicesLookupUnavailable && !professionalsLookupUnavailable;

  const columns = useMemo(() => createPetAppointmentColumns({
    clients,
    professionals,
    profiles,
    clientsLookupUnavailable,
    professionalsLookupUnavailable,
    profilesLookupUnavailable,
    onEdit: beginEdit,
    onDelete: setDeleteCandidate
  }), [
    clients,
    clientsLookupUnavailable,
    professionals,
    professionalsLookupUnavailable,
    profiles,
    profilesLookupUnavailable
  ]);

  return (
    <PermissionGuard
      permission="pet.appointment.read"
      fallback={<div className="ui-notice-warning">You do not have permission to view appointments.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle 
           title="Appointment Schedule" 
           description="Book visits, assign services, and create the operating story that later surfaces in billing and insights." 
           actions={
             <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                  className="ui-secondary-button"
                >
                  View: {viewMode === 'calendar' ? 'Calendar' : 'List'}
                </button>
                <PermissionGuard permission="pet.appointment.create">
                  <button type="button" onClick={() => beginCreate()} className="ui-primary-button">
                    Book appointment
                  </button>
                </PermissionGuard>
             </div>
           }
        />

        <PetAppointmentsFilters
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          clientFilterId={clientFilterId}
          onClientFilterIdChange={setClientFilterId}
          clientOptions={clientOptions}
          clientsLookupUnavailable={clientsLookupUnavailable}
          petFilterId={petFilterId}
          onPetFilterIdChange={setPetFilterId}
          petOptions={petOptions}
          profilesLookupUnavailable={profilesLookupUnavailable}
          serviceFilterId={serviceFilterId}
          onServiceFilterIdChange={setServiceFilterId}
          serviceOptions={serviceOptions}
          servicesLookupUnavailable={servicesLookupUnavailable}
          professionalFilterId={professionalFilterId}
          onProfessionalFilterIdChange={setProfessionalFilterId}
          professionalOptions={professionalOptions}
          professionalsLookupUnavailable={professionalsLookupUnavailable}
          onSearch={() => setSearch(searchInput)}
          onClear={() => {
            setSearchInput('');
            setSearch('');
            setStatusFilter('');
            setClientFilterId('');
            setPetFilterId('');
            setServiceFilterId('');
            setProfessionalFilterId('');
          }}
        />

        <PetLookupFeedback issues={lookupIssues} />

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        {viewMode === 'calendar' ? (
          <PetAppointmentsCalendar
            appointments={calendarData}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onDateClick={(d) => beginCreate(d)}
            onEventClick={onCalendarEventClick}
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              loading={loading}
              loadingTitle="Loading appointments"
              loadingDescription="Preparing the appointment schedule with client, pet, and professional context."
              emptyState={{
                title: 'No appointments yet',
                description: 'Book the first appointment after clients, pet profiles, services, and professionals are ready.',
                action: canCreateAppointments ? (
                  <button type="button" onClick={() => beginCreate()} className="ui-primary-button">
                    Book first appointment
                  </button>
                ) : undefined
              }}
            />

            <Pagination
              page={pageData.page}
              totalPages={pageData.totalPages}
              totalElements={totalItems}
              onPageChange={(nextPage) =>
                loadData(nextPage, search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId, viewMode, currentMonth)
              }
            />
          </>
        )}

        {/* SIDE DRAWER FOR APPOINTMENT */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-lg h-full overflow-y-auto ui-surface-panel p-6 shadow-2xl animate-in slide-in-from-right duration-300 border-l border-border relative">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    {editingId ? 'Edit appointment' : 'Book appointment'}
                  </h2>
                  <p className="text-sm mt-1 text-muted">
                    Connect client, pet, service, and professional in one operational step.
                  </p>
                </div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-full p-2 text-muted hover:bg-surface-inset hover:text-foreground transition-colors duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-6 pb-20">
                <PetAppointmentForm
                  editingId={editingId}
                  onSubmit={handleSubmit}
                  clientId={clientId}
                  onClientIdChange={setClientId}
                  formClientOptions={formClientOptions}
                  clientsLookupUnavailable={clientsLookupUnavailable}
                  petId={petId}
                  onPetIdChange={setPetId}
                  formPetOptions={formPetOptions}
                  profilesLookupUnavailable={profilesLookupUnavailable}
                  serviceId={serviceId}
                  onServiceIdChange={setServiceId}
                  formServiceOptions={formServiceOptions}
                  servicesLookupUnavailable={servicesLookupUnavailable}
                  professionalId={professionalId}
                  onProfessionalIdChange={setProfessionalId}
                  formProfessionalOptions={formProfessionalOptions}
                  professionalsLookupUnavailable={professionalsLookupUnavailable}
                  scheduledAt={scheduledAt}
                  onScheduledAtChange={setScheduledAt}
                  status={status}
                  onStatusChange={setStatus}
                  notes={notes}
                  onNotesChange={setNotes}
                  extrasAmount={extrasAmount}
                  onExtrasAmountChange={setExtrasAmount}
                  extrasDescription={extrasDescription}
                  onExtrasDescriptionChange={setExtrasDescription}
                  submitting={submitting}
                  appointmentReferencesReady={appointmentReferencesReady}
                  onCancelEdit={() => setIsEditorOpen(false)}
                />
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Remove appointment?"
          description={deleteCandidate ? `The appointment for "${deleteCandidate.serviceName}" will be removed.` : undefined}
          confirmLabel="Remove"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
