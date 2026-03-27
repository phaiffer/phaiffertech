'use client';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { AppLocale, useAppI18n } from '@/shared/i18n/app-i18n-provider';

export type PublicLocale = AppLocale;
export type PublicTheme = 'light' | 'dark';

type PublicSiteContextValue = {
  locale: PublicLocale;
  theme: PublicTheme;
  setLocale: (locale: PublicLocale) => void;
  setTheme: (theme: PublicTheme) => void;
};

const PUBLIC_THEME_KEY = 'phaiffertech-public-theme';

const PublicSiteContext = createContext<PublicSiteContextValue>({
  locale: process.env.NODE_ENV === 'test' ? 'en-US' : 'pt-BR',
  theme: 'light',
  setLocale: () => undefined,
  setTheme: () => undefined
});

function readStoredTheme(): PublicTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(PUBLIC_THEME_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

type PublicSiteProviderProps = {
  children: ReactNode;
};

export function PublicSiteProvider({ children }: PublicSiteProviderProps) {
  const { locale, setLocale } = useAppI18n();
  const [theme, setThemeState] = useState<PublicTheme>('light');

  useEffect(() => {
    setThemeState(readStoredTheme());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(PUBLIC_THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === PUBLIC_THEME_KEY) {
        setThemeState(readStoredTheme());
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo<PublicSiteContextValue>(
    () => ({
      locale,
      theme,
      setLocale,
      setTheme: setThemeState
    }),
    [locale, setLocale, theme]
  );

  return <PublicSiteContext.Provider value={value}>{children}</PublicSiteContext.Provider>;
}

export function usePublicSite() {
  return useContext(PublicSiteContext);
}
