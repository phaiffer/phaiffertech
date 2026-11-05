import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrmContactsPage } from '@/modules/crm/contacts-page';

const { hasPermissionMock, crmServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  crmServiceMock: {
    listCompanies: vi.fn(),
    listContacts: vi.fn(),
    deleteContact: vi.fn()
  }
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: hasPermissionMock,
    hasAnyPermission: vi.fn(() => false)
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
    size: 14
  };
}

describe('CrmContactsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hasPermissionMock.mockReturnValue(true);
    crmServiceMock.listContacts.mockResolvedValue(createPageResponse([
      {
        id: 'contact-1',
        firstName: 'Ana',
        lastName: 'Silva',
        companyId: 'company-1',
        company: 'Acme Vet',
        status: 'ACTIVE',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z'
      }
    ]));
  });

  it('lists support contacts without loading companies or showing the legacy company', async () => {
    render(<CrmContactsPage />);

    expect(await screen.findByText('Ana Silva')).toBeInTheDocument();

    expect(crmServiceMock.listCompanies).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: /Support contacts/ })).toBeInTheDocument();
    expect(screen.queryByText('Acme Vet')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'New support contact' })[0]).toHaveAttribute('href', '/pet/clients/contacts/new');
  });

  it('filters by status through the shared contact service', async () => {
    render(<CrmContactsPage />);

    await screen.findByText('Ana Silva');
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'INACTIVE' } });

    await waitFor(() => {
      expect(crmServiceMock.listContacts).toHaveBeenLastCalledWith(0, 14, '', { status: 'INACTIVE' });
    });
  });
});
