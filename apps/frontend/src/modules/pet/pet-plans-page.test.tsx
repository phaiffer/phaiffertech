import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetPlansPage } from '@/modules/pet/pet-plans-page';

const { hasPermissionMock, petServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  petServiceMock: {
    listClientPlans: vi.fn(),
    listPlanTemplates: vi.fn(),
    listClients: vi.fn(),
    listProfiles: vi.fn(),
    listServices: vi.fn(),
    getBillingMessageSettings: vi.fn(),
    updateBillingMessageSettings: vi.fn(),
    preparePlanRenewalMessage: vi.fn(),
    dispatchPlanRenewalWhatsApp: vi.fn(),
    createClientPlan: vi.fn(),
    updateClientPlan: vi.fn(),
    deleteClientPlan: vi.fn(),
    createPlanTemplate: vi.fn(),
    updatePlanTemplate: vi.fn(),
    deletePlanTemplate: vi.fn()
  }
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: hasPermissionMock
  })
}));

vi.mock('@/shared/services/pet-service', () => ({
  petService: petServiceMock
}));

vi.mock('@/modules/pet/pet-module-subnav', () => ({
  PetModuleSubnav: () => <nav>PetFlow nav</nav>
}));

function createPageResponse<T>(items: T[]) {
  return {
    items,
    totalItems: items.length,
    totalPages: 1,
    page: 0,
    size: 20
  };
}

