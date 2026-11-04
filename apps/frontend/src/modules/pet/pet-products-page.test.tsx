import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetProductsPage } from '@/modules/pet/pet-products-page';

const { hasPermissionMock, hasAnyPermissionMock, petServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  hasAnyPermissionMock: vi.fn(),
  petServiceMock: {
    listProducts: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn()
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

describe('PetProductsPage', () => {
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
        currentQuantity: 3,
        stockQuantity: 3,
        minimumQuantity: 2,
        reorderPoint: 4,
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
  });

  it('surfaces low-stock context in the refreshed product catalog', async () => {
    render(<PetProductsPage />);

    await waitFor(() => {
      expect(petServiceMock.listProducts).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument();
    expect(screen.getByText('Recovery Food Pack')).toBeInTheDocument();
    expect(screen.getAllByText('Retail product').length).toBeGreaterThan(0);
    expect(screen.getByText('Min 2 • Restock at 4')).toBeInTheDocument();
    expect(screen.getByText('Restock')).toBeInTheDocument();
    expect(screen.getByText('1-1 of 1')).toBeInTheDocument();
  });

  it('opens the product editor only when adding or editing', async () => {
    render(<PetProductsPage />);
    await screen.findByText('Recovery Food Pack');

    expect(screen.queryByRole('group', { name: 'Stock and restock' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByRole('heading', { name: 'Edit product' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Stock and restock' })).toBeInTheDocument();
    expect(screen.getByLabelText('Restock point')).toHaveValue(4);
  });
});
