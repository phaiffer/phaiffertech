'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  FileText,
  Filter,
  PawPrint,
  Pill,
  Printer,
  Stethoscope,
  Syringe,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity
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
import { useAppI18n, useAppMessages, type AppLocale } from '@/shared/i18n/app-i18n-provider';
import { formatDateForLocale, formatTimeForLocale } from '@/shared/i18n/formatters';
import { resolvePageItems } from '@/shared/lib/pagination';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { petService } from '@/shared/services/pet-service';
import type {
  PetClinicalTimeline,
  PetClinicalTimelineEvent,
  PetMedicalRecord,
  PetPrescription,
  PetProfile,
  PetVaccination
} from '@/shared/types/pet';

type PetTimelinePageProps = {
  petId: string;
  showSubnav?: boolean;
};

type TimelineFilters = {
  eventType: string;
  period: string;
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

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function TimelineStatCard({
  label,
  value,
  icon,
  tone = 'default'
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'warning';
}) {
  const toneClasses = {
    default: 'border-slate-200/80 bg-white',
    accent: 'border-[color:var(--accent)]/20 bg-[color:var(--accent)]/5',
    success: 'border-emerald-200 bg-emerald-50',
    warning: 'border-amber-200 bg-amber-50'
  };

  const iconToneClasses = {
    default: 'bg-slate-100 text-slate-600',
    accent: 'bg-[color:var(--accent)]/10 text-[color:var(--accent)]',
    success: 'bg-emerald-100 text-emerald-600',
    warning: 'bg-amber-100 text-amber-600'
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${toneClasses[tone]}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconToneClasses[tone]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="text-lg font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function EventTypeIcon({ type }: { type: string }) {
  const iconConfig: Record<string, { icon: ReactNode; bgClass: string }> = {
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
    },
    APPOINTMENT: {
      icon: <Calendar className="h-5 w-5 text-slate-600" />,
      bgClass: 'bg-slate-100'
    }
  };

  const config = iconConfig[type] ?? {
    icon: <Activity className="h-5 w-5 text-slate-600" />,
    bgClass: 'bg-slate-100'
  };

  return (
    <div className={`flex h-12 w-12 items-center justify-center rounded-full border-4 border-white shadow-sm ${config.bgClass}`}>
      {config.icon}
    </div>
  );
}

function EventTypeBadge({ type }: { type: string }) {
  const t = useAppMessages().petTimeline.events;
  
  const config: Record<string, { label: string; className: string }> = {
    MEDICAL_RECORD: {
      label: t.medicalRecord,
      className: 'bg-blue-100 text-blue-800'
    },
    VACCINATION: {
      label: t.vaccination,
      className: 'bg-emerald-100 text-emerald-800'
    },
    PRESCRIPTION: {
      label: t.prescription,
      className: 'bg-purple-100 text-purple-800'
    },
    APPOINTMENT: {
      label: t.appointment,
      className: 'bg-slate-100 text-slate-700'
    }
  };

  const typeConfig = config[type] ?? { label: type, className: 'bg-slate-100 text-slate-700' };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${typeConfig.className}`}>
      {typeConfig.label}
    </span>
  );
}

function VaccinationCard({
  vaccination,
  locale
}: {
  vaccination: PetVaccination;
  locale: AppLocale;
}) {
  const today = startOfDay();
  const nextDue = vaccination.nextDueAt ? startOfDay(new Date(vaccination.nextDueAt)) : null;
  const isOverdue = nextDue && nextDue < today;
  const isDueSoon = nextDue && !isOverdue && nextDue <= addDays(today, 14);

  return (
    <div className={`rounded-xl border p-4 ${
      isOverdue
        ? 'border-red-200 bg-red-50'
        : isDueSoon
          ? 'border-amber-200 bg-amber-50'
          : 'border-slate-200 bg-white'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            isOverdue ? 'bg-red-100' : isDueSoon ? 'bg-amber-100' : 'bg-emerald-100'
          }`}>
            <Syringe className={`h-5 w-5 ${
              isOverdue ? 'text-red-600' : isDueSoon ? 'text-amber-600' : 'text-emerald-600'
            }`} />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900">{vaccination.vaccineName}</h4>
            <p className="text-sm text-slate-600">
              Aplicada em {formatDateForLocale(locale, vaccination.appliedAt)}
            </p>
          </div>
        </div>
        {isOverdue ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
            <AlertTriangle className="h-3 w-3" />
            Vencida
          </span>
        ) : isDueSoon ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
            <Clock className="h-3 w-3" />
            Vence em breve
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            Em dia
          </span>
        )}
      </div>
      {nextDue ? (
        <p className="mt-3 text-sm text-slate-600">
          <span className="font-medium">Proxima dose:</span> {formatDateForLocale(locale, vaccination.nextDueAt!)}
        </p>
      ) : null}
      {vaccination.notes ? (
        <p className="mt-2 text-sm text-slate-500">{vaccination.notes}</p>
      ) : null}
    </div>
  );
}

export function PetTimelinePage({ petId, showSubnav = false }: PetTimelinePageProps) {
  const { locale } = useAppI18n();
  const t = useAppMessages().petTimeline;
  const platform = useFrontendPlatform();

  const [pet, setPet] = useState<PetProfile | null>(null);
  const [timeline, setTimeline] = useState<PetClinicalTimeline | null>(null);
  const [vaccinations, setVaccinations] = useState<PetVaccination[]>([]);
  const [records, setRecords] = useState<PetMedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<PetPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TimelineFilters>({
    eventType: '',
    period: ''
  });

  const hasPermission = (permission: string) => platform.user?.permissions.includes(permission) ?? false;
  const hasWorkspaceWidePetVisibility =
    platform.workspace.hasFullPlatformVisibility || platform.workspace.canManagePlatformAdministration;
  const canReadProfiles = hasPermission('pet.profile.read') || hasWorkspaceWidePetVisibility;
  const canReadMedicalRecords = hasPermission('pet.medical-record.read') || hasWorkspaceWidePetVisibility;
  const canReadVaccinations = hasPermission('pet.vaccination.read') || hasWorkspaceWidePetVisibility;
  const canReadPrescriptions = hasPermission('pet.prescription.read') || hasWorkspaceWidePetVisibility;

  useEffect(() => {
    let active = true;

    setLoading(true);

    Promise.allSettled([
      canReadProfiles ? petService.getProfile(petId) : Promise.resolve(null),
      petService.getClinicalTimeline({ petId, limit: 200 }),
      canReadVaccinations ? petService.listVaccinations(0, 100, '', { petId }) : Promise.resolve(null),
      canReadMedicalRecords ? petService.listMedicalRecords(0, 100, '', { petId }) : Promise.resolve(null),
      canReadPrescriptions ? petService.listPrescriptions(0, 100, '', { petId }) : Promise.resolve(null)
    ]).then((results) => {
      if (!active) return;

      const [petResult, timelineResult, vaccinationsResult, recordsResult, prescriptionsResult] = results;

      if (petResult.status === 'fulfilled' && petResult.value) {
        setPet(petResult.value);
      }

      if (timelineResult.status === 'fulfilled') {
        setTimeline(timelineResult.value);
      }

      if (vaccinationsResult.status === 'fulfilled' && vaccinationsResult.value) {
        setVaccinations(resolvePageItems(vaccinationsResult.value));
      }

      if (recordsResult.status === 'fulfilled' && recordsResult.value) {
        setRecords(resolvePageItems(recordsResult.value));
      }

      if (prescriptionsResult.status === 'fulfilled' && prescriptionsResult.value) {
        setPrescriptions(resolvePageItems(prescriptionsResult.value));
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [canReadMedicalRecords, canReadPrescriptions, canReadProfiles, canReadVaccinations, petId]);

  const filteredEvents = useMemo(() => {
    if (!timeline) return [];

    let events = timeline.events;

    // Filter by event type
    if (filters.eventType) {
      events = events.filter((e) => e.eventType === filters.eventType);
    }

    // Filter by period
    if (filters.period) {
      const today = startOfDay();
      let startDate: Date;

      switch (filters.period) {
        case 'week':
          startDate = addDays(today, -7);
          break;
        case 'month':
          startDate = addDays(today, -30);
          break;
        case '3months':
          startDate = addDays(today, -90);
          break;
        case 'year':
          startDate = addDays(today, -365);
          break;
        default:
          startDate = new Date(0);
      }

      events = events.filter((e) => new Date(e.occurredAt) >= startDate);
    }

    return events;
  }, [timeline, filters]);

  const groupedEvents = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents]);

  const lastVisitDate = useMemo(() => {
    if (!timeline || timeline.events.length === 0) return null;
    return timeline.events[0].occurredAt;
  }, [timeline]);

  if (!canReadMedicalRecords && !canReadVaccinations && !canReadPrescriptions) {
    return <div className="ui-notice-warning">{t.noPermission}</div>;
  }

  if (loading) {
    return (
      <div className={sharedPageStackClass}>
        {showSubnav ? <PetModuleSubnav /> : null}
        <div className="ui-notice-neutral">{t.loading}</div>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className={sharedPageStackClass}>
        {showSubnav ? <PetModuleSubnav /> : null}
        <div className="ui-notice-warning">{t.petNotFound}</div>
      </div>
    );
  }

  return (
    <div className={sharedPageStackClass}>
      {showSubnav ? <PetModuleSubnav /> : null}

      {/* Header Section */}
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(16,185,129,0.05),rgba(255,255,255,0.98)_120px)] p-6 shadow-[0_24px_54px_-40px_rgba(15,23,42,0.14)] lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <Link
              href="/pet/pets"
              className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.backToPets}
            </Link>

            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10">
                <PawPrint className="h-8 w-8 text-[color:var(--accent)]" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t.eyebrow}
                </p>
                <h1 className="mt-1 text-3xl font-bold tracking-[-0.04em] text-slate-900">
                  {pet.name}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  {pet.species} {pet.breed ? `· ${pet.breed}` : ''} {pet.gender ? `· ${pet.gender}` : ''}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">{t.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                showFilters
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/5 text-[color:var(--accent)]'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <Filter className="h-4 w-4" />
              {t.filters.title}
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300"
            >
              <Printer className="h-4 w-4" />
              {t.actions.printHistory}
            </button>
          </div>
        </div>
      </section>

      {/* Filters Panel */}
      {showFilters ? (
        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_38px_-32px_rgba(15,23,42,0.10)]">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="type-filter" className={sharedInputLabelClass}>
                Tipo de evento
              </label>
              <div className="relative">
                <span className={sharedInputLeadingAccessoryClass}>
                  <Activity className="h-4 w-4" />
                </span>
                <select
                  id="type-filter"
                  value={filters.eventType}
                  onChange={(e) => setFilters((f) => ({ ...f, eventType: e.target.value }))}
                  className={`${sharedInputClass} ${sharedInputWithLeadingAccessoryClass} ${sharedInputWithTrailingAccessoryClass}`}
                >
                  <option value="">{t.filters.allTypes}</option>
                  <option value="MEDICAL_RECORD">{t.events.medicalRecord}</option>
                  <option value="VACCINATION">{t.events.vaccination}</option>
                  <option value="PRESCRIPTION">{t.events.prescription}</option>
                </select>
                <span className={sharedInputTrailingAccessoryClass}>
                  <ChevronDown className="h-4 w-4" />
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="period-filter" className={sharedInputLabelClass}>
                {t.filters.period}
              </label>
              <div className="relative">
                <span className={sharedInputLeadingAccessoryClass}>
                  <Calendar className="h-4 w-4" />
                </span>
                <select
                  id="period-filter"
                  value={filters.period}
                  onChange={(e) => setFilters((f) => ({ ...f, period: e.target.value }))}
                  className={`${sharedInputClass} ${sharedInputWithLeadingAccessoryClass} ${sharedInputWithTrailingAccessoryClass}`}
                >
                  <option value="">{t.filters.allTime}</option>
                  <option value="week">{t.filters.lastWeek}</option>
                  <option value="month">{t.filters.lastMonth}</option>
                  <option value="3months">{t.filters.last3Months}</option>
                  <option value="year">{t.filters.lastYear}</option>
                </select>
                <span className={sharedInputTrailingAccessoryClass}>
                  <ChevronDown className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>

          {(filters.eventType || filters.period) ? (
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-600">
                <span className="font-medium">{filteredEvents.length}</span> evento(s) encontrado(s)
              </p>
              <button
                type="button"
                onClick={() => setFilters({ eventType: '', period: '' })}
                className="text-sm font-medium text-[color:var(--accent)] hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <TimelineStatCard
          label={t.stats.totalEvents}
          value={timeline?.totalEvents ?? 0}
          icon={<Activity className="h-5 w-5" />}
          tone="accent"
        />
        <TimelineStatCard
          label={t.stats.vaccinations}
          value={vaccinations.length}
          icon={<Syringe className="h-5 w-5" />}
          tone="success"
        />
        <TimelineStatCard
          label={t.stats.records}
          value={records.length}
          icon={<FileText className="h-5 w-5" />}
        />
        <TimelineStatCard
          label={t.stats.prescriptions}
          value={prescriptions.length}
          icon={<Pill className="h-5 w-5" />}
        />
        <TimelineStatCard
          label={t.stats.lastVisit}
          value={lastVisitDate ? formatDateForLocale(locale, lastVisitDate, '', { day: '2-digit', month: 'short' }) : '-'}
          icon={<Calendar className="h-5 w-5" />}
        />
      </div>

      {/* Vaccination Card Section */}
      {vaccinations.length > 0 ? (
        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_38px_-32px_rgba(15,23,42,0.10)] lg:p-7">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                <Syringe className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{t.sections.vaccinations}</h2>
                <p className="text-sm text-slate-600">{vaccinations.length} vacinas registradas</p>
              </div>
            </div>
            <Link
              href="/pet/appointments"
              className="text-sm font-medium text-[color:var(--accent)] hover:underline"
            >
              {t.actions.addVaccine}
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {vaccinations.slice(0, 4).map((v) => (
              <VaccinationCard key={v.id} vaccination={v} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Timeline Section */}
      <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_38px_-32px_rgba(15,23,42,0.10)] lg:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
            <Clock className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t.title}</h2>
            <p className="text-sm text-slate-600">{t.description}</p>
          </div>
        </div>

        {groupedEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
            <Activity className="mx-auto mb-3 h-12 w-12 text-slate-400" />
            <h3 className="text-base font-semibold text-slate-900">{t.events.empty}</h3>
            <p className="mt-2 text-sm text-slate-600">{t.events.emptyDescription}</p>
          </div>
        ) : (
          <div className="space-y-8">
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
                    {group.events.map((event) => (
                      <div key={event.eventId} className="relative">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[52px] top-0">
                          <EventTypeIcon type={event.eventType} />
                        </div>

                        {/* Event Card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.1)] transition-shadow hover:shadow-[0_12px_32px_-16px_rgba(15,23,42,0.15)]">
                          <div className="flex flex-wrap items-center gap-3">
                            <EventTypeBadge type={event.eventType} />
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
                            {event.professionalName ? (
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                                  <Stethoscope className="h-3.5 w-3.5 text-slate-600" />
                                </div>
                                <span className="text-sm font-medium text-slate-700">
                                  {event.professionalName}
                                </span>
                              </div>
                            ) : null}

                            {event.appointmentServiceName ? (
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100">
                                  <Calendar className="h-3.5 w-3.5 text-slate-600" />
                                </div>
                                <span className="text-sm text-slate-600">
                                  {event.appointmentServiceName}
                                </span>
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
          </div>
        )}
      </section>
    </div>
  );
}
