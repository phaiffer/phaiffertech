'use client';

import type { ReactNode } from 'react';
import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, X, Globe, Bell, Settings, LogOut, ChevronDown } from 'lucide-react';
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
import { Separator } from '@/shared/ui/shadcn/separator';

function resolveModuleContext(pathname: string): 'core' | 'crm' | 'iot' | 'pet' {
  if (pathname.startsWith('/iot')) return 'iot';
  if (pathname.startsWith('/crm')) return 'crm';
  if (pathname.startsWith('/pet')) return 'pet';
  return 'core';
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

  const shellStyle = useMemo(() => ({ ...branding.style }), [branding.style]);

  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  return (
    <div
      className="flex h-screen overflow-hidden bg-[var(--background)]"
      data-module={moduleContext}
      style={shellStyle}
    >
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ImpersonationBanner tenantName={branding.scopeName} tenantCode={branding.tenantCode} />

        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-4">
          {/* Breadcrumb / section title */}
          <Separator orientation="vertical" className="mx-1 h-5" />
          <span className="truncate text-sm font-medium text-[var(--foreground)]">
            {headerMeta.label}
          </span>

          <div className="flex-1" />

          {/* Search */}
          <div className="flex items-center">
            {searchOpen ? (
              <div className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5">
                <Search className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar clientes, pets, agendamentos..."
                  className="w-52 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setSearchOpen(false);
                  }}
                />
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="flex h-5 w-5 items-center justify-center rounded text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-inset)] hover:text-[var(--foreground)]"
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
                className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-inset)] hover:text-[var(--foreground)]"
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
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-inset)] hover:text-[var(--foreground)]"
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
                className="flex h-8 items-center gap-1.5 rounded-lg px-1.5 text-left transition-colors hover:bg-[var(--surface-inset)]"
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

        <main className="flex-1 overflow-auto px-6 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
