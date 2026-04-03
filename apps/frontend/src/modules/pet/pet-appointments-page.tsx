'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarCheck, CarFront, CreditCard, RefreshCcw, type LucideIcon } from 'lucide-react';
import {
  describePetServiceCatalogItem,
  formatPetServiceCategory
} from '@/modules/pet/pet-service-catalog-policy';
import {
  PetAppointmentForm,
  PetAppointmentsFilters,
  type PetAppointmentSelectedService,
  type PetAppointmentServiceSummary,
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
  PetAppointmentServiceLine,
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
import {
  sharedDrawerContainerClass,
  sharedDrawerHeaderClass,
  sharedDrawerOverlayClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';

const pageSize = 10;

const initialPage: PageResponse<PetAppointment> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

type AppointmentFocusCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'accent' | 'warning';
};

function AppointmentFocusCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'default'
}: AppointmentFocusCardProps) {
  const toneClass = tone === 'accent'
    ? 'border-transparent bg-[linear-gradient(135deg,var(--accent),var(--petflow-teal))] text-white shadow-[0_20px_40px_-28px_rgba(16,185,129,0.5)]'
    : tone === 'warning'
      ? 'border-amber-200/80 bg-[linear-gradient(180deg,rgba(251,191,36,0.12),rgba(255,255,255,0.98))]'
      : 'border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.05),rgba(255,255,255,0.99)_140px)]';

  return (
    <div className={`rounded-2xl border p-5 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.16)] ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${tone === 'accent' ? 'text-white/72' : 'text-slate-600'}`}>
            {label}
          </p>
          <p className={`mt-3 text-3xl font-bold tracking-[-0.03em] ${tone === 'accent' ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            tone === 'accent'
              ? 'bg-white/12 text-white'
              : tone === 'warning'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className={`mt-3 ${tone === 'accent' ? 'text-sm leading-6 text-white/80' : 'text-sm leading-6 text-slate-700'}`}>{detail}</p>
    </div>
  );
}

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

function resolveServiceSummaryCopy(locale: string) {
  if (locale === 'pt-BR') {
    return {
      title: 'Servicos estruturados',
      empty: 'Adicione um ou mais servicos para confirmar composicao, duracao total, preco base e regra de agendamento.',
      description: 'Este atendimento usa definicoes estruturadas do catalogo do tenant, nao nomes soltos.',
      selectedServicesLabel: 'Servicos selecionados',
      emptySelectionLabel: 'Adicione pelo menos um servico estruturado antes de salvar.',
      addServiceLabel: 'Adicionar servico',
      removeServiceLabel: 'Remover',
      category: 'Categoria',
      servicesCount: 'Servicos',
      status: 'Status',
      scheduling: 'Regra de agendamento',
      duration: 'Duracao total',
      basePrice: 'Preco base total',
      checkout: 'Checkout previsto',
      active: 'Ativo para novos agendamentos',
      inactive: 'Inativo para novos agendamentos',
      flexible: 'Avulso e plano habilitados',
      planOnly: 'Somente por plano',
      standaloneOnly: 'Somente avulso',
      unavailable: 'Indisponivel para novos agendamentos',
      planReady: 'Todos os servicos selecionados podem ser consumidos pelo plano vinculado.',
      planBlocked: 'Algum servico selecionado nao pode ser consumido por plano.',
      standaloneReady: 'Todos os servicos selecionados podem ser agendados como atendimento avulso.',
      standaloneBlocked: 'Algum servico selecionado exige plano vinculado antes do agendamento.',
      inactiveLegacy: 'Servico inativo mantido apenas para preservar a edicao segura de um agendamento historico.',
      missingLegacy: 'A definicao original do servico nao esta mais no catalogo ativo. Mantenha o vinculo apenas para edicao historica segura.',
      legacyHeadlineSuffix: 'reserva legada',
      bundleHeadlineSuffix: 'servicos selecionados'
    };
  }

  return {
    title: 'Structured services',
    empty: 'Add one or more services to confirm the bundle, total duration, base price, and booking rule.',
    description: 'This appointment uses tenant-owned structured service definitions instead of loose service labels.',
    selectedServicesLabel: 'Selected services',
    emptySelectionLabel: 'Add at least one structured service before saving.',
    addServiceLabel: 'Add service',
    removeServiceLabel: 'Remove',
    category: 'Category',
    servicesCount: 'Services',
    status: 'Status',
    scheduling: 'Scheduling rule',
    duration: 'Combined duration',
    basePrice: 'Combined base price',
    checkout: 'Projected checkout',
    active: 'Active for new bookings',
    inactive: 'Inactive for new bookings',
    flexible: 'Standalone booking and plan sessions enabled',
    planOnly: 'Plan sessions only',
    standaloneOnly: 'Standalone booking only',
    unavailable: 'Unavailable for new scheduling',
    planReady: 'All selected services can be consumed from the linked plan.',
    planBlocked: 'At least one selected service cannot be consumed from the linked plan.',
    standaloneReady: 'All selected services can be booked as one-time appointments.',
    standaloneBlocked: 'At least one selected service requires a linked plan before booking.',
    inactiveLegacy: 'This inactive service stays visible only to preserve safe editing of a historical appointment.',
    missingLegacy: 'The original service definition is no longer in the active catalog. Keep the link only for safe historical edits.',
    legacyHeadlineSuffix: 'legacy booking',
    bundleHeadlineSuffix: 'services selected'
  };
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
  const [editingServiceLines, setEditingServiceLines] = useState<PetAppointmentServiceLine[]>([]);
  const [clientId, setClientId] = useState('');
  const [petId, setPetId] = useState('');
  const [servicePickerId, setServicePickerId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
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

  const bookableServices = useMemo(
    () => services.filter((service) => service.active),
    [services]
  );
  const serviceSummaryCopy = useMemo(
    () => resolveServiceSummaryCopy(locale),
    [locale]
  );
  const servicesById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services]
  );
  const editingServiceLinesById = useMemo(
    () => new Map(editingServiceLines.map((line) => [line.serviceId, line])),
    [editingServiceLines]
  );

  const serviceOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.all },
      ...services.map((service) => ({
        value: service.id,
        label: describePetServiceCatalogItem(service, locale)
      }))
    ];
  }, [locale, messages.formOptions.all, services]);

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
      ...bookableServices
        .filter((service) => !selectedServiceIds.includes(service.id))
        .map((service) => ({
          value: service.id,
          label: describePetServiceCatalogItem(service, locale)
        }))
    ];
  }, [bookableServices, locale, messages.formOptions.selectService, selectedServiceIds]);

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

  const selectedServiceEntries = useMemo(() => {
    return selectedServiceIds
      .map((selectedId) => {
        const catalogService = servicesById.get(selectedId);
        const legacyServiceLine = editingServiceLinesById.get(selectedId);

        if (!catalogService && !legacyServiceLine) {
          return null;
        }

        return {
          serviceId: selectedId,
          catalogService,
          legacyServiceLine
        };
      })
      .filter((entry): entry is {
        serviceId: string;
        catalogService: PetServiceCatalog | undefined;
        legacyServiceLine: PetAppointmentServiceLine | undefined;
      } => entry !== null);
  }, [editingServiceLinesById, selectedServiceIds, servicesById]);

  const selectedServices = useMemo<PetAppointmentSelectedService[]>(() => {
    return selectedServiceEntries.map((entry) => {
      if (entry.catalogService) {
        return {
          serviceId: entry.serviceId,
          label: describePetServiceCatalogItem(entry.catalogService, locale),
          note: entry.catalogService.active ? undefined : serviceSummaryCopy.inactiveLegacy,
          removable: true
        };
      }

      return {
        serviceId: entry.serviceId,
        label: `${entry.legacyServiceLine?.serviceName ?? messages.filters.service} · ${serviceSummaryCopy.legacyHeadlineSuffix}`,
        note: serviceSummaryCopy.missingLegacy,
        removable: true
      };
    });
  }, [locale, messages.filters.service, selectedServiceEntries, serviceSummaryCopy.inactiveLegacy, serviceSummaryCopy.legacyHeadlineSuffix, serviceSummaryCopy.missingLegacy]);

  const selectedServiceSummary = useMemo<PetAppointmentServiceSummary | null>(() => {
    if (selectedServiceEntries.length === 0) {
      return null;
    }

    const parsedExtrasAmount = extrasAmount ? parseFloat(extrasAmount) : 0;
    const safeExtrasAmount = Number.isFinite(parsedExtrasAmount) ? parsedExtrasAmount : 0;
    const notices: string[] = [];
    const categories = Array.from(new Set(
      selectedServiceEntries
        .map((entry) => entry.catalogService?.category ?? entry.legacyServiceLine?.serviceCategory ?? null)
        .filter((category): category is NonNullable<typeof category> => Boolean(category))
        .map((category) => formatPetServiceCategory(category))
    ));
    const combinedDurationMinutes = selectedServiceEntries.reduce((total, entry) => (
      total + (entry.catalogService?.durationMinutes ?? entry.legacyServiceLine?.durationMinutes ?? 0)
    ), 0);
    const combinedBasePrice = selectedServiceEntries.reduce((total, entry) => (
      total + (entry.catalogService?.basePrice ?? entry.legacyServiceLine?.basePrice ?? 0)
    ), 0);
    const supportsSelectedBookingMode = clientPlanId
      ? selectedServiceEntries.every((entry) => entry.catalogService?.allowInPlans ?? entry.legacyServiceLine?.allowInPlans ?? false)
      : selectedServiceEntries.every((entry) => entry.catalogService?.allowStandaloneBooking ?? entry.legacyServiceLine?.allowStandaloneBooking ?? false);
    const projectedCheckout = (clientPlanId && supportsSelectedBookingMode ? 0 : combinedBasePrice) + safeExtrasAmount;

    selectedServiceEntries.forEach((entry) => {
      if (entry.catalogService && !entry.catalogService.active) {
        notices.push(`${entry.catalogService.name}: ${serviceSummaryCopy.inactiveLegacy}`);
      } else if (!entry.catalogService) {
        notices.push(`${entry.legacyServiceLine?.serviceName ?? messages.filters.service}: ${serviceSummaryCopy.missingLegacy}`);
      }
    });

    notices.push(clientPlanId
      ? (supportsSelectedBookingMode ? serviceSummaryCopy.planReady : serviceSummaryCopy.planBlocked)
      : (supportsSelectedBookingMode ? serviceSummaryCopy.standaloneReady : serviceSummaryCopy.standaloneBlocked));

    return {
      title: serviceSummaryCopy.title,
      description: serviceSummaryCopy.description,
      selectedServicesLabel: serviceSummaryCopy.selectedServicesLabel,
      emptySelectionLabel: serviceSummaryCopy.emptySelectionLabel,
      addServiceLabel: serviceSummaryCopy.addServiceLabel,
      removeServiceLabel: serviceSummaryCopy.removeServiceLabel,
      headline: selectedServiceEntries.length === 1
        ? selectedServices[0]?.label ?? serviceSummaryCopy.title
        : `${selectedServiceEntries.length} ${serviceSummaryCopy.bundleHeadlineSuffix}`,
      details: [
        { label: serviceSummaryCopy.servicesCount, value: String(selectedServiceEntries.length) },
        { label: serviceSummaryCopy.category, value: categories.length > 0 ? categories.join(' + ') : serviceSummaryCopy.unavailable },
        {
          label: serviceSummaryCopy.scheduling,
          value: clientPlanId
            ? (supportsSelectedBookingMode ? serviceSummaryCopy.planOnly : serviceSummaryCopy.unavailable)
            : (supportsSelectedBookingMode ? serviceSummaryCopy.standaloneOnly : serviceSummaryCopy.unavailable)
        },
        { label: serviceSummaryCopy.duration, value: `${combinedDurationMinutes} min` },
        { label: serviceSummaryCopy.basePrice, value: formatCurrencyForLocale(locale, combinedBasePrice) },
        { label: serviceSummaryCopy.checkout, value: formatCurrencyForLocale(locale, projectedCheckout) }
      ],
      notices
    };
  }, [clientPlanId, extrasAmount, locale, messages.filters.service, selectedServiceEntries, selectedServices, serviceSummaryCopy]);

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
    setEditingServiceLines([]);
    setClientId('');
    setPetId('');
    setServicePickerId('');
    setSelectedServiceIds([]);
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
    const appointmentServices = appointment.appointmentServices && appointment.appointmentServices.length > 0
      ? appointment.appointmentServices
      : [{
          serviceId: appointment.serviceId,
          serviceName: appointment.serviceName,
          serviceCategory: null,
          durationMinutes: appointment.totalServiceDurationMinutes ?? null,
          basePrice: appointment.servicePrice ?? appointment.totalServiceBasePrice ?? null,
          active: false,
          allowInPlans: Boolean(appointment.clientPlanId),
          allowStandaloneBooking: !appointment.clientPlanId,
          lineOrder: 0,
          primary: true,
          missingFromCatalog: true
        }];
    setEditingId(appointment.id);
    setEditingServiceLines(appointmentServices);
    setClientId(appointment.clientId);
    setPetId(appointment.petId);
    setServicePickerId('');
    setSelectedServiceIds(appointmentServices.map((service) => service.serviceId));
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

  function handleAddService() {
    if (!servicePickerId || selectedServiceIds.includes(servicePickerId)) {
      return;
    }

    setSelectedServiceIds((current) => [...current, servicePickerId]);
    setServicePickerId('');
  }

  function handleRemoveService(serviceToRemoveId: string) {
    setSelectedServiceIds((current) => current.filter((selectedId) => selectedId !== serviceToRemoveId));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!clientId || !petId || selectedServiceIds.length === 0 || !professionalId) {
      setError(messages.errors.missingReferences);
      return;
    }

    const isoScheduledAt = toIsoDate(scheduledAt);
    if (!isoScheduledAt) {
      setError(messages.errors.missingDate);
      return;
    }

    setSubmitting(true);

    const primaryServiceId = selectedServiceIds[0];
    const parsedExtrasAmount = extrasAmount ? parseFloat(extrasAmount) : undefined;
    if (!editingId && selectedServiceEntries.some((entry) => entry.catalogService && !entry.catalogService.active)) {
      setSubmitting(false);
      setError('Selected service is inactive for new bookings.');
      return;
    }

    if (!editingId && selectedServiceEntries.some((entry) => !entry.catalogService)) {
      setSubmitting(false);
      setError('Legacy appointment services cannot be used for new bookings.');
      return;
    }

    if (clientPlanId && selectedServiceEntries.some((entry) => !(entry.catalogService?.allowInPlans ?? entry.legacyServiceLine?.allowInPlans))) {
      setSubmitting(false);
      setError('At least one selected service is not available for plan-based appointments.');
      return;
    }

    if (!clientPlanId && selectedServiceEntries.some((entry) => !(entry.catalogService?.allowStandaloneBooking ?? entry.legacyServiceLine?.allowStandaloneBooking))) {
      setSubmitting(false);
      setError('At least one selected service requires a linked plan before booking.');
      return;
    }

    if (!primaryServiceId) {
        setSubmitting(false);
        setError(messages.errors.missingReferences);
        return;
    }

    const payload = {
      clientId,
      petId,
      serviceId: primaryServiceId,
      serviceIds: selectedServiceIds,
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
            <AppointmentFocusCard
              icon={RefreshCcw}
              label={messages.focus.recurring}
              value={new Intl.NumberFormat(locale).format(recurringAppointments)}
              detail={messages.focus.recurringDetail}
            />
            <AppointmentFocusCard
              icon={CalendarCheck}
              label={messages.focus.oneTime}
              value={new Intl.NumberFormat(locale).format(oneTimeAppointments)}
              detail={messages.focus.oneTimeDetail}
            />
            <AppointmentFocusCard
              icon={CalendarCheck}
              label={messages.focus.ready}
              value={new Intl.NumberFormat(locale).format(readyForPickup)}
              detail={`${pickupMessagesReady} ${messages.focus.readyDetailSuffix}`}
            />
            <AppointmentFocusCard
              icon={CreditCard}
              label={messages.focus.planAlerts}
              value={new Intl.NumberFormat(locale).format(lowPlanAlerts)}
              detail={messages.focus.planAlertsDetail}
              tone={lowPlanAlerts > 0 ? 'warning' : 'default'}
            />
            <AppointmentFocusCard
              icon={CarFront}
              label={messages.focus.petTaxi}
              value={new Intl.NumberFormat(locale).format(petTaxiAppointments)}
              detail={messages.focus.petTaxiDetail}
            />
            <AppointmentFocusCard
              icon={CreditCard}
              label={messages.focus.commission}
              value={formatCurrencyForLocale(locale, visibleCommissionTotal)}
              detail={messages.focus.commissionDetail}
              tone="accent"
            />
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
          <div className={sharedDrawerOverlayClass}>
            <div className={`${sharedDrawerContainerClass} max-w-lg`}>
              <div className={sharedDrawerHeaderClass}>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                    {editingId ? messages.drawer.editTitle : messages.drawer.createTitle}
                  </h2>
                  <p className="mt-1 text-sm text-slate-700">
                    {messages.drawer.description}
                  </p>
                </div>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="rounded-full p-2 text-slate-600 transition-colors duration-200 hover:bg-surface-inset hover:text-slate-900"
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
                  servicePickerId={servicePickerId}
                  onServicePickerIdChange={setServicePickerId}
                  formServiceOptions={formServiceOptions}
                  servicesLookupUnavailable={servicesLookupUnavailable}
                  selectedServices={selectedServices}
                  onAddService={handleAddService}
                  onRemoveService={handleRemoveService}
                  canAddSelectedService={Boolean(servicePickerId) && !selectedServiceIds.includes(servicePickerId)}
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
                  serviceSummaryTitle={serviceSummaryCopy.title}
                  serviceSummaryEmpty={serviceSummaryCopy.empty}
                  selectedServiceSummary={selectedServiceSummary}
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
