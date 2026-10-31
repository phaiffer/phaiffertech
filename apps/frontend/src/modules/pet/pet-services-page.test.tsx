import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetServicesPage } from '@/modules/pet/pet-services-page';

const { hasPermissionMock, hasAnyPermissionMock, petServiceMock, platformState } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  hasAnyPermissionMock: vi.fn(),
  petServiceMock: {
    listServices: vi.fn(),
    listProducts: vi.fn(),
    createService: vi.fn(),
    updateService: vi.fn(),
    deleteService: vi.fn()
  },
  platformState: {
    user: {
      permissions: ['pet.service.read', 'pet.service.create', 'pet.service.update', 'pet.service.delete'],
      featureEntitlements: ['pet.aesthetics', 'pet.retail', 'pet.clinic']
    }
  }
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: hasPermissionMock,
    hasAnyPermission: hasAnyPermissionMock
  })
}));

vi.mock('@/shared/platform/use-frontend-platform', () => ({
  useFrontendPlatform: () => platformState
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

describe('PetServicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermissionMock.mockReturnValue(true);
    hasAnyPermissionMock.mockReturnValue(true);
    petServiceMock.listServices.mockResolvedValue(createPageResponse([
      {
        id: 'service-1',
        name: 'Banho Premium Porte Médio',
        description: 'Banho completo com secagem e hidratação.',
        category: 'GROOMING',
        active: true,
        basePrice: 110,
        durationMinutes: 60,
        commissionEligible: true,
        allowInPlans: true,
        allowStandaloneBooking: true,
        inventoryLinks: [
          {
            id: 'link-1',
            inventoryItemId: 'inv-1',
            inventoryItemName: 'Shampoo Neutro',
            inventoryItemSku: 'SHP-001',
            unitOfMeasure: 'ML',
            expectedQuantity: 50,
            consumptionRule: 'FIXED_PER_SERVICE',
            active: true
          }
        ],
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z'
      }
    ]));
    petServiceMock.listProducts.mockResolvedValue(createPageResponse([
      {
        id: 'prod-1',
        inventoryItemId: 'inv-1',
        name: 'Shampoo Neutro',
        sku: 'SHP-001',
        price: 85,
        category: 'GROOMING_SUPPLY',
        unitOfMeasure: 'ML',
        currentQuantity: 500,
        stockQuantity: 500,
        minimumQuantity: 100,
        reorderPoint: 150,
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z'
      }
    ]));
  });

  it('renders the service catalog with booking rules and linked inventory recipes', async () => {
    render(<PetServicesPage />);

    await waitFor(() => {
      expect(petServiceMock.listServices).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Grooming catalog')).toBeInTheDocument();
    expect(screen.getByText('Banho Premium Porte Médio')).toBeInTheDocument();
    expect(screen.getByText('Shampoo Neutro x50 ML')).toBeInTheDocument();
    expect(screen.getByText('Can use plan sessions')).toBeInTheDocument();
  });
});
