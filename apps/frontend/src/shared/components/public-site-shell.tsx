'use client';

import { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  publicPrimaryButtonClass,
  publicSecondaryButtonClass,
  publicSiteContainerClass
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

  const nextLocale = locale === 'pt-BR' ? 'en-US' : 'pt-BR';
  const localeSwitchLabel = nextLocale.toUpperCase();

  const navLinkClass = (active: boolean) =>
    [
      'text-[11px] font-bold uppercase tracking-[0.22em] transition-colors',
      active ? 'text-sky-400' : 'text-[#b6bec5] hover:text-sky-400'
    ].join(' ');

  const localeButtonClass = [
    'rounded-[14px] border border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] transition-colors',
    'text-[#b6bec5] hover:border-sky-400/50 hover:text-sky-400'
  ].join(' ');

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(14,165,233,0.12),transparent_34%),radial-gradient(circle_at_88%_78%,rgba(14,165,233,0.08),transparent_30%)]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#020617]/80 backdrop-blur-xl">
        <div className={`${publicSiteContainerClass} flex items-center justify-between py-4`}>
          <Link href="/" className="group inline-flex items-center gap-4 text-inherit no-underline">
            <span className="relative block h-16 w-16 shrink-0 md:h-[4.5rem] md:w-[4.5rem]">
              <Image
                src="/logo.png"
                alt="PhaifferTech logo"
                width={96}
                height={96}
                priority
                className="h-full w-full scale-[1.46] object-contain transition-transform duration-200 group-hover:scale-[1.52]"
              />
            </span>

            <span className="min-w-0 leading-tight">
              <span className="block text-4xl font-black leading-none tracking-[-0.05em] text-white md:text-[3.4rem]">
                PHAIFFER <span className="text-sky-400">TECH</span>
              </span>
              <span className="mt-1.5 block text-[11px] font-bold uppercase tracking-[0.42em] text-[#b6bec5] md:text-[12px]">
                SOFTWARE &amp; DATA
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 xl:flex">
            <nav className="flex items-center gap-8">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href} className={navLinkClass(item.active)}>
                  {item.label}
                </Link>
              ))}
            </nav>

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

        <div className={`${publicSiteContainerClass} pb-4 xl:hidden`}>
          <nav className="flex gap-6 overflow-x-auto whitespace-nowrap">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(item.active)}
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

      <footer className="relative z-10 border-t border-white/10 bg-[#020617]">
        <div className={`${publicSiteContainerClass} grid gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]`}>
          <div className="max-w-md">
            <p className="text-3xl font-black tracking-tight text-white">
              PHAIFFER <span className="text-sky-400">TECH</span>
            </p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.36em] text-[#b6bec5]">
              SOFTWARE &amp; DATA
            </p>
            <p className="mt-5 text-sm leading-7 text-[#b6bec5]">{t.footerNarrativeText}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">{t.footerExploreTitle}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-[#b6bec5]">
              {footerLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-sky-400">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">{t.footerProductsTitle}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-[#b6bec5]">
              {productLinks.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="transition hover:text-sky-400"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-white">{t.footerAccessTitle}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-[#b6bec5]">
              {accessLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-sky-400">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className={`${publicSiteContainerClass} py-5 text-sm text-[#7e8a9a]`}>
            {t.footerCopyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
