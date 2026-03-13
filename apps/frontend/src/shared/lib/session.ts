import { SessionState } from '@/shared/types/auth';

const SESSION_KEY = 'platform.session';
export const SESSION_CHANGE_EVENT = 'platform:session-changed';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function notifySessionChange(): void {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
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
