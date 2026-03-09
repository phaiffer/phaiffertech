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

export function getSession(): SessionState | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionState;
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
