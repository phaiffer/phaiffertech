'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandBanner, BrandMark, PetFlowMark } from '@/shared/components/brand-assets';
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
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/92 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <div className={`${publicSiteContainerClass} flex h-16 items-center justify-between gap-6`}>
          <Link href="/" className="inline-flex shrink-0 items-center gap-2.5">
            <PetFlowMark className="h-9 w-9 shrink-0" iconClassName="scale-95" />
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight text-slate-900">PetFlow</span>
              <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
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

      <footer className="border-t border-slate-200 bg-[linear-gradient(180deg,rgba(16,185,129,0.04),rgba(248,250,252,0.82))]">
        <div className={`${publicSiteContainerClass} grid gap-10 py-12 md:grid-cols-4`}>
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5">
              <PetFlowMark className="h-9 w-9 shrink-0" iconClassName="scale-95" />
              <div className="flex flex-col leading-none">
                <span className="text-base font-bold tracking-tight text-slate-900">PetFlow</span>
                <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-600">
                  by
                  <BrandMark className="h-3.5 w-3.5 rounded-sm" imageClassName="scale-110" />
                  PhaifferTech
                </span>
              </div>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-700">{t.footerNarrativeText}</p>
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

        <div className="border-t border-slate-200 bg-white/88">
          <div className={`${publicSiteContainerClass} flex flex-col gap-3 py-5 md:flex-row md:items-center md:justify-between`}>
            <div className="text-sm text-slate-700">{t.footerCopyright}</div>
            <div className="flex w-full max-w-[10rem] flex-col items-start gap-2 md:items-end md:text-right">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">by PhaifferTech</span>
              <div className="flex h-28 w-full items-center justify-center rounded-[1.25rem] bg-[linear-gradient(180deg,rgba(16,185,129,0.04),rgba(255,255,255,0.96))] p-2">
                <BrandBanner
                  className="aspect-[3/2] h-full max-w-full rounded-[0.85rem]"
                  imageClassName="h-full w-full object-contain object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
