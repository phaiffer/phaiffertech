'use client';

import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@/shared/components/brand-assets';
import { ImpersonationBanner } from '@/shared/components/impersonation-banner';
import { Sidebar } from '@/shared/components/sidebar';
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
    description: hasPetVisible ? labels.petOverviewDescription : labels.overviewDescription
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

function SearchIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { locale, setLocale } = useAppI18n();
  const messages = useAppMessages().appShell;
  const petSubnav = useAppMessages().petSubnav;
  const { branding, modules, user, workspace } = useFrontendPlatform();
  const hasPetVisible = modules.availableCodes.includes('PET');

  const moduleContext = useMemo(() => resolveModuleContext(pathname), [pathname]);
  const headerMeta = useMemo(
    () => resolveHeaderMeta(pathname, messages.header, workspace.canManagePlatformAdministration, hasPetVisible),
    [hasPetVisible, messages.header, pathname, workspace.canManagePlatformAdministration]
  );
  const nextLocale = locale === 'pt-BR' ? 'en-US' : 'pt-BR';
  const localeSwitchLabel = nextLocale === 'en-US' ? 'EN' : 'PT';
  const primaryActionHref = hasPetVisible ? '/pet/appointments' : '/settings';
  const primaryActionLabel = hasPetVisible ? petSubnav.appointments : messages.mobileSettings;
  const shellStyle = useMemo(
    () => ({
      ...branding.style
    }),
    [branding.style]
  );

  return (
    <div className="flex min-h-screen bg-slate-50" data-module={moduleContext} style={shellStyle}>
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <ImpersonationBanner tenantName={branding.scopeName} tenantCode={branding.tenantCode} />

        <nav className="sticky top-0 z-30 flex items-center gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-3 lg:hidden">
          <Link href="/" className="inline-flex shrink-0">
            <BrandMark className="h-11 w-11 rounded-2xl" imageClassName="scale-[1.08]" />
          </Link>
          <Link
            href="/dashboard"
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              pathname === '/dashboard' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {messages.mobileOverview}
          </Link>
          {hasPetVisible ? (
            <Link
              href="/pet/appointments"
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith('/pet') ? 'bg-[color:var(--accent)] text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {petSubnav.appointments}
            </Link>
          ) : null}
          <Link
            href="/settings"
            className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith('/settings') ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {messages.mobileSettings}
          </Link>
        </nav>

        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-6 py-5 lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">{branding.scopeName}</p>
                <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-slate-900">{headerMeta.label}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">{headerMeta.description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="hidden min-w-[300px] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 lg:flex">
                  <SearchIcon />
                  <span className="truncate text-sm text-slate-500">
                    {hasPetVisible ? messages.quickSearchPet : messages.quickSearchWorkspace}
                  </span>
                </div>

                <Link
                  href={primaryActionHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,var(--accent),#1d4ed8)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 transition-transform hover:-translate-y-0.5"
                >
                  <PlusIcon />
                  {primaryActionLabel}
                </Link>

                <button
                  type="button"
                  onClick={() => setLocale(nextLocale)}
                  aria-label={messages.localeButtonLabel}
                  className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                >
                  {localeSwitchLabel}
                </button>

                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {workspace.accessLabel}
                </span>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-900">
                    {getInitials(user?.fullName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{user?.fullName}</p>
                    <p className="truncate text-xs text-slate-500">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
