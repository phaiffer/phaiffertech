'use client';

import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@/shared/components/brand-assets';
import { ImpersonationBanner } from '@/shared/components/impersonation-banner';
import { Sidebar } from '@/shared/components/sidebar';
import {
  appShellContentContainerClass,
  sharedEyebrowClass,
  sharedShellHeaderClass
} from '@/shared/components/public-visual-system';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';

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
    return {
      label: labels.iotLabel,
      description: labels.iotDescription
    };
  }

  if (pathname.startsWith('/crm')) {
    return {
      label: labels.crmLabel,
      description: labels.crmDescription
    };
  }

  if (pathname.startsWith('/pet')) {
    return {
      label: labels.petLabel,
      description: labels.petDescription
    };
  }

  if (pathname.startsWith('/tenants')) {
    return {
      label: labels.workspacesLabel,
      description: labels.workspacesDescription
    };
  }

  if (pathname.startsWith('/users')) {
    return {
      label: labels.usersLabel,
      description: labels.usersDescription
    };
  }

  if (pathname.startsWith('/settings')) {
    return {
      label: labels.settingsLabel,
      description: labels.settingsDescription
    };
  }

  return {
    label: platformAdmin ? labels.platformLabel : hasPetVisible ? labels.petOverviewLabel : labels.overviewLabel,
    description: hasPetVisible
      ? labels.petOverviewDescription
      : labels.overviewDescription
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
  const messages = useAppMessages().appShell;
  const { branding, modules, user, workspace } = useFrontendPlatform();
  const hasPetVisible = modules.availableCodes.includes('PET');

  const moduleContext = useMemo(() => resolveModuleContext(pathname), [pathname]);
  const headerMeta = useMemo(
    () => resolveHeaderMeta(pathname, messages.header, workspace.canManagePlatformAdministration, hasPetVisible),
    [hasPetVisible, messages.header, pathname, workspace.canManagePlatformAdministration]
  );
  const shellStyle = useMemo(
    () => ({
      ...branding.style,
      backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,252,0.98) 280px)'
    }),
    [branding.style]
  );
  const quickSearchHref = hasPetVisible ? '/pet/appointments' : '/dashboard';
  const nextLocale = locale === 'pt-BR' ? 'en-US' : 'pt-BR';
  const localeSwitchLabel = nextLocale === 'en-US' ? 'EN' : 'PT';

  return (
    <div className="flex min-h-screen bg-slate-50 bg-no-repeat" data-module={moduleContext} style={shellStyle}>
      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0">
        <ImpersonationBanner tenantName={branding.scopeName} tenantCode={branding.tenantCode} />

        <nav className="sticky top-0 z-30 flex items-center gap-2 overflow-x-auto border-b border-border bg-surface px-3 py-2 lg:hidden">
          <Link href="/" className="inline-flex shrink-0">
            <BrandMark className="h-11 w-11" imageClassName="scale-[1.08]" />
          </Link>
          <Link href="/dashboard" className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${pathname === '/dashboard' ? 'bg-accent-muted text-foreground' : 'text-slate-600 hover:bg-surface-inset hover:text-foreground'}`}>
            {messages.mobileOverview}
          </Link>
          {modules.availableCodes.includes('PET') && (
            <Link href="/pet" className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${pathname.startsWith('/pet') ? 'bg-accent-muted text-foreground' : 'text-slate-600 hover:bg-surface-inset hover:text-foreground'}`}>
              {messages.mobilePetFlow}
            </Link>
          )}
          <Link href="/settings" className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${pathname.startsWith('/settings') ? 'bg-accent-muted text-foreground' : 'text-slate-600 hover:bg-surface-inset hover:text-foreground'}`}>
            {messages.mobileSettings}
          </Link>
        </nav>

        <header className={`sticky top-0 z-20 ${sharedShellHeaderClass}`}>
          <div className={`${appShellContentContainerClass} flex flex-col gap-4 px-6 py-5 lg:px-8`}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className={`${sharedEyebrowClass} text-[11px]`}>{branding.scopeName}</p>
                <h1 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
                  {headerMeta.label}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">{headerMeta.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={quickSearchHref}
                  className="hidden min-w-[320px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-xs transition-colors hover:border-accent hover:text-foreground lg:inline-flex"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                  </svg>
                  <span className="truncate">
                    {hasPetVisible ? messages.quickSearchPet : messages.quickSearchWorkspace}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={() => setLocale(nextLocale)}
                  aria-label={messages.localeButtonLabel}
                  className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition-colors hover:border-accent hover:text-foreground"
                >
                  {localeSwitchLabel}
                </button>

                <span className="inline-flex items-center rounded-full border border-[color:var(--accent)]/20 bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-medium text-foreground">
                  {workspace.accessLabel}
                </span>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-xs">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-sm font-semibold text-foreground">
                    {getInitials(user?.fullName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{user?.fullName}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-6 lg:px-8 lg:py-8">
          <div className={appShellContentContainerClass}>{children}</div>
        </main>
      </div>
    </div>
  );
}
