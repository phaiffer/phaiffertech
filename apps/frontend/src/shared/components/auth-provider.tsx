'use client';

import { clearSession, getSession, setSession } from '@/shared/lib/session';
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
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<SessionState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setSessionState(getSession());
    setIsLoading(false);
  }, []);

  const signIn = useCallback((newSession: SessionState) => {
    setSession(newSession);
    setSessionState(newSession);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setSessionState(null);
    router.push('/login');
  }, [router]);

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
