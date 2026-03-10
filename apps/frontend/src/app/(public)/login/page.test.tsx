import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '@/app/(public)/login/page';
import { AuthProvider } from '@/shared/components/auth-provider';
import { getSession } from '@/shared/lib/session';
import { PublicSiteProvider } from '@/shared/public/public-site-provider';
import { authService } from '@/shared/services/auth-service';

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
    refresh: vi.fn(),
    logout: vi.fn(),
    me: vi.fn()
  }
}));

const authResponseFixture = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresInSeconds: 300,
  user: {
    userId: 'user-1',
    email: 'admin@local.test',
    fullName: 'Admin Local',
    tenantId: 'tenant-1',
    role: 'ADMIN',
    roles: ['ADMIN'],
    permissions: ['tenant.read']
  }
};

describe('LoginPage', () => {
  beforeEach(() => {
    pushMock.mockReset();
    replaceMock.mockReset();
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
      refreshToken: authResponseFixture.refreshToken,
      user: authResponseFixture.user
    });
    expect(replaceMock).toHaveBeenCalledWith('/dashboard');
  });
});
