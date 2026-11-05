import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrmTasksPage } from '@/modules/crm/tasks-page';

const { hasPermissionMock, crmServiceMock, petServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  crmServiceMock: {
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
    size: 14
  };
}

const appointmentTask = {
  id: 'task-2',
  title: 'Follow-up do atendimento',
  dueDate: '2026-03-12T12:00:00Z',
  status: 'OPEN',
  priority: 'MEDIUM',
  relatedType: 'PET.APPOINTMENT',
  relatedReferenceType: 'PET.APPOINTMENT',
  relatedModule: 'PET',
  relatedEntityType: 'APPOINTMENT',
  relatedId: '87654321-1234-1234-1234-abcdefabcdef',
  relatedDisplayName: 'Consulta clinica',
  relatedDisplayContext: 'Nina',
  createdAt: '2026-03-10T09:00:00Z',
  updatedAt: '2026-03-10T09:00:00Z'
};

describe('CrmTasksPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '/pet/follow-up');

    hasPermissionMock.mockReturnValue(true);
    crmServiceMock.listTasks.mockResolvedValue(createPageResponse([appointmentTask]));
    crmServiceMock.createTask.mockResolvedValue(appointmentTask);
    petServiceMock.listClients.mockResolvedValue(createPageResponse([
      {
        id: 'client-1',
        name: 'Tutor Pet',
        fullName: 'Tutor Pet',
        status: 'ACTIVE',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z'
      }
    ]));
    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([]));
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
  });

  it('pins the list to pet references and shows them without technical tokens', async () => {
    render(<CrmTasksPage />);

    expect(await screen.findByText('Follow-up do atendimento')).toBeInTheDocument();

    expect(crmServiceMock.listTasks).toHaveBeenCalledWith(0, 14, '', {
      status: undefined,
      priority: undefined,
      relatedReferenceType: undefined,
      relatedId: undefined,
      relatedModule: 'PET'
    });
    expect(screen.getByText('Appointment · Nina')).toBeInTheDocument();
    expect(screen.queryByText(/PET\.APPOINTMENT/)).not.toBeInTheDocument();
  });

  it('keeps the editor closed until the user asks for it', async () => {
    render(<CrmTasksPage />);

    await screen.findByText('Follow-up do atendimento');
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'New task' }));
    expect(screen.getByLabelText('Title')).toHaveValue('');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  });

  it('edits a task with its stored pet reference', async () => {
    render(<CrmTasksPage />);

    await screen.findByText('Follow-up do atendimento');

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByLabelText('Title')).toHaveValue('Follow-up do atendimento');
    expect(screen.getByLabelText('Due date')).toHaveValue('2026-03-12');
    expect(screen.getAllByLabelText('Link type')[1]).toHaveValue('PET.APPOINTMENT');
    await waitFor(() => {
      expect(screen.getAllByLabelText('Linked record')[1]).toHaveValue('87654321-1234-1234-1234-abcdefabcdef');
    });
  });

  it('asks for a link before creating a task', async () => {
    render(<CrmTasksPage />);

    await screen.findByText('Follow-up do atendimento');
    fireEvent.click(screen.getByRole('button', { name: 'New task' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Ligar para o tutor' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create task' }));

    expect(await screen.findByText('Title and link are required.')).toBeInTheDocument();
    expect(crmServiceMock.createTask).not.toHaveBeenCalled();
  });

  it('creates a task with the canonical pet reference', async () => {
    render(<CrmTasksPage />);

    await screen.findByText('Follow-up do atendimento');
    fireEvent.click(screen.getByRole('button', { name: 'New task' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Ligar para o tutor' } });
    await screen.findByRole('option', { name: 'Tutor Pet' });
    fireEvent.change(screen.getAllByLabelText('Linked record')[1], { target: { value: 'client-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create task' }));

    await waitFor(() => {
      expect(crmServiceMock.createTask).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Ligar para o tutor',
        status: 'OPEN',
        priority: 'MEDIUM',
        relatedReferenceType: 'PET.CLIENT',
        relatedId: 'client-1'
      }));
    });
    await waitFor(() => {
      expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    });
  });

  it('applies relation filters from the query string', async () => {
    window.history.pushState({}, '', '/pet/follow-up?relatedReferenceType=PET.CLIENT&relatedId=client-1');

    render(<CrmTasksPage />);

    await waitFor(() => {
      expect(crmServiceMock.listTasks).toHaveBeenCalledWith(0, 14, '', {
        status: undefined,
        priority: undefined,
        relatedReferenceType: 'PET.CLIENT',
        relatedId: 'client-1',
        relatedModule: 'PET'
      });
    });

    expect(screen.getByLabelText('Link type')).toHaveValue('PET.CLIENT');
    await waitFor(() => {
      expect(screen.getByLabelText('Linked record')).toHaveValue('client-1');
    });
  });

  it('shows a lookup failure without hiding the task list', async () => {
    petServiceMock.listClients.mockRejectedValue(new Error('network'));

    render(<CrmTasksPage />);

    expect(await screen.findByText('Follow-up do atendimento')).toBeInTheDocument();
    expect(await screen.findByText('Unable to load clients, pets and appointments for linking.')).toBeInTheDocument();
  });
});
