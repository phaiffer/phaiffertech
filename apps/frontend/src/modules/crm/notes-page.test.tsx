import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrmNotesPage } from '@/modules/crm/notes-page';

const { hasPermissionMock, crmServiceMock, petServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  crmServiceMock: {
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
    size: 14
  };
}

const clientId = '87654321-4321-4321-4321-1234567890ab';

describe('CrmNotesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/pet/follow-up?tab=notes');

    hasPermissionMock.mockReturnValue(true);
    crmServiceMock.listNotes.mockResolvedValue(createPageResponse([]));
    petServiceMock.listClients.mockResolvedValue(createPageResponse([
      {
        id: clientId,
        name: 'Ana Tutor',
        fullName: 'Ana Tutor',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z',
        status: 'ACTIVE'
      }
    ]));
    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([]));
    petServiceMock.listAppointments.mockResolvedValue(createPageResponse([]));
  });

  it('renders pet client references and keeps them editable', async () => {
    crmServiceMock.listNotes.mockResolvedValue(createPageResponse([
      {
        id: 'note-1',
        content: 'Cliente veio do Pet',
        relatedType: 'PET.CLIENT',
        relatedReferenceType: 'PET.CLIENT',
        relatedModule: 'PET',
        relatedEntityType: 'CLIENT',
        relatedId: clientId,
        relatedDisplayName: 'Ana Tutor',
        relatedDisplayContext: 'ana@example.test',
        createdBy: 'Ana',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z'
      }
    ]));

    render(<CrmNotesPage />);

    expect(await screen.findByText('Cliente veio do Pet')).toBeInTheDocument();
    expect(screen.getByText('Client · ana@example.test')).toBeInTheDocument();
    expect(screen.queryByLabelText('Content')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByLabelText('Content')).toHaveValue('Cliente veio do Pet');
    expect(screen.getAllByLabelText('Link type')[1]).toHaveValue('PET.CLIENT');
    await waitFor(() => {
      expect(screen.getAllByLabelText('Linked record')[1]).toHaveValue(clientId);
    });
  });

  it('keeps references it cannot edit read-only', async () => {
    crmServiceMock.listNotes.mockResolvedValue(createPageResponse([
      {
        id: 'note-2',
        content: 'Registro antigo',
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

    expect(await screen.findByText('Device')).toBeInTheDocument();
    expect(screen.getByText('Read only')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('creates a note with the canonical pet reference', async () => {
    crmServiceMock.createNote.mockResolvedValue({ id: 'note-3' });

    render(<CrmNotesPage />);

    fireEvent.click((await screen.findAllByRole('button', { name: 'New note' }))[0]);
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'Prefere contato à tarde' } });
    await screen.findByRole('option', { name: 'Ana Tutor' });
    fireEvent.change(screen.getAllByLabelText('Linked record')[1], { target: { value: clientId } });
    fireEvent.click(screen.getByRole('button', { name: 'Create note' }));

    await waitFor(() => {
      expect(crmServiceMock.createNote).toHaveBeenCalledWith({
        content: 'Prefere contato à tarde',
        relatedReferenceType: 'PET.CLIENT',
        relatedId: clientId
      });
    });
  });

  it('applies relation filters from the query string', async () => {
    window.history.pushState({}, '', `/pet/follow-up?tab=notes&relatedReferenceType=PET.CLIENT&relatedId=${clientId}`);

    render(<CrmNotesPage />);

    await waitFor(() => {
      expect(crmServiceMock.listNotes).toHaveBeenCalledWith(0, 14, '', {
        relatedReferenceType: 'PET.CLIENT',
        relatedId: clientId,
        relatedModule: 'PET'
      });
    });

    expect(screen.getByLabelText('Link type')).toHaveValue('PET.CLIENT');
    await waitFor(() => {
      expect(screen.getByLabelText('Linked record')).toHaveValue(clientId);
    });
  });
});
