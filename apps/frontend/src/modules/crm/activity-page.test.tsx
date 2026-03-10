import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrmActivityPage } from '@/modules/crm/activity-page';

const { hasPermissionMock, crmServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  crmServiceMock: {
    listActivity: vi.fn()
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

describe('CrmActivityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
        payload: {},
        createdAt: '2026-03-10T09:00:00Z'
      }
    ]));
  });

  it('renders canonical entity context for the activity feed', async () => {
    render(<CrmActivityPage />);

    await waitFor(() => {
      expect(crmServiceMock.listActivity).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('CRM / Task')).toBeInTheDocument();
    expect(screen.getByText('CRM.TASK · abcdef12')).toBeInTheDocument();
  });
});
