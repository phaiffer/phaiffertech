import { describe, expect, it, vi } from 'vitest';
import { SESSION_CHANGE_EVENT, clearSession, getSession, setSession } from '@/shared/lib/session';
import { SessionState } from '@/shared/types/auth';

const sessionFixture: SessionState = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
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

describe('session storage', () => {
  it('setSession salva a sessao no localStorage', () => {
    setSession(sessionFixture);

    expect(window.localStorage.getItem('platform.session')).toBe(JSON.stringify(sessionFixture));
  });

  it('getSession retorna a sessao salva', () => {
    window.localStorage.setItem('platform.session', JSON.stringify(sessionFixture));

    expect(getSession()).toEqual(sessionFixture);
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
