import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import UsersPage from '@/app/(app)/users/page';
import { userService } from '@/shared/services/user-service';

const hasPermissionMock = vi.fn<(permission: string) => boolean>();

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: hasPermissionMock,
    hasAnyPermission: vi.fn().mockReturnValue(false)
  })
}));

vi.mock('@/shared/services/user-service', () => ({
  userService: {
    list: vi.fn(),
    create: vi.fn()
  }
}));

describe('UsersPage authorization', () => {
  it('nao chama userService.list sem USER_READ', async () => {
    hasPermissionMock.mockImplementation(() => false);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Você não possui permissão para visualizar usuários.')).toBeInTheDocument();
    });

    expect(userService.list).not.toHaveBeenCalled();
  });

  it('carrega a lista sem expor o formulario quando so existe USER_READ', async () => {
    hasPermissionMock.mockImplementation((permission) => permission === 'USER_READ');
    vi.mocked(userService.list).mockResolvedValue({
      items: [
        {
          id: 'user-1',
          fullName: 'Operator One',
          email: 'operator@example.test',
          role: 'OPERATOR',
          active: true
        }
      ],
      totalItems: 1,
      totalPages: 1,
      page: 0,
      size: 20
    });

    render(<UsersPage />);

    await waitFor(() => {
      expect(userService.list).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('Operator One')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Criar usuário' })).not.toBeInTheDocument();
  });
});
