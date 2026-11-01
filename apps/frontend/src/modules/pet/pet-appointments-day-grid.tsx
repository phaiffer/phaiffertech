'use client';

import { useMemo } from 'react';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatCurrencyForLocale, formatTimeForLocale } from '@/shared/i18n/formatters';
import type { PetAppointment, PetProfessional, PetProfile } from '@/shared/types/pet';

type PetAppointmentsDayGridProps = {
  day: Date;
  appointments: PetAppointment[];
  professionals: PetProfessional[];
  profiles: PetProfile[];
  canCreate: boolean;
  onEventClick: (appointment: PetAppointment) => void;
  onSlotClick: (date: Date) => void;
};

type GridColumn = {
  id: string;
  name: string;
  role?: string;
  appointments: PetAppointment[];
};

const DEFAULT_START_HOUR = 8;
const DEFAULT_END_HOUR = 19;
// 80px per hour fits the four lines of a one-hour block (time, pet, service, status).
const HOUR_HEIGHT_PX = 80;
const DEFAULT_DURATION_MINUTES = 60;
const MIN_BLOCK_MINUTES = 30;
const NO_PROFESSIONAL_ID = '__none__';

function minutesSinceMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function durationOf(appointment: PetAppointment) {
  return Math.max(appointment.totalServiceDurationMinutes ?? DEFAULT_DURATION_MINUTES, MIN_BLOCK_MINUTES);
}

function isSameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
}

function isInactiveStatus(status: string) {
  const normalized = status.toUpperCase();
  return normalized === 'CANCELED' || normalized === 'NO_SHOW';
}

