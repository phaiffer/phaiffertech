import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/app/(public)/login/page';
import { buildLoginVisualContext } from '@/shared/components/public-visual-system';
import { AuthProvider } from '@/shared/components/auth-provider';
import { getSession, setAuthNotice } from '@/shared/lib/session';
import { PublicSiteProvider } from '@/shared/public/public-site-provider';
import { authService } from '@/shared/services/auth-service';
import { AuthTokenResponse } from '@/shared/types/auth';

const navigationMocks = vi.hoisted(() => ({
  pushMock: vi.fn(),
  replaceMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: navigationMocks.pushMock,
    replace: navigationMocks.replaceMock
  })
}));

vi.mock('@/shared/services/auth-service', () => ({
  authService: {
    login: vi.fn(),
    demoLogin: vi.fn(),
    requestPasswordReset: vi.fn(),
    confirmPasswordReset: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
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
    navigationMocks.pushMock.mockReset();
    navigationMocks.replaceMock.mockReset();
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

    fireEvent.change(screen.getByLabelText('Company or workspace'), { target: { value: 'default' } });
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
    expect(navigationMocks.replaceMock).toHaveBeenCalledWith('/dashboard');
  });

  it('respects the requested next path after login', async () => {
    vi.mocked(authService.login).mockResolvedValue(authResponseFixture);

    render(
      <PublicSiteProvider>
        <AuthProvider>
          <LoginPage searchParams={{ next: '/settings' }} />
        </AuthProvider>
      </PublicSiteProvider>
    );

    fireEvent.change(screen.getByLabelText('Company or workspace'), { target: { value: 'default' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@local.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Admin@123' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(navigationMocks.replaceMock).toHaveBeenCalledWith('/settings');
    });
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

    expect(screen.getByLabelText('Company or workspace')).toHaveValue('');
   expect(screen.getByLabelText('Email')).toHaveValue('');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.getByRole('link', { name: 'Forgot your password?' })).toHaveAttribute('href', '/forgot-password');
    expect(navigationMocks.replaceMock).toHaveBeenCalledWith('/dashboard');
  });

  it('renders the password reset notice on the next login screen', async () => {
    setAuthNotice('password-reset');

    render(
      <PublicSiteProvider>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </PublicSiteProvider>
    );

    expect(await screen.findByText('Password reset successfully. Sign in again with the new credential.')).toBeInTheDocument();
  });

  it('keeps the visual context stable while typing the tenant code and only commits it on blur', async () => {
    const { container } = render(
      <PublicSiteProvider>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </PublicSiteProvider>
    );

    const surface = container.firstElementChild as HTMLElement;
    const tenantInput = screen.getByLabelText('Company or workspace');
    const defaultAccent = (buildLoginVisualContext('').containerStyle as Record<string, string | undefined>)['--tenant-accent'];
    const petAccent = (buildLoginVisualContext('pet-spa').containerStyle as Record<string, string | undefined>)['--tenant-accent'];

    expect(surface.style.getPropertyValue('--tenant-accent')).toBe(String(defaultAccent));

    fireEvent.change(tenantInput, { target: { value: 'pet-spa' } });
    expect(surface.style.getPropertyValue('--tenant-accent')).toBe(String(defaultAccent));

    fireEvent.blur(tenantInput);
    await waitFor(() => {
      expect(surface.style.getPropertyValue('--tenant-accent')).toBe(String(petAccent));
    });
  });

  it('renders login fields with stable autofill metadata', () => {
    render(
      <PublicSiteProvider>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </PublicSiteProvider>
    );

    const tenantInput = screen.getByLabelText('Company or workspace');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');

    expect(tenantInput).toHaveAttribute('name', 'tenantCode');
    expect(tenantInput).toHaveAttribute('autocomplete', 'section-petflow organization');
    expect(tenantInput).toHaveAttribute('autocapitalize', 'none');
    expect(tenantInput).toHaveAttribute('autocorrect', 'off');
    expect(tenantInput).toHaveAttribute('spellcheck', 'false');
    expect(tenantInput).toHaveAttribute('data-lpignore', 'true');
    expect(tenantInput).toHaveAttribute('data-1p-ignore', 'true');

    expect(emailInput).toHaveAttribute('name', 'email');
    expect(emailInput).toHaveAttribute('autocomplete', 'username');
    expect(emailInput).toHaveAttribute('inputmode', 'email');
    expect(emailInput).toHaveAttribute('autocapitalize', 'none');
    expect(emailInput).toHaveAttribute('autocorrect', 'off');
    expect(emailInput).toHaveAttribute('spellcheck', 'false');

    expect(passwordInput).toHaveAttribute('name', 'password');
    expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
  });
});
