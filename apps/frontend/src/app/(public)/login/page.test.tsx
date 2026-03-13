import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/app/(public)/login/page';
import { AuthProvider } from '@/shared/components/auth-provider';
import { getSession } from '@/shared/lib/session';
import { PublicSiteProvider } from '@/shared/public/public-site-provider';
import { authService } from '@/shared/services/auth-service';
import { AuthTokenResponse } from '@/shared/types/auth';

const { pushMock, replaceMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  replaceMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock
  })
}));

vi.mock('@/shared/services/auth-service', () => ({
  authService: {
    login: vi.fn(),
    demoLogin: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    me: vi.fn()
  }
}));

const authResponseFixture: AuthTokenResponse = {
  accessToken: 'access-token',
  expiresInSeconds: 300,
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

describe('LoginPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
    delete process.env.NEXT_PUBLIC_DEMO_ASSISTED_ENABLED;
    window.localStorage.setItem('phaiffertech-public-locale', 'en-US');
  });

  it('login cria a sessao corretamente', async () => {
    vi.mocked(authService.login).mockResolvedValue(authResponseFixture);

    render(
      <PublicSiteProvider>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </PublicSiteProvider>
    );

    fireEvent.change(screen.getByLabelText('Company or tenant'), { target: { value: 'default' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@local.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Admin@123' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        tenantCode: 'default',
        email: 'admin@local.test',
        password: 'Admin@123'
      });
    });

    expect(getSession()).toEqual({
      accessToken: authResponseFixture.accessToken,
      user: authResponseFixture.user
    });
    expect(replaceMock).toHaveBeenCalledWith('/dashboard');
  });

  it('aciona o fluxo de demo assistida sem expor credenciais no formulario', async () => {
    process.env.NEXT_PUBLIC_DEMO_ASSISTED_ENABLED = 'true';
    vi.mocked(authService.demoLogin).mockResolvedValue(authResponseFixture);

    render(
      <PublicSiteProvider>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </PublicSiteProvider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Use demo' }));

    await waitFor(() => {
      expect(authService.demoLogin).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByLabelText('Company or tenant')).toHaveValue('');
    expect(screen.getByLabelText('Email')).toHaveValue('');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.getByRole('link', { name: 'Forgot your password?' })).toHaveAttribute('href', '/contact');
    expect(replaceMock).toHaveBeenCalledWith('/dashboard');
  });
});
