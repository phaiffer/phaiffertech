import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

    expect(screen.getByRole('heading', { name: 'Grooming catalog' })).toBeInTheDocument();
    expect(screen.getByText('Banho Premium Porte Médio')).toBeInTheDocument();
    expect(screen.getByText('Shampoo Neutro x50 ML')).toBeInTheDocument();
    expect(screen.getByText('One-off and plan enabled')).toBeInTheDocument();
    expect(screen.getByText('1-1 of 1')).toBeInTheDocument();
  });

  it('keeps the editor closed until a service is created or edited', async () => {
    render(<PetServicesPage />);
    await screen.findByText('Banho Premium Porte Médio');

    expect(screen.queryByRole('group', { name: 'Price and time' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByRole('heading', { name: 'Edit service' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Price and time' })).toBeInTheDocument();
  });

  it('turns a service off from the row switch keeping the other fields', async () => {
    petServiceMock.updateService.mockResolvedValue({});
    render(<PetServicesPage />);
    await screen.findByText('Banho Premium Porte Médio');

    const toggle = screen.getByRole('switch', { name: 'Turn Banho Premium Porte Médio on or off' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(toggle);

    await waitFor(() => {
      expect(petServiceMock.updateService).toHaveBeenCalledWith('service-1', expect.objectContaining({
        active: false,
        basePrice: 110,
        durationMinutes: 60,
        allowInPlans: true,
        inventoryLinks: [{ inventoryItemId: 'inv-1', expectedQuantity: 50, consumptionRule: 'FIXED_PER_SERVICE', active: true }]
      }));
    });
    expect(await screen.findByText('Service updated.')).toBeInTheDocument();
  });
});
