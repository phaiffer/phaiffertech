'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getPublicSiteMessages } from '@/shared/public/public-site-messages';

type PublicSiteShellProps = {
  children: ReactNode;
};

export function PublicSiteShell({ children }: PublicSiteShellProps) {
  const pathname = usePathname();
  const { locale, theme, setLocale, setTheme } = usePublicSite();
  const t = getPublicSiteMessages(locale).shell;

  const navigationItems = [
    { href: '/', label: t.navHome, active: pathname === '/' },
    { href: '/about', label: t.navAbout, active: pathname === '/about' },
    { href: '/platform', label: t.navPlatform, active: pathname === '/platform' },
    { href: '/products', label: t.navProducts, active: pathname === '/products' },
    {
      href: '/engineering',
      label: t.navEngineering,
      active: pathname === '/engineering'
    },
    { href: '/research', label: t.navResearch, active: pathname === '/research' },
    {
      href: '/articles',
      label: t.navArticles,
      active: pathname === '/articles' || pathname.startsWith('/articles/')
    },
    { href: '/contact', label: t.navContact, active: pathname === '/contact' }
  ];

  const footerLinks = [
    { href: '/', label: t.navHome },
    { href: '/about', label: t.navAbout },
    { href: '/platform', label: t.navPlatform },
    { href: '/products', label: t.navProducts },
    { href: '/engineering', label: t.navEngineering },
    { href: '/research', label: t.navResearch },
    { href: '/articles', label: t.navArticles },
    { href: '/contact', label: t.navContact }
  ];

  const productLinks = [
    { href: '/products', label: 'IoT System' },
    { href: '/products', label: 'PetFlow' },
    { href: '/products', label: 'CRM / Operational Hub' }
  ];

  const accessLinks = [
    { href: '/login', label: t.navLogin },
    { href: '/platform', label: t.navPlatform },
    { href: '/research', label: t.navResearch }
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <Link href="/" className="inline-flex items-center gap-3 text-inherit no-underline">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-sky-500/20 bg-[var(--surface)] shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
                  <Image
                    src="/logo.png"
                    alt="PhaifferTech logo"
                    width={56}
                    height={56}
                    priority
                    className="h-full w-full object-cover"
                  />
                </span>

                <span className="min-w-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    {t.brandEyebrow}
                  </span>
                  <span className="block truncate text-lg font-semibold text-[var(--foreground)]">
                    {t.brandTitle}
                  </span>
                  <span className="mt-1 block max-w-xl text-xs text-slate-500 sm:text-sm">
                    {t.brandSubtitle}
                  </span>
                </span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
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

              <Link
                href="/login"
                className={[
                  'rounded-xl px-4 py-2 text-sm font-medium transition',
                  pathname === '/login'
                    ? 'border border-sky-500/30 bg-[var(--surface-muted)] text-[var(--foreground)]'
                    : 'bg-action text-white hover:bg-blue-700'
                ].join(' ')}
              >
                {t.navLogin}
              </Link>
            </div>
          </div>

          <nav className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'whitespace-nowrap rounded-full border px-3 py-2 text-sm transition',
                  item.active
                    ? 'border-sky-500/35 bg-sky-500/10 text-[var(--foreground)]'
                    : 'border-[var(--border)] bg-[var(--surface)] text-slate-600 hover:text-[var(--foreground)]'
                ].join(' ')}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr] lg:px-8">
          <div className="max-w-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-action">
              {t.footerNarrativeTitle}
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-600">{t.footerNarrativeText}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{t.footerExploreTitle}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
              {footerLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-[var(--foreground)]">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{t.footerProductsTitle}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
              {productLinks.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="transition hover:text-[var(--foreground)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">{t.footerAccessTitle}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
              {accessLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-[var(--foreground)]">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--border)]">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 text-sm text-slate-500 sm:px-6 lg:px-8">
            {t.footerCopyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
