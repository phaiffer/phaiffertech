import { render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetMedicalRecordsPage } from '@/modules/pet/pet-medical-records-page';

const { hasPermissionMock, hasAnyPermissionMock, petServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  hasAnyPermissionMock: vi.fn(),
  petServiceMock: {
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

    expect(screen.getByText('Controle de aplicações e próximos reforços.')).toBeInTheDocument();
    const vaccinationRow = screen.getByText('Raiva').closest('tr');

    expect(vaccinationRow).not.toBeNull();
    expect(within(vaccinationRow as HTMLTableRowElement).getByText('Nina')).toBeInTheDocument();
    expect(screen.queryByText('Histórico clínico e evoluções por pet.')).not.toBeInTheDocument();
    expect(screen.queryByText('Prescrições vinculadas ao histórico do atendimento.')).not.toBeInTheDocument();
    expect(petServiceMock.listMedicalRecords).not.toHaveBeenCalled();
    expect(petServiceMock.listPrescriptions).not.toHaveBeenCalled();
  });

  it('mostra fallback quando o usuário não possui nenhuma permissão médica', async () => {
    render(<PetMedicalRecordsPage />);

    expect(screen.getByText('Você não possui permissão para visualizar workflows médicos do Pet.')).toBeInTheDocument();

    await waitFor(() => {
      expect(petServiceMock.listProfiles).not.toHaveBeenCalled();
      expect(petServiceMock.listMedicalRecords).not.toHaveBeenCalled();
      expect(petServiceMock.listVaccinations).not.toHaveBeenCalled();
      expect(petServiceMock.listPrescriptions).not.toHaveBeenCalled();
    });
  });
});
