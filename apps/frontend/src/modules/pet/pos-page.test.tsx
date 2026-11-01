import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

    fireEvent.click(screen.getByRole('button', { name: 'Add Biscoito Natural Canino' }));

    // The item now appears in the current sale too.
    const sale = screen.getByRole('complementary', { name: 'Current sale' });
    expect(within(sale).getByText('Biscoito Natural Canino')).toBeInTheDocument();
  });

  it('adds the first result with Enter and opens the confirmation with F9', async () => {
    render(<POSPage />);
    await screen.findByText('Biscoito Natural Canino');

    const search = screen.getByPlaceholderText('Item code or name');
    fireEvent.change(search, { target: { value: 'bisc' } });
    fireEvent.keyDown(search, { key: 'Enter' });

    const sale = screen.getByRole('complementary', { name: 'Current sale' });
    expect(within(sale).getByText('Biscoito Natural Canino')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'F9' });
    expect(screen.getByRole('dialog', { name: 'Confirm sale' })).toBeInTheDocument();
  });

  it('does not show invented sales metrics', async () => {
    render(<POSPage />);
    await screen.findByText('Biscoito Natural Canino');

    // The pre-redesign page showed hardcoded numbers (12 sales, R$ 2,456.90...).
    expect(screen.queryByText(/2,456\.90|2\.456,90/)).not.toBeInTheDocument();
  });
});
