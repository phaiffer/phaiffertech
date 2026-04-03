import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrmLeadsPage } from '@/modules/crm/leads-page';

const { hasPermissionMock, crmServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  crmServiceMock: {
    listCompanies: vi.fn(),
    listContacts: vi.fn(),
    listLeads: vi.fn(),
    deleteLead: vi.fn()
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

describe('CrmLeadsPage', () => {
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
    crmServiceMock.listContacts.mockImplementation((_page: number, _size: number, _search: string, filters?: { companyId?: string }) => {
      if (filters?.companyId === 'company-1') {
        return Promise.resolve(createPageResponse([
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
      }

      return Promise.resolve(createPageResponse([]));
    });
    crmServiceMock.listLeads.mockResolvedValue(createPageResponse([
      {
        id: 'lead-1',
        name: 'Lead Acme',
        source: 'WEBSITE',
        email: 'lead@acme.test',
        companyId: 'company-1',
        contactId: 'contact-1',
        status: 'NEW',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z'
      }
    ]));
  });

  it('applies the existing company and contact filters supported by crmService', async () => {
    render(<CrmLeadsPage />);

    await waitFor(() => {
      expect(crmServiceMock.listLeads).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText('Company'), { target: { value: 'company-1' } });

    await waitFor(() => {
      expect(crmServiceMock.listContacts).toHaveBeenLastCalledWith(0, 100, '', {
        companyId: 'company-1'
      });
      expect(crmServiceMock.listLeads).toHaveBeenLastCalledWith(0, 10, '', {
        status: undefined,
        source: undefined,
        companyId: 'company-1',
        contactId: undefined
      });
    });

    fireEvent.change(screen.getByLabelText('Contato'), { target: { value: 'contact-1' } });

    await waitFor(() => {
      expect(crmServiceMock.listLeads).toHaveBeenLastCalledWith(0, 10, '', {
        status: undefined,
        source: undefined,
        companyId: 'company-1',
        contactId: 'contact-1'
      });
    });

    expect(screen.getAllByText('Ana Silva').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Acme Vet').length).toBeGreaterThan(0);
  });

  it('uses the PetFlow commercial surface without reviving CRM routes', async () => {
    render(<CrmLeadsPage surface="pet" />);

    await waitFor(() => {
      expect(crmServiceMock.listLeads).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Leads comerciais')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Novo lead comercial' })).toHaveAttribute('href', '/pet/commercial/leads/new');

    fireEvent.change(screen.getByLabelText('Conta comercial'), { target: { value: 'company-1' } });

    await waitFor(() => {
      expect(crmServiceMock.listLeads).toHaveBeenLastCalledWith(0, 10, '', {
        status: undefined,
        source: undefined,
        companyId: 'company-1',
        contactId: undefined
      });
    });

    expect(screen.getByLabelText('Contato de apoio')).toBeInTheDocument();
  });
});