// Comanda v2 day view: one column per professional, blocks placed by start time and
// real service duration. Status is a dot + text; the pet name gets the highlighter
// only when the appointment is ready (COMPLETED).
export function PetAppointmentsDayGrid({
  day,
  appointments,
  professionals,
  profiles,
  canCreate,
  onEventClick,
  onSlotClick
}: PetAppointmentsDayGridProps) {
  const { locale } = useAppI18n();
  const copy = useAppMessages().screens.petAppointments;
  const breedByPetId = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile.breed])), [profiles]);

  const columns = useMemo<GridColumn[]>(() => {
    const byProfessional = new Map<string, PetAppointment[]>();
    appointments.forEach((appointment) => {
      const key = appointment.professionalId || NO_PROFESSIONAL_ID;
      byProfessional.set(key, [...(byProfessional.get(key) ?? []), appointment]);
    });

    const known = professionals.map((professional) => ({
      id: professional.id,
      name: professional.name,
      role: professional.specialty,
      appointments: byProfessional.get(professional.id) ?? []
    }));
    const knownIds = new Set(professionals.map((professional) => professional.id));
    const unknown = Array.from(byProfessional.entries())
      .filter(([id]) => !knownIds.has(id))
      .map(([id, items]) => ({
        id,
        name: id === NO_PROFESSIONAL_ID ? copy.noProfessional : items[0]?.professionalName ?? copy.noProfessional,
        appointments: items
      }));

    return [...known, ...unknown];
  }, [appointments, copy.noProfessional, professionals]);

  const { startHour, endHour } = useMemo(() => {
    let start = DEFAULT_START_HOUR;
    let end = DEFAULT_END_HOUR;
    appointments.forEach((appointment) => {
      const begin = new Date(appointment.scheduledAt);
      const finish = minutesSinceMidnight(begin) + durationOf(appointment);
      start = Math.min(start, begin.getHours());
      end = Math.max(end, Math.ceil(finish / 60));
    });
    return { startHour: start, endHour: Math.min(end, 24) };
  }, [appointments]);

  const hours = Array.from({ length: endHour - startHour }, (_, index) => startHour + index);
  const gridHeight = hours.length * HOUR_HEIGHT_PX;
  const now = new Date();
  const nowOffset = isSameDay(now, day) && now.getHours() >= startHour && now.getHours() < endHour
    ? ((minutesSinceMidnight(now) - startHour * 60) / 60) * HOUR_HEIGHT_PX
    : null;

  const slotDate = (hour: number) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0);

  if (columns.length === 0) {
    return <p className="py-6 text-sm text-[var(--muted)]">{copy.dayEmpty}</p>;
  }

  return (
    <section aria-label={copy.dayGrid} className="overflow-x-auto rounded-md border border-[color:var(--line)]">
      <div
        className="grid min-w-[640px]"
        style={{ gridTemplateColumns: `56px repeat(${columns.length}, minmax(180px, 1fr))` }}
      >
        {/* Column headers */}
        <div className="border-b border-[color:var(--line)] bg-[var(--bg-row)]" />
        {columns.map((column) => (
          <div key={column.id} className="flex min-w-0 items-baseline gap-2 border-b border-l border-[color:var(--line)] bg-[var(--bg-row)] px-3 py-2">
            <span className="truncate text-sm font-semibold text-[var(--ink)]">{column.name}</span>
            {column.role ? <span className="truncate text-xs text-[var(--muted)]">{column.role}</span> : null}
            <span className="ui-mono ml-auto text-xs text-[var(--muted)]">{column.appointments.length}</span>
          </div>
        ))}

        {/* Time axis */}
        <div className="relative" style={{ height: gridHeight }}>
          {hours.map((hour, index) => (
            <span
              key={hour}
              className="ui-mono absolute right-2 text-xs text-[var(--muted)]"
              style={{ top: index * HOUR_HEIGHT_PX + 2 }}
            >
              {String(hour).padStart(2, '0')}:00
            </span>
          ))}
        </div>

        {/* Professional columns */}
        {columns.map((column) => (
          <div key={column.id} className="relative border-l border-[color:var(--line)]" style={{ height: gridHeight }}>
            {hours.map((hour, index) => (
              canCreate ? (
                <button
                  key={hour}
                  type="button"
                  onClick={() => onSlotClick(slotDate(hour))}
                  aria-label={copy.bookAt.replace('{time}', `${String(hour).padStart(2, '0')}:00`)}
                  className="absolute inset-x-0 border-t border-[color:var(--line-soft)] hover:bg-[var(--selected)]"
                  style={{ top: index * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
                />
              ) : (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-t border-[color:var(--line-soft)]"
                  style={{ top: index * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
                />
              )
            ))}

            {column.appointments.map((appointment) => {
              const begin = new Date(appointment.scheduledAt);
              const top = ((minutesSinceMidnight(begin) - startHour * 60) / 60) * HOUR_HEIGHT_PX;
              const height = (durationOf(appointment) / 60) * HOUR_HEIGHT_PX;
              const end = new Date(begin.getTime() + durationOf(appointment) * 60_000);
              const ready = appointment.status.toUpperCase() === 'COMPLETED';
              const inactive = isInactiveStatus(appointment.status);
              const breed = breedByPetId.get(appointment.petId);
              const amount = appointment.finalAmountDue ?? appointment.servicePrice;

              return (
                <button
                  key={appointment.id}
                  type="button"
                  onClick={() => onEventClick(appointment)}
                  className={`absolute inset-x-1 z-10 flex flex-col gap-0.5 overflow-hidden rounded-md [&>*]:shrink-0 border border-[color:var(--line)] bg-[var(--bg)] px-2 py-1.5 text-left hover:border-[color:var(--control)] ${
                    inactive ? 'opacity-60' : ''
                  }`}
                  style={{ top: top + 2, height: Math.max(height - 4, 28) }}
                >
                  {/* Three lines so a one-hour block shows everything: time + status,
                      pet + breed, service + amount. */}
                  <span className="flex items-center justify-between gap-2">
                    <span className="ui-mono text-xs text-[var(--muted)]">
                      {`${formatTimeForLocale(locale, begin.toISOString())}-${formatTimeForLocale(locale, end.toISOString())}`}
                    </span>
                    <StatusBadge status={appointment.status} />
                  </span>
                  <span className={`truncate text-sm font-semibold text-[var(--ink)] ${inactive ? 'line-through' : ''}`}>
                    <span className={ready ? 'ui-highlight' : ''}>{appointment.petName ?? '-'}</span>
                    {breed ? <span className="font-normal text-[var(--muted)]"> · {breed}</span> : null}
                  </span>
                  <span className="flex min-w-0 items-baseline justify-between gap-2 text-xs">
                    <span className="truncate text-[var(--ink-2)]">{appointment.serviceName}</span>
                    {amount ? <span className="ui-mono shrink-0 text-[var(--muted)]">{formatCurrencyForLocale(locale, amount)}</span> : null}
                  </span>
                </button>
              );
            })}

            {nowOffset !== null ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-[var(--danger)]"
                style={{ top: nowOffset }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
