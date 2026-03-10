import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrmNotesPage } from '@/modules/crm/notes-page';

const { hasPermissionMock, crmServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  crmServiceMock: {
    listCompanies: vi.fn(),
    listContacts: vi.fn(),
    listLeads: vi.fn(),
    listDeals: vi.fn(),
    listNotes: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn()
  }
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: hasPermissionMock,
    hasAnyPermission: vi.fn(() => true)
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

describe('CrmNotesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hasPermissionMock.mockReturnValue(true);
    crmServiceMock.listCompanies.mockResolvedValue(createPageResponse([]));
    crmServiceMock.listContacts.mockResolvedValue(createPageResponse([]));
    crmServiceMock.listLeads.mockResolvedValue(createPageResponse([]));
    crmServiceMock.listDeals.mockResolvedValue(createPageResponse([]));
    crmServiceMock.listNotes.mockResolvedValue(createPageResponse([
      {
        id: 'note-1',
        content: 'Cliente veio do PetFlow',
        relatedType: 'PET.CLIENT',
        relatedReferenceType: 'PET.CLIENT',
        relatedModule: 'PET',
        relatedEntityType: 'CLIENT',
        relatedId: '87654321-4321-4321-4321-1234567890ab',
        createdBy: 'Ana',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z'
      }
    ]));
  });

  it('shows external canonical references explicitly and keeps them read-only in the CRM form', async () => {
    render(<CrmNotesPage />);

    await waitFor(() => {
      expect(crmServiceMock.listNotes).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Pet / Client')).toBeInTheDocument();
    expect(screen.getByText('PET.CLIENT · 87654321')).toBeInTheDocument();
    expect(screen.getByText('Somente leitura')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });
});
