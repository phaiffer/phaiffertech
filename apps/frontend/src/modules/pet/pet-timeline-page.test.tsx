import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetTimelinePage } from '@/modules/pet/pet-timeline-page';

const { petServiceMock, platformState } = vi.hoisted(() => ({
  petServiceMock: {
    getProfile: vi.fn(),
    getClient: vi.fn(),
    listAppointments: vi.fn(),
    getClinicalTimeline: vi.fn(),
    listVaccinations: vi.fn()
  },
  platformState: {
    user: { permissions: [] as string[] },
    workspace: { hasFullPlatformVisibility: false, canManagePlatformAdministration: false }
  }
}));

vi.mock('@/shared/platform/use-frontend-platform', () => ({
  useFrontendPlatform: () => platformState
}));

vi.mock('@/shared/services/pet-service', () => ({
  petService: petServiceMock
}));

vi.mock('@/modules/pet/pet-module-subnav', () => ({
  PetModuleSubnav: () => <nav data-testid="pet-subnav" />
}));

describe('PetTimelinePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Banho e tosa user: no clinical permissions.
    platformState.user.permissions = ['pet.profile.read', 'pet.client.read', 'pet.appointment.read'];
    petServiceMock.getProfile.mockResolvedValue({
      id: 'pet-1',
      clientId: 'client-1',
      name: 'Thor',
      species: 'Cão',
      breed: 'Shih-tzu',
      behavior: 'Morde ao secar',
      createdAt: '2026-10-01T10:00:00Z',
      updatedAt: '2026-10-01T10:00:00Z'
    });
    petServiceMock.getClient.mockResolvedValue({ id: 'client-1', name: 'Fernanda Lima', status: 'ACTIVE', createdAt: '', updatedAt: '' });
    petServiceMock.listAppointments.mockResolvedValue({
      items: [{
        id: 'apt-1',
        clientId: 'client-1',
        petId: 'pet-1',
        serviceId: 'service-1',
        serviceName: 'Banho e tosa',
        professionalId: 'prof-1',
        professionalName: 'Jéssica',
        scheduledAt: '2026-10-31T12:00:00Z',
        status: 'COMPLETED',
        finalAmountDue: 85,
        createdAt: '',
        updatedAt: ''
      }],
      totalItems: 1,
      totalPages: 1,
      page: 0,
      size: 50
    });
  });

  it('opens for grooming users without clinical permissions and shows details, care and appointments', async () => {
    render(<PetTimelinePage petId="pet-1" />);

    expect(await screen.findByRole('heading', { name: 'Thor' })).toBeInTheDocument();
    expect(await screen.findByText('Fernanda Lima')).toBeInTheDocument();
    expect(screen.getByText('Morde ao secar')).toBeInTheDocument();
    expect(screen.getByText('Banho e tosa')).toBeInTheDocument();
    expect(petServiceMock.listAppointments).toHaveBeenCalledWith(0, 50, '', { petId: 'pet-1' });

    // No clinical section and no clinical requests without permission.
    expect(screen.queryByRole('heading', { name: /Clinical history/ })).not.toBeInTheDocument();
    expect(petServiceMock.getClinicalTimeline).not.toHaveBeenCalled();
  });

  it('does not load the profile without pet.profile.read', () => {
    platformState.user.permissions = [];

    render(<PetTimelinePage petId="pet-1" />);

    expect(petServiceMock.getProfile).not.toHaveBeenCalled();
  });
});
