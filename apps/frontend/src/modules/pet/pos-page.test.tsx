import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POSPage } from '@/modules/pet/pos-page';

const { petServiceMock, platformState } = vi.hoisted(() => ({
  petServiceMock: {
    listProducts: vi.fn(),
    listServices: vi.fn(),
    listClients: vi.fn()
  },
  platformState: {
    user: {
      permissions: ['pet.product.read', 'pet.service.read', 'pet.client.read', 'pet.invoice.write']
    },
    workspace: {
      hasFullPlatformVisibility: false,
      canManagePlatformAdministration: false
    }
  }
}));

vi.mock('@/shared/platform/use-frontend-platform', () => ({
  useFrontendPlatform: () => platformState
}));

vi.mock('@/shared/services/pet-service', () => ({
  petService: petServiceMock
}));

vi.mock('@/modules/pet/pet-module-subnav', () => ({
  PetModuleSubnav: () => <nav data-testid="pet-subnav">pet-subnav</nav>
}));

function createPageResponse<T>(items: T[]) {
  return {
    items,
    totalItems: items.length,
    totalPages: 1,
    page: 0,
    size: 200
  };
}

describe('POSPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.user.permissions = ['pet.product.read', 'pet.service.read', 'pet.client.read', 'pet.invoice.write'];
    petServiceMock.listProducts.mockResolvedValue(createPageResponse([
      {
        id: 'prod-1',
        inventoryItemId: 'inv-1',
        name: 'Biscoito Natural Canino',
        sku: 'BISC-001',
        price: 34.9,
        category: 'PET_RETAIL_GOOD',
        unitOfMeasure: 'UNIT',
        currentQuantity: 10,
        stockQuantity: 10,
        minimumQuantity: 2,
        reorderPoint: 4,
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z'
      }
    ]));
    petServiceMock.listServices.mockResolvedValue(createPageResponse([
      {
        id: 'srv-1',
        name: 'Corte de Unhas',
        description: 'Higiene rápida',
        category: 'GROOMING',
        active: true,
        basePrice: 35,
        durationMinutes: 20,
        commissionEligible: true,
        allowInPlans: false,
        allowStandaloneBooking: true,
        inventoryLinks: [],
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z'
      }
    ]));
    petServiceMock.listClients.mockResolvedValue(createPageResponse([]));
  });

  it('loads products and allows adding an item to the POS cart', async () => {
    render(<POSPage showSubnav />);

    await waitFor(() => {
      expect(petServiceMock.listProducts).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId('pet-subnav')).toBeInTheDocument();
    expect(screen.getByText('Biscoito Natural Canino')).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    const addProductButton = buttons.find((btn) => btn.className.includes('bg-[color:var(--accent)]') && !btn.textContent);
    expect(addProductButton).toBeDefined();
    if (addProductButton) {
      fireEvent.click(addProductButton);
    }

    expect(screen.getAllByText('Biscoito Natural Canino').length).toBeGreaterThan(1);
  });
});
