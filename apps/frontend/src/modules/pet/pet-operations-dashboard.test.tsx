import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetOperationsDashboard } from '@/modules/pet/pet-operations-dashboard';

const { petServiceMock, platformState, routerPush } = vi.hoisted(() => ({
  routerPush: vi.fn(),
  petServiceMock: {
    listClients: vi.fn(),
    listAppointments: vi.fn(),
    listClientPlans: vi.fn(),
    listProducts: vi.fn(),
    listInvoices: vi.fn()
  },
  platformState: {
    user: {
      permissions: [
        'pet.dashboard.read',
        'pet.client.read',
        'pet.appointment.read',
        'pet.plan.read',
        'pet.product.read',
        'pet.invoice.read'
      ]
    },
    workspace: {
      hasFullPlatformVisibility: false,
      canManagePlatformAdministration: false
    }
  }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: routerPush })
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

describe('PetOperationsDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    platformState.user.permissions = [
      'pet.dashboard.read',
      'pet.client.read',
      'pet.appointment.read',
      'pet.plan.read',
      'pet.product.read',
      'pet.invoice.read'
    ];
    petServiceMock.listClients.mockResolvedValue(createPageResponse([
      {
        id: 'client-1',
        name: 'Marina Costa',
        email: 'marina@example.com',
        phone: '+55 11 99999-0000',
        status: 'ACTIVE',
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z'
      }
    ]));
    petServiceMock.listAppointments.mockResolvedValue(createPageResponse([
      {
        id: 'appointment-1',
        clientId: 'client-1',
        clientName: 'Marina Costa',
        petId: 'pet-1',
        petName: 'Thor',
        serviceId: 'service-1',
        serviceName: 'Banho & Tosa Higiênica',
        professionalId: 'prof-1',
        professionalName: 'Camila Rocha',
        scheduledAt: new Date().toISOString(),
        status: 'COMPLETED',
        servicePrice: 120,
        commissionAmount: 36,
        planCovered: true,
        clientPlanId: 'plan-1',
        createdAt: '2026-10-20T09:00:00Z',
        updatedAt: '2026-10-20T10:00:00Z'
      }
    ]));
    petServiceMock.listClientPlans.mockResolvedValue(createPageResponse([
      {
        id: 'plan-1',
        clientId: 'client-1',
        planName: 'Pacote Mensal 4 Banhos',
        totalSessions: 4,
        usedSessions: 3,
        remainingSessions: 1,
        price: 380,
        status: 'ACTIVE',
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-20T10:00:00Z'
      }
    ]));
    petServiceMock.listProducts.mockResolvedValue(createPageResponse([
      {
        id: 'prod-1',
        inventoryItemId: 'inv-1',
        name: 'Shampoo Neutro 5L',
        sku: 'SHP-001',
        price: 95,
        category: 'GROOMING_SUPPLY',
        unitOfMeasure: 'UNIT',
        currentQuantity: 1,
        stockQuantity: 1,
        minimumQuantity: 2,
        reorderPoint: 3,
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-01T10:00:00Z'
      }
    ]));
    petServiceMock.listInvoices.mockResolvedValue(createPageResponse([]));
  });

  it('loads and renders operational stats, queue and renewal alerts', async () => {
    render(
      <PetOperationsDashboard
        eyebrow="Operação Pet"
        title="Visão operacional do dia"
        description="Acompanhe fila, pacotes e cobrança."
        showSubnav
      />
    );

    await waitFor(() => {
      expect(petServiceMock.listClients).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId('pet-subnav')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Visão operacional do dia' })).toBeInTheDocument();
    // Plan near the end and low stock show up as pending items.
    expect(screen.getAllByText((text) => text.includes('Pacote Mensal 4 Banhos')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Shampoo Neutro 5L').length).toBeGreaterThan(0);
  });

  it("groups today's queue by stage and highlights ready pets", async () => {
    render(<PetOperationsDashboard title="Today" />);

    const petName = await screen.findByText('Thor');

    // COMPLETED appointments land in the "Ready" stage with the highlighter on the pet name.
    expect(screen.getByRole('heading', { name: /Ready/ })).toBeInTheDocument();
    expect(petName).toHaveClass('ui-highlight');
    expect(screen.getByText('pickup message ready')).toBeInTheDocument();
  });

  it('opens a new appointment with the N shortcut when the user can book', async () => {
    platformState.user.permissions = [...platformState.user.permissions, 'pet.appointment.create'];

    render(<PetOperationsDashboard title="Today" />);
    await screen.findByText('Thor');

    fireEvent.keyDown(window, { key: 'n' });

    expect(routerPush).toHaveBeenCalledWith('/pet/appointments?novo=1');
  });

  it('shows a permission warning when pet.dashboard.read is missing', () => {
    platformState.user.permissions = [];

    render(
      <PetOperationsDashboard
        eyebrow="Operação Pet"
        title="Visão operacional do dia"
        description="Acompanhe fila, pacotes e cobrança."
      />
    );

    expect(petServiceMock.listClients).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Visão operacional do dia' })).not.toBeInTheDocument();
  });
});
