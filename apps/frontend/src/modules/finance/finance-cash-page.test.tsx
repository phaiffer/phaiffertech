import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FinanceCashPage } from '@/modules/finance/finance-cash-page';

const { financeServiceMock } = vi.hoisted(() => ({
  financeServiceMock: {
    listCashMovements: vi.fn()
  }
}));

vi.mock('@/shared/services/finance-service', () => ({
  financeService: financeServiceMock
}));

const movements = [
  {
    id: 'cash-1',
    direction: 'IN',
    category: 'INVOICE_PAYMENT',
    amount: 95,
    currency: 'BRL',
    occurredAt: '2026-11-03T15:00:00Z',
    description: 'Pagamento PIX recebido',
    invoiceId: 'finance-invoice-1'
  },
  {
    id: 'cash-2',
    direction: 'OUT',
    category: 'PAYMENT_REVERSAL',
    amount: 20,
    currency: 'BRL',
    occurredAt: '2026-11-03T16:00:00Z',
    description: 'Reembolso parcial',
    invoiceId: null
  }
];

describe('FinanceCashPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    financeServiceMock.listCashMovements.mockResolvedValue({
      items: movements,
      totalItems: 2,
      totalPages: 1,
      page: 0,
      size: 14
    });
  });

  it('lists cash movements with translated labels and signed amounts', async () => {
    render(<FinanceCashPage />);

    await screen.findByText('Pagamento PIX recebido');

    expect(screen.getByRole('heading', { name: 'Cash' })).toBeInTheDocument();
    expect(screen.getAllByText('Invoice payment').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Payment reversal').length).toBeGreaterThan(0);
    expect(screen.getByText(/^\+R\$\s?95\.00$/)).toBeInTheDocument();
    expect(screen.getByText('1-2 of 2')).toBeInTheDocument();
  });

  it('filters by direction through the filter chip', async () => {
    render(<FinanceCashPage />);
    await screen.findByText('Pagamento PIX recebido');

    fireEvent.change(screen.getByLabelText('Direction'), { target: { value: 'OUT' } });

    await waitFor(() => {
      expect(financeServiceMock.listCashMovements).toHaveBeenLastCalledWith(0, 14, { direction: 'OUT', category: undefined });
    });
  });
});
