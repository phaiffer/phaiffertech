'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  Syringe,
  FileText,
  Pill,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Calendar,
  PawPrint
} from 'lucide-react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatDateForLocale, formatTimeForLocale } from '@/shared/i18n/formatters';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems } from '@/shared/lib/pagination';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { petService } from '@/shared/services/pet-service';
import type {
  PetAppointment,
  PetClinicalTimeline,
  PetMedicalRecord,
  PetPrescription,
  PetVaccination
} from '@/shared/types/pet';

type ClinicDashboardProps = {
  eyebrow: string;
  title: string;
  description: string;
  showSubnav?: boolean;
};

type DashboardState = {
  todayAppointments: PetAppointment[];
  vaccinations: PetVaccination[];
  todayRecords: PetMedicalRecord[];
  prescriptions: PetPrescription[];
  timeline: PetClinicalTimeline | null;
};

type StatTone = 'default' | 'accent' | 'warning';

const initialState: DashboardState = {
  todayAppointments: [],
  vaccinations: [],
  todayRecords: [],
  prescriptions: [],
  timeline: null
};

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysDifference(date1: Date, date2: Date) {
  const diffTime = date1.getTime() - date2.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function ClinicStatCard({
  label,
  value,
  detail,
  tone = 'default',
  icon
}: {
  label: string;
  value: string;
  detail: string;
  tone?: StatTone;
  icon?: ReactNode;
}) {
  const toneClass = tone === 'accent'
    ? 'border-transparent bg-[linear-gradient(135deg,var(--accent),var(--petflow-teal))] text-white shadow-[0_24px_48px_-34px_rgba(16,185,129,0.52)]'
    : tone === 'warning'
      ? 'border-warning/20 bg-[linear-gradient(180deg,rgba(202,138,4,0.08),rgba(255,255,255,0.98))]'
      : 'border-slate-200/80 bg-white/95 shadow-[0_18px_38px_-32px_rgba(15,23,42,0.12)]';

  return (
    <div className={`rounded-[1.6rem] border p-6 ${toneClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${tone === 'accent' ? 'text-white/72' : 'text-slate-500'}`}>
            {label}
          </p>
          <p className={`mt-4 text-3xl font-semibold tracking-[-0.04em] ${tone === 'accent' ? 'text-white' : 'text-foreground'}`}>
            {value}
          </p>
        </div>
        {icon ? (
          <span
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
              tone === 'accent' ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className={`mt-3 text-sm leading-6 ${tone === 'accent' ? 'text-white/80' : 'text-slate-600'}`}>{detail}</p>
    </div>
  );
}

function TimelineEventBadge({ type }: { type: string }) {
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
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function VaccinationStatusBadge({ dueDate }: { dueDate: string }) {
  const today = startOfDay();
  const due = startOfDay(new Date(dueDate));
  const diff = daysDifference(due, today);

  if (diff < 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800">
        <AlertTriangle className="h-3 w-3" />
        Vencida ha {Math.abs(diff)} dias
      </span>
    );
  }

  if (diff === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
        <Clock className="h-3 w-3" />
        Vence hoje
      </span>
    );
  }

  if (diff <= 7) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
        <Clock className="h-3 w-3" />
        Vence em {diff} dias
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
      <Calendar className="h-3 w-3" />
      Vence em {diff} dias
    </span>
  );
}

export function ClinicDashboard({
  eyebrow,
  title,
  description,
  showSubnav = false
}: ClinicDashboardProps) {
  const { locale } = useAppI18n();
  const t = useAppMessages().petClinic;
  const platform = useFrontendPlatform();
  const [state, setState] = useState<DashboardState>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = (permission: string) => platform.user?.permissions.includes(permission) ?? false;
  const hasWorkspaceWidePetVisibility =
    platform.workspace.hasFullPlatformVisibility || platform.workspace.canManagePlatformAdministration;
  const canReadMedicalRecords = hasPermission('pet.medical-record.read') || hasWorkspaceWidePetVisibility;
  const canReadVaccinations = hasPermission('pet.vaccination.read') || hasWorkspaceWidePetVisibility;
  const canReadPrescriptions = hasPermission('pet.prescription.read') || hasWorkspaceWidePetVisibility;
  const canReadAppointments = hasPermission('pet.appointment.read') || hasWorkspaceWidePetVisibility;
  const canReadClinic = canReadMedicalRecords || canReadVaccinations || canReadPrescriptions;

  useEffect(() => {
    if (!canReadClinic) {
      setLoading(false);
      return;
    }

    let active = true;
    const todayStart = startOfDay();
    const todayEnd = endOfDay();
    const thirtyDaysAgo = addDays(todayStart, -30);
    const fourteenDaysFromNow = addDays(todayEnd, 14);

    setLoading(true);
    setError(null);

    Promise.allSettled([
      canReadAppointments
        ? petService.listAppointments(0, 100, '', {
            scheduledFrom: todayStart.toISOString(),
            scheduledTo: todayEnd.toISOString()
          })
        : Promise.resolve(null),
      canReadVaccinations
        ? petService.listVaccinations(0, 200, '')
        : Promise.resolve(null),
      canReadMedicalRecords
        ? petService.listMedicalRecords(0, 100, '')
        : Promise.resolve(null),
      canReadPrescriptions
        ? petService.listPrescriptions(0, 100, '')
        : Promise.resolve(null),
      petService.getClinicalTimeline({ limit: 10 })
    ]).then((results) => {
      if (!active) return;

      const [
        appointmentsResult,
        vaccinationsResult,
        recordsResult,
        prescriptionsResult,
        timelineResult
      ] = results;

      const nextErrors: string[] = [];

      const allVaccinations = vaccinationsResult.status === 'fulfilled' && vaccinationsResult.value
        ? resolvePageItems(vaccinationsResult.value)
        : [];

      // Filter vaccinations with nextDueAt within the next 14 days or already overdue
      const pendingVaccinations = allVaccinations.filter((v) => {
        if (!v.nextDueAt) return false;
        const dueDate = new Date(v.nextDueAt);
        return dueDate <= fourteenDaysFromNow;
      }).sort((a, b) => {
        if (!a.nextDueAt || !b.nextDueAt) return 0;
        return new Date(a.nextDueAt).getTime() - new Date(b.nextDueAt).getTime();
      });

      const allRecords = recordsResult.status === 'fulfilled' && recordsResult.value
        ? resolvePageItems(recordsResult.value)
        : [];

      // Filter records created today
      const todayRecords = allRecords.filter((r) => {
        const createdDate = startOfDay(new Date(r.createdAt));
        return createdDate.getTime() === todayStart.getTime();
      });

      const allPrescriptions = prescriptionsResult.status === 'fulfilled' && prescriptionsResult.value
        ? resolvePageItems(prescriptionsResult.value)
        : [];

      // Filter prescriptions from the last 30 days
      const activePrescriptions = allPrescriptions.filter((p) => {
        const createdDate = new Date(p.createdAt);
        return createdDate >= thirtyDaysAgo;
      });

      setState({
        todayAppointments: appointmentsResult.status === 'fulfilled' && appointmentsResult.value
          ? resolvePageItems(appointmentsResult.value).filter(
              (a) => !['CANCELED', 'NO_SHOW'].includes(a.status.toUpperCase())
            )
          : [],
        vaccinations: pendingVaccinations,
        todayRecords,
        prescriptions: activePrescriptions,
        timeline: timelineResult.status === 'fulfilled' ? timelineResult.value : null
      });

      if (vaccinationsResult.status === 'rejected') {
        nextErrors.push(
          vaccinationsResult.reason instanceof ApiClientError
            ? vaccinationsResult.reason.message
            : t.errors.vaccinations
        );
      }

      if (recordsResult.status === 'rejected') {
        nextErrors.push(
          recordsResult.reason instanceof ApiClientError
            ? recordsResult.reason.message
            : t.errors.records
        );
      }

      setError(nextErrors.length > 0 ? nextErrors.join(' ') : null);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [
    canReadAppointments,
    canReadClinic,
    canReadMedicalRecords,
    canReadPrescriptions,
    canReadVaccinations,
    t.errors.records,
    t.errors.vaccinations
  ]);

  // Filter clinical appointments (services that are likely veterinary)
  const clinicalAppointments = useMemo(() => {
    const clinicalKeywords = ['consulta', 'vacina', 'cirurgia', 'retorno', 'exame', 'checkup', 'check-up', 'veterinar'];
    return state.todayAppointments.filter((a) => {
      const serviceName = a.serviceName?.toLowerCase() ?? '';
      return clinicalKeywords.some((keyword) => serviceName.includes(keyword));
    });
  }, [state.todayAppointments]);

  const overdueVaccinations = useMemo(() => {
    const today = startOfDay();
    return state.vaccinations.filter((v) => {
      if (!v.nextDueAt) return false;
      return new Date(v.nextDueAt) < today;
    });
  }, [state.vaccinations]);

  if (!canReadClinic) {
    return <div className="ui-notice-warning">{t.noPermission}</div>;
  }

  return (
    <div className={sharedPageStackClass}>
      {showSubnav ? <PetModuleSubnav /> : null}

      {/* Header Section */}
      <section className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(16,185,129,0.05),rgba(255,255,255,0.98)_120px)] p-6 shadow-[0_24px_54px_-40px_rgba(15,23,42,0.14)] lg:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-900 lg:text-[2.2rem]">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/pet/clinic/timeline"
              className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              {t.actions.viewTimeline}
            </Link>
            <Link
              href="/pet/appointments"
              className="inline-flex items-center rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--petflow-teal))] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_-26px_rgba(16,185,129,0.52)]"
            >
              {t.actions.newRecord}
            </Link>
          </div>
        </div>
      </section>

      {loading ? <div className="ui-notice-neutral">{t.loading}</div> : null}
      {error ? <div className="ui-notice-error">{error}</div> : null}

      {!loading ? (
        <>
          {/* Stat Cards */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <ClinicStatCard
              label={t.stats.clinicalAppointments}
              value={String(clinicalAppointments.length)}
              detail={t.stats.clinicalAppointmentsDetail}
              tone="accent"
              icon={<Stethoscope className="h-5 w-5" />}
            />
            <ClinicStatCard
              label={t.stats.pendingVaccinations}
              value={String(state.vaccinations.length)}
              detail={`${overdueVaccinations.length} vencida(s) · ${t.stats.pendingVaccinationsDetail}`}
              tone={overdueVaccinations.length > 0 ? 'warning' : 'default'}
              icon={<Syringe className="h-5 w-5" />}
            />
            <ClinicStatCard
              label={t.stats.todayRecords}
              value={String(state.todayRecords.length)}
              detail={t.stats.todayRecordsDetail}
              icon={<FileText className="h-5 w-5" />}
            />
            <ClinicStatCard
              label={t.stats.activePrescriptions}
              value={String(state.prescriptions.length)}
              detail={t.stats.activePrescriptionsDetail}
              icon={<Pill className="h-5 w-5" />}
            />
          </div>

          {/* Pending Vaccinations Section */}
          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_38px_-32px_rgba(15,23,42,0.10)] lg:p-7">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-900">
                  {t.vaccinations.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{t.vaccinations.description}</p>
              </div>
              {state.vaccinations.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {state.vaccinations.length} pendente(s)
                </span>
              ) : null}
            </div>

            {state.vaccinations.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500" />
                <p className="text-sm font-medium text-slate-700">{t.vaccinations.empty}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {state.vaccinations.slice(0, 5).map((vaccination) => (
                  <div
                    key={vaccination.id}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                        <PawPrint className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {vaccination.petName ?? 'Pet'}
                        </p>
                        <p className="text-sm text-slate-600">{vaccination.vaccineName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {vaccination.nextDueAt ? (
                        <VaccinationStatusBadge dueDate={vaccination.nextDueAt} />
                      ) : null}
                      <Link
                        href={`/pet/pets/${vaccination.petId}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                      >
                        {t.vaccinations.viewPet}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Timeline Section */}
          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_38px_-32px_rgba(15,23,42,0.10)] lg:p-7">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-900">
                  {t.timeline.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{t.timeline.description}</p>
              </div>
              <Link
                href="/pet/clinic/timeline"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--accent)] hover:underline"
              >
                {t.timeline.viewAll}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {!state.timeline || state.timeline.events.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
                <FileText className="mb-3 h-10 w-10 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">{t.timeline.empty}</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[19px] top-2 h-[calc(100%-16px)] w-px bg-slate-200" />
                <div className="space-y-4">
                  {state.timeline.events.slice(0, 5).map((event) => (
                    <div key={event.eventId} className="relative flex gap-4 pl-10">
                      <div className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-slate-100 shadow-sm">
                        {event.eventType === 'MEDICAL_RECORD' ? (
                          <FileText className="h-4 w-4 text-blue-600" />
                        ) : event.eventType === 'VACCINATION' ? (
                          <Syringe className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <Pill className="h-4 w-4 text-purple-600" />
                        )}
                      </div>
                      <div className="flex-1 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <TimelineEventBadge type={event.eventType} />
                          <span className="text-xs text-slate-500">
                            {formatTimeForLocale(locale, event.occurredAt)} - {formatDateForLocale(locale, event.occurredAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-900">{event.title}</p>
                        {event.summary ? (
                          <p className="mt-1 text-sm text-slate-600">{event.summary}</p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          {event.petName ? (
                            <span className="inline-flex items-center gap-1">
                              <PawPrint className="h-3 w-3" />
                              {event.petName}
                            </span>
                          ) : null}
                          {event.professionalName ? (
                            <span className="inline-flex items-center gap-1">
                              <Stethoscope className="h-3 w-3" />
                              {event.professionalName}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Clinical Appointments Today Section */}
          <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_18px_38px_-32px_rgba(15,23,42,0.10)] lg:p-7">
            <div className="mb-6">
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-900">
                {t.appointments.title}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{t.appointments.description}</p>
            </div>

            {clinicalAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
                <Calendar className="mb-3 h-10 w-10 text-slate-400" />
                <p className="text-sm font-medium text-slate-700">{t.appointments.empty}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Horario
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Servico
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Pet
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Profissional
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Acoes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clinicalAppointments.map((appointment) => (
                      <tr key={appointment.id} className="group">
                        <td className="py-4 text-sm font-medium text-slate-900">
                          {formatTimeForLocale(locale, appointment.scheduledAt)}
                        </td>
                        <td className="py-4 text-sm text-slate-700">{appointment.serviceName}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                              <PawPrint className="h-4 w-4 text-slate-600" />
                            </div>
                            <span className="text-sm text-slate-700">{appointment.petName ?? 'Pet'}</span>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-slate-700">
                          {appointment.professionalName ?? '-'}
                        </td>
                        <td className="py-4">
                          <StatusBadge status={appointment.status} />
                        </td>
                        <td className="py-4 text-right">
                          <Link
                            href={`/pet/appointments/${appointment.id}`}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-900 group-hover:opacity-100"
                          >
                            Ver detalhes
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
