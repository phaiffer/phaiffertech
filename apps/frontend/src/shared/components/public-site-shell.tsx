'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  publicCardSurfaceClass,
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
  const useMinimalChrome = pathname === '/login';

  const navigationItems = [
    { href: '/', label: t.navHome, active: pathname === '/' },
    { href: '/about', label: t.navAbout, active: pathname === '/about' },
    { href: '/platform', label: t.navPlatform, active: pathname === '/platform' },
    { href: '/products', label: t.navProducts, active: pathname === '/products' },
    { href: '/engineering', label: t.navEngineering, active: pathname === '/engineering' },
    { href: '/research', label: t.navResearch, active: pathname === '/research' },
    { href: '/articles', label: t.navArticles, active: pathname === '/articles' || pathname.startsWith('/articles/') },
    { href: '/contact', label: t.navContact, active: pathname === '/contact' },
  ];

  const footerLinks = [
    { href: '/', label: t.navHome },
    { href: '/about', label: t.navAbout },
    { href: '/platform', label: t.navPlatform },
    { href: '/products', label: t.navProducts },
    { href: '/engineering', label: t.navEngineering },
    { href: '/research', label: t.navResearch },
    { href: '/articles', label: t.navArticles },
    { href: '/contact', label: t.navContact },
  ];

  const productLinks = [
    { href: '/products', label: 'IoT System' },
    { href: '/products', label: 'PetFlow' },
    { href: '/products', label: 'CRM Hub' },
  ];

  const accessLinks = [
    { href: '/login', label: t.navLogin },
    { href: '/platform', label: t.navPlatform },
    { href: '/research', label: t.navResearch },
  ];

  const nextLocale = locale === 'pt-BR' ? 'en-US' : 'pt-BR';
  const localeSwitchLabel = nextLocale === 'en-US' ? 'EN' : 'PT';

  const navLinkClass = (active: boolean) =>
    `text-sm font-medium transition-colors ${active ? 'text-accent' : 'text-muted hover:text-foreground'}`;

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
      {/* Subtle Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-40 ${publicChromeSurfaceClass}`}>
        <div className={`${publicSiteContainerClass} flex items-center justify-between py-5`}>
          {/* Logo */}
          <Link href="/" className="group inline-flex items-center gap-3">
            <div className={`${publicCardSurfaceClass} flex h-11 w-11 items-center justify-center overflow-hidden p-1.5`}>
              <Image
                src="/logo.png"
                alt="PhaifferTech"
                width={40}
                height={40}
                priority
                className="h-full w-full object-cover"
              />
            </div>
            <div className="hidden sm:block">
              <span className="block text-lg font-semibold tracking-tight text-foreground">
                PhaifferTech
              </span>
              <span className="block text-2xs font-medium uppercase tracking-wider text-muted">
                Software & Data
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-6 lg:flex">
            <nav className="flex items-center gap-6">
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

        {/* Mobile Navigation */}
        <div className={`${publicSiteContainerClass} pb-5 lg:hidden`}>
          <nav className="flex gap-4 overflow-x-auto whitespace-nowrap">
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

      {/* Main Content */}
      <main className="relative z-10">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-surface">
        <div className={`${publicSiteContainerClass} grid gap-10 py-16 lg:grid-cols-4`}>
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <p className="text-lg font-semibold text-foreground">PhaifferTech</p>
            <p className="mt-1 text-2xs font-medium uppercase tracking-wider text-muted">
              Software & Data
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">{t.footerNarrativeText}</p>
          </div>

          {/* Explore Links */}
          <div>
            <p className="text-sm font-medium text-foreground">{t.footerExploreTitle}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-muted">
              {footerLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-accent">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Products Links */}
          <div>
            <p className="text-sm font-medium text-foreground">{t.footerProductsTitle}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-muted">
              {productLinks.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="transition-colors hover:text-accent"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Access Links */}
          <div>
            <p className="text-sm font-medium text-foreground">{t.footerAccessTitle}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm text-muted">
              {accessLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-accent">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border">
          <div className={`${publicSiteContainerClass} py-5 text-sm text-muted`}>
            {t.footerCopyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
