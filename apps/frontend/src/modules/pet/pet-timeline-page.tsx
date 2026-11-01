'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatCurrencyForLocale, formatDateForLocale, formatTimeForLocale } from '@/shared/i18n/formatters';
import { resolvePageItems } from '@/shared/lib/pagination';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { petService } from '@/shared/services/pet-service';
import type {
  PetAppointment,
  PetClient,
  PetClinicalTimeline,
  PetClinicalTimelineEvent,
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

const APPOINTMENTS_LIMIT = 50;
const DUE_SOON_DAYS = 14;
const PERIOD_DAYS: Record<string, number> = { week: 7, month: 30, '3months': 90, year: 365 };

function groupEventsByDate(events: PetClinicalTimelineEvent[]): GroupedEvents[] {
  const groups = new Map<string, PetClinicalTimelineEvent[]>();
  events.forEach((event) => {
    const day = event.occurredAt.slice(0, 10);
    groups.set(day, [...(groups.get(day) ?? []), event]);
  });
  return Array.from(groups.entries()).map(([date, items]) => ({ date, events: items }));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function vaccineState(vaccination: PetVaccination): 'overdue' | 'dueSoon' | 'ok' {
  if (!vaccination.nextDueAt) return 'ok';
  const today = startOfDay();
  const nextDue = startOfDay(new Date(vaccination.nextDueAt));
  if (nextDue < today) return 'overdue';
  if (nextDue <= addDays(today, DUE_SOON_DAYS)) return 'dueSoon';
  return 'ok';
}

// Comanda v2 pet profile (banho e tosa first): pet details, care notes and the pet's
// appointments. The clinical history (vaccines, records, prescriptions) only shows
// for users with clinical permissions.
export function PetTimelinePage({ petId, showSubnav = false }: PetTimelinePageProps) {
  const { locale } = useAppI18n();
  const t = useAppMessages().petTimeline;
  const copy = useAppMessages().screens.petProfile;
  const profileCopy = useAppMessages().screens.petProfiles;
  const platform = useFrontendPlatform();

  const [pet, setPet] = useState<PetProfile | null>(null);
  const [owner, setOwner] = useState<PetClient | null>(null);
  const [appointments, setAppointments] = useState<PetAppointment[]>([]);
  const [timeline, setTimeline] = useState<PetClinicalTimeline | null>(null);
  const [vaccinations, setVaccinations] = useState<PetVaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TimelineFilters>({ eventType: '', period: '' });

  const hasPermission = (permission: string) => platform.user?.permissions.includes(permission) ?? false;
  const hasWorkspaceWidePetVisibility =
    platform.workspace.hasFullPlatformVisibility || platform.workspace.canManagePlatformAdministration;
  const canReadProfiles = hasPermission('pet.profile.read') || hasWorkspaceWidePetVisibility;
  const canReadClients = hasPermission('pet.client.read') || hasWorkspaceWidePetVisibility;
  const canReadAppointments = hasPermission('pet.appointment.read') || hasWorkspaceWidePetVisibility;
  const canCreateAppointments = hasPermission('pet.appointment.create') || hasWorkspaceWidePetVisibility;
  const canReadMedicalRecords = hasPermission('pet.medical-record.read') || hasWorkspaceWidePetVisibility;
  const canReadVaccinations = hasPermission('pet.vaccination.read') || hasWorkspaceWidePetVisibility;
  const canReadPrescriptions = hasPermission('pet.prescription.read') || hasWorkspaceWidePetVisibility;
  const canReadClinical = canReadMedicalRecords || canReadVaccinations || canReadPrescriptions;

  useEffect(() => {
    if (!canReadProfiles) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    Promise.allSettled([
      petService.getProfile(petId),
      canReadAppointments
        ? petService.listAppointments(0, APPOINTMENTS_LIMIT, '', { petId })
        : Promise.resolve(null),
      canReadClinical ? petService.getClinicalTimeline({ petId, limit: 200 }) : Promise.resolve(null),
      canReadVaccinations ? petService.listVaccinations(0, 100, '', { petId }) : Promise.resolve(null)
    ]).then(async (results) => {
      if (!active) return;
      const [petResult, appointmentsResult, timelineResult, vaccinationsResult] = results;

      const profile = petResult.status === 'fulfilled' ? petResult.value : null;
      setPet(profile);

      if (appointmentsResult.status === 'fulfilled' && appointmentsResult.value) {
        const items = resolvePageItems(appointmentsResult.value);
        setAppointments([...items].sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()));
      }
      if (timelineResult.status === 'fulfilled' && timelineResult.value) {
        setTimeline(timelineResult.value);
      }
      if (vaccinationsResult.status === 'fulfilled' && vaccinationsResult.value) {
        setVaccinations(resolvePageItems(vaccinationsResult.value));
      }

      if (profile && canReadClients) {
        try {
          const client = await petService.getClient(profile.clientId);
          if (active) setOwner(client);
        } catch {
          if (active) setOwner(null);
        }
      }

      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [canReadAppointments, canReadClients, canReadClinical, canReadProfiles, canReadVaccinations, petId]);

  const filteredEvents = useMemo(() => {
    if (!timeline) return [];
    let events = timeline.events;
    if (filters.eventType) {
      events = events.filter((event) => event.eventType === filters.eventType);
    }
    const days = PERIOD_DAYS[filters.period];
    if (days) {
      const from = addDays(startOfDay(), -days);
      events = events.filter((event) => new Date(event.occurredAt) >= from);
    }
    return events;
  }, [timeline, filters]);

  const groupedEvents = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents]);

  if (!canReadProfiles) {
    return <div className="ui-notice-warning">{t.noPermission}</div>;
  }

  if (loading) {
    return (
      <div className={sharedPageStackClass}>
        {showSubnav ? <PetModuleSubnav /> : null}
        <p className="text-sm text-[var(--muted)]">{t.loading}</p>
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

  const sexLabel = pet.gender === 'MALE' ? profileCopy.sexMale : pet.gender === 'FEMALE' ? profileCopy.sexFemale : null;
  const sizeLabels: Record<string, string> = {
    TOY: profileCopy.sizeToy,
    SMALL: profileCopy.sizeSmall,
    MEDIUM: profileCopy.sizeMedium,
    LARGE: profileCopy.sizeLarge,
    GIANT: profileCopy.sizeGiant
  };
  const sizeLabel = pet.size ? sizeLabels[pet.size] ?? pet.size : null;
  const details: Array<[string, string | null | undefined, boolean?]> = [
    [copy.owner, owner?.name ?? owner?.fullName],
    [copy.sex, sexLabel],
    [copy.size, sizeLabel],
    [copy.coat, pet.coatType],
    [copy.weight, pet.weight !== undefined && pet.weight !== null ? `${pet.weight} kg` : null, true],
    [copy.birth, pet.birthDate ? formatDateForLocale(locale, pet.birthDate) : null, true],
    [copy.color, pet.color]
  ];
  const careNotes: Array<{ label: string; value?: string; alert: boolean }> = [
    { label: copy.behavior, value: pet.behavior, alert: true },
    { label: copy.restrictions, value: pet.restrictions, alert: true },
    { label: copy.groomingNotes, value: pet.groomingNotes, alert: false }
  ].filter((note) => Boolean(note.value));
  const eventTypeLabel: Record<string, string> = {
    MEDICAL_RECORD: t.events.medicalRecord,
    VACCINATION: t.events.vaccination,
    PRESCRIPTION: t.events.prescription,
    APPOINTMENT: t.events.appointment
  };

  return (
    <div className={sharedPageStackClass}>
      {showSubnav ? <PetModuleSubnav /> : null}

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/pet/pets" className="inline-flex items-center gap-1 text-sm text-[var(--ink-2)] hover:text-[var(--ink)]">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t.backToPets}
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-[var(--ink)]">{pet.name}</h1>
          <p className="text-sm text-[var(--muted)]">{[pet.species, pet.breed].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => window.print()} className="ui-secondary-button">
            {copy.print}
          </button>
          {canCreateAppointments ? (
            <Link href="/pet/appointments?novo=1" className="ui-primary-button">
              {copy.schedule}
            </Link>
          ) : null}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {/* Appointments of this pet */}
          {canReadAppointments ? (
            <section aria-labelledby="pet-appointments-title">
              <h2 id="pet-appointments-title" className="mb-2 text-sm font-semibold text-[var(--ink)]">
                {copy.appointments} <span className="ui-mono font-normal text-[var(--muted)]">{appointments.length}</span>
              </h2>
              {appointments.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">{copy.appointmentsEmpty}</p>
              ) : (
                <div className="overflow-x-auto rounded-md border border-[color:var(--line)]">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[var(--bg-row)] text-left text-xs text-[var(--muted)]">
                      <tr className="border-b border-[color:var(--line)]">
                        <th scope="col" className="h-9 px-3 font-medium">{copy.colDate}</th>
                        <th scope="col" className="h-9 px-3 font-medium">{copy.colService}</th>
                        <th scope="col" className="h-9 px-3 font-medium">{copy.colProfessional}</th>
                        <th scope="col" className="h-9 px-3 font-medium">{copy.colStatus}</th>
                        <th scope="col" className="h-9 px-3 text-right font-medium">{copy.colAmount}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appointment) => {
                        const amount = appointment.finalAmountDue ?? appointment.servicePrice;
                        return (
                          <tr key={appointment.id} className="border-b border-[color:var(--line-soft)] last:border-b-0">
                            <td className="ui-mono h-10 whitespace-nowrap px-3">
                              {formatDateForLocale(locale, appointment.scheduledAt)} {formatTimeForLocale(locale, appointment.scheduledAt)}
                            </td>
                            <td className="max-w-[16rem] truncate px-3">{appointment.serviceName}</td>
                            <td className="px-3">{appointment.professionalName ?? '-'}</td>
                            <td className="px-3"><StatusBadge status={appointment.status} /></td>
                            <td className="ui-mono px-3 text-right">{amount ? formatCurrencyForLocale(locale, amount) : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ) : null}

          {/* Clinical history: only for users with clinical permissions */}
          {canReadClinical ? (
            <section aria-labelledby="pet-clinical-title" className="border-t border-[color:var(--line)] pt-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 id="pet-clinical-title" className="mr-auto text-sm font-semibold text-[var(--ink)]">
                  {copy.clinical}{' '}
                  <span className="ui-mono font-normal text-[var(--muted)]">
                    {copy.eventsCount.replace('{n}', String(filteredEvents.length))}
                  </span>
                </h2>
                <label className="ui-filter-chip" data-active={filters.eventType ? 'true' : 'false'}>
                  <span>{copy.eventType}</span>
                  <select
                    value={filters.eventType}
                    onChange={(event) => setFilters((current) => ({ ...current, eventType: event.target.value }))}
                    className="bg-transparent font-medium text-[var(--ink)] outline-none"
                  >
                    <option value="">{t.filters.allTypes}</option>
                    <option value="MEDICAL_RECORD">{t.events.medicalRecord}</option>
                    <option value="VACCINATION">{t.events.vaccination}</option>
                    <option value="PRESCRIPTION">{t.events.prescription}</option>
                  </select>
                </label>
                <label className="ui-filter-chip" data-active={filters.period ? 'true' : 'false'}>
                  <span>{t.filters.period}</span>
                  <select
                    value={filters.period}
                    onChange={(event) => setFilters((current) => ({ ...current, period: event.target.value }))}
                    className="bg-transparent font-medium text-[var(--ink)] outline-none"
                  >
                    <option value="">{t.filters.allTime}</option>
                    <option value="week">{t.filters.lastWeek}</option>
                    <option value="month">{t.filters.lastMonth}</option>
                    <option value="3months">{t.filters.last3Months}</option>
                    <option value="year">{t.filters.lastYear}</option>
                  </select>
                </label>
                {filters.eventType || filters.period ? (
                  <button
                    type="button"
                    onClick={() => setFilters({ eventType: '', period: '' })}
                    className="text-sm text-[var(--ink-2)] underline-offset-2 hover:underline"
                  >
                    {copy.clearFilters}
                  </button>
                ) : null}
              </div>

              {groupedEvents.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">{t.events.empty}</p>
              ) : (
                <ol>
                  {groupedEvents.map((group) => (
                    <li key={group.date} className="border-t border-[color:var(--line-soft)] py-2">
                      <h3 className="ui-mono text-xs text-[var(--muted)]">{formatDateForLocale(locale, group.date)}</h3>
                      <ul>
                        {group.events.map((event) => (
                          <li key={event.eventId} className="grid grid-cols-[56px_minmax(0,1fr)] gap-3 py-1.5">
                            <span className="ui-mono text-xs text-[var(--muted)]">{formatTimeForLocale(locale, event.occurredAt)}</span>
                            <div className="min-w-0">
                              <p className="text-sm">
                                <span className="text-xs text-[var(--muted)]">{eventTypeLabel[event.eventType] ?? event.eventType}</span>{' '}
                                <span className="font-medium text-[var(--ink)]">{event.title}</span>
                              </p>
                              {event.summary ? <p className="text-sm text-[var(--ink-2)]">{event.summary}</p> : null}
                              {event.professionalName || event.appointmentServiceName ? (
                                <p className="text-xs text-[var(--muted)]">
                                  {[event.professionalName, event.appointmentServiceName].filter(Boolean).join(' · ')}
                                </p>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ) : null}
        </div>

        <aside className="space-y-5">
          <section aria-labelledby="pet-details-title">
            <h2 id="pet-details-title" className="mb-2 text-sm font-semibold text-[var(--ink)]">{copy.details}</h2>
            <dl className="text-sm">
              {details.map(([label, value, mono]) => (
                <div key={label} className="flex justify-between gap-3 border-t border-[color:var(--line-soft)] py-1.5">
                  <dt className="text-[var(--muted)]">{label}</dt>
                  <dd className={`text-right ${mono ? 'ui-mono' : ''} ${value ? 'text-[var(--ink)]' : 'text-[var(--faint)]'}`}>
                    {value || copy.notInformed}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="pet-care-title">
            <h2 id="pet-care-title" className="mb-2 text-sm font-semibold text-[var(--ink)]">{copy.care}</h2>
            {careNotes.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">{copy.noCareNotes}</p>
            ) : (
              <dl className="text-sm">
                {careNotes.map((note) => (
                  <div key={note.label} className="border-t border-[color:var(--line-soft)] py-1.5">
                    <dt className="text-xs text-[var(--muted)]">{note.label}</dt>
                    <dd className={note.alert ? 'text-[var(--warn)]' : 'text-[var(--ink)]'}>{note.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          {canReadVaccinations && vaccinations.length > 0 ? (
            <section aria-labelledby="pet-vaccines-title">
              <h2 id="pet-vaccines-title" className="mb-2 text-sm font-semibold text-[var(--ink)]">
                {copy.vaccines} <span className="ui-mono font-normal text-[var(--muted)]">{vaccinations.length}</span>
              </h2>
              <ul>
                {vaccinations.map((vaccination) => {
                  const state = vaccineState(vaccination);
                  return (
                    <li key={vaccination.id} className="border-t border-[color:var(--line-soft)] py-2 text-sm">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-[var(--ink)]">{vaccination.vaccineName}</span>
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-[var(--ink-2)]">
                          <span
                            className="ui-status-dot"
                            data-status={state === 'overdue' ? 'danger' : state === 'dueSoon' ? 'warn' : 'done'}
                            aria-hidden="true"
                          />
                          {state === 'overdue' ? copy.vaccineOverdue : state === 'dueSoon' ? copy.vaccineDueSoon : copy.vaccineUpToDate}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)]">
                        {copy.vaccineApplied.replace('{date}', formatDateForLocale(locale, vaccination.appliedAt))}
                        {vaccination.nextDueAt
                          ? ` · ${copy.vaccineNextDose.replace('{date}', formatDateForLocale(locale, vaccination.nextDueAt))}`
                          : ''}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
