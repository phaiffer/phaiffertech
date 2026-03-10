import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrmNotesPage } from '@/modules/crm/notes-page';

const { hasPermissionMock, crmServiceMock, petServiceMock } = vi.hoisted(() => ({
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
  },
  petServiceMock: {
    listClients: vi.fn(),
    listProfiles: vi.fn(),
    listAppointments: vi.fn()
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

vi.mock('@/shared/services/pet-service', () => ({
  petService: petServiceMock
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
    crmServiceMock.listNotes.mockResolvedValue(createPageResponse([]));
    petServiceMock.listClients.mockResolvedValue(createPageResponse([]));
    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([]));
    petServiceMock.listAppointments.mockResolvedValue(createPageResponse([]));
  });

  it('renders enriched pet client references and keeps them editable when the pet lookup is available', async () => {
    crmServiceMock.listNotes.mockResolvedValue(createPageResponse([
      {
        id: 'note-1',
        content: 'Cliente veio do PetFlow',
        relatedType: 'PET.CLIENT',
        relatedReferenceType: 'PET.CLIENT',
        relatedModule: 'PET',
        relatedEntityType: 'CLIENT',
        relatedId: '87654321-4321-4321-4321-1234567890ab',
        relatedDisplayName: 'Ana Tutor',
        relatedDisplayContext: 'ana@example.test',
        createdBy: 'Ana',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z'
      }
    ]));
    petServiceMock.listClients.mockResolvedValue(createPageResponse([
      {
        id: '87654321-4321-4321-4321-1234567890ab',
        name: 'Ana Tutor',
        fullName: 'Ana Tutor',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z',
        status: 'ACTIVE'
      }
    ]));

    render(<CrmNotesPage />);

    await waitFor(() => {
      expect(crmServiceMock.listNotes).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Ana Tutor')).toBeInTheDocument();
    expect(screen.getByText('Pet / Client · ana@example.test · PET.CLIENT · 87654321')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    expect(screen.getByLabelText('Tipo de vínculo')).toHaveValue('PET.CLIENT');
    expect(screen.getByLabelText('Registro vinculado')).toHaveValue('87654321-4321-4321-4321-1234567890ab');
  });

  it('keeps unsupported external placeholders read-only in the CRM form', async () => {
    crmServiceMock.listNotes.mockResolvedValue(createPageResponse([
      {
        id: 'note-2',
        content: 'Placeholder externo',
        relatedType: 'IOT.DEVICE',
        relatedReferenceType: 'IOT.DEVICE',
        relatedModule: 'IOT',
        relatedEntityType: 'DEVICE',
        relatedId: '12345678-1111-1111-1111-1234567890ab',
        createdBy: 'Ana',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z'
      }
    ]));

    render(<CrmNotesPage />);

    await waitFor(() => {
      expect(crmServiceMock.listNotes).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('IoT / Device')).toBeInTheDocument();
    expect(screen.getByText('Somente leitura')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });
});
