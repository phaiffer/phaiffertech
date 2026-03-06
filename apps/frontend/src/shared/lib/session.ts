import { SessionState } from '@/shared/types/auth';

const SESSION_KEY = 'platform.session';

export function getSession(): SessionState | null {
  if (typeof window === 'undefined') {
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
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(SESSION_KEY);
}
