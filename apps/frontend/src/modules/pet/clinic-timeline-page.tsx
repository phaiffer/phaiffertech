'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ClinicEventType, ClinicTabs, petProfileHref } from '@/modules/pet/clinic-shared';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatDateForLocale, formatTimeForLocale } from '@/shared/i18n/formatters';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems } from '@/shared/lib/pagination';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { petService } from '@/shared/services/pet-service';
import type { PetClinicalTimeline, PetClinicalTimelineEvent, PetProfile, PetProfessional } from '@/shared/types/pet';
import { FilterChip } from '@/shared/ui/filter-chip';
import { PageTitle } from '@/shared/ui/page-title';

// PetClinicalTimelineService caps the response at 50 events.
const TIMELINE_LIMIT = 50;

type TimelineFilters = {
  petId: string;
  eventType: string;
  professionalId: string;
};

const emptyFilters: TimelineFilters = { petId: '', eventType: '', professionalId: '' };

type EventGroup = {
  day: string;
  events: PetClinicalTimelineEvent[];
};

// Groups by the viewer's calendar day; an event at 22h in Brazil is already the next day in UTC.
function localDay(value: string) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function groupByDay(events: PetClinicalTimelineEvent[]): EventGroup[] {
  const groups = new Map<string, PetClinicalTimelineEvent[]>();

  events.forEach((event) => {
    const day = localDay(event.occurredAt);
    groups.set(day, [...(groups.get(day) ?? []), event]);
  });

  return Array.from(groups, ([day, dayEvents]) => ({ day, events: dayEvents }))
    .sort((a, b) => b.day.localeCompare(a.day));
}

