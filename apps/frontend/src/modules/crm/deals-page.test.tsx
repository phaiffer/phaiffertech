import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrmDealsPage } from '@/modules/crm/deals-page';

const { hasPermissionMock, hasAnyPermissionMock, crmServiceMock, financeServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  hasAnyPermissionMock: vi.fn(),
  crmServiceMock: {
    listCompanies: vi.fn(),
    listContacts: vi.fn(),
    listLeads: vi.fn(),
    listPipelineStages: vi.fn(),
    listDeals: vi.fn(),
    createDeal: vi.fn(),
    updateDeal: vi.fn(),
    deleteDeal: vi.fn()
  },
  financeServiceMock: {
    listInvoices: vi.fn(),
    createInvoice: vi.fn()
  }
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: hasPermissionMock,
    hasAnyPermission: hasAnyPermissionMock
  })
}));

vi.mock('@/shared/services/crm-service', () => ({
  crmService: crmServiceMock
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

const mockStage = { id: 's1', name: 'Prospecting', position: 1, color: '#3b82f6' };
const mockDeal = { id: 'd1', title: 'Deal One', pipelineStageId: 's1', status: 'OPEN', currency: 'BRL', amount: 5000, companyId: 'c1' };
const mockCompany = { id: 'c1', name: 'Acme Corp' };

describe('CrmDealsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermissionMock.mockReturnValue(true);
    hasAnyPermissionMock.mockReturnValue(true);
    crmServiceMock.listCompanies.mockResolvedValue(createPageResponse([]));
    crmServiceMock.listContacts.mockResolvedValue(createPageResponse([]));
    crmServiceMock.listLeads.mockResolvedValue(createPageResponse([]));
    crmServiceMock.listPipelineStages.mockResolvedValue(createPageResponse([]));
    crmServiceMock.listDeals.mockResolvedValue(createPageResponse([]));
    financeServiceMock.listInvoices.mockResolvedValue(createPageResponse([]));
  });

  it('shows guided setup actions when pipeline stages are missing', async () => {
    render(<CrmDealsPage />);

    await waitFor(() => {
      expect(crmServiceMock.listDeals).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByText('The Kanban board requires at least one pipeline stage to be configured.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Configure pipeline stages' })).toHaveAttribute('href', '/crm/pipeline');
  });

  it('uses the PetFlow commercial pipeline setup route on the absorbed surface', async () => {
    render(<CrmDealsPage surface="pet" />);

    await waitFor(() => {
      expect(crmServiceMock.listDeals).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Negocios comerciais')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Configurar pipeline comercial' })).toHaveAttribute('href', '/pet/commercial?tab=pipeline');
  });

  it('renders kanban board when stages and deals exist', async () => {
    crmServiceMock.listPipelineStages.mockResolvedValue(createPageResponse([mockStage]));
    crmServiceMock.listDeals.mockResolvedValue(createPageResponse([mockDeal]));

    render(<CrmDealsPage />);

    await waitFor(() => {
      expect(screen.getByText('Prospecting')).toBeInTheDocument();
      expect(screen.getByText('Deal One')).toBeInTheDocument();
    });
  });

  it('shows "No invoice" label when deal has no linked invoice', async () => {
    crmServiceMock.listPipelineStages.mockResolvedValue(createPageResponse([mockStage]));
    crmServiceMock.listDeals.mockResolvedValue(createPageResponse([mockDeal]));

    render(<CrmDealsPage />);

    await waitFor(() => {
      expect(screen.getByText('No invoice')).toBeInTheDocument();
    });
  });

  it('shows "Awaiting payment" for ISSUED invoices', async () => {
    crmServiceMock.listPipelineStages.mockResolvedValue(createPageResponse([mockStage]));
    crmServiceMock.listDeals.mockResolvedValue(createPageResponse([mockDeal]));
    financeServiceMock.listInvoices.mockResolvedValue(
      createPageResponse([{
        id: 'inv1',
        sourceModule: 'CRM',
        businessContextId: 'd1',
        businessContextType: 'CRM.DEAL',
        status: 'ISSUED',
        currency: 'BRL',
        totalAmount: 5000,
        paidAmount: 0,
        outstandingAmount: 5000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
    );

    render(<CrmDealsPage />);

    await waitFor(() => {
      expect(screen.getByText('Awaiting payment')).toBeInTheDocument();
    });
  });

  it('shows "Draft invoice" for DRAFT status (not "Invoice issued")', async () => {
    crmServiceMock.listPipelineStages.mockResolvedValue(createPageResponse([mockStage]));
    crmServiceMock.listDeals.mockResolvedValue(createPageResponse([mockDeal]));
    financeServiceMock.listInvoices.mockResolvedValue(
      createPageResponse([{
        id: 'inv1',
        sourceModule: 'CRM',
        businessContextId: 'd1',
        status: 'DRAFT',
        currency: 'BRL',
        totalAmount: 5000,
        paidAmount: 0,
        outstandingAmount: 5000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }])
    );

    render(<CrmDealsPage />);

    await waitFor(() => {
      expect(screen.getByText('Draft invoice')).toBeInTheDocument();
      expect(screen.queryByText('Invoice issued')).not.toBeInTheDocument();
    });
  });

  it('shows generate invoice button in drawer when deal has no invoice and has an amount', async () => {
    crmServiceMock.listCompanies.mockResolvedValue(createPageResponse([mockCompany]));
    crmServiceMock.listPipelineStages.mockResolvedValue(createPageResponse([mockStage]));
    crmServiceMock.listDeals.mockResolvedValue(createPageResponse([mockDeal]));

    render(<CrmDealsPage />);

    await waitFor(() => {
      expect(screen.getByText('Deal One')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Deal One'));

    await waitFor(() => {
      expect(screen.getByText('No invoice yet for this deal.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Generate invoice' })).toBeInTheDocument();
    });
  });

  it('shows amount prompt when deal has no amount and no invoice', async () => {
    const dealWithoutAmount = { ...mockDeal, amount: undefined };
    crmServiceMock.listPipelineStages.mockResolvedValue(createPageResponse([mockStage]));
    crmServiceMock.listDeals.mockResolvedValue(createPageResponse([dealWithoutAmount]));

    render(<CrmDealsPage />);

    await waitFor(() => {
      expect(screen.getByText('Deal One')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Deal One'));

    await waitFor(() => {
      expect(screen.getByText('Set a deal amount to enable invoice generation.')).toBeInTheDocument();
    });
  });

  it('calls createInvoice with CRM.DEAL context when generate invoice is clicked', async () => {
    crmServiceMock.listCompanies.mockResolvedValue(createPageResponse([mockCompany]));
    crmServiceMock.listPipelineStages.mockResolvedValue(createPageResponse([mockStage]));
    crmServiceMock.listDeals.mockResolvedValue(createPageResponse([mockDeal]));
    financeServiceMock.createInvoice.mockResolvedValue({ id: 'new-inv', status: 'DRAFT' });

    render(<CrmDealsPage />);

    await waitFor(() => {
      expect(screen.getByText('Deal One')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Deal One'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Generate invoice' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Generate invoice' }));

    await waitFor(() => {
      expect(financeServiceMock.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceModule: 'CRM',
          businessContextType: 'CRM.DEAL',
          businessContextId: 'd1',
          currency: 'BRL',
          totalAmount: 5000
        })
      );
    });
  });
});
