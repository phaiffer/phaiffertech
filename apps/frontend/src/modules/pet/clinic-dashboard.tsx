'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ClinicEventType, ClinicTabs, petProfileHref } from '@/modules/pet/clinic-shared';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatDateForLocale, formatTimeForLocale } from '@/shared/i18n/formatters';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { petService } from '@/shared/services/pet-service';
import type { PetAppointment, PetClinicalTimeline, PetVaccination } from '@/shared/types/pet';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { PageTitle } from '@/shared/ui/page-title';

const VACCINATION_SAMPLE_SIZE = 200;
const VACCINATION_WINDOW_DAYS = 14;
const VISIBLE_VACCINATIONS = 8;
const RECENT_EVENTS = 8;
const DAY_MS = 86_400_000;

// The API has no clinical flag on services, so clinical visits are recognized by service name.
const CLINICAL_SERVICE_KEYWORDS = ['consulta', 'vacina', 'cirurgia', 'retorno', 'exame', 'checkup', 'check-up', 'veterinar'];

type DashboardState = {
  appointments: PetAppointment[];
  vaccinations: PetVaccination[];
  vaccinationTotal: number;
  timeline: PetClinicalTimeline | null;
  appointmentsFailed: boolean;
  vaccinationsFailed: boolean;
  timelineFailed: boolean;
};

const initialState: DashboardState = {
  appointments: [],
  vaccinations: [],
  vaccinationTotal: 0,
  timeline: null,
  appointmentsFailed: false,
  vaccinationsFailed: false,
  timelineFailed: false
};

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function daysUntil(value: string) {
  return Math.round((startOfDay(new Date(value)).getTime() - startOfDay().getTime()) / DAY_MS);
}

function isClinicalService(serviceName?: string) {
  const name = serviceName?.toLowerCase() ?? '';
  return CLINICAL_SERVICE_KEYWORDS.some((keyword) => name.includes(keyword));
}

