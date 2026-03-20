import { useMemo } from 'react';
import { PetAppointment } from '@/shared/types/pet';

type CalendarProps = {
  appointments: PetAppointment[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onDateClick: (date: Date) => void;
  onEventClick: (event: React.MouseEvent, appointment: PetAppointment) => void;
};

export function PetAppointmentsCalendar({
  appointments,
  currentMonth,
  onMonthChange,
  onDateClick,
  onEventClick
}: CalendarProps) {
  const { days, blanksBefore } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return {
      blanksBefore: firstDay,
      days: Array.from({ length: totalDays }, (_, i) => i + 1)
    };
  }, [currentMonth]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map<number, PetAppointment[]>();
    appointments.forEach((apt) => {
      const d = new Date(apt.scheduledAt);
      if (
        d.getFullYear() === currentMonth.getFullYear() &&
        d.getMonth() === currentMonth.getMonth()
      ) {
        const dateKey = d.getDate();
        const existing = map.get(dateKey) || [];
        existing.push(apt);
        map.set(dateKey, existing);
      }
    });

    // Sort by time within each day
    map.forEach((list) => {
      list.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    });

    return map;
  }, [appointments, currentMonth]);

  function prevMonth() {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }

  function nextMonth() {
    onMonthChange(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  function getStatusColorClass(status: string) {
    const s = status.toUpperCase();
    if (s === 'COMPLETED') return 'border-success/30 bg-success-muted text-success';
    if (s === 'SCHEDULED') return 'border-info/30 bg-info-muted text-info';
    if (s === 'CONFIRMED') return 'border-accent/30 bg-accent-muted text-accent';
    if (s === 'IN_PROGRESS') return 'border-warning/30 bg-warning-muted text-warning';
    if (s === 'CANCELED' || s === 'NO_SHOW') return 'border-danger/30 bg-danger-muted text-danger line-through';
    return 'border-border bg-surface-inset text-muted';
  }

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="ui-surface-panel p-4 overflow-hidden flex flex-col h-full min-h-[600px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[color:var(--app-shell-heading)]">
          {currentMonth.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="ui-secondary-button px-3 py-1 text-sm">&larr; Prev</button>
          <button
            onClick={() => onMonthChange(new Date())}
            className="ui-secondary-button px-3 py-1 text-sm font-semibold"
          >
            Today
          </button>
          <button onClick={nextMonth} className="ui-secondary-button px-3 py-1 text-sm">Next &rarr;</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-[color:var(--app-shell-border)] border border-[color:var(--app-shell-border)] rounded-md overflow-hidden flex-1">
        {weekdays.map((day) => (
          <div key={day} className="bg-[color:var(--app-shell-surface-muted)] py-2 text-center text-xs font-semibold text-[color:var(--app-shell-muted)] uppercase tracking-wider">
            {day}
          </div>
        ))}

        {Array.from({ length: blanksBefore }).map((_, i) => (
          <div key={`blank-${i}`} className="bg-[color:var(--app-shell-surface)] min-h-[100px]" />
        ))}

        {days.map((day) => {
          const isToday =
            new Date().getDate() === day &&
            new Date().getMonth() === currentMonth.getMonth() &&
            new Date().getFullYear() === currentMonth.getFullYear();
          const dayAppointments = appointmentsByDay.get(day) || [];

          return (
            <div
              key={day}
              onClick={() => onDateClick(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 8, 0))}
              className={`bg-[color:var(--app-shell-surface)] min-h-[100px] p-1 border-t border-[color:var(--app-shell-border)] cursor-pointer hover:bg-[color:var(--app-shell-panel-muted)] transition-colors ${
                isToday ? 'bg-[color:var(--tenant-primary-soft)]' : ''
              }`}
            >
              <div className="flex justify-between items-center px-1 mb-1">
                <span className={`text-sm font-medium ${isToday ? 'text-[color:var(--tenant-primary)]' : 'text-[color:var(--app-shell-muted)]'}`}>
                  {day}
                </span>
                {dayAppointments.length > 0 && (
                  <span className="text-[10px] text-[color:var(--app-shell-muted)] bg-[color:var(--app-shell-border)] px-1.5 rounded-full">
                    {dayAppointments.length}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto no-scrollbar pb-1">
                {dayAppointments.map((apt) => {
                  const time = new Date(apt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={apt.id}
                      onClick={(e) => onEventClick(e, apt)}
                      className={`text-[10px] p-1 rounded border truncate hover:opacity-80 transition-opacity ${getStatusColorClass(apt.status)}`}
                      title={`${time} - ${apt.petName || 'Pet'} (${apt.serviceName})`}
                    >
                      <span className="font-semibold mr-1">{time}</span>
                      {apt.petName || 'Pet'}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
