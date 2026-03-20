import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetInvoicesPage } from '@/modules/pet/pet-invoices-page';

const { hasPermissionMock, hasAnyPermissionMock, petServiceMock, financeServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  hasAnyPermissionMock: vi.fn(),
  petServiceMock: {
    listClients: vi.fn(),
    listInvoices: vi.fn(),
    createInvoice: vi.fn(),
    updateInvoice: vi.fn(),
    createInvoicePayment: vi.fn(),
    deleteInvoice: vi.fn()
  },
  financeServiceMock: {
    getInvoice: vi.fn(),
    listCashMovements: vi.fn()
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

vi.mock('@/shared/services/finance-service', () => ({
  financeService: financeServiceMock
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

describe('PetInvoicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermissionMock.mockReturnValue(true);
    hasAnyPermissionMock.mockReturnValue(true);
    petServiceMock.listClients.mockResolvedValue(createPageResponse([
      {
        id: 'client-1',
        name: 'Ana Costa',
        status: 'ACTIVE',
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listInvoices.mockResolvedValue(createPageResponse([
      {
        id: 'invoice-1',
        financeInvoiceId: 'finance-1',
        clientId: 'client-1',
        clientName: 'Ana Costa',
        totalAmount: 150,
        paidAmount: 50,
        outstandingAmount: 100,
        status: 'ISSUED',
        description: 'Vaccination bundle',
        businessContextType: 'APPOINTMENT',
        businessContextId: 'appointment-1',
        businessContextLabel: 'Vaccination package',
        issuedAt: '2026-03-18T10:00:00Z',
        dueAt: '2026-03-20T10:00:00Z',
        paidAt: null,
        canceledAt: null,
        createdAt: '2026-03-18T10:00:00Z',
        updatedAt: '2026-03-18T10:00:00Z',
        payments: [
          {
            id: 'payment-1',
            status: 'PAID',
            method: 'PIX',
            amount: 50,
            receivedAt: '2026-03-18T12:00:00Z',
            referenceCode: 'PIX-001',
            notes: 'Initial deposit',
            createdAt: '2026-03-18T12:00:00Z',
            updatedAt: '2026-03-18T12:00:00Z'
          }
        ]
      }
    ]));
    financeServiceMock.getInvoice.mockResolvedValue({
      id: 'finance-1',
      sourceModule: 'PET',
      counterpartyName: 'Ana Costa',
      businessContextLabel: 'Vaccination package',
      description: 'Vaccination bundle',
      status: 'ISSUED',
      currency: 'BRL',
      totalAmount: 150,
      paidAmount: 50,
      outstandingAmount: 100,
      issuedAt: '2026-03-18T10:00:00Z',
      dueAt: '2026-03-20T10:00:00Z',
      paidAt: null,
      canceledAt: null,
      documentNumber: 'INV-001',
      recipientEmail: 'ana@example.com',
      createdAt: '2026-03-18T10:00:00Z',
      updatedAt: '2026-03-18T10:00:00Z'
    });
    financeServiceMock.listCashMovements.mockResolvedValue(createPageResponse([
      {
        id: 'movement-1',
        invoiceId: 'finance-1',
        paymentId: 'payment-1',
        direction: 'IN',
        category: 'INVOICE_PAYMENT',
        amount: 50,
        currency: 'BRL',
        occurredAt: '2026-03-18T12:00:00Z',
        description: 'PIX payment received',
        createdAt: '2026-03-18T12:00:00Z',
        updatedAt: '2026-03-18T12:00:00Z'
      }
    ]));
  });

  it('shows linked finance context and cash movement visibility for the reviewed invoice', async () => {
    render(<PetInvoicesPage />);

    await waitFor(() => {
      expect(petServiceMock.listInvoices).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Open balance')).toBeInTheDocument();
    expect(screen.getAllByText('Ana Costa').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Review finance' }));

    await waitFor(() => {
      expect(financeServiceMock.getInvoice).toHaveBeenCalledWith('finance-1');
      expect(financeServiceMock.listCashMovements).toHaveBeenCalledWith(0, 8, { invoiceId: 'finance-1' });
    });

    expect(screen.getByText('Operational finance review')).toBeInTheDocument();
    expect(screen.getByText('Linked finance document')).toBeInTheDocument();
    expect(screen.getByText('Cash movement visibility')).toBeInTheDocument();
    expect(screen.getByText('PIX payment received')).toBeInTheDocument();
  });
});
