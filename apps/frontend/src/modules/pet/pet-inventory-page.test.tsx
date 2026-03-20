import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetInventoryPage } from '@/modules/pet/pet-inventory-page';

const { hasPermissionMock, hasAnyPermissionMock, petServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  hasAnyPermissionMock: vi.fn(),
  petServiceMock: {
    listProducts: vi.fn(),
    listInventoryMovements: vi.fn(),
    createInventoryMovement: vi.fn(),
    updateInventoryMovement: vi.fn(),
    deleteInventoryMovement: vi.fn()
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

describe('PetInventoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermissionMock.mockReturnValue(true);
    hasAnyPermissionMock.mockReturnValue(true);
    petServiceMock.listProducts.mockResolvedValue(createPageResponse([
      {
        id: 'product-1',
        name: 'Recovery Food Pack',
        sku: 'RFC-001',
        price: 89.9,
        category: 'PET_RETAIL_GOOD',
        unitOfMeasure: 'UNIT',
        currentQuantity: 1,
        stockQuantity: 1,
        minimumQuantity: 2,
        reorderPoint: 4,
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listInventoryMovements.mockResolvedValue(createPageResponse([
      {
        id: 'movement-1',
        productId: 'product-1',
        productName: 'Recovery Food Pack',
        productSku: 'RFC-001',
        movementType: 'OUT',
        quantity: 2,
        sourceType: 'MANUAL',
        reason: 'Cycle count adjustment',
        notes: 'Front desk recount',
        quantityBefore: 3,
        quantityAfter: 1,
        createdAt: '2026-03-18T10:00:00Z',
        updatedAt: '2026-03-18T10:00:00Z'
      }
    ]));
  });

  it('surfaces low-stock health and operational source context in the inventory workspace', async () => {
    render(<PetInventoryPage />);

    await waitFor(() => {
      expect(petServiceMock.listInventoryMovements).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Low stock products')).toBeInTheDocument();
    expect(screen.getByText('Stock health watchlist')).toBeInTheDocument();
    expect(screen.getByText('Recovery Food Pack')).toBeInTheDocument();
    expect(screen.getByText('Below minimum 2 UNIT.')).toBeInTheDocument();
    expect(screen.getByText('Manual adjustment')).toBeInTheDocument();
    expect(screen.getByText('Inventory ledger')).toBeInTheDocument();
  });
});
