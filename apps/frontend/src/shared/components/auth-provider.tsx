'use client';

import { SESSION_CHANGE_EVENT, clearSession, getSession, setSession } from '@/shared/lib/session';
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
        if (isActive) {
          setSessionState(null);
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

        setSession(validatedSession);
        setSessionState(validatedSession);
      } catch {
        clearSession();
        if (!isActive) {
          return;
        }
        setSessionState(null);
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
    setSession(newSession);
    setSessionState(newSession);
  }, []);

  const signOut = useCallback(async () => {
    const storedSession = getSession() ?? session;
    const initialRefreshToken = storedSession?.refreshToken ?? null;

    try {
      if (initialRefreshToken) {
        try {
          await authService.logout(initialRefreshToken);
        } catch (error) {
          const latestRefreshToken = getSession()?.refreshToken;

          if (latestRefreshToken && latestRefreshToken !== initialRefreshToken) {
            await authService.logout(latestRefreshToken);
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      logRemoteLogoutFailure(error, initialRefreshToken);
    } finally {
      clearSession();
      setSessionState(null);
      router.push('/login');
    }
  }, [logRemoteLogoutFailure, router, session]);

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
