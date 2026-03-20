import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResetPasswordPage from '@/app/(public)/reset-password/page';
import {
  consumeAuthNotice,
  getImpersonationBackupSession,
  getSession,
  setImpersonationBackupSession,
  setSession
} from '@/shared/lib/session';
import { PublicSiteProvider } from '@/shared/public/public-site-provider';
import { authService } from '@/shared/services/auth-service';

const navigationMocks = vi.hoisted(() => ({
  replaceMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: navigationMocks.replaceMock
  })
}));

vi.mock('@/shared/services/auth-service', () => ({
  authService: {
    requestPasswordReset: vi.fn(),
    confirmPasswordReset: vi.fn()
  }
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationMocks.replaceMock.mockReset();
    window.localStorage.setItem('phaiffertech-public-locale', 'en-US');
    window.localStorage.removeItem('platform.session');
    window.localStorage.removeItem('platform.impersonation.backup');
    window.sessionStorage.clear();
  });

  it('shows an invalid state when the reset token is missing', () => {
    render(
      <PublicSiteProvider>
        <ResetPasswordPage />
      </PublicSiteProvider>
    );

    expect(screen.getByText('Reset link unavailable')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute('href', '/forgot-password');
  });

  it('confirms the password reset, clears local sessions and redirects to login', async () => {
    vi.mocked(authService.confirmPasswordReset).mockResolvedValue(undefined);
    setSession({
      accessToken: 'access-token',
      user: {
        userId: 'user-1',
        email: 'admin@local.test',
        fullName: 'Admin',
        tenantId: 'tenant-1',
        tenantName: 'Default Tenant',
        tenantCode: 'default',
        tenantDefaultThemeMode: 'SYSTEM',
        tenantAllowUserThemeOverride: true,
        platformOwner: false,
        platformAdmin: false,
        role: 'TENANT_ADMIN',
        permissions: []
      }
    });
    setImpersonationBackupSession({
      accessToken: 'backup-token',
      user: {
        userId: 'user-1',
        email: 'admin@local.test',
        fullName: 'Admin',
        tenantId: 'tenant-1',
        tenantName: 'Default Tenant',
        tenantCode: 'default',
        tenantDefaultThemeMode: 'SYSTEM',
        tenantAllowUserThemeOverride: true,
        platformOwner: false,
        platformAdmin: false,
        role: 'TENANT_ADMIN',
        permissions: []
      }
    });

    render(
      <PublicSiteProvider>
        <ResetPasswordPage searchParams={{ token: 'raw-reset-token' }} />
      </PublicSiteProvider>
    );

    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'NewPassword@123' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'NewPassword@123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() => {
      expect(authService.confirmPasswordReset).toHaveBeenCalledWith({
        token: 'raw-reset-token',
        newPassword: 'NewPassword@123',
        confirmNewPassword: 'NewPassword@123'
      });
    });

    expect(getSession()).toBeNull();
    expect(getImpersonationBackupSession()).toBeNull();
    expect(consumeAuthNotice()).toBe('password-reset');
    expect(navigationMocks.replaceMock).toHaveBeenCalledWith('/login');
  });
});
