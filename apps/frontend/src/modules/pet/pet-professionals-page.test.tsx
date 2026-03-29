import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetProfessionalsPage } from '@/modules/pet/pet-professionals-page';

const { hasPermissionMock, hasAnyPermissionMock, petServiceMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  hasAnyPermissionMock: vi.fn(),
  petServiceMock: {
    listProfessionals: vi.fn(),
    listAppointments: vi.fn(),
    createProfessional: vi.fn(),
    updateProfessional: vi.fn(),
    deleteProfessional: vi.fn()
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
    size: 10
  };
}

describe('PetProfessionalsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermissionMock.mockReturnValue(true);
    hasAnyPermissionMock.mockReturnValue(true);
    petServiceMock.listProfessionals.mockResolvedValue(createPageResponse([]));
    petServiceMock.listAppointments.mockResolvedValue(createPageResponse([]));
  });

  it('renders the professional email field with safe autofill metadata', async () => {
    render(<PetProfessionalsPage />);

    await waitFor(() => {
      expect(petServiceMock.listProfessionals).toHaveBeenCalledTimes(1);
    });

    const emailInput = screen.getByLabelText('Email');

    expect(emailInput).toHaveAttribute('id', 'professional-email');
    expect(emailInput).toHaveAttribute('name', 'professionalEmail');
    expect(emailInput).toHaveAttribute('autocomplete', 'section-professional email');
    expect(emailInput).toHaveAttribute('inputmode', 'email');
    expect(emailInput).toHaveAttribute('autocapitalize', 'none');
    expect(emailInput).toHaveAttribute('autocorrect', 'off');
    expect(emailInput).toHaveAttribute('spellcheck', 'false');
    expect(emailInput).toHaveAttribute('data-lpignore', 'true');
    expect(emailInput).toHaveAttribute('data-1p-ignore', 'true');
  });
});
