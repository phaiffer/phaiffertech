import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrmActivityPage } from '@/modules/crm/activity-page';

const { hasPermissionMock, crmServiceMock, petServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  crmServiceMock: {
    listActivity: vi.fn()
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

describe('CrmActivityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/pet/follow-up?tab=activity');

    hasPermissionMock.mockReturnValue(true);
    crmServiceMock.listActivity.mockResolvedValue(createPageResponse([
      {
        id: 'activity-1',
        eventType: 'task.created',
        entity: 'crm_task',
        entityReferenceType: 'CRM.TASK',
        entityModule: 'CRM',
        entityType: 'TASK',
        entityId: 'abcdef12-1234-1234-1234-abcdefabcdef',
        relatedType: 'PET.CLIENT',
        relatedReferenceType: 'PET.CLIENT',
        relatedModule: 'PET',
        relatedEntityType: 'CLIENT',
        relatedId: clientId,
        relatedDisplayName: 'Ana Tutor',
        relatedDisplayContext: 'ana@example.test',
        userId: 'user-uuid',
        payload: { detail: 'raw-json' },
        createdAt: '2026-03-10T09:00:00Z'
      }
    ]));
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

  it('shows translated events and pet references without raw ids or payloads', async () => {
    render(<CrmActivityPage />);

    expect(await screen.findByText('Task created')).toBeInTheDocument();
    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Client · ana@example.test')).toBeInTheDocument();
    expect(screen.queryByText(/raw-json/)).not.toBeInTheDocument();
    expect(screen.queryByText('user-uuid')).not.toBeInTheDocument();
  });

  it('formats timestamps embedded in the reference context', async () => {
    crmServiceMock.listActivity.mockResolvedValue(createPageResponse([
      {
        id: 'activity-3',
        eventType: 'note.created',
        entity: 'crm_note',
        entityId: 'id',
        relatedReferenceType: 'PET.APPOINTMENT',
        relatedId: 'appointment-1',
        relatedDisplayName: 'Banho',
        relatedDisplayContext: 'Nina · 2026-03-10T14:00:00Z',
        payload: {},
        createdAt: '2026-03-10T09:00:00Z'
      }
    ]));

    render(<CrmActivityPage />);

    expect(await screen.findByText(/^Appointment · Nina · /)).toBeInTheDocument();
    expect(screen.queryByText(/2026-03-10T14:00:00Z/)).not.toBeInTheDocument();
  });

  it('falls back to the raw event when it has no label', async () => {
    crmServiceMock.listActivity.mockResolvedValue(createPageResponse([
      { id: 'activity-2', eventType: 'task.archived', entity: 'crm_task', entityId: 'id', payload: {}, createdAt: '2026-03-10T09:00:00Z' }
    ]));

    render(<CrmActivityPage />);

    expect(await screen.findByText('task.archived')).toBeInTheDocument();
  });

  it('applies relation filters from the query string', async () => {
    window.history.pushState({}, '', `/pet/follow-up?tab=activity&relatedReferenceType=PET.CLIENT&relatedId=${clientId}`);

    render(<CrmActivityPage />);

    await waitFor(() => {
      expect(crmServiceMock.listActivity).toHaveBeenCalledWith(0, 14, {
        relatedReferenceType: 'PET.CLIENT',
        relatedId: clientId,
        relatedModule: 'PET'
      });
    });

    expect(screen.getByLabelText('Link type')).toHaveValue('PET.CLIENT');
    // The record options arrive with the async client lookup, so wait for the selected value.
    await waitFor(() => {
      expect(screen.getByLabelText('Linked record')).toHaveValue(clientId);
    });
  });
});
