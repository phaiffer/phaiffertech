'use client';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { getAppMessages } from '@/shared/i18n/messages';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';

export type AppLocale = 'pt-BR' | 'en-US';

type AppI18nContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  messages: AppMessages;
};

const APP_LOCALE_STORAGE_KEY = 'phaiffertech-locale';
const LEGACY_PUBLIC_LOCALE_STORAGE_KEY = 'phaiffertech-public-locale';
const DEFAULT_APP_LOCALE: AppLocale = process.env.NODE_ENV === 'test' ? 'en-US' : 'pt-BR';

function readStoredLocale(): AppLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_APP_LOCALE;
  }

  const stored = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY)
    ?? window.localStorage.getItem(LEGACY_PUBLIC_LOCALE_STORAGE_KEY);
  return stored === 'en-US' ? 'en-US' : 'pt-BR';
}

const defaultContextValue: AppI18nContextValue = {
  locale: DEFAULT_APP_LOCALE,
  setLocale: () => undefined,
  messages: getAppMessages(DEFAULT_APP_LOCALE)
};

const AppI18nContext = createContext<AppI18nContextValue>(defaultContextValue);

export function AppI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(readStoredLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale);
    window.localStorage.setItem(LEGACY_PUBLIC_LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === APP_LOCALE_STORAGE_KEY || event.key === LEGACY_PUBLIC_LOCALE_STORAGE_KEY) {
        setLocaleState(readStoredLocale());
      }
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = useMemo<AppI18nContextValue>(() => ({
    locale,
    setLocale: setLocaleState,
    messages: getAppMessages(locale)
  }), [locale]);

  return <AppI18nContext.Provider value={value}>{children}</AppI18nContext.Provider>;
}

export function useAppI18n() {
  return useContext(AppI18nContext);
}

export function useAppMessages() {
  return useAppI18n().messages;
}
