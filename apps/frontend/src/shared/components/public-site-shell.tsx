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
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
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
          </div>

          {/* Navigation Column */}
          <div>
            <p className="text-sm font-semibold text-white">Navegacao</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
              {footerLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-white">
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
                  {item.label}
                </Link>
              ))}
            </div>
            
            <p className="mt-8 text-sm font-semibold text-white">Acesso</p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
              {accessLinks.map((item) => (
                <Link key={item.href} href={item.href} className="transition-colors hover:text-white">
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
          </div>
        </div>
      </footer>
    </div>
  );
}
