'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  publicChromeSurfaceClass,
  publicCompactButtonClass,
  publicPrimaryButtonClass,
  publicSecondaryButtonClass,
  publicSiteContainerClass,
} from '@/shared/components/public-visual-system';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getPublicSiteMessages } from '@/shared/public/public-site-messages';

type PublicSiteShellProps = {
  children: ReactNode;
};

export function PublicSiteShell({ children }: PublicSiteShellProps) {
  const pathname = usePathname();
  const { locale, setLocale } = usePublicSite();
  const t = getPublicSiteMessages(locale).shell;
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
    { href: '/platform', label: locale === 'pt-BR' ? 'Fundação da plataforma' : 'Platform foundation' },
  ];

  const accessLinks = [
    { href: '/login', label: t.navLogin },
    { href: '/contact', label: locale === 'pt-BR' ? 'Solicitar demo' : 'Request a demo' },
  ];

  const nextLocale = locale === 'pt-BR' ? 'en-US' : 'pt-BR';
  const localeSwitchLabel = nextLocale === 'en-US' ? 'EN' : 'PT';

  const navLinkClass = (active: boolean) =>
    `inline-flex h-10 items-center rounded-2xl px-3.5 text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-accent-muted text-foreground shadow-sm'
        : 'text-muted hover:bg-surface-inset hover:text-foreground'
    }`;

  const localeButtonClass = publicCompactButtonClass;

  if (useMinimalChrome) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-0 top-1/4 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
      </div>

      <header className={`sticky top-0 z-40 ${publicChromeSurfaceClass}`}>
        <div className={`${publicSiteContainerClass} flex items-center justify-between py-3`}>
          <Link href="/" className="group inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[1.1rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#eff6ff)] p-1.5 shadow-sm">
              <Image
                src="/PhaifferTech_logo.png"
                alt="PhaifferTech"
                width={40}
                height={40}
                priority
                className="h-full w-full object-cover"
              />
            </div>
            <div className="hidden sm:block">
              <span className="block text-base font-semibold tracking-tight text-foreground">PhaifferTech</span>
              <span className="block text-2xs font-medium uppercase tracking-[0.2em] text-muted">PetFlow focus</span>
            </div>
          </Link>

          <div className="hidden items-center gap-4 lg:flex">
            <nav className="flex items-center gap-2">
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
                className={localeButtonClass}
              >
                {localeSwitchLabel}
              </button>

              <Link
                href="/login"
                className={pathname === '/login' ? publicSecondaryButtonClass : publicPrimaryButtonClass}
              >
                {t.navLogin}
              </Link>
            </div>
          </div>
        </div>

        <div className={`${publicSiteContainerClass} pb-4 lg:hidden`}>
          <nav className="flex gap-2 overflow-x-auto whitespace-nowrap">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass(item.active)}>
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

            <Link
              href="/login"
              className={pathname === '/login' ? publicSecondaryButtonClass : publicPrimaryButtonClass}
            >
              {t.navLogin}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 mt-16 border-t border-white/10 bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.16),transparent_32%)]" />
        <div className={`${publicSiteContainerClass} relative grid gap-10 py-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]`}>
          <div>
            <p className="text-lg font-semibold text-white">PhaifferTech</p>
            <p className="mt-1 text-2xs font-medium uppercase tracking-wider text-slate-400">
              PetFlow focus
            </p>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">{t.footerNarrativeText}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-white">{locale === 'pt-BR' ? 'Navegação' : 'Navigation'}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-300">
              {footerLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-white">{t.footerProductsTitle}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-300">
              {productLinks.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <p className="mt-8 text-sm font-medium text-white">{t.footerAccessTitle}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-slate-300">
              {accessLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className={`${publicSiteContainerClass} py-5 text-sm text-slate-400`}>
            {t.footerCopyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
