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
    size: 10
  };
}

describe('CrmContactsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hasPermissionMock.mockReturnValue(true);
    crmServiceMock.listCompanies.mockResolvedValue(createPageResponse([
      {
        id: 'company-1',
        name: 'Acme Vet',
        status: 'ACTIVE',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z'
      }
    ]));
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

  it('uses the existing company filter supported by crmService', async () => {
    render(<CrmContactsPage />);

    await waitFor(() => {
      expect(crmServiceMock.listContacts).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText('Company'), { target: { value: 'company-1' } });

    await waitFor(() => {
      expect(crmServiceMock.listContacts).toHaveBeenLastCalledWith(0, 10, '', {
        status: undefined,
        companyId: 'company-1'
      });
    });

    expect(screen.getAllByText('Acme Vet').length).toBeGreaterThan(0);
  });

  it('renders the PetFlow support-contact surface without exposing the CRM company filter', async () => {
    render(<CrmContactsPage surface="pet" />);

    await waitFor(() => {
      expect(crmServiceMock.listContacts).toHaveBeenCalledTimes(1);
    });

    expect(crmServiceMock.listCompanies).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Contatos de apoio' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Company')).not.toBeInTheDocument();
    expect(screen.getByText('Contexto legado')).toBeInTheDocument();
  });
});
