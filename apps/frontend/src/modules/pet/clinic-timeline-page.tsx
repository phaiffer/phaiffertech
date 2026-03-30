'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Syringe,
  FileText,
  Pill,
  ArrowLeft,
  PawPrint,
  Filter,
  Calendar,
  User,
  ChevronDown
} from 'lucide-react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import {
  sharedInputClass,
  sharedInputLabelClass,
  sharedInputLeadingAccessoryClass,
  sharedInputTrailingAccessoryClass,
  sharedInputWithLeadingAccessoryClass,
  sharedInputWithTrailingAccessoryClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatDateForLocale, formatTimeForLocale } from '@/shared/i18n/formatters';
import { resolvePageItems } from '@/shared/lib/pagination';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { petService } from '@/shared/services/pet-service';
import type { PetClinicalTimeline, PetClinicalTimelineEvent, PetProfile, PetProfessional } from '@/shared/types/pet';

type ClinicTimelinePageProps = {
  showSubnav?: boolean;
};

type TimelineFilters = {
  petId: string;
  eventType: string;
  professionalId: string;
};

type GroupedEvents = {
  date: string;
  events: PetClinicalTimelineEvent[];
};

function groupEventsByDate(events: PetClinicalTimelineEvent[]): GroupedEvents[] {
  const groups = new Map<string, PetClinicalTimelineEvent[]>();

  events.forEach((event) => {
    const dateKey = new Date(event.occurredAt).toISOString().split('T')[0];
    const existing = groups.get(dateKey) ?? [];
    groups.set(dateKey, [...existing, event]);
  });

  return Array.from(groups.entries())
    .map(([date, evts]) => ({ date, events: evts }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function TimelineEventIcon({ type }: { type: string }) {
  const iconConfig: Record<string, { icon: React.ReactNode; bgClass: string }> = {
    MEDICAL_RECORD: {
      icon: <FileText className="h-5 w-5 text-blue-600" />,
      bgClass: 'bg-blue-100'
    },
    VACCINATION: {
      icon: <Syringe className="h-5 w-5 text-emerald-600" />,
      bgClass: 'bg-emerald-100'
    },
    PRESCRIPTION: {
      icon: <Pill className="h-5 w-5 text-purple-600" />,
      bgClass: 'bg-purple-100'
    }
  };

  const config = iconConfig[type] ?? {
    icon: <FileText className="h-5 w-5 text-slate-600" />,
    bgClass: 'bg-slate-100'
  };

  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-white shadow-sm ${config.bgClass}`}>
      {config.icon}
    </div>
  );
}

function TimelineEventTypeBadge({ type }: { type: string }) {
  const typeConfig: Record<string, { label: string; className: string }> = {
    MEDICAL_RECORD: {
      label: 'Prontuario',
      className: 'bg-blue-100 text-blue-800'
    },
    VACCINATION: {
      label: 'Vacinacao',
      className: 'bg-emerald-100 text-emerald-800'
    },
    PRESCRIPTION: {
      label: 'Prescricao',
      className: 'bg-purple-100 text-purple-800'
    }
  };

  const config = typeConfig[type] ?? { label: type, className: 'bg-slate-100 text-slate-700' };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${config.className}`}>
      {config.label}
    </span>
  );
}

export function ClinicTimelinePage({ showSubnav = false }: ClinicTimelinePageProps) {
  const { locale } = useAppI18n();
  const t = useAppMessages().petClinic;
  const platform = useFrontendPlatform();

  const [timeline, setTimeline] = useState<PetClinicalTimeline | null>(null);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [professionals, setProfessionals] = useState<PetProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TimelineFilters>({
    petId: '',
    eventType: '',
    professionalId: ''
  });

  const hasPermission = (permission: string) => platform.user?.permissions.includes(permission) ?? false;
  const hasWorkspaceWidePetVisibility =
    platform.workspace.hasFullPlatformVisibility || platform.workspace.canManagePlatformAdministration;
  const canReadMedicalRecords = hasPermission('pet.medical-record.read') || hasWorkspaceWidePetVisibility;
  const canReadProfiles = hasPermission('pet.profile.read') || hasWorkspaceWidePetVisibility;
  const canReadProfessionals = hasPermission('pet.professional.read') || hasWorkspaceWidePetVisibility;

  useEffect(() => {
    let active = true;

    setLoading(true);

    Promise.allSettled([
      petService.getClinicalTimeline({
        petId: filters.petId || undefined,
        limit: 100
      }),
      canReadProfiles ? petService.listProfiles(0, 200, '') : Promise.resolve(null),
      canReadProfessionals ? petService.listProfessionals(0, 200, '') : Promise.resolve(null)
    ]).then((results) => {
      if (!active) return;

      const [timelineResult, petsResult, professionalsResult] = results;

      if (timelineResult.status === 'fulfilled') {
        setTimeline(timelineResult.value);
      }

      if (petsResult.status === 'fulfilled' && petsResult.value) {
        setPets(resolvePageItems(petsResult.value));
      }

      if (professionalsResult.status === 'fulfilled' && professionalsResult.value) {
        setProfessionals(resolvePageItems(professionalsResult.value));
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [canReadProfiles, canReadProfessionals, filters.petId]);

  const filteredEvents = useMemo(() => {
    if (!timeline) return [];

    let events = timeline.events;

    if (filters.eventType) {
      events = events.filter((e) => e.eventType === filters.eventType);
    }

    if (filters.professionalId) {
      events = events.filter((e) => e.professionalId === filters.professionalId);
    }

    return events;
  }, [timeline, filters.eventType, filters.professionalId]);

  const groupedEvents = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents]);

  const selectedPet = useMemo(
    () => pets.find((p) => p.id === filters.petId),
    [pets, filters.petId]
  );

  if (!canReadMedicalRecords) {
    return <div className="ui-notice-warning">{t.noPermission}</div>;
  }

  return (
    <div className={sharedPageStackClass}>
      {showSubnav ? <PetModuleSubnav /> : null}

      {/* Header Section */}
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(16,185,129,0.05),rgba(255,255,255,0.98)_120px)] p-6 shadow-[0_24px_54px_-40px_rgba(15,23,42,0.14)] lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <Link
              href="/pet/clinic"
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao dashboard
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-900 lg:text-[2.2rem]">
              {t.timeline.title}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">{t.timeline.description}</p>

            {selectedPet ? (
              <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--accent)]/10">
                  <PawPrint className="h-4 w-4 text-[color:var(--accent)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{selectedPet.name}</p>
                  <p className="text-xs text-slate-500">
                    {selectedPet.species} {selectedPet.breed ? `· ${selectedPet.breed}` : ''}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                showFilters
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/5 text-[color:var(--accent)]'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtros
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Filters Panel */}
      {showFilters ? (
        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_38px_-32px_rgba(15,23,42,0.10)]">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="pet-filter" className={sharedInputLabelClass}>
                Pet
              </label>
              <div className="relative">
                <span className={sharedInputLeadingAccessoryClass}>
                  <PawPrint className="h-4 w-4" />
                </span>
                <select
                  id="pet-filter"
                  value={filters.petId}
                  onChange={(e) => setFilters((f) => ({ ...f, petId: e.target.value }))}
                  className={`${sharedInputClass} ${sharedInputWithLeadingAccessoryClass} ${sharedInputWithTrailingAccessoryClass}`}
                >
                  <option value="">Todos os pets</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species})
                    </option>
                  ))}
                </select>
                <span className={sharedInputTrailingAccessoryClass}>
                  <ChevronDown className="h-4 w-4" />
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="type-filter" className={sharedInputLabelClass}>
                Tipo de evento
              </label>
              <div className="relative">
                <span className={sharedInputLeadingAccessoryClass}>
                  <Calendar className="h-4 w-4" />
                </span>
                <select
                  id="type-filter"
                  value={filters.eventType}
                  onChange={(e) => setFilters((f) => ({ ...f, eventType: e.target.value }))}
                  className={`${sharedInputClass} ${sharedInputWithLeadingAccessoryClass} ${sharedInputWithTrailingAccessoryClass}`}
                >
                  <option value="">Todos os tipos</option>
                  <option value="MEDICAL_RECORD">{t.timeline.types.medicalRecord}</option>
                  <option value="VACCINATION">{t.timeline.types.vaccination}</option>
                  <option value="PRESCRIPTION">{t.timeline.types.prescription}</option>
                </select>
                <span className={sharedInputTrailingAccessoryClass}>
                  <ChevronDown className="h-4 w-4" />
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="professional-filter" className={sharedInputLabelClass}>
                Profissional
              </label>
              <div className="relative">
                <span className={sharedInputLeadingAccessoryClass}>
                  <User className="h-4 w-4" />
                </span>
                <select
                  id="professional-filter"
                  value={filters.professionalId}
                  onChange={(e) => setFilters((f) => ({ ...f, professionalId: e.target.value }))}
                  className={`${sharedInputClass} ${sharedInputWithLeadingAccessoryClass} ${sharedInputWithTrailingAccessoryClass}`}
                >
                  <option value="">Todos os profissionais</option>
                  {professionals.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.name}
                    </option>
                  ))}
                </select>
                <span className={sharedInputTrailingAccessoryClass}>
                  <ChevronDown className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>

          {(filters.petId || filters.eventType || filters.professionalId) ? (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-600">
                <span className="font-medium">{filteredEvents.length}</span> evento(s) encontrado(s)
              </p>
              <button
                type="button"
                onClick={() => setFilters({ petId: '', eventType: '', professionalId: '' })}
                className="text-sm font-medium text-[color:var(--accent)] hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Loading State */}
      {loading ? (
        <div className="ui-notice-neutral">{t.loading}</div>
      ) : null}

      {/* Timeline Content */}
      {!loading ? (
        groupedEvents.length === 0 ? (
          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-12 text-center shadow-[0_18px_38px_-32px_rgba(15,23,42,0.10)]">
            <FileText className="mx-auto mb-4 h-12 w-12 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-900">{t.timeline.empty}</h3>
            <p className="mt-2 text-sm text-slate-600">
              Registre prontuarios, vacinas ou prescricoes para construir o historico clinico.
            </p>
          </section>
        ) : (
          <section className="space-y-8">
            {groupedEvents.map((group) => (
              <div key={group.date} className="relative">
                {/* Date Header */}
                <div className="sticky top-4 z-10 mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-semibold text-slate-900">
                      {formatDateForLocale(locale, group.date)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {group.events.length} evento(s)
                    </span>
                  </div>
                </div>

                {/* Events */}
                <div className="relative ml-6 border-l-2 border-slate-200 pl-8">
                  <div className="space-y-6">
                    {group.events.map((event, index) => (
                      <div key={event.eventId} className="relative">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[52px] top-0">
                          <TimelineEventIcon type={event.eventType} />
                        </div>

                        {/* Event Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.1)] transition-shadow hover:shadow-[0_12px_32px_-16px_rgba(15,23,42,0.15)]">
                          <div className="flex flex-wrap items-center gap-3">
                            <TimelineEventTypeBadge type={event.eventType} />
                            <span className="text-sm font-medium text-slate-900">
                              {formatTimeForLocale(locale, event.occurredAt)}
                            </span>
                          </div>

                          <h3 className="mt-3 text-base font-semibold text-slate-900">
                            {event.title}
                          </h3>

                          {event.summary ? (
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                              {event.summary}
                            </p>
                          ) : null}

                          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
                            {event.petName ? (
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                                  <PawPrint className="h-3.5 w-3.5 text-slate-600" />
                                </div>
                                <span className="text-sm font-medium text-slate-700">{event.petName}</span>
                              </div>
                            ) : null}

                            {event.professionalName ? (
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                                  <Stethoscope className="h-3.5 w-3.5 text-slate-600" />
                                </div>
                                <span className="text-sm font-medium text-slate-700">{event.professionalName}</span>
                              </div>
                            ) : null}

                            {event.appointmentServiceName ? (
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                                  <Calendar className="h-3.5 w-3.5 text-slate-600" />
                                </div>
                                <span className="text-sm text-slate-600">{event.appointmentServiceName}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )
      ) : null}
    </div>
  );
}
