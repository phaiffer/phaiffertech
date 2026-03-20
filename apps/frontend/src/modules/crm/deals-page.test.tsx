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

  it('shows guided setup actions when deals cannot yet be created safely', async () => {
    render(<CrmDealsPage />);

    await waitFor(() => {
      expect(crmServiceMock.listDeals).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByText('Deals are easier to create after the workspace has at least one company and one pipeline stage.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open companies' })).toHaveAttribute('href', '/crm/companies');
    expect(screen.getByRole('link', { name: 'Open pipeline' })).toHaveAttribute('href', '/crm/pipeline');
    expect(screen.getByRole('button', { name: 'Create first deal' })).toBeInTheDocument();
  });
});
