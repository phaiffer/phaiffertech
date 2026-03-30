'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, X, Globe, Bell, Settings, LogOut, ChevronDown } from 'lucide-react';
import { BrandMark, PetFlowMark } from '@/shared/components/brand-assets';
import { ImpersonationBanner } from '@/shared/components/impersonation-banner';
import { Sidebar } from '@/shared/components/sidebar';
import { useAuth } from '@/shared/auth/use-auth';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { Avatar, AvatarFallback } from '@/shared/ui/shadcn/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/dropdown-menu';

function resolveModuleContext(pathname: string): 'core' | 'crm' | 'iot' | 'pet' {
  if (pathname.startsWith('/iot')) return 'iot';
  if (pathname.startsWith('/crm')) return 'crm';
  if (pathname.startsWith('/pet')) return 'pet';
  return 'core';
}

function isAdministrativeSurface(pathname: string, canManagePlatformAdministration: boolean) {
  if (!canManagePlatformAdministration) {
    return false;
  }

  return pathname.startsWith('/tenants')
    || pathname.startsWith('/users')
    || pathname.startsWith('/settings');
}

function resolveHeaderMeta(
  pathname: string,
  labels: ReturnType<typeof useAppMessages>['appShell']['header'],
  platformAdmin?: boolean,
  hasPetVisible?: boolean
) {
  if (pathname.startsWith('/iot')) {
    return { label: labels.iotLabel, description: labels.iotDescription };
  }
  if (pathname.startsWith('/crm')) {
    return { label: labels.crmLabel, description: labels.crmDescription };
  }
  if (pathname.startsWith('/pet')) {
    return { label: labels.petLabel, description: labels.petDescription };
  }
  if (pathname.startsWith('/tenants')) {
    return { label: labels.workspacesLabel, description: labels.workspacesDescription };
  }
  if (pathname.startsWith('/users')) {
    return { label: labels.usersLabel, description: labels.usersDescription };
  }
  if (pathname.startsWith('/settings')) {
    return { label: labels.settingsLabel, description: labels.settingsDescription };
  }
  return {
    label: platformAdmin ? labels.platformLabel : hasPetVisible ? labels.petOverviewLabel : labels.overviewLabel,
    description: hasPetVisible ? labels.petOverviewDescription : labels.overviewDescription,
  };
}

