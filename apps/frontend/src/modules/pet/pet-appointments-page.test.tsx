import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetAppointmentsPage } from '@/modules/pet/pet-appointments-page';

const { hasPermissionMock, hasAnyPermissionMock, petServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  hasAnyPermissionMock: vi.fn(),
  petServiceMock: {
    listClients: vi.fn(),
    listProfiles: vi.fn(),
    listServices: vi.fn(),
    listProfessionals: vi.fn(),
    listClientPlans: vi.fn(),
    listAppointments: vi.fn(),
    createAppointment: vi.fn(),
    updateAppointment: vi.fn(),
    deleteAppointment: vi.fn()
  }
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: hasPermissionMock,
    hasAnyPermission: hasAnyPermissionMock
  })
}));

vi.mock('@/shared/services/pet-service', () => ({
  petService: petServiceMock
}));

function createPageResponse<T>(items: T[]) {
  return {
    items,
    totalItems: items.length,
    totalPages: 1,
    page: 0,
    size: 10
  };
}

function setGrantedPermissions(granted: string[]) {
  hasPermissionMock.mockImplementation((permission: string) => granted.includes(permission));
  hasAnyPermissionMock.mockImplementation((permissions: string[]) => permissions.some((permission) => granted.includes(permission)));
}

describe('PetAppointmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    setGrantedPermissions(['pet.appointment.read', 'pet.appointment.create', 'pet.medical-record.read']);

    petServiceMock.listClients.mockResolvedValue(createPageResponse([]));
    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([]));
    petServiceMock.listServices.mockResolvedValue(createPageResponse([]));
    petServiceMock.listProfessionals.mockResolvedValue(createPageResponse([]));
    petServiceMock.listClientPlans.mockResolvedValue(createPageResponse([]));
    petServiceMock.listAppointments.mockResolvedValue(createPageResponse([
      {
        id: 'appointment-1',
        clientId: 'client-1',
        clientName: 'Owner Example',
        petId: 'pet-1',
        petName: 'Pet Example',
        serviceId: 'service-1',
        serviceName: 'Bath',
        professionalId: 'professional-1',
        professionalName: 'Dr Example',
        scheduledAt: '2026-03-10T10:00:00Z',
        status: 'SCHEDULED',
        medicalRecordCount: 0,
        vaccinationCount: 0,
        prescriptionCount: 0,
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
  });

  it('shows degraded lookup diagnostics and enriched labels in the appointment table', async () => {
    render(<PetAppointmentsPage />);

    await waitFor(() => {
      expect(petServiceMock.listAppointments).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'View: Calendar' }));

    expect(screen.getByText('Some PetFlow references are not yet available.')).toBeInTheDocument();
    expect(screen.getByText(/pet\.client\.read/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Owner Example')).toBeInTheDocument();
      expect(screen.getByText('Pet Example')).toBeInTheDocument();
      expect(screen.getByText('Dr Example')).toBeInTheDocument();
      expect(screen.getByText('Bath')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('0 records · 0 vaccines · 0 rx')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Care notes' })).toHaveAttribute(
        'href',
        '/pet/medical-records?appointmentId=appointment-1'
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Book appointment' }));

    expect(
      screen.getByText('To book an appointment, first add at least one client, pet, service, and professional. Return here once those are ready.')
    ).toBeInTheDocument();
  });
});
