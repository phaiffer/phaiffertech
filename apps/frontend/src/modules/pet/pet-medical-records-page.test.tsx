import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetMedicalRecordsPage } from '@/modules/pet/pet-medical-records-page';

const { hasPermissionMock, hasAnyPermissionMock, searchParamGetMock, petServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  hasAnyPermissionMock: vi.fn(),
  searchParamGetMock: vi.fn(),
  petServiceMock: {
    getAppointment: vi.fn(),
    getClinicalTimeline: vi.fn(),
    listProfiles: vi.fn(),
    listProfessionals: vi.fn(),
    listMedicalRecords: vi.fn(),
    listVaccinations: vi.fn(),
    listPrescriptions: vi.fn(),
    createMedicalRecord: vi.fn(),
    updateMedicalRecord: vi.fn(),
    deleteMedicalRecord: vi.fn(),
    createVaccination: vi.fn(),
    updateVaccination: vi.fn(),
    deleteVaccination: vi.fn(),
    createPrescription: vi.fn(),
    updatePrescription: vi.fn(),
    deletePrescription: vi.fn()
  }
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: hasPermissionMock,
    hasAnyPermission: hasAnyPermissionMock
  })
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/pet/medical-records',
  useSearchParams: () => ({
    get: searchParamGetMock
  })
}));