function getInitials(name?: string) {
  if (!name) return 'PT';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { locale, setLocale } = useAppI18n();
  const { signOut } = useAuth();
  const messages = useAppMessages().appShell;
  const { branding, modules, user, workspace } = useFrontendPlatform();
  const hasPetVisible = modules.availableCodes.includes('PET');

  const moduleContext = useMemo(() => resolveModuleContext(pathname), [pathname]);
  const headerMeta = useMemo(
    () => resolveHeaderMeta(pathname, messages.header, workspace.canManagePlatformAdministration, hasPetVisible),
    [hasPetVisible, messages.header, pathname, workspace.canManagePlatformAdministration]
  );

  const nextLocale = locale === 'pt-BR' ? 'en-US' : 'pt-BR';
  const localeSwitchLabel = nextLocale === 'en-US' ? 'PT-BR' : 'EN-US';
  const currentLocaleLabel = locale === 'pt-BR' ? 'PT-BR' : 'EN-US';

  const shellStyle = useMemo(
    () =>
      ({
        ...branding.style,
        '--tenant-accent': 'var(--petflow-primary)',
        '--tenant-accent-soft': 'color-mix(in srgb, var(--petflow-primary) 18%, transparent)',
        '--tenant-primary': 'var(--petflow-gradient-start)',
        '--tenant-primary-soft': 'color-mix(in srgb, var(--petflow-gradient-end) 14%, transparent)'
      }) as CSSProperties,
    [branding.style]
  );
  const showAdministrativeSignature = useMemo(
    () => isAdministrativeSurface(pathname, workspace.canManagePlatformAdministration),
    [pathname, workspace.canManagePlatformAdministration]
  );

  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  return (
    <div
      className="flex h-screen overflow-hidden bg-[linear-gradient(180deg,#f7fbf8,#f4f8f6)]"
      data-module={moduleContext}
      style={shellStyle}
    >
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ImpersonationBanner tenantName={branding.scopeName} tenantCode={branding.tenantCode} />

        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-[4.25rem] shrink-0 items-center gap-3 border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,248,0.95))] px-5 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.12)] backdrop-blur-sm">
          <div className="flex min-w-0 items-center gap-3">
            <PetFlowMark className="h-9 w-9 shrink-0 rounded-[1rem]" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                PetFlow workspace
              </p>
              <p className="truncate text-sm font-semibold text-slate-900">
                {headerMeta.label}
              </p>
              <p className="hidden truncate text-xs text-slate-600 xl:block">
                {headerMeta.description}
              </p>
            </div>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="flex items-center">
            {searchOpen ? (
              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white/90 px-2.5 py-2 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.1)]">
                <Search className="h-4 w-4 shrink-0 text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar clientes, pets, agendamentos..."
                  className="w-52 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setSearchOpen(false);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="flex h-5 w-5 items-center justify-center rounded text-slate-500 hover:text-slate-900"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-emerald-50 hover:text-slate-900"
              >
                <Search className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Language selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={messages.localeButtonLabel}
                className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-emerald-50 hover:text-slate-900"
              >
                <Globe className="h-4 w-4" />
                {currentLocaleLabel}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem
                onClick={() => setLocale('pt-BR')}
                className={locale === 'pt-BR' ? 'font-medium text-[var(--primary)]' : ''}
              >
                PT-BR
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLocale('en-US')}
                className={locale === 'en-US' ? 'font-medium text-[var(--primary)]' : ''}
              >
                EN-US
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Notificações"
                className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-emerald-50 hover:text-slate-900"
              >
                <Bell className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-4 text-center text-sm text-[var(--muted-foreground)]">
                Nenhuma notificação no momento.
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User avatar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-9 items-center gap-1.5 rounded-xl px-2 text-left transition-colors hover:bg-emerald-50"
              >
                <Avatar className="h-7 w-7 text-xs">
                  <AvatarFallback className="bg-[var(--primary)] text-[var(--primary-foreground)]">
                    {getInitials(user?.fullName)}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-[var(--foreground)]">{user?.fullName}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => void signOut()}
                className="cursor-pointer text-[var(--destructive)] focus:text-[var(--destructive)]"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {showAdministrativeSignature ? (
          <div className="border-b border-slate-200/80 bg-[linear-gradient(90deg,rgba(16,185,129,0.05),rgba(255,255,255,0.98),rgba(15,118,110,0.04))]">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-3 px-6 py-2.5 lg:px-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <PetFlowMark className="h-8 w-8 shrink-0 rounded-[0.95rem]" />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                    PetFlow administration
                  </p>
                  <p className="text-sm text-slate-700">
                    Superfície administrativa do PetFlow com assinatura discreta da
                    {' '}
                    <span className="font-medium text-slate-900">PhaifferTech</span>.
                  </p>
                </div>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/88 px-3 py-1.5 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.08)]">
                <BrandMark className="h-4 w-4 rounded-[0.5rem] p-[0.12rem]" imageClassName="scale-[1.08]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                  PhaifferTech
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <main className="flex-1 overflow-auto px-6 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}

            <footer className="mt-8 border-t border-slate-200/80 pt-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">PetFlow</p>
                  <p className="text-xs text-slate-600">
                    Continuação direta da experiência institucional do PetFlow.
                  </p>
                </div>

                <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.08)]">
                  <BrandMark className="h-4 w-4 rounded-[0.5rem] p-[0.12rem]" imageClassName="scale-[1.08]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                    by PhaifferTech
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
