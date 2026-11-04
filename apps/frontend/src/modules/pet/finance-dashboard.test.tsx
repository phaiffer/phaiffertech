import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FinanceDashboard } from '@/modules/pet/finance-dashboard';

const { financeServiceMock, hasAnyPermissionMock } = vi.hoisted(() => ({
  financeServiceMock: {
    listInvoices: vi.fn(),
    listCashMovements: vi.fn(),
    listPayments: vi.fn()
  },
  hasAnyPermissionMock: vi.fn()
}));

vi.mock('@/shared/services/finance-service', () => ({
  financeService: financeServiceMock
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({ hasPermission: () => true, hasAnyPermission: hasAnyPermissionMock })
}));

vi.mock('@/modules/pet/pet-module-subnav', () => ({
  PetModuleSubnav: () => null
}));

function page<T>(items: T[], totalItems = items.length) {
  return { items, totalItems, totalPages: 1, page: 0, size: 8 };
}

describe('FinanceDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasAnyPermissionMock.mockReturnValue(true);
    financeServiceMock.listInvoices.mockImplementation((_page: number, size: number, filters?: { status?: string }) => (
      Promise.resolve(filters?.status === 'ISSUED' && size === 1
        ? page([], 3)
        : page([{ id: 'inv-1', counterpartyName: 'Maria Oliveira', status: 'ISSUED', totalAmount: 150, outstandingAmount: 100, currency: 'BRL' }], 12))
    ));
    financeServiceMock.listCashMovements.mockResolvedValue(page([
      { id: 'cash-1', direction: 'IN', category: 'PAYMENT', amount: 95, currency: 'BRL', occurredAt: '2026-11-03T15:00:00Z', description: 'Pagamento PIX recebido' }
    ], 7));
    financeServiceMock.listPayments.mockRejectedValue(new Error('forbidden'));
  });

  it('shows server totals and recent records instead of built-in sample data', async () => {
    render(<FinanceDashboard />);

    await screen.findByText('Pagamento PIX recebido');

    const metrics = screen.getByText('Issued invoices awaiting payment').closest('dl') as HTMLElement;
    expect(within(metrics).getByText('3')).toBeInTheDocument();
    expect(within(metrics).getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Maria Oliveira')).toBeInTheDocument();
    expect(screen.queryByText('Venda de racao premium')).not.toBeInTheDocument();
    expect(financeServiceMock.listInvoices).toHaveBeenCalledWith(0, 1, { status: 'ISSUED' });
  });

  it('keeps the page usable when one finance block is not accessible', async () => {
    render(<FinanceDashboard />);

    expect(await screen.findByText('No access to this data, or it could not be loaded.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recent payments' })).toBeInTheDocument();
  });
});
