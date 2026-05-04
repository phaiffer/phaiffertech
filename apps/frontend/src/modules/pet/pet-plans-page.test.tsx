import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetPlansPage } from '@/modules/pet/pet-plans-page';

const { hasPermissionMock, petServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  petServiceMock: {
    listClientPlans: vi.fn(),
    listPlanTemplates: vi.fn(),
    listClients: vi.fn(),
    listProfiles: vi.fn(),
    listServices: vi.fn(),
    getBillingMessageSettings: vi.fn(),
    updateBillingMessageSettings: vi.fn(),
    preparePlanRenewalMessage: vi.fn(),
    createClientPlan: vi.fn(),
    updateClientPlan: vi.fn(),
    deleteClientPlan: vi.fn(),
    createPlanTemplate: vi.fn(),
    updatePlanTemplate: vi.fn(),
    deletePlanTemplate: vi.fn()
  }
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: hasPermissionMock
  })
}));

vi.mock('@/shared/services/pet-service', () => ({
  petService: petServiceMock
}));

vi.mock('@/modules/pet/pet-module-subnav', () => ({
  PetModuleSubnav: () => <nav>PetFlow nav</nav>
}));

function createPageResponse<T>(items: T[]) {
  return {
    items,
    totalItems: items.length,
    totalPages: 1,
    page: 0,
    size: 20
  };
}

describe('PetPlansPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermissionMock.mockReturnValue(true);
    petServiceMock.listPlanTemplates.mockResolvedValue(createPageResponse([
      {
        id: 'template-1',
        commercialName: 'Banho 4x/mes',
        description: 'Pacote mensal de banhos recorrentes.',
        price: 240,
        validityDays: 30,
        totalSessions: 4,
        serviceIds: ['service-bath'],
        renewalRules: 'Avisar no penultimo uso.',
        active: true
      }
    ]));
    petServiceMock.listClientPlans.mockResolvedValue(createPageResponse([
      {
        id: 'plan-1',
        clientId: 'client-1',
        petId: 'pet-1',
        planTemplateId: 'template-1',
        planName: 'Banho 4x/mes',
        totalSessions: 4,
        usedSessions: 2,
        remainingSessions: 2,
        startedAt: '2026-05-01T00:00:00Z',
        expiresAt: '2026-05-31T23:59:59Z',
        finalPrice: 220,
        status: 'ACTIVE',
        renewalState: 'PENULTIMATE_USE',
        renewalRules: 'Avisar no penultimo uso.'
      }
    ]));
    petServiceMock.listClients.mockResolvedValue(createPageResponse([
      {
        id: 'client-1',
        name: 'Maria Responsavel',
        email: 'maria@example.com',
        phone: '11999999999',
        documentType: 'CPF',
        document: '52998224725',
        address: 'Rua Pet, 10',
        status: 'ACTIVE',
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z'
      }
    ]));
    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([
      {
        id: 'pet-1',
        clientId: 'client-1',
        name: 'Luna',
        species: 'Dog',
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z'
      }
    ]));
    petServiceMock.listServices.mockResolvedValue(createPageResponse([
      {
        id: 'service-bath',
        name: 'Banho',
        category: 'GROOMING',
        active: true,
        basePrice: 80,
        durationMinutes: 60,
        commissionEligible: true,
        allowInPlans: true,
        allowStandaloneBooking: true,
        inventoryLinks: [],
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z'
      }
    ]));
    petServiceMock.getBillingMessageSettings.mockResolvedValue({
      pixKey: null,
      billingDisplayName: null,
      planRenewalMessageTemplate: null,
      petReadyMessageTemplate: null,
      pixConfigured: false
    });
  });

  it('separates plan catalog from sold client pet plans and shows remaining session balance', async () => {
    render(<PetPlansPage />);

    await waitFor(() => {
      expect(petServiceMock.listPlanTemplates).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Catalogo de planos')).toBeInTheDocument();
    expect(screen.getAllByText('Banho 4x/mes').length).toBeGreaterThan(0);
    expect(screen.getByText('Pacote mensal de banhos recorrentes.')).toBeInTheDocument();
    expect(screen.getByText('Pet: Luna')).toBeInTheDocument();
    expect(screen.getByText('2 left')).toBeInTheDocument();
    expect(screen.getByText('PENULTIMATE_USE')).toBeInTheDocument();
  });
});
