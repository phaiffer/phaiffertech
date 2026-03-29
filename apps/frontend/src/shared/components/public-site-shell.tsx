'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandBanner, BrandMark } from '@/shared/components/brand-assets';
import {
  publicChromeSurfaceClass,
  publicCompactButtonClass,
  publicPrimaryButtonClass,
  publicSecondaryButtonClass,
  publicSiteContainerClass,
} from '@/shared/components/public-visual-system';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { usePublicSite } from '@/shared/public/public-site-provider';

type PublicSiteShellProps = {
  children: ReactNode;
};

export function PublicSiteShell({ children }: PublicSiteShellProps) {
  const pathname = usePathname();
  const { locale, setLocale } = usePublicSite();
  const t = useAppMessages().publicShell;
  const useMinimalChrome = ['/login', '/forgot-password', '/reset-password'].includes(pathname);

  const navigationItems = [
    { href: '/', label: t.navHome, active: pathname === '/' },
    { href: '/products', label: t.navProducts, active: pathname === '/products' },
    { href: '/platform', label: t.navPlatform, active: pathname === '/platform' },
    { href: '/contact', label: t.navContact, active: pathname === '/contact' },
  ];

  const footerLinks = [
    { href: '/', label: t.navHome },
    { href: '/products', label: t.navProducts },
    { href: '/platform', label: t.navPlatform },
    { href: '/contact', label: t.navContact },
  ];

  const productLinks = [
    { href: '/products', label: 'PetFlow' },
    { href: '/platform', label: t.footerPlatformLabel },
  ];

  const accessLinks = [
    { href: '/login', label: t.navLogin },
    { href: '/contact', label: t.footerDemoLabel },
  ];

  const nextLocale = locale === 'pt-BR' ? 'en-US' : 'pt-BR';
  const localeSwitchLabel = nextLocale === 'en-US' ? 'EN' : 'PT';

  const localeButtonClass = publicCompactButtonClass;
  const navLinkClass = (active: boolean) =>
    `text-sm transition-colors ${
      active ? 'font-semibold text-slate-900' : 'font-medium text-slate-600 hover:text-slate-900'
    }`;

  if (useMinimalChrome) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-foreground">
      <header className={`sticky top-0 z-50 ${publicChromeSurfaceClass}`}>
        <div className={`${publicSiteContainerClass} flex h-20 items-center justify-between gap-8`}>
          <Link href="/" className="inline-flex shrink-0 items-center gap-3">
            <BrandMark priority className="h-11 w-11 shrink-0 rounded-2xl sm:h-12 sm:w-12" imageClassName="scale-[1.08]" />
            <div className="min-w-0">
              <p className="truncate text-xl font-bold tracking-[-0.03em] text-slate-900">PetFlow</p>
              <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                by PhaifferTech
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass(item.active)}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLocale(nextLocale)}
              aria-label={t.localeLabel}
              className={`${localeButtonClass} hidden sm:inline-flex`}
            >
              {localeSwitchLabel}
            </button>

            <Link href="/login" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 md:inline-flex">
              {t.navLogin}
            </Link>
            <Link href="/contact" className={`hidden md:inline-flex ${publicPrimaryButtonClass}`}>
              {t.footerDemoLabel}
            </Link>
            <Link href="/login" className="text-sm font-medium text-slate-700 transition-colors hover:text-slate-900 md:hidden">
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
                  item.active
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLocale(nextLocale)}
              aria-label={t.localeLabel}
              className={localeButtonClass}
            >
              {localeSwitchLabel}
            </button>

            <Link href="/login" className={pathname === '/login' ? publicSecondaryButtonClass : publicPrimaryButtonClass}>
              {t.navLogin}
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className={`${publicSiteContainerClass} grid gap-10 py-14 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]`}>
          <div>
            <BrandBanner className="h-14 w-[210px] border-slate-200 bg-white sm:w-[232px]" />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.brandTitle}</p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">{t.footerNarrativeText}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">{t.navLabel}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
              {footerLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-slate-900">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">{t.footerProductsTitle}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
              {productLinks.map((item) => (
                <Link key={`${item.href}-${item.label}`} href={item.href} className="transition-colors hover:text-slate-900">
                  {item.label}
                </Link>
              ))}
            </div>
            <p className="mt-8 text-sm font-semibold text-slate-900">{t.footerAccessTitle}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
              {accessLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-slate-900">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200">
          <div className={`${publicSiteContainerClass} py-5 text-sm text-slate-500`}>
            {t.footerCopyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
