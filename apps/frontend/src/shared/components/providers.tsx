'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/shared/components/auth-provider';
import { AppI18nProvider } from '@/shared/i18n/app-i18n-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppI18nProvider>
      <AuthProvider>{children}</AuthProvider>
    </AppI18nProvider>
  );
}
