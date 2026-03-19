import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImpersonationBanner } from '@/shared/components/impersonation-banner';
import { supportImpersonationService } from '@/shared/services/support-impersonation-service';

const { pushMock, signInMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  signInMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

vi.mock('@/shared/auth/use-auth', () => ({
  useAuth: () => ({
    session: {
      accessToken: 'impersonated-token',
      user: {
        userId: 'user-1',
        email: 'admin@phaiffer.test',
        fullName: 'Platform Admin',
        tenantId: 'tenant-2',
        tenantName: 'Clinic North',
        tenantCode: 'clinic-north',
        tenantLogoUrl: null,
        tenantPrimaryColor: '#0f172a',
        tenantAccentColor: '#2563eb',
        tenantDefaultThemeMode: 'SYSTEM',
        tenantAllowUserThemeOverride: true,
        platformOwner: false,
        platformAdmin: false,
        role: 'PLATFORM_ADMIN',
        permissions: ['TENANT_READ'],
        impersonation: {
          sessionId: 'session-1',
          sourceTenantId: 'tenant-1',
          sourceTenantName: 'PhaifferTech',
          sourceTenantCode: 'default',
          startedAt: '2026-03-19T12:00:00Z',
          expiresAt: '2026-03-19T12:30:00Z'
        }
      }
    },
    signIn: signInMock
  })
}));

vi.mock('@/shared/services/support-impersonation-service', () => ({
  supportImpersonationService: {
    start: vi.fn(),
    stop: vi.fn()
  }
}));

vi.mock('@/shared/lib/session', () => ({
  getImpersonationBackupSession: vi.fn().mockReturnValue(null),
  clearImpersonationBackupSession: vi.fn()
}));

describe('ImpersonationBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the active support tenant context and exits safely', async () => {
    vi.mocked(supportImpersonationService.stop).mockResolvedValue({
      accessToken: 'restored-token',
      expiresInSeconds: 300,
      user: {
        userId: 'user-1',
        email: 'admin@phaiffer.test',
        fullName: 'Platform Admin',
        tenantId: 'tenant-1',
        tenantName: 'PhaifferTech',
        tenantCode: 'default',
        tenantLogoUrl: null,
        tenantPrimaryColor: '#0f172a',
        tenantAccentColor: '#2563eb',
        tenantDefaultThemeMode: 'SYSTEM',
        tenantAllowUserThemeOverride: true,
        platformOwner: true,
        platformAdmin: true,
        role: 'PLATFORM_ADMIN',
        permissions: ['TENANT_READ']
      }
    });

    render(<ImpersonationBanner tenantName="Clinic North" tenantCode="clinic-north" />);

    expect(screen.getByText('Support impersonation active')).toBeInTheDocument();
    expect(screen.getByText(/Operating inside Clinic North/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Exit impersonation' }));

    await waitFor(() => {
      expect(supportImpersonationService.stop).toHaveBeenCalledTimes(1);
      expect(signInMock).toHaveBeenCalledWith({
        accessToken: 'restored-token',
        user: expect.objectContaining({
          tenantId: 'tenant-1',
          platformAdmin: true
        })
      });
      expect(pushMock).toHaveBeenCalledWith('/tenants');
    });
  });
});
