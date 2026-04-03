import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContactFormPage } from '@/modules/crm/contact-form-page';
import { ApiClientError } from '@/shared/lib/http';

const { hasPermissionMock, crmServiceMock, pushMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  pushMock: vi.fn(),
  crmServiceMock: {
    listCompanies: vi.fn(),
    getContact: vi.fn(),
    createContact: vi.fn(),
    updateContact: vi.fn()
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

describe('ContactFormPage', () => {
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
    crmServiceMock.createContact.mockResolvedValue({
      id: 'contact-1',
      firstName: 'Ana',
      companyId: 'company-1',
      company: 'Acme Vet',
      status: 'ACTIVE',
      createdAt: '2026-03-10T09:00:00Z',
      updatedAt: '2026-03-10T09:00:00Z'
    });
    crmServiceMock.updateContact.mockResolvedValue({
      id: 'contact-1',
      firstName: 'Ana',
      company: 'Legacy Org',
      status: 'ACTIVE',
      createdAt: '2026-03-10T09:00:00Z',
      updatedAt: '2026-03-10T09:00:00Z'
    });
  });

  it('prioritizes companyId when a company is selected', async () => {
    render(<ContactFormPage />);

    await waitFor(() => {
      expect(crmServiceMock.listCompanies).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByLabelText('Company vinculada'), { target: { value: 'company-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar contato' }));

    await waitFor(() => {
      expect(crmServiceMock.createContact).toHaveBeenCalledTimes(1);
    });

    const payload = crmServiceMock.createContact.mock.calls[0][0];

    expect(payload).toMatchObject({
      firstName: 'Ana',
      companyId: 'company-1',
      status: 'ACTIVE'
    });
    expect(payload).not.toHaveProperty('company');
    expect(screen.queryByLabelText('Empresa manual (compatibilidade)')).not.toBeInTheDocument();
  });

  it('keeps manual company compatibility for legacy contacts without companyId', async () => {
    crmServiceMock.getContact.mockResolvedValue({
      id: 'contact-1',
      firstName: 'Legacy',
      company: 'Legacy Org',
      status: 'ACTIVE',
      createdAt: '2026-03-10T09:00:00Z',
      updatedAt: '2026-03-10T09:00:00Z'
    });

    render(<ContactFormPage contactId="contact-1" />);

    await waitFor(() => {
      expect(crmServiceMock.getContact).toHaveBeenCalledWith('contact-1');
    });

    expect(screen.getByLabelText('Empresa manual (compatibilidade)')).toHaveValue('Legacy Org');

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Legacy Updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar contato' }));

    await waitFor(() => {
      expect(crmServiceMock.updateContact).toHaveBeenCalledTimes(1);
    });

    const payload = crmServiceMock.updateContact.mock.calls[0][1];

    expect(payload).toMatchObject({
      firstName: 'Legacy Updated',
      company: 'Legacy Org',
      status: 'ACTIVE'
    });
    expect(payload).not.toHaveProperty('companyId');
  });

  it('shows the permission fallback when contact write access is missing', () => {
    hasPermissionMock.mockReturnValue(false);

    render(<ContactFormPage />);

    expect(screen.getByText('Você não possui permissão para esta ação.')).toBeInTheDocument();
  });

  it('surfaces lookup errors without breaking the manual fallback', async () => {
    crmServiceMock.listCompanies.mockRejectedValue(new ApiClientError('Companies unavailable', 403));

    render(<ContactFormPage />);

    await waitFor(() => {
      expect(screen.getByText('Companies unavailable')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Empresa manual (compatibilidade)')).toBeInTheDocument();
  });

  it('uses the PetFlow support-contact surface without loading companies', async () => {
    render(<ContactFormPage surface="pet" />);

    await waitFor(() => {
      expect(screen.getByText('Novo contato de apoio')).toBeInTheDocument();
    });

    expect(crmServiceMock.listCompanies).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Company vinculada')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Contexto legado (opcional)')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nome do contato de apoio'), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar contato de apoio' }));

    await waitFor(() => {
      expect(crmServiceMock.createContact).toHaveBeenCalledTimes(1);
    });

    expect(crmServiceMock.createContact.mock.calls[0][0]).toMatchObject({
      firstName: 'Ana',
      status: 'ACTIVE'
    });
    expect(pushMock).not.toHaveBeenCalled();
  });
});
