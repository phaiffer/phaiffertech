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
    { href: '/', label: t.navHome },
    { href: '/platform', label: t.navPlatform },
    { href: '/products', label: t.navProducts },
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
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className={`${publicSiteContainerClass} flex h-16 items-center justify-between gap-6`}>
          <Link href="/" className="inline-flex shrink-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                <ellipse cx="12" cy="17" rx="4.5" ry="3.5" />
                <ellipse cx="7" cy="13.5" rx="2" ry="2.5" />
                <ellipse cx="17" cy="13.5" rx="2" ry="2.5" />
                <ellipse cx="9.5" cy="10" rx="2" ry="2.5" />
                <ellipse cx="14.5" cy="10" rx="2" ry="2.5" />
              </svg>
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight text-slate-900">PetFlow</span>
              <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                by
                <BrandMark className="h-3.5 w-3.5 rounded-sm" imageClassName="scale-110" />
                PhaifferTech
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  isActivePath(pathname, item.href)
                    ? 'font-semibold text-slate-900'
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

            <Link href="/contact" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 md:inline-flex">
              {t.navContact}
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--petflow-teal))] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_38px_-26px_rgba(16,185,129,0.52)] transition-transform hover:-translate-y-0.5"
            >
              {t.navLogin}
            </Link>
          </div>
        </div>

        <div className={`${publicSiteContainerClass} pb-4 md:hidden`}>
          <nav className="flex gap-2 overflow-x-auto whitespace-nowrap">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex h-10 items-center rounded-xl border px-3.5 text-sm font-medium transition-colors ${
                  isActivePath(pathname, item.href)
                    ? 'border-[color:var(--accent)]/20 bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
                    : 'border-slate-200 bg-white text-slate-700 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50/70">
        <div className={`${publicSiteContainerClass} grid gap-10 py-12 md:grid-cols-4`}>
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <ellipse cx="12" cy="17" rx="4.5" ry="3.5" />
                  <ellipse cx="7" cy="13.5" rx="2" ry="2.5" />
                  <ellipse cx="17" cy="13.5" rx="2" ry="2.5" />
                  <ellipse cx="9.5" cy="10" rx="2" ry="2.5" />
                  <ellipse cx="14.5" cy="10" rx="2" ry="2.5" />
                </svg>
              </span>
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold tracking-tight text-slate-900">PetFlow</span>
                <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                  by
                  <BrandMark className="h-3.5 w-3.5 rounded-sm" imageClassName="scale-110" />
                  PhaifferTech
                </span>
              </div>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-600">{t.footerNarrativeText}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">{t.footerExploreTitle}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-700">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-slate-900">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">{t.footerProductsTitle}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-700">
              <Link href="/products" className="transition-colors hover:text-slate-900">
                {t.navProducts}
              </Link>
              <Link href="/platform" className="transition-colors hover:text-slate-900">
                {t.navPlatform}
              </Link>
              <Link href="/contact" className="transition-colors hover:text-slate-900">
                {t.navContact}
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">{t.footerAccessTitle}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-700">
              <Link href="/login" className="transition-colors hover:text-slate-900">
                {t.navLogin}
              </Link>
              <Link href="/contact" className="transition-colors hover:text-slate-900">{t.navContact}</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white/80">
          <div className={`${publicSiteContainerClass} py-5 text-sm text-slate-700`}>{t.footerCopyright}</div>
        </div>
      </footer>
    </div>
  );
}