vi.mock('@/modules/pet/pet-module-subnav', () => ({
  PetModuleSubnav: () => null
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
    size: 5
  };
}

function setGrantedPermissions(granted: string[]) {
  hasPermissionMock.mockImplementation((permission: string) => granted.includes(permission));
  hasAnyPermissionMock.mockImplementation((permissions: string[]) => permissions.some((permission) => granted.includes(permission)));
}

describe('PetMedicalRecordsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    setGrantedPermissions([]);
    searchParamGetMock.mockReturnValue(null);

    petServiceMock.getAppointment.mockResolvedValue(null);
    petServiceMock.getClinicalTimeline.mockResolvedValue({
      totalEvents: 0,
      events: []
    });
    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([]));
    petServiceMock.listProfessionals.mockResolvedValue(createPageResponse([]));
    petServiceMock.listMedicalRecords.mockResolvedValue(createPageResponse([]));
    petServiceMock.listVaccinations.mockResolvedValue(createPageResponse([]));
    petServiceMock.listPrescriptions.mockResolvedValue(createPageResponse([]));
  });

  it('permite acesso parcial a workflows médicos e mostra apenas a seção autorizada', async () => {
    setGrantedPermissions([
      'pet.profile.read',
      'pet.vaccination.read',
      'pet.vaccination.create'
    ]);

    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([
      {
        id: 'pet-1',
        clientId: 'client-1',
        name: 'Nina',
        species: 'DOG',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z'
      }
    ]));

    petServiceMock.listVaccinations.mockResolvedValue(createPageResponse([
      {
        id: 'vaccination-1',
        petId: 'pet-1',
        petName: 'Nina',
        vaccineName: 'Raiva',
        appliedAt: '2026-03-10T10:00:00Z',
        createdAt: '2026-03-10T10:00:00Z',
        updatedAt: '2026-03-10T10:00:00Z'
      }
    ]));

    render(<PetMedicalRecordsPage />);

    await waitFor(() => {
      expect(petServiceMock.listVaccinations).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole('heading', { level: 2, name: /Vaccinations/ })).toBeInTheDocument();
    const vaccinationRow = screen.getByText('Raiva').closest('tr');

    expect(vaccinationRow).not.toBeNull();
    expect(within(vaccinationRow as HTMLTableRowElement).getByText('Nina')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: /Medical records/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: /Prescriptions/ })).not.toBeInTheDocument();
    expect(petServiceMock.listMedicalRecords).not.toHaveBeenCalled();
    expect(petServiceMock.listPrescriptions).not.toHaveBeenCalled();
    expect(petServiceMock.getClinicalTimeline).not.toHaveBeenCalled();
  });

  it('mostra fallback quando o usuário não possui nenhuma permissão médica', async () => {
    render(<PetMedicalRecordsPage />);

    expect(screen.getByText('You do not have permission to view clinical records.')).toBeInTheDocument();

    await waitFor(() => {
      expect(petServiceMock.listProfiles).not.toHaveBeenCalled();
      expect(petServiceMock.listMedicalRecords).not.toHaveBeenCalled();
      expect(petServiceMock.listVaccinations).not.toHaveBeenCalled();
      expect(petServiceMock.listPrescriptions).not.toHaveBeenCalled();
      expect(petServiceMock.getClinicalTimeline).not.toHaveBeenCalled();
    });
  });

  it('mostra orientacao de timeline quando nao ha pet nem atendimento em contexto', async () => {
    setGrantedPermissions([
      'pet.profile.read',
      'pet.professional.read',
      'pet.medical-record.read'
    ]);

    render(<PetMedicalRecordsPage />);

    await waitFor(() => {
      expect(petServiceMock.listMedicalRecords).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByText('Select a pet or open an appointment to see the clinical history.')
    ).toBeInTheDocument();
    expect(petServiceMock.getClinicalTimeline).not.toHaveBeenCalled();
  });

  it('mostra a falha de cada lista e tira o aviso quando a lista volta a carregar', async () => {
    setGrantedPermissions(['pet.medical-record.read', 'pet.vaccination.read']);
    petServiceMock.listMedicalRecords.mockRejectedValue(new Error('network'));
    petServiceMock.listVaccinations.mockRejectedValue(new Error('network'));

    render(<PetMedicalRecordsPage />);

    expect(await screen.findByText('Unable to load medical records.')).toBeInTheDocument();
    expect(await screen.findByText('Unable to load vaccinations.')).toBeInTheDocument();

    petServiceMock.listMedicalRecords.mockResolvedValue(createPageResponse([]));
    petServiceMock.listVaccinations.mockResolvedValue(createPageResponse([]));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Nina' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(screen.queryByText('Unable to load medical records.')).not.toBeInTheDocument();
      expect(screen.queryByText('Unable to load vaccinations.')).not.toBeInTheDocument();
    });
  });

  it('abre o editor de prontuário quando a Clínica pede um novo registro', async () => {
    setGrantedPermissions(['pet.profile.read', 'pet.professional.read', 'pet.medical-record.read', 'pet.medical-record.create']);
    searchParamGetMock.mockImplementation((key: string) => ({ tab: 'records', novo: '1' } as Record<string, string>)[key] ?? null);

    render(<PetMedicalRecordsPage />);

    expect(await screen.findByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create record' })).toBeInTheDocument();
  });

  it('usa o atendimento selecionado como contexto clínico do prontuário', async () => {
    setGrantedPermissions([
      'pet.appointment.read',
      'pet.profile.read',
      'pet.professional.read',
      'pet.medical-record.read',
      'pet.medical-record.create'
    ]);
    searchParamGetMock.mockImplementation((key: string) => (key === 'appointmentId' ? 'appointment-1' : null));

    petServiceMock.getAppointment.mockResolvedValue({
      id: 'appointment-1',
      clientId: 'client-1',
      clientName: 'Owner Example',
      petId: 'pet-1',
      petName: 'Nina',
      serviceId: 'service-1',
      serviceName: 'Consulta clínica',
      professionalId: 'professional-1',
      professionalName: 'Dr Example',
      scheduledAt: '2026-03-10T10:00:00Z',
      status: 'SCHEDULED',
      medicalRecordCount: 0,
      vaccinationCount: 0,
      prescriptionCount: 0,
      createdAt: '2026-03-10T10:00:00Z',
      updatedAt: '2026-03-10T10:00:00Z'
    });

    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([
      {
        id: 'pet-1',
        clientId: 'client-1',
        name: 'Nina',
        species: 'DOG',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z'
      }
    ]));
    petServiceMock.listProfessionals.mockResolvedValue(createPageResponse([
      {
        id: 'professional-1',
        name: 'Dr Example',
        createdAt: '2026-03-10T09:00:00Z',
        updatedAt: '2026-03-10T09:00:00Z'
      }
    ]));
    petServiceMock.createMedicalRecord.mockResolvedValue({
      id: 'record-1',
      petId: 'pet-1',
      petName: 'Nina',
      professionalId: 'professional-1',
      professionalName: 'Dr Example',
      appointmentId: 'appointment-1',
      appointmentServiceName: 'Consulta clínica',
      appointmentScheduledAt: '2026-03-10T10:00:00Z',
      description: 'Observação inicial',
      createdAt: '2026-03-10T10:05:00Z',
      updatedAt: '2026-03-10T10:05:00Z'
    });
    petServiceMock.getClinicalTimeline.mockResolvedValue({
      petId: 'pet-1',
      petName: 'Nina',
      appointmentId: 'appointment-1',
      appointmentServiceName: 'Consulta clínica',
      appointmentScheduledAt: '2026-03-10T10:00:00Z',
      appointmentStatus: 'SCHEDULED',
      totalEvents: 2,
      events: [
        {
          eventType: 'VACCINATION',
          eventId: 'event-1',
          occurredAt: '2026-03-10T10:10:00Z',
          petId: 'pet-1',
          petName: 'Nina',
          appointmentId: 'appointment-1',
          appointmentServiceName: 'Consulta clínica',
          appointmentScheduledAt: '2026-03-10T10:00:00Z',
          title: 'Raiva',
          summary: 'Dose anual'
        },
        {
          eventType: 'MEDICAL_RECORD',
          eventId: 'event-2',
          occurredAt: '2026-03-10T10:05:00Z',
          petId: 'pet-1',
          petName: 'Nina',
          professionalId: 'professional-1',
          professionalName: 'Dr Example',
          appointmentId: 'appointment-1',
          appointmentServiceName: 'Consulta clínica',
          appointmentScheduledAt: '2026-03-10T10:00:00Z',
          title: 'Otite',
          summary: 'Observação inicial'
        }
      ]
    });

    render(<PetMedicalRecordsPage />);

    await waitFor(() => {
      expect(petServiceMock.getAppointment).toHaveBeenCalledWith('appointment-1');
    });

    await waitFor(() => {
      expect(petServiceMock.listMedicalRecords).toHaveBeenCalledWith(0, 14, '', {
        petId: 'pet-1',
        professionalId: 'professional-1',
        appointmentId: 'appointment-1'
      });
    });

    await waitFor(() => {
      expect(petServiceMock.getClinicalTimeline).toHaveBeenCalledWith({
        petId: undefined,
        appointmentId: 'appointment-1',
        limit: 20
      });
    });

    expect(await screen.findByText('Recording for an appointment.')).toBeInTheDocument();
    expect(await screen.findByText('History of the current appointment.')).toBeInTheDocument();
    expect(screen.getByText('Raiva')).toBeInTheDocument();
    expect(screen.getByText('Otite')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View full history' })).toHaveAttribute(
      'href',
      '/pet/medical-records'
    );
    expect(screen.getByText(/Consulta clínica for Nina \(Owner Example\) with Dr Example/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Medical records' }));
    expect(screen.queryByLabelText('Description')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'New record' }));
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Observação inicial' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create record' }));

    await waitFor(() => {
      expect(petServiceMock.createMedicalRecord).toHaveBeenCalledWith({
        petId: 'pet-1',
        professionalId: 'professional-1',
        appointmentId: 'appointment-1',
        description: 'Observação inicial',
        diagnosis: undefined,
        treatment: undefined
      });
    });
  });
});