describe('PetPlansPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) }
    });
    hasPermissionMock.mockReturnValue(true);
    petServiceMock.listPlanTemplates.mockResolvedValue(createPageResponse([
      {
        id: 'template-1',
        commercialName: 'Banho 4x/mes',
        description: 'Pacote mensal de banhos recorrentes.',
        price: 240,
        validityDays: 30,
        totalSessions: 4,
        serviceIds: ['service-bath'],
        renewalRules: 'Avisar no penultimo uso.',
        active: true
      }
    ]));
    petServiceMock.listClientPlans.mockResolvedValue(createPageResponse([
      {
        id: 'plan-1',
        clientId: 'client-1',
        petId: 'pet-1',
        planTemplateId: 'template-1',
        planName: 'Banho 4x/mes',
        totalSessions: 4,
        usedSessions: 3,
        remainingSessions: 1,
        startedAt: '2026-05-01T00:00:00Z',
        expiresAt: '2026-05-31T23:59:59Z',
        finalPrice: 220,
        status: 'ACTIVE',
        renewalState: 'LAST_USE',
        renewalRules: 'Avisar no penultimo uso.',
        notes: 'Cliente prefere banho aos sabados.'
      }
    ]));
    petServiceMock.listClients.mockResolvedValue(createPageResponse([
      {
        id: 'client-1',
        name: 'Maria Responsavel',
        email: 'maria@example.com',
        phone: '11999999999',
        documentType: 'CPF',
        document: '52998224725',
        address: 'Rua Pet, 10',
        status: 'ACTIVE',
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z'
      }
    ]));
    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([
      {
        id: 'pet-1',
        clientId: 'client-1',
        name: 'Luna',
        species: 'Dog',
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z'
      }
    ]));
    petServiceMock.listServices.mockResolvedValue(createPageResponse([
      {
        id: 'service-bath',
        name: 'Banho',
        category: 'GROOMING',
        active: true,
        basePrice: 80,
        durationMinutes: 60,
        commissionEligible: true,
        allowInPlans: true,
        allowStandaloneBooking: true,
        inventoryLinks: [],
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z'
      }
    ]));
    petServiceMock.getBillingMessageSettings.mockResolvedValue({
      pixKey: null,
      billingDisplayName: null,
      planRenewalMessageTemplate: null,
      petReadyMessageTemplate: null,
      pixConfigured: false
    });
    petServiceMock.preparePlanRenewalMessage.mockResolvedValue({
      type: 'PLAN_RENEWAL_PIX_REMINDER',
      tenantId: 'tenant-1',
      clientId: 'client-1',
      clientName: 'Maria Responsavel',
      clientEmail: 'maria@example.com',
      petId: 'pet-1',
      petName: 'Luna',
      planId: 'plan-1',
      planName: 'Banho 4x/mes',
      remainingSessions: 1,
      subject: 'Plan renewal reminder',
      message: 'Ola, Maria Responsavel! O plano Banho 4x/mes do pet Luna esta no ultimo banho do ciclo atual.\n\nPara renovar o proximo ciclo, o valor e R$ 220,00.\nPIX: pix@petshop.com.br\nFavorecido: Pet Shop Teste\n\nAssim que pagar, nos envie o comprovante.',
      pixKey: 'pix@petshop.com.br',
      billingDisplayName: 'Pet Shop Teste',
      invoiceId: 'invoice-1',
      invoiceStatus: 'ISSUED',
      invoiceAmount: 220,
      invoiceOutstandingAmount: 220,
      pixConfigured: true,
      eligible: true,
      safetyNote: 'Manual send only.'
    });
    petServiceMock.dispatchPlanRenewalWhatsApp.mockResolvedValue({
      id: 'dispatch-renewal-1',
      businessKey: 'PLAN_RENEWAL_PIX_REMINDER',
      recipientPhone: '11999999999',
      status: 'SENT',
      providerMessageId: 'wamid.renewal',
      failureReason: null
    });
  });

  it('separates plan catalog from sold client pet plans and shows remaining session balance', async () => {
    render(<PetPlansPage />);

    await waitFor(() => {
      expect(petServiceMock.listPlanTemplates).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Catalogo de planos')).toBeInTheDocument();
    expect(screen.getAllByText('Banho 4x/mes').length).toBeGreaterThan(0);
    expect(screen.getByText('Pacote mensal de banhos recorrentes.')).toBeInTheDocument();
    expect(screen.getByText('Pet: Luna')).toBeInTheDocument();
    expect(screen.getByText('Obs: Cliente prefere banho aos sabados.')).toBeInTheDocument();
    expect(screen.getByText('1 left')).toBeInTheDocument();
    expect(screen.getByText('LAST_USE')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Send WhatsApp renewal' }));

    await waitFor(() => {
      expect(petServiceMock.dispatchPlanRenewalWhatsApp).toHaveBeenCalledWith('plan-1');
    });
    expect(screen.getByText('Official WhatsApp renewal dispatch sent. Dispatch: dispatch-renewal-1.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Prepare PIX reminder' }));

    await waitFor(() => {
      expect(petServiceMock.preparePlanRenewalMessage).toHaveBeenCalledWith('plan-1');
    });
    expect(await screen.findByText('Renewal charge pending')).toBeInTheDocument();
    expect(screen.getByText('Assisted manual flow: copy the message, review the billing data, and send it through the agreed customer channel.')).toBeInTheDocument();
    expect(screen.getAllByText('Maria Responsavel').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Luna').length).toBeGreaterThan(0);
    expect(screen.getAllByText((text) => text.includes('220,00')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('pix@petshop.com.br').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pet Shop Teste').length).toBeGreaterThan(0);
    expect(screen.getByText(/Fatura vinculada: invoice-1/)).toBeInTheDocument();
    expect((screen.getByLabelText('Prepared renewal message') as HTMLTextAreaElement).value)
      .toContain('Assim que pagar, nos envie o comprovante.');

    fireEvent.click(screen.getByRole('button', { name: 'Copy PIX key' }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('pix@petshop.com.br');
    });
  });

  it('contracts a catalog plan for a client and pet with final price and notes', async () => {
    petServiceMock.createClientPlan.mockResolvedValue({
      id: 'plan-new'
    });

    render(<PetPlansPage />);

    await waitFor(() => {
      expect(petServiceMock.listPlanTemplates).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText('Client'), { target: { value: 'client-1' } });
    fireEvent.change(screen.getByLabelText('Pet'), { target: { value: 'pet-1' } });
    fireEvent.change(screen.getByLabelText('Plano do catalogo'), { target: { value: 'template-1' } });
    fireEvent.change(screen.getByLabelText('Preco final'), { target: { value: '210' } });
    fireEvent.change(screen.getByLabelText('Observacoes'), { target: { value: 'Aplicar desconto de fidelidade.' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Create plan' }).at(-1)!);

    await waitFor(() => {
      expect(petServiceMock.createClientPlan).toHaveBeenCalledWith(expect.objectContaining({
        clientId: 'client-1',
        petId: 'pet-1',
        planTemplateId: 'template-1',
        planName: 'Banho 4x/mes',
        totalSessions: 4,
        finalPrice: 210,
        status: 'ACTIVE',
        notes: 'Aplicar desconto de fidelidade.'
      }));
    });
  });
});
