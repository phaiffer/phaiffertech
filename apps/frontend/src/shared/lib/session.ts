import { SessionState } from '@/shared/types/auth';

const SESSION_KEY = 'platform.session';
const AUTH_NOTICE_KEY = 'platform.auth.notice';
export const SESSION_CHANGE_EVENT = 'platform:session-changed';
const AUTH_NOTICE_REASONS = ['signed-out', 'session-expired', 'tenant-mismatch', 'password-changed'] as const;

export type AuthNoticeReason = (typeof AUTH_NOTICE_REASONS)[number];

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function notifySessionChange(): void {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

function isAuthNoticeReason(value: string | null): value is AuthNoticeReason {
  return value !== null && AUTH_NOTICE_REASONS.includes(value as AuthNoticeReason);
}

function sanitizeSession(candidate: unknown): SessionState | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const parsed = candidate as {
    accessToken?: unknown;
    user?: SessionState['user'];
    refreshToken?: unknown;
  };

  if (typeof parsed.accessToken !== 'string' || !parsed.accessToken || !parsed.user) {
    return null;
  }

  const sanitizedSession: SessionState = {
    accessToken: parsed.accessToken,
    user: parsed.user
  };

  if (parsed.refreshToken !== undefined && isBrowser()) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sanitizedSession));
  }

  return sanitizedSession;
}

export function getSession(): SessionState | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = sanitizeSession(JSON.parse(raw));
    if (!parsed) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    clearSession();
    return null;
  }
}

export function setSession(session: SessionState): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  notifySessionChange();
}

export function clearSession(): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(SESSION_KEY);
  notifySessionChange();
}

export function setAuthNotice(reason: AuthNoticeReason): void {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.setItem(AUTH_NOTICE_KEY, reason);
}

export function clearAuthNotice(): void {
  if (!isBrowser()) {
    return;
  }

  window.sessionStorage.removeItem(AUTH_NOTICE_KEY);
}

export function consumeAuthNotice(): AuthNoticeReason | null {
  if (!isBrowser()) {
    return null;
  }

  const storedValue = window.sessionStorage.getItem(AUTH_NOTICE_KEY);
  window.sessionStorage.removeItem(AUTH_NOTICE_KEY);

  return isAuthNoticeReason(storedValue) ? storedValue : null;
}
