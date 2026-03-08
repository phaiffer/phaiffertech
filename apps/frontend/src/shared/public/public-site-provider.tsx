'use client';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

export type PublicLocale = 'pt-BR' | 'en-US';
export type PublicTheme = 'light' | 'dark';

type PublicSiteContextValue = {
  locale: PublicLocale;
  theme: PublicTheme;
  setLocale: (locale: PublicLocale) => void;
  setTheme: (theme: PublicTheme) => void;
};

const PUBLIC_LOCALE_KEY = 'phaiffertech-public-locale';
const PUBLIC_THEME_KEY = 'phaiffertech-public-theme';

const PublicSiteContext = createContext<PublicSiteContextValue | null>(null);

function readStoredLocale(): PublicLocale {
  if (typeof window === 'undefined') {
    return 'pt-BR';
  }

  const stored = window.localStorage.getItem(PUBLIC_LOCALE_KEY);
  return stored === 'en-US' ? 'en-US' : 'pt-BR';
}

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
  const [locale, setLocaleState] = useState<PublicLocale>('pt-BR');
  const [theme, setThemeState] = useState<PublicTheme>('light');

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setThemeState(readStoredTheme());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(PUBLIC_THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(PUBLIC_LOCALE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === PUBLIC_LOCALE_KEY) {
        setLocaleState(readStoredLocale());
      }

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
      setLocale: setLocaleState,
      setTheme: setThemeState
    }),
    [locale, theme]
  );

  return <PublicSiteContext.Provider value={value}>{children}</PublicSiteContext.Provider>;
}

export function usePublicSite() {
  const context = useContext(PublicSiteContext);

  if (!context) {
    throw new Error('usePublicSite must be used within PublicSiteProvider.');
  }

  return context;
}