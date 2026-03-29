'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@/shared/components/brand-assets';
import { publicSiteContainerClass } from '@/shared/components/public-visual-system';
import { getPublicSiteMessages } from '@/shared/public/public-site-messages';
import { usePublicSite } from '@/shared/public/public-site-provider';

type PublicSiteShellProps = {
  children: ReactNode;
};

function isActivePath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicSiteShell({ children }: PublicSiteShellProps) {
  const pathname = usePathname();
  const { locale, setLocale } = usePublicSite();
  const t = getPublicSiteMessages(locale).shell;
  const useMinimalChrome = ['/login', '/forgot-password', '/reset-password', '/register'].includes(pathname);
  const nextLocale = locale === 'pt-BR' ? 'en-US' : 'pt-BR';
  const localeSwitchLabel = nextLocale === 'en-US' ? 'EN' : 'PT';

  const navigationItems = [
    { href: '/platform', label: t.navHome },
    { href: '/products', label: t.navProducts },
    { href: '/engineering', label: t.navEngineering },
    { href: '/research', label: t.navResearch },
    { href: '/articles', label: t.navArticles },
    { href: '/contact', label: t.navContact }
  ];

  if (useMinimalChrome) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-foreground">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl">
        <div className={`${publicSiteContainerClass} flex h-20 items-center justify-between gap-6`}>
          <Link href="/" className="inline-flex shrink-0 items-center gap-3">
            <BrandMark priority className="h-11 w-11 shrink-0 rounded-2xl" imageClassName="scale-[1.08]" />
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold tracking-[-0.02em] text-slate-900">PetFlow</p>
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">by PhaifferTech</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  isActivePath(pathname, item.href)
                    ? 'font-semibold text-[color:var(--accent)]'
                    : 'font-medium text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLocale(nextLocale)}
              aria-label={t.localeLabel}
              className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
            >
              {localeSwitchLabel}
            </button>

            <Link href="/login" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 md:inline-flex">
              {t.navLogin}
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--petflow-teal))] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_38px_-26px_rgba(16,185,129,0.52)] transition-transform hover:-translate-y-0.5"
            >
              {t.navLogin}
            </Link>
          </div>
        </div>

        <div className={`${publicSiteContainerClass} pb-4 lg:hidden`}>
          <nav className="flex gap-2 overflow-x-auto whitespace-nowrap">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex h-10 items-center rounded-xl border px-3.5 text-sm font-medium transition-colors ${
                  isActivePath(pathname, item.href)
                    ? 'border-[color:var(--accent)]/20 bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="relative overflow-hidden border-t border-slate-200 bg-[linear-gradient(180deg,#f8fbf9,#ffffff)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(16,185,129,0.08),transparent_36%)]" />
        <div className={`${publicSiteContainerClass} grid gap-10 py-14 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]`}>
          <div>
            <div className="inline-flex items-center gap-3 rounded-[1.6rem] border border-slate-200/80 bg-white/90 px-4 py-3 shadow-[0_18px_34px_-28px_rgba(15,23,42,0.16)]">
              <BrandMark className="h-11 w-11 shrink-0 rounded-2xl" imageClassName="scale-[1.08]" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-[-0.02em] text-slate-900">PetFlow</p>
                <p className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">by PhaifferTech</p>
              </div>
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.brandTitle}</p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">{t.footerNarrativeText}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">{t.footerExploreTitle}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-slate-900">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">{t.footerAccessTitle}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
              <Link href="/login" className="transition-colors hover:text-slate-900">
                {t.navLogin}
              </Link>
              <Link href="/contact" className="transition-colors hover:text-slate-900">
                {t.navContact}
              </Link>
              <Link href="/products" className="transition-colors hover:text-slate-900">
                {t.navProducts}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200">
          <div className={`${publicSiteContainerClass} py-5 text-sm text-slate-500`}>{t.footerCopyright}</div>
        </div>
      </footer>
    </div>
  );
}
