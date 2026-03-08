'use client';

import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { usePublicSite } from '@/shared/public/public-site-provider';

type PublicSiteShellProps = {
  children: ReactNode;
};

const copy = {
  'pt-BR': {
    brandEyebrow: 'Phaiffer Platform',
    brandTitle: 'SaaS Control Plane',
    navPlatform: 'Plataforma',
    navModules: 'Módulos',
    navArchitecture: 'Arquitetura',
    navLogin: 'Entrar',
    navHome: 'Início',
    themeLight: 'Light',
    themeDark: 'Dark',
    localeLabel: 'Idioma',
    footerText: 'PhaifferTech Platform · Institutional shell prepared for bilingual public experience.'
  },
  'en-US': {
    brandEyebrow: 'Phaiffer Platform',
    brandTitle: 'SaaS Control Plane',
    navPlatform: 'Platform',
    navModules: 'Modules',
    navArchitecture: 'Architecture',
    navLogin: 'Login',
    navHome: 'Home',
    themeLight: 'Light',
    themeDark: 'Dark',
    localeLabel: 'Language',
    footerText: 'PhaifferTech Platform · Institutional shell prepared for a bilingual public experience.'
  }
} as const;

export function PublicSiteShell({ children }: PublicSiteShellProps) {
  const { locale, theme, setLocale, setTheme } = usePublicSite();
  const t = useMemo(() => copy[locale], [locale]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {t.brandEyebrow}
            </p>
            <p className="truncate text-lg font-semibold text-[var(--foreground)]">
              {t.brandTitle}
            </p>
          </div>

          <div className="hidden items-center gap-6 lg:flex">
            <Link className="text-sm text-slate-600 transition hover:text-[var(--foreground)]" href="/">
              {t.navHome}
            </Link>
            <a className="text-sm text-slate-600 transition hover:text-[var(--foreground)]" href="/#platform">
              {t.navPlatform}
            </a>
            <a className="text-sm text-slate-600 transition hover:text-[var(--foreground)]" href="/#modules">
              {t.navModules}
            </a>
            <a className="text-sm text-slate-600 transition hover:text-[var(--foreground)]" href="/#architecture">
              {t.navArchitecture}
            </a>
            <Link
              href="/login"
              className="rounded-xl bg-action px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              {t.navLogin}
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1 sm:flex">
              <span className="px-2 text-[11px] font-medium text-slate-500">{t.localeLabel}</span>
              <button
                type="button"
                onClick={() => setLocale('pt-BR')}
                className={[
                  'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                  locale === 'pt-BR'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                    : 'text-slate-500 hover:text-[var(--foreground)]'
                ].join(' ')}
              >
                PT
              </button>
              <button
                type="button"
                onClick={() => setLocale('en-US')}
                className={[
                  'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                  locale === 'en-US'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                    : 'text-slate-500 hover:text-[var(--foreground)]'
                ].join(' ')}
              >
                EN
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={[
                  'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                  theme === 'light'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                    : 'text-slate-500 hover:text-[var(--foreground)]'
                ].join(' ')}
              >
                {t.themeLight}
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={[
                  'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                  theme === 'dark'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                    : 'text-slate-500 hover:text-[var(--foreground)]'
                ].join(' ')}
              >
                {t.themeDark}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <span>{t.footerText}</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="transition hover:text-[var(--foreground)]">
              {t.navLogin}
            </Link>
            <Link href="/" className="transition hover:text-[var(--foreground)]">
              {t.navHome}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}