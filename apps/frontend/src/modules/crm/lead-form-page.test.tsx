import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientError } from '@/shared/lib/http';
import { LeadFormPage } from '@/modules/crm/lead-form-page';

const { hasPermissionMock, pushMock, crmServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  pushMock: vi.fn(),
  crmServiceMock: {
    listCompanies: vi.fn(),
    listContacts: vi.fn(),
    getLead: vi.fn(),
    createLead: vi.fn(),
    updateLead: vi.fn()
  }
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock
  })
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
    size: 100
  };
}

describe('LeadFormPage', () => {
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
    crmServiceMock.createLead.mockResolvedValue({
      id: 'lead-1',
      name: 'Lead Acme',
      companyId: 'company-1',
      contactId: 'contact-1',
      notes: 'Cliente interessado em onboarding',
      status: 'NEW',
      createdAt: '2026-03-10T09:00:00Z',
      updatedAt: '2026-03-10T09:00:00Z'
    });
  });

  it('uses the existing company, contact and notes fields from the lead contract', async () => {
    render(<LeadFormPage />);

    await waitFor(() => {
      expect(crmServiceMock.listCompanies).toHaveBeenCalledTimes(1);
      expect(crmServiceMock.listContacts).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Lead Acme' } });
    fireEvent.change(screen.getByLabelText('Company relacionada'), { target: { value: 'company-1' } });

    await waitFor(() => {
      expect(crmServiceMock.listContacts).toHaveBeenLastCalledWith(0, 100, '', {
        companyId: 'company-1'
      });
    });

    fireEvent.change(screen.getByLabelText('Contato relacionado'), { target: { value: 'contact-1' } });
    fireEvent.change(screen.getByLabelText('Observações comerciais'), { target: { value: 'Cliente interessado em onboarding' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar lead' }));

    await waitFor(() => {
      expect(crmServiceMock.createLead).toHaveBeenCalledTimes(1);
    });

    expect(crmServiceMock.createLead).toHaveBeenCalledWith({
      name: 'Lead Acme',
      companyId: 'company-1',
      contactId: 'contact-1',
      notes: 'Cliente interessado em onboarding',
      status: 'NEW'
    });
  });

  it('shows API errors returned while saving the lead', async () => {
    crmServiceMock.createLead.mockRejectedValue(new ApiClientError('Lead invalid', 400));

    render(<LeadFormPage />);

    await waitFor(() => {
      expect(crmServiceMock.listCompanies).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Lead error' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar lead' }));

    await waitFor(() => {
      expect(screen.getByText('Lead invalid')).toBeInTheDocument();
    });
  });

  it('returns to the PetFlow commercial surface after creating a lead on the absorbed route', async () => {
    render(<LeadFormPage surface="pet" />);

    await waitFor(() => {
      expect(crmServiceMock.listCompanies).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText('Nome do lead'), { target: { value: 'Lead PetFlow' } });
    fireEvent.change(screen.getByLabelText('Conta comercial (legado)'), { target: { value: 'company-1' } });

    await waitFor(() => {
      expect(crmServiceMock.listContacts).toHaveBeenLastCalledWith(0, 100, '', {
        companyId: 'company-1'
      });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Criar lead comercial' }));

    await waitFor(() => {
      expect(crmServiceMock.createLead).toHaveBeenCalledWith({
        name: 'Lead PetFlow',
        companyId: 'company-1',
        status: 'NEW'
      });
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/pet/commercial?tab=leads');
    }, { timeout: 1500 });
  });
});
