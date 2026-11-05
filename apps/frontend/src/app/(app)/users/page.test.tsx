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

vi.mock('@/shared/auth/use-auth', () => ({
  useAuth: () => ({
    session: {
      user: {
        platformAdmin: false,
        tenantName: 'Workspace One',
        tenantCode: 'workspace-one'
      }
    }
  })
}));

vi.mock('@/shared/services/user-service', () => ({
  userService: {
    list: vi.fn(),
    create: vi.fn()
  }
}));

describe('UsersPage authorization', () => {
  it('does not call userService.list without USER_READ', async () => {
    hasPermissionMock.mockImplementation(() => false);

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('You do not have permission to view users.')).toBeInTheDocument();
    });

    expect(userService.list).not.toHaveBeenCalled();
  });

  it('loads the list without exposing the form when only USER_READ is available', async () => {
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
    expect(screen.getByText('Operator')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New user' })).not.toBeInTheDocument();
  });

  it('renders the guided empty state for a tenant without users', async () => {
    hasPermissionMock.mockImplementation((permission) => permission === 'USER_READ');
    vi.mocked(userService.list).mockResolvedValue({
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: 0,
      size: 10
    });

    render(<UsersPage />);

    expect(await screen.findByText('No users in this workspace yet')).toBeInTheDocument();
    expect(screen.getByText('Create the first user to give your team access.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/users');
  });
});
