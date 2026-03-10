import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrmTasksPage } from '@/modules/crm/tasks-page';

const { hasPermissionMock, crmServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  crmServiceMock: {
    listCompanies: vi.fn(),
    listContacts: vi.fn(),
    listLeads: vi.fn(),
    listDeals: vi.fn(),
    listTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn()
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

describe('CrmTasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    hasPermissionMock.mockReturnValue(true);
    crmServiceMock.listCompanies.mockResolvedValue(createPageResponse([]));
    crmServiceMock.listContacts.mockResolvedValue(createPageResponse([]));
    crmServiceMock.listLeads.mockResolvedValue(createPageResponse([]));
    crmServiceMock.listDeals.mockResolvedValue(createPageResponse([]));
    crmServiceMock.listTasks.mockResolvedValue(createPageResponse([
      {
        id: 'task-1',
        title: 'Ligar para cliente',
        status: 'OPEN',
        priority: 'HIGH',
        relatedType: 'COMPANY',
        relatedReferenceType: 'CRM.COMPANY',
        relatedModule: 'CRM',
        relatedEntityType: 'COMPANY',
        relatedId: '12345678-1234-1234-1234-1234567890ab',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z'
      }
    ]));
  });

  it('renders canonical CRM relation context and keeps legacy CRM editing compatible', async () => {
    render(<CrmTasksPage />);

    await waitFor(() => {
      expect(crmServiceMock.listTasks).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('CRM / Company')).toBeInTheDocument();
    expect(screen.getByText('CRM.COMPANY · 12345678')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    expect(screen.getByLabelText('Tipo de vínculo')).toHaveValue('COMPANY');
    expect(screen.getByLabelText('Título')).toHaveValue('Ligar para cliente');
  });
});
