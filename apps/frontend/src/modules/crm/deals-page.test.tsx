import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrmDealsPage } from '@/modules/crm/deals-page';

const { hasPermissionMock, hasAnyPermissionMock, crmServiceMock } = vi.hoisted(() => ({
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

function createPageResponse<T>(items: T[]) {
  return {
    items,
    totalItems: items.length,
    totalPages: 1,
    page: 0,
    size: 10
  };
}

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
  });

  it('shows guided setup actions when pipeline stages are missing', async () => {
    render(<CrmDealsPage />);

    await waitFor(() => {
      expect(crmServiceMock.listDeals).toHaveBeenCalledTimes(1);
    });

    // We changed the component to render the Kanban Board, and if no stages exist it gives this prompt:
    expect(
      screen.getByText('The Kanban board requires at least one pipeline stage to be configured.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Configure pipeline stages' })).toHaveAttribute('href', '/crm/pipeline');
  });
  
  it('renders kanban board when stages and deals exist', async () => {
    // Return mock data for stages and deals
    crmServiceMock.listPipelineStages.mockResolvedValue(createPageResponse([{ id: 's1', name: 'Prospecting', position: 1, colorHex: '#fff' }]));
    crmServiceMock.listDeals.mockResolvedValue(createPageResponse([{ id: 'd1', title: 'Deal One', pipelineStageId: 's1', status: 'OPEN', currency: 'USD', amount: 5000 }]));
    
    render(<CrmDealsPage />);

    await waitFor(() => {
      expect(screen.getByText('Prospecting')).toBeInTheDocument();
      expect(screen.getByText('Deal One')).toBeInTheDocument();
    });
  });
});
