'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatCurrencyForLocale } from '@/shared/i18n/formatters';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import {
  ClientPlan,
  PetAppointment,
  PetClient,
  PetProfessional,
  PetProfile,
  PetServiceCatalog
} from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable } from '@/shared/ui/data-table';
import { PageSection } from '@/shared/ui/page-section';
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

function hasPetTaxi(appointment: PetAppointment) {
  return /taxi/i.test(appointment.extrasDescription ?? '');
}

function hasPickupMessageCoverage(appointment: PetAppointment, clients: PetClient[]) {
  if (appointment.status.toUpperCase() !== 'COMPLETED') {
    return false;
  }

  const client = clients.find((entry) => entry.id === appointment.clientId);
  return Boolean(client?.email);
}

export function PetAppointmentsPage() {
  const { locale } = useAppI18n();
  const messages = useAppMessages().petAppointments;
  const commonButtons = useAppMessages().common.buttons;
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
  const [clientPlanId, setClientPlanId] = useState('');
  const [clientPlans, setClientPlans] = useState<ClientPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const lastPlanClientIdRef = useRef<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetAppointment | null>(null);

  const canReadClients = hasPermission('pet.client.read');
  const canReadProfiles = hasPermission('pet.profile.read');
  const canReadServices = hasPermission('pet.service.read');
  const canReadProfessionals = hasPermission('pet.professional.read');
  const canCreateAppointments = hasPermission('pet.appointment.create');

  const clientOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.all },
      ...clients.map((client) => ({
        value: client.id,
        label: client.name ?? client.fullName ?? client.id
      }))
    ];
  }, [clients, messages.formOptions.all]);

  const formClientOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.selectClient },
      ...clients.map((client) => ({
        value: client.id,
        label: client.name ?? client.fullName ?? client.id
      }))
    ];
  }, [clients, messages.formOptions.selectClient]);

  const filteredProfiles = useMemo(() => {
    if (!clientId) return profiles;
    return profiles.filter((profile) => profile.clientId === clientId);
  }, [clientId, profiles]);

  const petOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.all },
      ...profiles.map((profile) => ({ value: profile.id, label: profile.name }))
    ];
  }, [messages.formOptions.all, profiles]);

  const serviceOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.all },
      ...services.map((service) => ({ value: service.id, label: service.name }))
    ];
  }, [messages.formOptions.all, services]);

  const professionalOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.all },
      ...professionals.map((professional) => ({ value: professional.id, label: professional.name }))
    ];
  }, [messages.formOptions.all, professionals]);

  const formPetOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.selectPet },
      ...filteredProfiles.map((profile) => ({ value: profile.id, label: profile.name }))
    ];
  }, [filteredProfiles, messages.formOptions.selectPet]);

  const formServiceOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.selectService },
      ...services.map((service) => ({ value: service.id, label: service.name }))
    ];
  }, [messages.formOptions.selectService, services]);

  const formProfessionalOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.selectProfessional },
      ...professionals.map((professional) => ({ value: professional.id, label: professional.name }))
    ];
  }, [messages.formOptions.selectProfessional, professionals]);

  // Plan options loaded server-side by clientId when the form is open
  const planOptions = useMemo(() => {
    if (!clientId) {
      return [{ value: '', label: messages.formOptions.selectClientFirst }];
    }
    if (plansLoading) {
      return [{ value: '', label: messages.formOptions.loadingPlans }];
    }
    const active = clientPlans.filter((plan) => plan.remainingSessions > 0);
    return [
      { value: '', label: active.length > 0 ? messages.formOptions.oneTime : messages.formOptions.noActivePlan },
      ...active.map((plan) => ({
        value: plan.id,
        label: `${plan.planName} (${plan.remainingSessions} ${messages.formOptions.sessionsLeftSuffix})`
      }))
    ];
  }, [clientPlans, clientId, messages.formOptions, plansLoading]);

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
      issues.push({ key: 'clients', label: messages.notices.clients, message: resolvePetLookupIssue(null, 'pet.client.read') });
    } else if (clientPage.status === 'fulfilled' && clientPage.value) {
      setClients(resolvePageItems(clientPage.value));
    } else {
      setClients([]);
      issues.push({ key: 'clients', label: messages.notices.clients, message: resolvePetLookupIssue(clientPage.status === 'rejected' ? clientPage.reason : null) });
    }

    if (!canReadProfiles) {
      setProfiles([]);
      issues.push({ key: 'profiles', label: messages.notices.pets, message: resolvePetLookupIssue(null, 'pet.profile.read') });
    } else if (profilePage.status === 'fulfilled' && profilePage.value) {
      setProfiles(resolvePageItems(profilePage.value));
    } else {
      setProfiles([]);
      issues.push({ key: 'profiles', label: messages.notices.pets, message: resolvePetLookupIssue(profilePage.status === 'rejected' ? profilePage.reason : null) });
    }

    if (!canReadServices) {
      setServices([]);
      issues.push({ key: 'services', label: messages.notices.services, message: resolvePetLookupIssue(null, 'pet.service.read') });
    } else if (servicePage.status === 'fulfilled' && servicePage.value) {
      setServices(resolvePageItems(servicePage.value));
    } else {
      setServices([]);
      issues.push({ key: 'services', label: messages.notices.services, message: resolvePetLookupIssue(servicePage.status === 'rejected' ? servicePage.reason : null) });
    }

    if (!canReadProfessionals) {
      setProfessionals([]);
      issues.push({ key: 'professionals', label: messages.notices.professionals, message: resolvePetLookupIssue(null, 'pet.professional.read') });
    } else if (professionalPage.status === 'fulfilled' && professionalPage.value) {
      setProfessionals(resolvePageItems(professionalPage.value));
    } else {
      setProfessionals([]);
      issues.push({ key: 'professionals', label: messages.notices.professionals, message: resolvePetLookupIssue(professionalPage.status === 'rejected' ? professionalPage.reason : null) });
    }

    setLookupIssues(issues);
  }, [canReadClients, canReadProfessionals, canReadProfiles, canReadServices, messages.notices]);

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
      setError(err instanceof ApiClientError ? err.message : messages.errors.load);
    } finally {
      setLoading(false);
    }
  }, [messages.errors.load]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  // Load plans for the selected client on-demand when the appointment form is open
  useEffect(() => {
    if (!isEditorOpen || !clientId) {
      setClientPlans([]);
      lastPlanClientIdRef.current = null;
      return;
    }
    if (lastPlanClientIdRef.current === clientId) return;
    lastPlanClientIdRef.current = clientId;
    setPlansLoading(true);
    petService.listClientPlans(clientId, 0, 100).then((result) => {
      setClientPlans(resolvePageItems(result));
    }).catch(() => {
      setClientPlans([]);
    }).finally(() => {
      setPlansLoading(false);
    });
  }, [clientId, isEditorOpen]);

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
    setClientPlanId('');
    setClientPlans([]);
    lastPlanClientIdRef.current = null;
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
    setClientPlanId(appointment.clientPlanId ?? '');
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
      setError(messages.errors.missingReferences);
      return;
    }

    const isoScheduledAt = toIsoDate(scheduledAt);
    if (!isoScheduledAt) {
      setError(messages.errors.missingDate);
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
      clientPlanId: clientPlanId || undefined,
      extrasAmount: parsedExtrasAmount,
      extrasDescription: extrasDescription || undefined
    };

    try {
      if (editingId) {
        await petService.updateAppointment(editingId, payload);
        setSuccess(messages.success.updated);
      } else {
        await petService.createAppointment(payload);
        setSuccess(messages.success.created);
      }

      setIsEditorOpen(false);
      await loadData(pageData.page, search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId, viewMode, currentMonth);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.errors.save);
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
      setSuccess(messages.success.deleted);
      await loadData(pageData.page, search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId, viewMode, currentMonth);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.errors.delete);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const activeFilterCount = [search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId].filter(Boolean).length;
  const clientsLookupUnavailable = lookupIssues.some((issue) => issue.key === 'clients');
  const profilesLookupUnavailable = lookupIssues.some((issue) => issue.key === 'profiles');
  const servicesLookupUnavailable = lookupIssues.some((issue) => issue.key === 'services');
  const professionalsLookupUnavailable = lookupIssues.some((issue) => issue.key === 'professionals');
  const appointmentReferencesReady = !clientsLookupUnavailable && !profilesLookupUnavailable && !servicesLookupUnavailable && !professionalsLookupUnavailable;
  const visibleAppointments = viewMode === 'calendar' ? calendarData : rows;
  const recurringAppointments = visibleAppointments.filter((appointment) => Boolean(appointment.clientPlanId)).length;
  const oneTimeAppointments = visibleAppointments.filter((appointment) => !appointment.clientPlanId).length;
  const readyForPickup = visibleAppointments.filter((appointment) => appointment.status.toUpperCase() === 'COMPLETED').length;
  const pickupMessagesReady = visibleAppointments.filter((appointment) => hasPickupMessageCoverage(appointment, clients)).length;
  const lowPlanAlerts = visibleAppointments.filter((appointment) => Boolean(appointment.clientPlanId) && (appointment.planRemainingSessions ?? 99) <= 2).length;
  const petTaxiAppointments = visibleAppointments.filter((appointment) => hasPetTaxi(appointment)).length;
  const visibleCommissionTotal = visibleAppointments.reduce((total, appointment) => total + (appointment.commissionAmount ?? 0), 0);

  const columns = useMemo(() => createPetAppointmentColumns({
    locale,
    messages,
    commonButtons,
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
    commonButtons,
    locale,
    messages,
    professionals,
    professionalsLookupUnavailable,
    profiles,
    profilesLookupUnavailable
  ]);

  return (
    <PermissionGuard
      permission="pet.appointment.read"
      fallback={<div className="ui-notice-warning">{messages.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PetModuleSubnav />

        <PageTitle 
           title={messages.title}
           description={messages.description}
           actions={
             <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                  className="ui-secondary-button"
                >
                  {viewMode === 'calendar' ? messages.actions.switchToList : messages.actions.switchToCalendar}
                </button>
                <PermissionGuard permission="pet.appointment.create">
                  <button type="button" onClick={() => beginCreate()} className="ui-primary-button">
                    {messages.actions.book}
                  </button>
                </PermissionGuard>
             </div>
           }
        />

        <PageSection
          tone="muted"
          title={messages.filters.title}
          description={messages.filters.description}
        >
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
            activeFilterCount={activeFilterCount}
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
        </PageSection>

        <PetLookupFeedback issues={lookupIssues} />

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <PageSection
          tone="muted"
          title={messages.focus.title}
          description={messages.focus.description}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">{messages.focus.recurring}</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{recurringAppointments}</p>
              <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">{messages.focus.recurringDetail}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">{messages.focus.oneTime}</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{oneTimeAppointments}</p>
              <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">{messages.focus.oneTimeDetail}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">{messages.focus.ready}</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{readyForPickup}</p>
              <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">{pickupMessagesReady} {messages.focus.readyDetailSuffix}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">{messages.focus.planAlerts}</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{lowPlanAlerts}</p>
              <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">{messages.focus.planAlertsDetail}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">{messages.focus.petTaxi}</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{petTaxiAppointments}</p>
              <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">{messages.focus.petTaxiDetail}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">{messages.focus.commission}</p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">
                {formatCurrencyForLocale(locale, visibleCommissionTotal)}
              </p>
              <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">{messages.focus.commissionDetail}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[color:var(--app-shell-muted)]">
            {messages.focus.pickupRule}
          </p>
        </PageSection>

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
              loadingTitle={messages.table.loadingTitle}
              loadingDescription={messages.table.loadingDescription}
              emptyState={{
                title: messages.table.emptyTitle,
                description: messages.table.emptyDescription,
                action: canCreateAppointments ? (
                  <button type="button" onClick={() => beginCreate()} className="ui-primary-button">
                    {messages.table.firstAppointment}
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
                    {editingId ? messages.drawer.editTitle : messages.drawer.createTitle}
                  </h2>
                  <p className="text-sm mt-1 text-muted">
                    {messages.drawer.description}
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
                  clientPlanId={clientPlanId}
                  onClientPlanIdChange={setClientPlanId}
                  planOptions={planOptions}
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
          title={messages.dialog.deleteTitle}
          description={deleteCandidate ? messages.dialog.deleteDescription.replace('{service}', deleteCandidate.serviceName) : undefined}
          confirmLabel={messages.dialog.confirmDelete}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
