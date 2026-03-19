'use client';

import {
  SESSION_CHANGE_EVENT,
  clearAuthNotice,
  clearImpersonationBackupSession,
  clearSession,
  getSession,
  restoreImpersonationBackupSession,
  setAuthNotice,
  setSession
} from '@/shared/lib/session';
import { ApiClientError } from '@/shared/lib/http';
import { logClientError, logClientInfo } from '@/shared/observability/client-logger';
import { authService } from '@/shared/services/auth-service';
import { SessionState } from '@/shared/types/auth';
import { useRouter } from 'next/navigation';
import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

type AuthContextValue = {
  session: SessionState | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (session: SessionState) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isExpiredImpersonationSession(session: SessionState | null): boolean {
  const expiresAt = session?.user.impersonation?.expiresAt;
  if (!expiresAt) {
    return false;
  }

  const parsed = Date.parse(expiresAt);
  return Number.isFinite(parsed) && parsed <= Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<SessionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logRemoteLogoutFailure = useCallback((error: unknown, attemptedRefreshToken: string | null) => {
    if (error instanceof ApiClientError) {
      logClientInfo('auth-provider', 'Remote logout failed', {
        status: error.status,
        code: error.code,
        attemptedRefreshToken: attemptedRefreshToken ? 'present' : 'missing'
      });
      return;
    }

    logClientError('auth-provider', 'Unexpected remote logout failure', {
      attemptedRefreshToken: attemptedRefreshToken ? 'present' : 'missing',
      error: error instanceof Error ? error.message : 'unknown'
    });
  }, []);

  useEffect(() => {
    const syncSession = () => {
      setSessionState(getSession());
    };

    window.addEventListener(SESSION_CHANGE_EVENT, syncSession);
    return () => {
      window.removeEventListener(SESSION_CHANGE_EVENT, syncSession);
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function bootstrapSession() {
      const storedSession = getSession();

      if (!storedSession) {
        const restoredSession = restoreImpersonationBackupSession();
        if (isActive) {
          setSessionState(restoredSession);
          setIsLoading(false);
        }
        return;
      }

      if (isExpiredImpersonationSession(storedSession)) {
        const restoredSession = restoreImpersonationBackupSession();
        if (!restoredSession) {
          clearSession();
        }

        if (isActive) {
          setSessionState(restoredSession);
          setIsLoading(false);
        }
        return;
      }

      setSessionState(storedSession);

      try {
        const user = await authService.me();
        if (!isActive) {
          return;
        }

        const currentSession = getSession() ?? storedSession;
        const validatedSession = {
          ...currentSession,
          user
        };

        if (!validatedSession.user.impersonation) {
          clearImpersonationBackupSession();
        }
        setSession(validatedSession);
        setSessionState(validatedSession);
      } catch {
        const restoredSession = storedSession.user.impersonation
          ? restoreImpersonationBackupSession()
          : null;

        if (!restoredSession) {
          clearSession();
          clearImpersonationBackupSession();
        }

        if (!isActive) {
          return;
        }
        setSessionState(restoredSession);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void bootstrapSession();

    return () => {
      isActive = false;
    };
  }, []);

  const signIn = useCallback((newSession: SessionState) => {
    clearAuthNotice();
    if (!newSession.user.impersonation) {
      clearImpersonationBackupSession();
    }
    setSession(newSession);
    setSessionState(newSession);
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (getSession() ?? session) {
        await authService.logout();
      }
    } catch (error) {
      logRemoteLogoutFailure(error, null);
    } finally {
      setAuthNotice('signed-out');
      clearImpersonationBackupSession();
      clearSession();
      setSessionState(null);
      router.push('/login');
    }
  }, [logRemoteLogoutFailure, router, session]);

  useEffect(() => {
    if (!session?.user.impersonation) {
      return undefined;
    }

    const expiresAt = Date.parse(session.user.impersonation.expiresAt);
    if (!Number.isFinite(expiresAt)) {
      return undefined;
    }

    const restorePlatformSession = () => {
      const restoredSession = restoreImpersonationBackupSession();
      if (restoredSession) {
        setSessionState(restoredSession);
        router.push('/tenants');
        return;
      }

      clearImpersonationBackupSession();
      clearSession();
      setSessionState(null);
      router.push('/login');
    };

    const remainingMs = expiresAt - Date.now();
    if (remainingMs <= 0) {
      restorePlatformSession();
      return undefined;
    }

    const timeoutId = window.setTimeout(restorePlatformSession, remainingMs);
    return () => window.clearTimeout(timeoutId);
  }, [router, session]);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    isLoading,
    isAuthenticated: Boolean(session?.accessToken),
    signIn,
    signOut
  }), [session, isLoading, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
