'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { PetMark } from '@/shared/components/brand-assets';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';

type AuthScreenProps = {
  style?: CSSProperties;
  children: ReactNode;
};

// Comanda v2 frame for login and password screens. They do not go through AppShell,
// so the v2 scope has to be applied here.
export function AuthScreen({ style, children }: AuthScreenProps) {
  const copy = useAppMessages().screens.accountAccess;

  return (
    // The visual context carries the public-site gradient; only its color variables apply here.
    <div
      data-surface="app"
      className="min-h-screen text-[var(--ink)]"
      style={{ ...style, backgroundImage: 'none', backgroundColor: 'var(--bg)' }}
    >
      <div className="grid min-h-screen lg:grid-cols-2">
        <aside className="hidden flex-col justify-between bg-[var(--ink)] p-12 text-[var(--bg)] lg:flex">
          <span className="inline-flex items-center gap-3 text-lg font-semibold">
            <PetMark className="h-9 w-9 shrink-0" />
            Gestão Pet
          </span>
          <p className="max-w-md text-3xl font-semibold leading-tight">{copy.brandTagline}</p>
        </aside>

        <main className="flex items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-sm space-y-5">
            <Link href="/" className="inline-flex items-center gap-2 text-base font-semibold text-[var(--ink)] lg:hidden">
              <PetMark className="h-8 w-8 shrink-0" />
              Gestão Pet
            </Link>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