export function ClinicDashboard({ showSubnav = false }: { showSubnav?: boolean }) {
  const { locale } = useAppI18n();
  const t = useAppMessages().petClinic;
  const platform = useFrontendPlatform();
  const [state, setState] = useState<DashboardState>(initialState);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const hasPermission = (permission: string) => platform.user?.permissions.includes(permission) ?? false;
  const hasWorkspaceWidePetVisibility =
    platform.workspace.hasFullPlatformVisibility || platform.workspace.canManagePlatformAdministration;
  const canReadMedicalRecords = hasPermission('pet.medical-record.read') || hasWorkspaceWidePetVisibility;
  const canReadVaccinations = hasPermission('pet.vaccination.read') || hasWorkspaceWidePetVisibility;
  const canReadPrescriptions = hasPermission('pet.prescription.read') || hasWorkspaceWidePetVisibility;
  const canReadAppointments = hasPermission('pet.appointment.read') || hasWorkspaceWidePetVisibility;
  const canReadClinic = canReadMedicalRecords || canReadVaccinations || canReadPrescriptions;

  const appointmentsError = t.errors.appointments;
  const vaccinationsError = t.errors.vaccinations;
  const timelineError = t.errors.timeline;

  useEffect(() => {
    if (!canReadClinic) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setErrors([]);

    Promise.allSettled([
      canReadAppointments
        ? petService.listAppointments(0, 100, '', {
            scheduledFrom: startOfDay().toISOString(),
            scheduledTo: endOfDay().toISOString()
          })
        : Promise.resolve(null),
      canReadVaccinations ? petService.listVaccinations(0, VACCINATION_SAMPLE_SIZE, '') : Promise.resolve(null),
      canReadMedicalRecords ? petService.getClinicalTimeline({ limit: RECENT_EVENTS }) : Promise.resolve(null)
    ]).then(([appointmentsResult, vaccinationsResult, timelineResult]) => {
      if (!active) {
        return;
      }

      const appointmentsPage = appointmentsResult.status === 'fulfilled' ? appointmentsResult.value : null;
      const vaccinationsPage = vaccinationsResult.status === 'fulfilled' ? vaccinationsResult.value : null;

      setState({
        appointments: appointmentsPage ? resolvePageItems(appointmentsPage) : [],
        vaccinations: vaccinationsPage ? resolvePageItems(vaccinationsPage) : [],
        vaccinationTotal: vaccinationsPage ? resolveTotalItems(vaccinationsPage) : 0,
        timeline: timelineResult.status === 'fulfilled' ? timelineResult.value : null,
        appointmentsFailed: appointmentsResult.status === 'rejected',
        vaccinationsFailed: vaccinationsResult.status === 'rejected',
        timelineFailed: timelineResult.status === 'rejected'
      });
      setErrors([
        appointmentsResult.status === 'rejected' ? resolveApiErrorMessage(appointmentsResult.reason, appointmentsError) : null,
        vaccinationsResult.status === 'rejected' ? resolveApiErrorMessage(vaccinationsResult.reason, vaccinationsError) : null,
        timelineResult.status === 'rejected' ? resolveApiErrorMessage(timelineResult.reason, timelineError) : null
      ].filter((message): message is string => Boolean(message)));
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [appointmentsError, canReadAppointments, canReadClinic, canReadMedicalRecords, canReadVaccinations, timelineError, vaccinationsError]);

  const clinicalAppointments = useMemo(
    () => state.appointments.filter((appointment) => (
      !['CANCELED', 'NO_SHOW'].includes(appointment.status.toUpperCase()) && isClinicalService(appointment.serviceName)
    )),
    [state.appointments]
  );

  const pendingVaccinations = useMemo(
    () => state.vaccinations
      .flatMap((vaccination) => (vaccination.nextDueAt ? [{ vaccination, days: daysUntil(vaccination.nextDueAt) }] : []))
      .filter((item) => item.days <= VACCINATION_WINDOW_DAYS)
      .sort((a, b) => a.days - b.days),
    [state.vaccinations]
  );

  const overdueCount = pendingVaccinations.filter((item) => item.days < 0).length;

  function dueLabel(days: number) {
    if (days === 0) {
      return t.vaccinations.dueToday;
    }
    if (days === -1) {
      return t.vaccinations.overdueOne;
    }
    if (days < 0) {
      return t.vaccinations.overdue.replace('{days}', String(Math.abs(days)));
    }
    return days === 1 ? t.vaccinations.dueInOne : t.vaccinations.dueIn.replace('{days}', String(days));
  }

  const appointmentColumns: DataTableColumn<PetAppointment>[] = [
    {
      key: 'time',
      header: t.appointments.columnTime,
      render: (row) => <span className="ui-mono text-[var(--ink)]">{formatTimeForLocale(locale, row.scheduledAt)}</span>
    },
    {
      key: 'pet',
      header: t.appointments.columnPet,
      render: (row) => (
        <Link href={petProfileHref(row.petId)} className="font-medium text-[var(--ink)] underline-offset-2 hover:underline">
          {row.petName ?? '-'}
        </Link>
      )
    },
    { key: 'service', header: t.appointments.columnService, render: (row) => row.serviceName },
    { key: 'professional', header: t.appointments.columnProfessional, render: (row) => row.professionalName ?? '-' },
    { key: 'status', header: t.appointments.columnStatus, render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'record',
      header: t.appointments.columnRecord,
      className: 'text-right',
      render: (row) => (
        <Link href={`/pet/medical-records?appointmentId=${row.id}`} className="ui-inline-button">
          {t.appointments.openRecord}
        </Link>
      )
    }
  ];

  if (!canReadClinic) {
    return <div className="ui-notice-warning">{t.noPermission}</div>;
  }

  const metrics = [
    {
      label: t.stats.clinicalAppointments,
      value: state.appointmentsFailed ? '-' : clinicalAppointments.length,
      tone: 'text-[var(--ink)]'
    },
    {
      label: t.stats.overdueVaccinations,
      value: state.vaccinationsFailed ? '-' : overdueCount,
      tone: overdueCount > 0 ? 'text-[var(--danger)]' : 'text-[var(--ink)]'
    },
    {
      label: t.stats.upcomingVaccinations,
      value: state.vaccinationsFailed ? '-' : pendingVaccinations.length - overdueCount,
      tone: 'text-[var(--ink)]'
    }
  ];
  const events = state.timeline?.events ?? [];

  return (
    <div className={sharedPageStackClass}>
      {showSubnav ? <PetModuleSubnav /> : null}
      <ClinicTabs />

      <PageTitle
        title={t.title}
        description={t.description}
        actions={canReadMedicalRecords ? (
          <Link href="/pet/medical-records?tab=records&novo=1" className="ui-primary-button">{t.actions.newRecord}</Link>
        ) : undefined}
      />

      {errors.map((message) => <div key={message} className="ui-notice-error">{message}</div>)}

      <dl className="grid gap-4 border-y border-[color:var(--line)] py-3 sm:grid-cols-3">
        {metrics.map((item) => (
          <div key={item.label}>
            <dt className="text-xs text-[var(--muted)]">{item.label}</dt>
            <dd className={`ui-mono mt-0.5 text-lg font-semibold ${item.tone}`}>{loading ? '-' : item.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="clinic-today" className="min-w-0 space-y-2">
          <h2 id="clinic-today" className="text-sm font-semibold text-[var(--ink)]">{t.appointments.title}</h2>
          <DataTable
            columns={appointmentColumns}
            rows={clinicalAppointments}
            getRowKey={(row) => row.id}
            loading={loading}
            loadingTitle={t.loading}
            emptyState={{ title: t.appointments.empty, description: '' }}
          />
        </section>

        <section aria-labelledby="clinic-vaccinations" className="min-w-0 space-y-2">
          <h2 id="clinic-vaccinations" className="text-sm font-semibold text-[var(--ink)]">{t.vaccinations.title}</h2>
          {state.vaccinationsFailed ? null : !loading && pendingVaccinations.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{t.vaccinations.empty}</p>
          ) : (
            <ul className="divide-y divide-[color:var(--line-soft)]">
              {pendingVaccinations.slice(0, VISIBLE_VACCINATIONS).map(({ vaccination, days }) => (
                <li key={vaccination.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    <Link href={petProfileHref(vaccination.petId)} className="font-medium text-[var(--ink)] underline-offset-2 hover:underline">
                      {vaccination.petName ?? '-'}
                    </Link>
                    <span className="block truncate text-xs text-[var(--ink-2)]">{vaccination.vaccineName}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-[var(--ink-2)]">
                    <span className="ui-status-dot" data-status={days < 0 ? 'danger' : 'warn'} aria-hidden="true" />
                    {dueLabel(days)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {state.vaccinationTotal > state.vaccinations.length ? (
            <p className="text-xs text-[var(--muted)]">
              {t.vaccinations.partial
                .replace('{shown}', String(state.vaccinations.length))
                .replace('{total}', String(state.vaccinationTotal))}
            </p>
          ) : null}
        </section>
      </div>

      {canReadMedicalRecords ? (
        <section aria-labelledby="clinic-recent" className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="clinic-recent" className="text-sm font-semibold text-[var(--ink)]">{t.timeline.recentTitle}</h2>
            <Link href="/pet/clinic/timeline" className="text-sm text-[var(--ink-2)] underline-offset-2 hover:text-[var(--ink)] hover:underline">
              {t.timeline.viewAll}
            </Link>
          </div>
          {state.timelineFailed ? null : !loading && events.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">{t.timeline.empty}</p>
          ) : (
            <ul className="divide-y divide-[color:var(--line-soft)]">
              {events.map((event) => (
                <li key={event.eventId} className="grid gap-1 py-2 text-sm sm:grid-cols-[7rem_8rem_minmax(0,1fr)] sm:gap-3">
                  <span className="ui-mono text-xs text-[var(--ink-2)]">{formatDateForLocale(locale, event.occurredAt)}</span>
                  <ClinicEventType type={event.eventType} />
                  <span className="min-w-0">
                    <span className="font-medium text-[var(--ink)]">{event.petName ?? event.title}</span>
                    {event.petName ? <span className="text-[var(--ink-2)]"> · {event.title}</span> : null}
                    {event.summary ? <span className="block truncate text-xs text-[var(--muted)]">{event.summary}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