export function ClinicTimelinePage({ showSubnav = false }: { showSubnav?: boolean }) {
  const { locale } = useAppI18n();
  const t = useAppMessages().petClinic;
  const platform = useFrontendPlatform();

  const [timeline, setTimeline] = useState<PetClinicalTimeline | null>(null);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [professionals, setProfessionals] = useState<PetProfessional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TimelineFilters>(emptyFilters);

  const hasPermission = (permission: string) => platform.user?.permissions.includes(permission) ?? false;
  const hasWorkspaceWidePetVisibility =
    platform.workspace.hasFullPlatformVisibility || platform.workspace.canManagePlatformAdministration;
  const canReadMedicalRecords = hasPermission('pet.medical-record.read') || hasWorkspaceWidePetVisibility;
  const canReadProfiles = hasPermission('pet.profile.read') || hasWorkspaceWidePetVisibility;
  const canReadProfessionals = hasPermission('pet.professional.read') || hasWorkspaceWidePetVisibility;
  const timelineError = t.errors.timeline;

  useEffect(() => {
    // The API only answers per pet or appointment; calling it without one is always a 400.
    if (!canReadMedicalRecords || !filters.petId) {
      setTimeline(null);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    petService.getClinicalTimeline({ petId: filters.petId, limit: TIMELINE_LIMIT })
      .then((result) => {
        if (active) {
          setTimeline(result);
        }
      })
      .catch((err) => {
        if (active) {
          setTimeline(null);
          setError(resolveApiErrorMessage(err, timelineError));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [canReadMedicalRecords, filters.petId, timelineError]);

  // The filters still work with an empty list, so a failed lookup is not a page error.
  useEffect(() => {
    let active = true;

    Promise.allSettled([
      canReadProfiles ? petService.listProfiles(0, 200, '') : Promise.resolve(null),
      canReadProfessionals ? petService.listProfessionals(0, 200, '') : Promise.resolve(null)
    ]).then(([petsResult, professionalsResult]) => {
      if (!active) {
        return;
      }
      if (petsResult.status === 'fulfilled' && petsResult.value) {
        setPets(resolvePageItems(petsResult.value));
      }
      if (professionalsResult.status === 'fulfilled' && professionalsResult.value) {
        setProfessionals(resolvePageItems(professionalsResult.value));
      }
    });

    return () => {
      active = false;
    };
  }, [canReadProfiles, canReadProfessionals]);

  const filteredEvents = useMemo(
    () => (timeline?.events ?? []).filter((event) => (
      (!filters.eventType || event.eventType === filters.eventType)
      && (!filters.professionalId || event.professionalId === filters.professionalId)
    )),
    [timeline, filters.eventType, filters.professionalId]
  );
  const groups = useMemo(() => groupByDay(filteredEvents), [filteredEvents]);

  if (!canReadMedicalRecords) {
    return <div className="ui-notice-warning">{t.noPermission}</div>;
  }

  const hasFilters = Boolean(filters.petId || filters.eventType || filters.professionalId);

  return (
    <div className={sharedPageStackClass}>
      {showSubnav ? <PetModuleSubnav /> : null}
      <ClinicTabs />

      <PageTitle
        title={t.timeline.title}
        description={t.timeline.description}
        count={loading || !filters.petId ? undefined : filteredEvents.length}
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip
          label={t.timeline.filterPet}
          value={filters.petId}
          onChange={(petId) => setFilters((current) => ({ ...current, petId }))}
          options={[{ value: '', label: t.timeline.selectPet }, ...pets.map((pet) => ({ value: pet.id, label: pet.name }))]}
        />
        <FilterChip
          label={t.timeline.filterType}
          value={filters.eventType}
          onChange={(eventType) => setFilters((current) => ({ ...current, eventType }))}
          options={[
            { value: '', label: t.timeline.all },
            { value: 'MEDICAL_RECORD', label: t.timeline.types.medicalRecord },
            { value: 'VACCINATION', label: t.timeline.types.vaccination },
            { value: 'PRESCRIPTION', label: t.timeline.types.prescription }
          ]}
        />
        <FilterChip
          label={t.timeline.filterProfessional}
          value={filters.professionalId}
          onChange={(professionalId) => setFilters((current) => ({ ...current, professionalId }))}
          options={[{ value: '', label: t.timeline.all }, ...professionals.map((item) => ({ value: item.id, label: item.name }))]}
        />
        {hasFilters ? (
          <button type="button" className="ui-inline-button" onClick={() => setFilters(emptyFilters)}>
            {t.timeline.clearFilters}
          </button>
        ) : null}
      </div>

      {loading ? <div className="ui-notice-neutral">{t.loading}</div> : null}
      {error ? <div className="ui-notice-error">{error}</div> : null}

      {!filters.petId ? <p className="text-sm text-[var(--muted)]">{t.timeline.selectPetHint}</p> : null}

      {filters.petId && !loading && !error && groups.length === 0 ? (
        <div>
          <p className="text-sm font-medium text-[var(--ink)]">{t.timeline.empty}</p>
          <p className="text-sm text-[var(--muted)]">{t.timeline.emptyHint}</p>
        </div>
      ) : null}

      {!loading ? groups.map((group) => (
        <section key={group.day} aria-label={formatDateForLocale(locale, group.events[0].occurredAt)} className="space-y-1">
          <h2 className="ui-mono border-b border-[color:var(--line)] pb-1 text-xs font-semibold text-[var(--ink-2)]">
            {formatDateForLocale(locale, group.events[0].occurredAt)}
          </h2>
          <ul className="divide-y divide-[color:var(--line-soft)]">
            {group.events.map((event) => (
              <li key={event.eventId} className="grid gap-1 py-2 text-sm sm:grid-cols-[4rem_8rem_minmax(0,1fr)] sm:gap-3">
                <span className="ui-mono text-xs text-[var(--ink-2)]">{formatTimeForLocale(locale, event.occurredAt)}</span>
                <ClinicEventType type={event.eventType} />
                <div className="min-w-0">
                  <p className="font-medium text-[var(--ink)]">{event.title}</p>
                  {event.summary ? <p className="text-[var(--ink-2)]">{event.summary}</p> : null}
                  <p className="text-xs text-[var(--muted)]">
                    {event.petName ? (
                      <Link href={petProfileHref(event.petId)} className="underline-offset-2 hover:underline">{event.petName}</Link>
                    ) : null}
                    {[event.professionalName, event.appointmentServiceName]
                      .filter(Boolean)
                      .map((detail) => ` · ${detail}`)
                      .join('')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )) : null}

      {!loading && timeline && timeline.totalEvents > timeline.events.length ? (
        <p className="text-xs text-[var(--muted)]">
          {t.timeline.partial
            .replace('{shown}', String(timeline.events.length))
            .replace('{total}', String(timeline.totalEvents))}
        </p>
      ) : null}
    </div>
  );
}
