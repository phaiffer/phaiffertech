'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandBanner, BrandMark } from '@/shared/components/brand-assets';
import { publicSiteContainerClass } from '@/shared/components/public-visual-system';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { usePublicSite } from '@/shared/public/public-site-provider';

type PublicSiteShellProps = {
  children: ReactNode;
};

export function PublicSiteShell({ children }: PublicSiteShellProps) {
  const pathname = usePathname();
  const { locale, setLocale } = usePublicSite();
  const t = useAppMessages().publicShell;
  const useMinimalChrome = ['/login', '/forgot-password', '/reset-password', '/register'].includes(pathname);

  const navigationItems = [
    { href: '/', label: 'Plataforma', active: pathname === '/' },
    { href: '/recursos', label: 'Recursos', active: pathname === '/recursos' },
    { href: '/precos', label: 'Precos', active: pathname === '/precos' },
    { href: '/clientes', label: 'Clientes', active: pathname === '/clientes' },
    { href: '/contact', label: 'Contato', active: pathname === '/contact' },
  ];

  const footerLinks = [
    { href: '/', label: 'Plataforma' },
    { href: '/recursos', label: 'Recursos' },
    { href: '/precos', label: 'Precos' },
    { href: '/contact', label: 'Contato' },
  ];

  const productLinks = [
    { href: '/produtos/prontuario', label: 'Prontuario Digital' },
    { href: '/produtos/agendamentos', label: 'Agendamentos' },
    { href: '/produtos/vacinas', label: 'Controle de Vacinas' },
    { href: '/produtos/financeiro', label: 'Gestao Financeira' },
  ];

  const accessLinks = [
    { href: '/login', label: 'Entrar' },
    { href: '/register', label: 'Comecar teste gratuito' },
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
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-white/95 backdrop-blur-lg">
        <div className={`${publicSiteContainerClass} flex h-20 items-center justify-between gap-6`}>
          {/* Logo */}
          <Link href="/" className="group inline-flex shrink-0 items-center gap-3">
            <BrandMark priority className="h-10 w-10 shrink-0" imageClassName="scale-[1.08]" />
            <div className="min-w-0">
              <p className="text-lg font-semibold tracking-[-0.02em] text-petflow">PetFlow</p>
              <p className="text-[10px] font-medium text-muted-foreground">by PhaifferTech</p>
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

          {/* Navigation */}
          <nav className="hidden items-center gap-8 lg:flex">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition-colors ${
                  item.active 
                    ? 'font-semibold text-foreground' 
                    : 'font-medium text-muted hover:text-foreground'
                }`}
              >
              <Link key={item.href} href={item.href} className={navLinkClass(item.active)}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="hidden text-sm font-medium text-muted transition-colors hover:text-foreground md:inline-flex"
            >
              Entrar
            </Link>
            <Link 
              href="/register" 
              className="inline-flex items-center rounded-xl bg-petflow px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-petflow/20 transition-all hover:-translate-y-0.5 hover:bg-petflow-dark"
            >
              Demonstracao gratuita
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

        {/* Mobile Navigation */}
        <div className={`${publicSiteContainerClass} pb-4 lg:hidden`}>
          <nav className="flex gap-2 overflow-x-auto whitespace-nowrap">
            {navigationItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`inline-flex items-center rounded-full px-4 py-2 text-sm transition-colors ${
                  item.active 
                    ? 'bg-petflow/10 font-medium text-petflow' 
                    : 'text-muted hover:bg-slate-100'
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

      {/* Footer */}
      <footer className="relative z-10 mt-20 border-t border-white/10 bg-petflow-gradient text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(16,185,129,0.15),transparent_50%)]" />
        
        <div className={`${publicSiteContainerClass} relative grid gap-12 py-16 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]`}>
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-3">
              <BrandMark tone="dark" className="h-10 w-10" />
              <div>
                <p className="text-lg font-semibold text-white">PetFlow</p>
                <p className="text-xs text-slate-400">by PhaifferTech</p>
              </div>
            </div>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-slate-300">
              Sistema de gestao completo para clinicas veterinarias. Prontuario digital, agendamentos, vacinas e muito mais.
            </p>
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className={`${publicSiteContainerClass} grid gap-10 py-14 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]`}>
          <div>
            <BrandBanner className="h-14 w-[210px] border-slate-200 bg-white sm:w-[232px]" />
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.brandTitle}</p>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">{t.footerNarrativeText}</p>
          </div>

          {/* Navigation Column */}
          <div>
            <p className="text-sm font-semibold text-white">Navegacao</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
            <p className="text-sm font-semibold text-slate-900">{t.navLabel}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
              {footerLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-slate-900">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Products & Access Column */}
          <div>
            <p className="text-sm font-semibold text-white">Produtos</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
              {productLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-white">
            <p className="text-sm font-semibold text-slate-900">{t.footerProductsTitle}</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-600">
              {productLinks.map((item) => (
                <Link key={`${item.href}-${item.label}`} href={item.href} className="transition-colors hover:text-slate-900">
                  {item.label}
                </Link>
              ))}
            </div>
            
            <p className="mt-8 text-sm font-semibold text-white">Acesso</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
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

        {/* Copyright */}
        <div className="border-t border-white/10">
          <div className={`${publicSiteContainerClass} py-6 text-sm text-slate-400`}>
            2024 PhaifferTech. Todos os direitos reservados.
        <div className="border-t border-slate-200">
          <div className={`${publicSiteContainerClass} py-5 text-sm text-slate-500`}>
            {t.footerCopyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
