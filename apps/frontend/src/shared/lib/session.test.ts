import { describe, expect, it, vi } from 'vitest';
import { SESSION_CHANGE_EVENT, clearSession, getSession, setSession } from '@/shared/lib/session';
import { SessionState } from '@/shared/types/auth';

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

describe('session storage', () => {
  it('setSession salva a sessao no localStorage', () => {
    setSession(sessionFixture);

    expect(window.localStorage.getItem('platform.session')).toBe(JSON.stringify(sessionFixture));
  });

  it('getSession retorna a sessao salva', () => {
    window.localStorage.setItem('platform.session', JSON.stringify(sessionFixture));

    expect(getSession()).toEqual(sessionFixture);
  });

  it('getSession remove refreshToken legado do localStorage', () => {
    window.localStorage.setItem('platform.session', JSON.stringify({
      ...sessionFixture,
      refreshToken: 'legacy-refresh-token'
    }));

    expect(getSession()).toEqual(sessionFixture);
    expect(window.localStorage.getItem('platform.session')).toBe(JSON.stringify(sessionFixture));
  });

  it('clearSession remove a sessao', () => {
    setSession(sessionFixture);

    clearSession();

    expect(window.localStorage.getItem('platform.session')).toBeNull();
    expect(getSession()).toBeNull();
  });

  it('dispara SESSION_CHANGE_EVENT quando a sessao muda', () => {
    const listener = vi.fn();
    window.addEventListener(SESSION_CHANGE_EVENT, listener);

    setSession(sessionFixture);
    clearSession();

    expect(listener).toHaveBeenCalledTimes(2);

    window.removeEventListener(SESSION_CHANGE_EVENT, listener);
  });
});
