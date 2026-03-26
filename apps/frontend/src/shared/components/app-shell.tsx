'use client';

import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ImpersonationBanner } from '@/shared/components/impersonation-banner';
import { Sidebar } from '@/shared/components/sidebar';
import {
  appShellContentContainerClass,
  sharedEyebrowClass,
  sharedShellHeaderClass
} from '@/shared/components/public-visual-system';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';

function resolveModuleContext(pathname: string): 'core' | 'crm' | 'iot' | 'pet' {
  if (pathname.startsWith('/iot')) return 'iot';
  if (pathname.startsWith('/crm')) return 'crm';
  if (pathname.startsWith('/pet')) return 'pet';
  return 'core';
}

function resolveHeaderMeta(pathname: string, platformAdmin?: boolean) {
  if (pathname.startsWith('/iot')) {
    return {
      label: 'IoT System',
    };
  }

  if (pathname.startsWith('/crm')) {
    return {
      label: 'CRM',
    };
  }

  if (pathname.startsWith('/pet')) {
    return {
      label: 'PetFlow',
    };
  }

  if (pathname.startsWith('/tenants')) {
    return {
      label: 'Workspaces',
    };
  }

  if (pathname.startsWith('/users')) {
    return {
      label: 'Usuários',
    };
  }

  if (pathname.startsWith('/settings')) {
    return {
      label: 'Configurações',
    };
  }

  return {
    label: platformAdmin ? 'Platform' : 'Overview',
  };
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { branding, modules, workspace } = useFrontendPlatform();

  const moduleContext = useMemo(() => resolveModuleContext(pathname), [pathname]);
  const headerMeta = useMemo(
    () => resolveHeaderMeta(pathname, workspace.canManagePlatformAdministration),
    [pathname, workspace.canManagePlatformAdministration]
  );
  const shellStyle = useMemo(
    () => ({
      ...branding.style,
      backgroundImage: 'linear-gradient(180deg, var(--tenant-accent-soft), transparent 220px)'
    }),
    [branding.style]
  );

  return (
    <div className="flex min-h-screen bg-background bg-no-repeat" data-module={moduleContext} style={shellStyle}>
      <Sidebar />

      <div className="flex flex-1 flex-col min-w-0">
        <ImpersonationBanner tenantName={branding.scopeName} tenantCode={branding.tenantCode} />

        <nav className="sticky top-0 z-30 flex items-center gap-1 overflow-x-auto border-b border-border bg-surface px-3 py-2 lg:hidden">
          <Link href="/dashboard" className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${pathname === '/dashboard' ? 'bg-accent-muted text-foreground' : 'text-muted hover:bg-surface-inset hover:text-foreground'}`}>
            Overview
          </Link>
          {modules.availableCodes.includes('PET') && (
            <Link href="/pet" className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${pathname.startsWith('/pet') ? 'bg-accent-muted text-foreground' : 'text-muted hover:bg-surface-inset hover:text-foreground'}`}>
              PetFlow
            </Link>
          )}
          {modules.availableCodes.includes('CRM') && (
            <Link href="/crm" className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${pathname.startsWith('/crm') ? 'bg-accent-muted text-foreground' : 'text-muted hover:bg-surface-inset hover:text-foreground'}`}>
              CRM
            </Link>
          )}
          {modules.availableCodes.includes('IOT') && (
            <Link href="/iot" className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${pathname.startsWith('/iot') ? 'bg-accent-muted text-foreground' : 'text-muted hover:bg-surface-inset hover:text-foreground'}`}>
              IoT
            </Link>
          )}
          <Link href="/settings" className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors ${pathname.startsWith('/settings') ? 'bg-accent-muted text-foreground' : 'text-muted hover:bg-surface-inset hover:text-foreground'}`}>
            Settings
          </Link>
        </nav>

        <header className={`sticky top-0 z-20 ${sharedShellHeaderClass}`}>
          <div className={`${appShellContentContainerClass} flex items-center justify-between gap-4 px-6 py-3 lg:px-8`}>
            <div>
              <p className={`${sharedEyebrowClass} text-[11px]`}>{branding.scopeName}</p>
              <h1 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                {headerMeta.label}
              </h1>
            </div>
            <span className="inline-flex items-center rounded-full border border-[color:var(--accent)] bg-accent-muted px-3 py-1 text-xs font-medium text-foreground">
              {workspace.accessLabel}
            </span>
          </div>
        </header>

        <main className="flex-1 px-6 py-6 lg:px-8 lg:py-8">
          <div className={appShellContentContainerClass}>{children}</div>
        </main>
      </div>
    </div>
  );
}
