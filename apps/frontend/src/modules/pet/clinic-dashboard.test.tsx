import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClinicDashboard } from '@/modules/pet/clinic-dashboard';

const { petServiceMock } = vi.hoisted(() => ({
  petServiceMock: {
    listAppointments: vi.fn(),
    listVaccinations: vi.fn(),
    listMedicalRecords: vi.fn(),
    getClinicalTimeline: vi.fn()
  }
}));

vi.mock('@/shared/services/pet-service', () => ({ petService: petServiceMock }));

vi.mock('@/shared/platform/use-frontend-platform', () => ({
  useFrontendPlatform: () => ({
    user: { permissions: [] },
    workspace: { hasFullPlatformVisibility: true, canManagePlatformAdministration: false }
  })
}));

vi.mock('next/navigation', () => ({ usePathname: () => '/pet/clinic' }));

function page<T>(items: T[], totalItems = items.length) {
  return { items, totalItems, totalPages: 1, page: 0, size: 200 };
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

const appointment = {
  id: 'appt-1',
  petId: 'pet-1',
  petName: 'Kiara',
  serviceName: 'Consulta geriatrica',
  professionalName: 'Dra. Renata',
  scheduledAt: daysFromNow(0),
  status: 'CONFIRMED'
};

describe('ClinicDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    petServiceMock.listAppointments.mockResolvedValue(page([
      appointment,
      { ...appointment, id: 'appt-2', petName: 'Bob', serviceName: 'Banho simples' }
    ]));
    petServiceMock.listVaccinations.mockResolvedValue(page([
      { id: 'vac-1', petId: 'pet-2', petName: 'Fred', vaccineName: 'V10', nextDueAt: daysFromNow(-3) },
      { id: 'vac-2', petId: 'pet-3', petName: 'Luna', vaccineName: 'Giardia', nextDueAt: daysFromNow(5) },
      { id: 'vac-3', petId: 'pet-4', petName: 'Thor', vaccineName: 'Gripe', nextDueAt: daysFromNow(60) }
    ], 450));
    petServiceMock.listMedicalRecords.mockResolvedValue(page([
      { id: 'rec-1', petId: 'pet-5', petName: 'Rex', professionalName: 'Dra. Carla', description: 'Otite leve', createdAt: daysFromNow(-1) }
    ]));
  });

  it('builds recent records from the list, because the timeline requires a pet', async () => {
    render(<ClinicDashboard />);

    expect(await screen.findByRole('link', { name: 'Rex' })).toHaveAttribute('href', '/pet/pets/pet-5/timeline');
    expect(screen.getByText('Otite leve')).toBeInTheDocument();
    expect(petServiceMock.listMedicalRecords).toHaveBeenCalledWith(0, 8, '');
    expect(petServiceMock.getClinicalTimeline).not.toHaveBeenCalled();
  });

  it('counts clinical visits and vaccinations and links only to routes that exist', async () => {
    render(<ClinicDashboard />);

    const kiara = await screen.findByRole('link', { name: 'Kiara' });
    expect(kiara).toHaveAttribute('href', '/pet/pets/pet-1/timeline');
    expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/pet/medical-records?appointmentId=appt-1');

    const metrics = screen.getByText('Overdue vaccinations').closest('dl') as HTMLElement;
    expect(within(metrics).getAllByText('1')).toHaveLength(3);
    expect(screen.getByText('overdue by 3 days')).toBeInTheDocument();
    expect(screen.queryByText('Thor')).not.toBeInTheDocument();
    expect(screen.getByText('Based on 3 of 450 recorded vaccinations.')).toBeInTheDocument();
  });

  it('reports a records failure instead of showing it as empty', async () => {
    petServiceMock.listMedicalRecords.mockRejectedValue(new Error('boom'));

    render(<ClinicDashboard />);

    expect(await screen.findByText('Unable to load recent records.')).toBeInTheDocument();
    expect(screen.queryByText('No clinical events recorded.')).not.toBeInTheDocument();
  });

  it('does not present failed vaccination data as a zero count', async () => {
    petServiceMock.listVaccinations.mockRejectedValue(new Error('forbidden'));

    render(<ClinicDashboard />);

    await screen.findByText('Unable to load pending vaccinations.');
    const metrics = screen.getByText('Overdue vaccinations').closest('dl') as HTMLElement;
    expect(within(metrics).getAllByText('-')).toHaveLength(2);
    expect(screen.queryByText('No pending vaccinations in the next 14 days.')).not.toBeInTheDocument();
  });
});
