import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrmTasksPage } from '@/modules/crm/tasks-page';

const { hasPermissionMock, crmServiceMock, petServiceMock } = vi.hoisted(() => ({
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

describe('CrmTasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/crm/tasks');

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
    petServiceMock.listClients.mockResolvedValue(createPageResponse([]));
    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([]));
    petServiceMock.listAppointments.mockResolvedValue(createPageResponse([]));
  });

  it('renders canonical CRM relation context and keeps legacy CRM editing compatible', async () => {
    render(<CrmTasksPage />);

    await waitFor(() => {
      expect(crmServiceMock.listTasks).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('CRM / Company')).toBeInTheDocument();
    expect(screen.getByText('CRM / Company · CRM.COMPANY · 12345678')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    expect(screen.getAllByLabelText('Tipo de vínculo')[1]).toHaveValue('COMPANY');
    expect(screen.getByLabelText('Título')).toHaveValue('Ligar para cliente');
  });

  it('renders enriched pet references and allows editing when the matching pet permission is available', async () => {
    crmServiceMock.listTasks.mockResolvedValue(createPageResponse([
      {
        id: 'task-2',
        title: 'Follow-up do atendimento',
        status: 'OPEN',
        priority: 'MEDIUM',
        relatedType: 'PET.APPOINTMENT',
        relatedReferenceType: 'PET.APPOINTMENT',
        relatedModule: 'PET',
        relatedEntityType: 'APPOINTMENT',
        relatedId: '87654321-1234-1234-1234-abcdefabcdef',
        relatedDisplayName: 'Consulta clinica',
        relatedDisplayContext: 'Nina · 2026-03-10T14:00:00Z',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z'
      }
    ]));
    petServiceMock.listAppointments.mockResolvedValue(createPageResponse([
      {
        id: '87654321-1234-1234-1234-abcdefabcdef',
        clientId: 'client-1',
        petId: 'pet-1',
        petName: 'Nina',
        serviceId: 'service-1',
        serviceName: 'Consulta clinica',
        professionalId: 'professional-1',
        scheduledAt: '2026-03-10T14:00:00Z',
        status: 'SCHEDULED',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z'
      }
    ]));

    render(<CrmTasksPage />);

    await waitFor(() => {
      expect(crmServiceMock.listTasks).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Consulta clinica')).toBeInTheDocument();
    expect(screen.getByText('Pet / Appointment · Nina · 2026-03-10T14:00:00Z · PET.APPOINTMENT · 87654321')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    expect(screen.getAllByLabelText('Tipo de vínculo')[1]).toHaveValue('PET.APPOINTMENT');
    expect(screen.getAllByLabelText('Registro vinculado')[1]).toHaveValue('87654321-1234-1234-1234-abcdefabcdef');
  });

  it('applies canonical relation filters from the query string for pet references', async () => {
    window.history.pushState({}, '', '/crm/tasks?relatedReferenceType=PET.CLIENT&relatedId=client-99');
    petServiceMock.listClients.mockResolvedValue(createPageResponse([
      {
        id: 'client-99',
        name: 'Tutor Pet',
        fullName: 'Tutor Pet',
        status: 'ACTIVE',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z'
      }
    ]));

    render(<CrmTasksPage />);

    await waitFor(() => {
      expect(crmServiceMock.listTasks).toHaveBeenCalledWith(0, 10, '', {
        status: undefined,
        priority: undefined,
        relatedReferenceType: 'PET.CLIENT',
        relatedId: 'client-99'
      });
    });

    expect(screen.getAllByLabelText('Tipo de vínculo')[0]).toHaveValue('PET.CLIENT');
    expect(screen.getAllByLabelText('Registro vinculado')[0]).toHaveValue('client-99');
  });
});
