import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContactFormPage } from '@/modules/crm/contact-form-page';
import { ApiClientError } from '@/shared/lib/http';

const { hasPermissionMock, crmServiceMock, pushMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  pushMock: vi.fn(),
  crmServiceMock: {
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

const storedContact = {
  id: 'contact-1',
  firstName: 'Legacy',
  status: 'ACTIVE',
  createdAt: '2026-03-10T09:00:00Z',
  updatedAt: '2026-03-10T09:00:00Z'
};

describe('ContactFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hasPermissionMock.mockReturnValue(true);
    crmServiceMock.createContact.mockResolvedValue(storedContact);
    crmServiceMock.updateContact.mockResolvedValue(storedContact);
  });

  it('creates a contact without legacy company fields and returns to the list', async () => {
    render(<ContactFormPage />);

    expect(screen.queryByLabelText('Company')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create support contact' }));

    await waitFor(() => {
      expect(crmServiceMock.createContact).toHaveBeenCalledTimes(1);
    });

    const payload = crmServiceMock.createContact.mock.calls[0][0];
    expect(payload).toMatchObject({ firstName: 'Ana', status: 'ACTIVE' });
    expect(payload).not.toHaveProperty('company');
    expect(payload).not.toHaveProperty('companyId');
    expect(await screen.findByText('Support contact created.')).toBeInTheDocument();

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/pet/clients/contacts');
    }, { timeout: 1500 });
  });

  it('keeps the manual company of a legacy contact editable', async () => {
    crmServiceMock.getContact.mockResolvedValue({ ...storedContact, company: 'Legacy Org' });

    render(<ContactFormPage contactId="contact-1" />);

    expect(await screen.findByLabelText('Company')).toHaveValue('Legacy Org');

    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Legacy Updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update support contact' }));

    await waitFor(() => {
      expect(crmServiceMock.updateContact).toHaveBeenCalledTimes(1);
    });

    const payload = crmServiceMock.updateContact.mock.calls[0][1];
    expect(payload).toMatchObject({ firstName: 'Legacy Updated', company: 'Legacy Org', status: 'ACTIVE' });
    expect(payload).not.toHaveProperty('companyId');
  });

  it('preserves the company link of a legacy contact on save', async () => {
    crmServiceMock.getContact.mockResolvedValue({ ...storedContact, companyId: 'company-1', company: 'Acme Vet' });

    render(<ContactFormPage contactId="contact-1" />);

    expect(await screen.findByLabelText('Company')).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Update support contact' }));

    await waitFor(() => {
      expect(crmServiceMock.updateContact).toHaveBeenCalledTimes(1);
    });

    const payload = crmServiceMock.updateContact.mock.calls[0][1];
    expect(payload).toMatchObject({ companyId: 'company-1' });
    expect(payload).not.toHaveProperty('company');
  });

  it('shows the permission fallback when contact write access is missing', () => {
    hasPermissionMock.mockReturnValue(false);

    render(<ContactFormPage />);

    expect(screen.getByText('You do not have permission to manage support contacts.')).toBeInTheDocument();
  });

  it('shows API errors returned while saving', async () => {
    crmServiceMock.createContact.mockRejectedValue(new ApiClientError('Contact invalid', 400));

    render(<ContactFormPage />);

    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create support contact' }));

    expect(await screen.findByText('Contact invalid')).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
