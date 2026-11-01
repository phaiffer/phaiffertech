import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PetAppointmentsDayGrid } from '@/modules/pet/pet-appointments-day-grid';
import { formatTimeForLocale } from '@/shared/i18n/formatters';
import type { PetAppointment, PetProfessional, PetProfile } from '@/shared/types/pet';

const day = new Date(2026, 10, 3); // 3 Nov 2026, local time

function appointment(overrides: Partial<PetAppointment>): PetAppointment {
  return {
    id: 'apt-1',
    clientId: 'client-1',
    petId: 'pet-1',
    petName: 'Thor',
    serviceId: 'service-1',
    serviceName: 'Banho + tosa',
    professionalId: 'prof-1',
    professionalName: 'Jéssica',
    scheduledAt: new Date(2026, 10, 3, 9, 0).toISOString(),
    totalServiceDurationMinutes: 90,
    status: 'SCHEDULED',
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
    ...overrides
  };
}

const professionals: PetProfessional[] = [
  { id: 'prof-1', name: 'Jéssica', specialty: 'Tosadora', createdAt: '', updatedAt: '' },
  { id: 'prof-2', name: 'Diego', specialty: 'Banhista', createdAt: '', updatedAt: '' }
];
const profiles = [{ id: 'pet-1', name: 'Thor', breed: 'Shih-tzu' }] as PetProfile[];

describe('PetAppointmentsDayGrid', () => {
  it('renders one column per professional and places the block with its time range', () => {
    render(
      <PetAppointmentsDayGrid
        day={day}
        appointments={[appointment({})]}
        professionals={professionals}
        profiles={profiles}
        canCreate={false}
        onEventClick={vi.fn()}
        onSlotClick={vi.fn()}
      />
    );

    expect(screen.getByText('Jéssica')).toBeInTheDocument();
    expect(screen.getByText('Diego')).toBeInTheDocument();
    // 09:00 + 90 min of service duration, in the active locale's time format.
    const start = formatTimeForLocale('en-US', new Date(2026, 10, 3, 9, 0).toISOString());
    const end = formatTimeForLocale('en-US', new Date(2026, 10, 3, 10, 30).toISOString());
    expect(screen.getByText(`${start}-${end}`)).toBeInTheDocument();
    expect(screen.getByText(/Shih-tzu/)).toBeInTheDocument();
    // Not ready yet: no highlighter.
    expect(screen.getByText('Thor')).not.toHaveClass('ui-highlight');
  });

  it('highlights the pet name only when the appointment is ready and opens it on click', () => {
    const onEventClick = vi.fn();
    render(
      <PetAppointmentsDayGrid
        day={day}
        appointments={[appointment({ status: 'COMPLETED' })]}
        professionals={professionals}
        profiles={profiles}
        canCreate={false}
        onEventClick={onEventClick}
        onSlotClick={vi.fn()}
      />
    );

    const petName = screen.getByText('Thor');
    expect(petName).toHaveClass('ui-highlight');

    fireEvent.click(petName);
    expect(onEventClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'apt-1' }));
  });

  it('books at the clicked hour when the user can create appointments', () => {
    const onSlotClick = vi.fn();
    render(
      <PetAppointmentsDayGrid
        day={day}
        appointments={[]}
        professionals={professionals}
        profiles={profiles}
        canCreate
        onEventClick={vi.fn()}
        onSlotClick={onSlotClick}
      />
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Book at 14:00' })[0]);

    const booked = onSlotClick.mock.calls[0][0] as Date;
    expect(booked.getHours()).toBe(14);
    expect(booked.getDate()).toBe(3);
  });
});
