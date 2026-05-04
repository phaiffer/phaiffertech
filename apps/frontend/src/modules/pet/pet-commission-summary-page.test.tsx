import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetCommissionSummaryPage } from '@/modules/pet/pet-commission-summary-page';

const { hasPermissionMock, hasAnyPermissionMock, petServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  hasAnyPermissionMock: vi.fn(),
  petServiceMock: {
    getCommissionSummary: vi.fn(),
    listInvoices: vi.fn(),
    listClientPlans: vi.fn()
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

describe('PetCommissionSummaryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermissionMock.mockImplementation((permission: string) => permission === 'pet.commission.read');
    hasAnyPermissionMock.mockReturnValue(true);
    petServiceMock.getCommissionSummary.mockResolvedValue({
      appointmentStatus: 'COMPLETED',
      totalCommissionAmount: 29,
      professionalCount: 2,
      generatedLineCount: 3,
      excludedLineCount: 1,
      eligibleWithoutAmountLineCount: 1,
      unassignedLineCount: 0,
      legacyLineCount: 0,
      contributingAppointmentCount: 2,
      professionals: [
        {
          professionalId: 'professional-1',
          professionalName: 'Ana Groomer',
          totalCommissionAmount: 24,
          generatedLineCount: 2,
          excludedLineCount: 1,
          eligibleWithoutAmountLineCount: 0,
          contributingAppointmentCount: 2
        },
        {
          professionalId: 'professional-2',
          professionalName: 'Beto Groomer',
          totalCommissionAmount: 5,
          generatedLineCount: 1,
          excludedLineCount: 0,
          eligibleWithoutAmountLineCount: 1,
          contributingAppointmentCount: 1
        }
      ],
      details: [
        {
          appointmentId: 'appointment-1',
          appointmentServiceLineId: 'line-1',
          scheduledAt: '2026-02-10T13:00:00Z',
          appointmentStatus: 'COMPLETED',
          clientId: 'client-1',
          clientName: 'Owner One',
          petId: 'pet-1',
          petName: 'Pet One',
          serviceId: 'service-1',
          serviceName: 'Bath',
          lineOrder: 0,
          professionalId: 'professional-1',
          professionalName: 'Ana Groomer',
          basePrice: 80,
          commissionEligible: true,
          commissionRate: 0.15,
          commissionAmount: 12,
          lineStatus: 'GENERATED',
          dataSource: 'STRUCTURED_LINE'
        },
        {
          appointmentId: 'appointment-1',
          appointmentServiceLineId: 'line-2',
          scheduledAt: '2026-02-10T13:00:00Z',
          appointmentStatus: 'COMPLETED',
          clientId: 'client-1',
          clientName: 'Owner One',
          petId: 'pet-1',
          petName: 'Pet One',
          serviceId: 'service-2',
          serviceName: 'Vaccination',
          lineOrder: 1,
          professionalId: 'professional-1',
          professionalName: 'Ana Groomer',
          basePrice: 35,
          commissionEligible: false,
          commissionRate: null,
          commissionAmount: null,
          lineStatus: 'EXCLUDED',
          dataSource: 'STRUCTURED_LINE'
        },
        {
          appointmentId: 'appointment-2',
          appointmentServiceLineId: 'line-3',
          scheduledAt: '2026-02-11T13:00:00Z',
          appointmentStatus: 'COMPLETED',
          clientId: 'client-2',
          clientName: 'Owner Two',
          petId: 'pet-2',
          petName: 'Pet Two',
          serviceId: 'service-3',
          serviceName: 'Hygienic Grooming',
          lineOrder: 0,
          professionalId: 'professional-2',
          professionalName: 'Beto Groomer',
          basePrice: 50,
          commissionEligible: true,
          commissionRate: null,
          commissionAmount: null,
          lineStatus: 'ELIGIBLE_WITHOUT_AMOUNT',
          dataSource: 'STRUCTURED_LINE'
        },
        {
          appointmentId: 'appointment-3',
          appointmentServiceLineId: null,
          scheduledAt: '2026-02-12T13:00:00Z',
          appointmentStatus: 'COMPLETED',
          clientId: 'client-3',
          clientName: 'Owner Three',
          petId: 'pet-3',
          petName: 'Pet Three',
          serviceId: 'service-4',
          serviceName: 'Legacy Bath',
          lineOrder: 0,
          professionalId: 'professional-1',
          professionalName: 'Ana Groomer',
          basePrice: 80,
          commissionEligible: true,
          commissionRate: null,
          commissionAmount: 12,
          lineStatus: 'GENERATED',
          dataSource: 'COMPATIBILITY_FALLBACK'
        }
      ]
    });
    petServiceMock.listInvoices.mockResolvedValue({
      items: [
        {
          id: 'invoice-1',
          financeInvoiceId: 'finance-1',
          clientId: 'client-1',
          clientName: 'Owner One',
          totalAmount: 220,
          paidAmount: 0,
          outstandingAmount: 220,
          status: 'ISSUED',
          description: 'Renovacao de plano PetFlow',
          businessContextType: 'PET.CLIENT_PLAN',
          businessContextId: 'plan-1',
          businessContextLabel: 'Banho 4x/mes',
          createdAt: '2026-02-12T13:00:00Z',
          updatedAt: '2026-02-12T13:00:00Z',
          payments: []
        }
      ],
      totalItems: 1,
      totalPages: 1,
      page: 0,
      size: 100
    });
    petServiceMock.listClientPlans.mockResolvedValue({
      items: [
        {
          id: 'plan-1',
          clientId: 'client-1',
          petId: 'pet-1',
          planName: 'Banho 4x/mes',
          totalSessions: 4,
          usedSessions: 3,
          remainingSessions: 1,
          startedAt: '2026-02-01T00:00:00Z',
          expiresAt: '2026-02-28T23:59:59Z',
          finalPrice: 220,
          status: 'ACTIVE',
          renewalState: 'LAST_USE'
        }
      ],
      totalItems: 1,
      totalPages: 1,
      page: 0,
      size: 100
    });
  });

  it('renders commission totals, professional summary, and line-level status detail', async () => {
    render(<PetCommissionSummaryPage />);

    await waitFor(() => {
      expect(petServiceMock.getCommissionSummary).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Fechamento operacional')).toBeInTheDocument();
    expect(screen.getAllByText('Ana Groomer').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Beto Groomer').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gerou comissao').length).toBeGreaterThan(0);
    expect(screen.getByText('Excluida')).toBeInTheDocument();
    expect(screen.getByText('Elegivel sem valor')).toBeInTheDocument();
    expect(screen.getAllByText('Compatibilidade historica').length).toBeGreaterThan(0);
    expect(screen.getByText('Legacy Bath')).toBeInTheDocument();
    expect(screen.getByText('Linhas excluidas')).toBeInTheDocument();
    expect(screen.getByText('Linhas com comissao')).toBeInTheDocument();
    expect(screen.getByText('Cobrancas pendentes')).toBeInTheDocument();
    expect(screen.getByText('Planos perto do fim')).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?220,00/)).toBeInTheDocument();
  });
});
