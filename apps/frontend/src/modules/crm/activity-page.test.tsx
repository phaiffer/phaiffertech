import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrmActivityPage } from '@/modules/crm/activity-page';

const { hasPermissionMock, crmServiceMock, petServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  crmServiceMock: {
    listActivity: vi.fn(),
    listCompanies: vi.fn(),
    listContacts: vi.fn(),
    listLeads: vi.fn(),
    listDeals: vi.fn()
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

describe('CrmActivityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/crm/activity');

    hasPermissionMock.mockReturnValue(true);
    crmServiceMock.listCompanies.mockResolvedValue(createPageResponse([]));
    crmServiceMock.listContacts.mockResolvedValue(createPageResponse([]));
    crmServiceMock.listLeads.mockResolvedValue(createPageResponse([]));
    crmServiceMock.listDeals.mockResolvedValue(createPageResponse([]));
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
        relatedId: '87654321-4321-4321-4321-1234567890ab',
        relatedDisplayName: 'Ana Tutor',
        relatedDisplayContext: 'ana@example.test',
        payload: {},
        createdAt: '2026-03-10T09:00:00Z'
      }
    ]));
    petServiceMock.listClients.mockResolvedValue(createPageResponse([]));
    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([]));
    petServiceMock.listAppointments.mockResolvedValue(createPageResponse([]));
  });

  it('renders canonical entity context and the related pet reference in the activity feed', async () => {
    render(<CrmActivityPage />);

    await waitFor(() => {
      expect(crmServiceMock.listActivity).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('CRM / Task')).toBeInTheDocument();
    expect(screen.getByText('CRM / Task · CRM.TASK · abcdef12')).toBeInTheDocument();
    expect(screen.getByText('Ana Tutor')).toBeInTheDocument();
    expect(screen.getByText('Pet / Client · ana@example.test · PET.CLIENT · 87654321')).toBeInTheDocument();
  });

  it('applies canonical activity filters from the query string for pet references', async () => {
    window.history.pushState({}, '', '/crm/activity?relatedReferenceType=PET.CLIENT&relatedId=87654321-4321-4321-4321-1234567890ab');
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

    render(<CrmActivityPage />);

    await waitFor(() => {
      expect(crmServiceMock.listActivity).toHaveBeenCalledWith(0, 10, {
        relatedReferenceType: 'PET.CLIENT',
        relatedId: '87654321-4321-4321-4321-1234567890ab'
      });
    });

    expect(screen.getByLabelText('Tipo de vínculo')).toHaveValue('PET.CLIENT');
    expect(screen.getByLabelText('Registro vinculado')).toHaveValue('87654321-4321-4321-4321-1234567890ab');
  });
});
