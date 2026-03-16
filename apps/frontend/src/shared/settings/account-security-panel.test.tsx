import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountSecurityPanel } from '@/shared/settings/account-security-panel';
import { consumeAuthNotice, getSession, setSession } from '@/shared/lib/session';
import { authService } from '@/shared/services/auth-service';
import type { SessionState } from '@/shared/types/auth';

vi.mock('@/shared/services/auth-service', () => ({
  authService: {
    changePassword: vi.fn()
  }
}));

const sessionFixture: SessionState = {
  accessToken: 'access-token',
  user: {
    userId: 'user-1',
    email: 'admin@local.test',
    fullName: 'Admin Local',
    tenantId: 'tenant-1',
    tenantName: 'Default Tenant',
    tenantCode: 'default',
    tenantLogoUrl: null,
    tenantPrimaryColor: '#0f172a',
    tenantAccentColor: '#2563eb',
    tenantDefaultThemeMode: 'SYSTEM',
    tenantAllowUserThemeOverride: true,
    platformOwner: true,
    platformAdmin: true,
    role: 'ADMIN',
    roles: ['ADMIN'],
    permissions: ['tenant.read']
  }
};

describe('AccountSecurityPanel', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    setSession(sessionFixture);
  });

  it('updates the password and invalidates the local session', async () => {
    vi.mocked(authService.changePassword).mockResolvedValue(undefined);

    render(<AccountSecurityPanel user={sessionFixture.user} />);

    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'Admin@123' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'N3wPassword@123' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'N3wPassword@123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() => {
      expect(authService.changePassword).toHaveBeenCalledWith({
        currentPassword: 'Admin@123',
        newPassword: 'N3wPassword@123',
        confirmNewPassword: 'N3wPassword@123'
      });
    });

    expect(getSession()).toBeNull();
    expect(consumeAuthNotice()).toBe('password-changed');
  });

  it('keeps the request local when password confirmation does not match', () => {
    render(<AccountSecurityPanel user={sessionFixture.user} />);

    fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'Admin@123' } });
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'N3wPassword@123' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'DifferentPassword@123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));

    expect(authService.changePassword).not.toHaveBeenCalled();
    expect(screen.getByText('New password confirmation must match.')).toBeInTheDocument();
    expect(getSession()).toEqual(sessionFixture);
  });
});
