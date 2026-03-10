import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/shared/components/auth-provider';
import { getSession, setSession } from '@/shared/lib/session';
import { authService } from '@/shared/services/auth-service';
import { SessionState } from '@/shared/types/auth';

const { pushMock } = vi.hoisted(() => ({
  pushMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

vi.mock('@/shared/services/auth-service', () => ({
  authService: {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    me: vi.fn()
  }
}));

vi.mock('@/shared/observability/client-logger', () => ({
  logClientError: vi.fn(),
  logClientInfo: vi.fn()
}));

const sessionFixture: SessionState = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
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

const validatedUser = {
  ...sessionFixture.user,
  fullName: 'Admin Validated',
  permissions: ['tenant.read', 'user.read']
};

function AuthConsumer() {
  const { isAuthenticated, isLoading, session, signIn, signOut } = useAuth();

  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="user-name">{session?.user.fullName ?? 'anonymous'}</span>
      <button type="button" onClick={() => signIn(sessionFixture)}>
        sign-in
      </button>
      <button
        type="button"
        onClick={() => {
          void signOut();
        }}
      >
        sign-out
      </button>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it('signIn persiste a sessao local', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('ready');
    });

    fireEvent.click(screen.getByRole('button', { name: 'sign-in' }));

    expect(getSession()).toEqual(sessionFixture);
    expect(screen.getByTestId('authenticated').textContent).toBe('yes');
  });

  it('bootstrap com sessao existente chama authService.me', async () => {
    setSession(sessionFixture);
    vi.mocked(authService.me).mockResolvedValue(validatedUser);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(authService.me).toHaveBeenCalledTimes(1);
    });

    expect(getSession()).toEqual({
      ...sessionFixture,
      user: validatedUser
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('yes');
    expect(screen.getByTestId('user-name').textContent).toBe('Admin Validated');
  });

  it('bootstrap sem sessao nao chama authService.me', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('ready');
    });

    expect(authService.me).not.toHaveBeenCalled();
    expect(screen.getByTestId('authenticated').textContent).toBe('no');
  });

  it('quando authService.me falha a sessao e limpa', async () => {
    setSession(sessionFixture);
    vi.mocked(authService.me).mockRejectedValue(new Error('unauthorized'));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getSession()).toBeNull();
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('no');
    expect(screen.getByTestId('user-name').textContent).toBe('anonymous');
  });

  it('signOut faz logout remoto e limpa a sessao local', async () => {
    setSession(sessionFixture);
    vi.mocked(authService.me).mockResolvedValue(sessionFixture.user);
    vi.mocked(authService.logout).mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('ready');
    });

    fireEvent.click(screen.getByRole('button', { name: 'sign-out' }));

    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalledWith('refresh-token');
    });

    expect(getSession()).toBeNull();
    expect(pushMock).toHaveBeenCalledWith('/login');
  });

  it('signOut limpa a sessao local mesmo quando o logout remoto falha', async () => {
    setSession(sessionFixture);
    vi.mocked(authService.me).mockResolvedValue(sessionFixture.user);
    vi.mocked(authService.logout).mockRejectedValue(new Error('network failure'));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('ready');
    });

    fireEvent.click(screen.getByRole('button', { name: 'sign-out' }));

    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalledWith('refresh-token');
    });

    expect(getSession()).toBeNull();
    expect(pushMock).toHaveBeenCalledWith('/login');
  });
});
