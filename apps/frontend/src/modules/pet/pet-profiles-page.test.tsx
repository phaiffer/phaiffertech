import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetProfilesPage } from '@/modules/pet/pet-profiles-page';

const { petServiceMock, pushMock } = vi.hoisted(() => ({
  petServiceMock: {
    listClients: vi.fn(),
    listProfiles: vi.fn(),
    updateProfile: vi.fn(),
    createProfile: vi.fn(),
    deleteProfile: vi.fn()
  },
  pushMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

vi.mock('@/shared/auth/PermissionGuard', () => ({
  PermissionGuard: ({ children }: { children: ReactNode }) => <>{children}</>
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

describe('PetProfilesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    petServiceMock.listClients.mockResolvedValue(createPageResponse([
      {
        id: 'client-1',
        name: 'Mister Dog Tutor',
        status: 'ACTIVE',
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z'
      }
    ]));
    petServiceMock.listProfiles.mockResolvedValue(createPageResponse([
      {
        id: 'pet-1',
        clientId: 'client-1',
        name: 'Luna',
        species: 'Dog',
        breed: 'Spitz',
        size: 'SMALL',
        coatType: 'Dupla',
        behavior: 'Ansiosa',
        restrictions: 'Alergia a perfume',
        groomingNotes: 'Usar shampoo neutro',
        createdAt: '2026-05-01T00:00:00Z',
        updatedAt: '2026-05-01T00:00:00Z'
      }
    ]));
    petServiceMock.updateProfile.mockResolvedValue({
      id: 'pet-1'
    });
  });

  it('updates and reloads grooming fields for a pet profile', async () => {
    render(<PetProfilesPage />);

    await waitFor(() => {
      expect(petServiceMock.listProfiles).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByLabelText('Porte'), { target: { value: 'MEDIUM' } });
    fireEvent.change(screen.getByLabelText('Tipo de pelagem'), { target: { value: 'Longa' } });
    fireEvent.change(screen.getByLabelText('Comportamento'), { target: { value: 'Calma' } });
    fireEvent.change(screen.getByLabelText('Restricoes'), { target: { value: 'Evitar perfume' } });
    fireEvent.change(screen.getByLabelText('Observacoes de banho/tosa'), { target: { value: 'Secagem morna' } });
    fireEvent.click(screen.getByRole('button', { name: 'Atualizar pet' }));

    await waitFor(() => {
      expect(petServiceMock.updateProfile).toHaveBeenCalledWith('pet-1', expect.objectContaining({
        size: 'MEDIUM',
        coatType: 'Longa',
        behavior: 'Calma',
        restrictions: 'Evitar perfume',
        groomingNotes: 'Secagem morna'
      }));
    });
    await waitFor(() => {
      expect(petServiceMock.listProfiles).toHaveBeenCalledTimes(2);
    });
  });
});
