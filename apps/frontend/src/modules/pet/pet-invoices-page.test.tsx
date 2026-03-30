import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetInvoicesPage } from '@/modules/pet/pet-invoices-page';

const { hasPermissionMock, hasAnyPermissionMock, petServiceMock, financeServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  hasAnyPermissionMock: vi.fn(),
  petServiceMock: {
    listClients: vi.fn(),
    listClientPlans: vi.fn(),
    listAppointments: vi.fn(),
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
        email: 'ana@example.com',
        status: 'ACTIVE',
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listClientPlans.mockResolvedValue(createPageResponse([
      {
        id: 'plan-1',
        clientId: 'client-1',
        planName: 'Banho e tosa 4x',
        totalSessions: 4,
        usedSessions: 2,
        remainingSessions: 2,
        expiresAt: null,
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));
    petServiceMock.listAppointments.mockResolvedValue(createPageResponse([
      {
        id: 'appointment-1',
        clientId: 'client-1',
        clientName: 'Ana Costa',
        petId: 'pet-1',
        petName: 'Luna',
        serviceId: 'service-1',
        serviceName: 'Bath & grooming',
        professionalId: 'professional-1',
        professionalName: 'Marcia',
        scheduledAt: '2026-04-05T10:00:00Z',
        status: 'SCHEDULED',
        clientPlanId: 'plan-1',
        planCovered: true,
        planRemainingSessions: 2,
        extrasAmount: 25,
        extrasDescription: 'Pet taxi ida e volta',
        finalAmountDue: 25,
        servicePrice: 90,
        createdAt: '2026-03-18T10:00:00Z',
        updatedAt: '2026-03-18T10:00:00Z'
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
        description: 'Pacote de vacinacao',
        businessContextType: 'APPOINTMENT',
        businessContextId: 'appointment-1',
        businessContextLabel: 'Pacote de vacinacao',
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
            notes: 'Entrada inicial',
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
      businessContextLabel: 'Pacote de vacinacao',
      description: 'Pacote de vacinacao',
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
        description: 'Pagamento PIX recebido',
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

    expect(screen.getByText('Projecao do proximo ciclo')).toBeInTheDocument();
    expect(screen.getByText('Banho e tosa 4x · 2 sessoes restantes')).toBeInTheDocument();
    expect(screen.getByText('O email de renovacao entra na demo quando o plano chega a visita penultima.')).toBeInTheDocument();
    expect(screen.getByText('Saldo em aberto')).toBeInTheDocument();
    expect(screen.getAllByText('Ana Costa').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Ver registro financeiro' }));

    await waitFor(() => {
      expect(financeServiceMock.getInvoice).toHaveBeenCalledWith('finance-1');
      expect(financeServiceMock.listCashMovements).toHaveBeenCalledWith(0, 8, { invoiceId: 'finance-1' });
    });

    expect(screen.getByText('Visao financeira vinculada')).toBeInTheDocument();
    expect(screen.getByText('Documento financeiro vinculado')).toBeInTheDocument();
    expect(screen.getByText('Visibilidade dos movimentos')).toBeInTheDocument();
    expect(screen.getByText('Pagamento PIX recebido')).toBeInTheDocument();
  });
});
