'use client';

import { ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { ImpersonationBanner } from '@/shared/components/impersonation-banner';
import { Sidebar } from '@/shared/components/sidebar';
import {
  sharedCompactTextClass,
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
      description: 'Monitoramento operacional, telemetria, alarmes e gestão de dispositivos industriais.',
    };
  }

  if (pathname.startsWith('/crm')) {
    return {
      label: 'CRM',
      description: 'Operações comerciais, pipeline de vendas e gestão de relacionamento.',
    };
  }

  if (pathname.startsWith('/pet')) {
    return {
      label: 'PetFlow',
      description: 'Workflows clínicos e operacionais para o segmento veterinário.',
    };
  }

  if (pathname.startsWith('/tenants')) {
    return {
      label: 'Tenants',
      description: 'Administração de organizações e módulos contratados.',
    };
  }

  if (pathname.startsWith('/users')) {
    return {
      label: 'Usuários',
      description: 'Gestão de acesso, permissões e roles por tenant.',
    };
  }

  if (pathname.startsWith('/settings')) {
    return {
      label: 'Configurações',
      description: 'Preferências do workspace e configurações da plataforma.',
    };
  }

  return {
    label: platformAdmin ? 'Platform' : 'Dashboard',
    description: platformAdmin
      ? 'Visão consolidada da administração da plataforma.'
      : 'Visão geral do workspace e módulos contratados.',
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
      backgroundImage: [
        'radial-gradient(circle at top left, var(--tenant-accent-soft), transparent 22%)',
        'radial-gradient(circle at bottom right, var(--tenant-primary-soft), transparent 26%)'
      ].join(', ')
    }),
    [branding.style]
  );

  return (
    <div className="flex min-h-screen bg-background bg-no-repeat" data-module={moduleContext} style={shellStyle}>
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <ImpersonationBanner tenantName={branding.scopeName} tenantCode={branding.tenantCode} />

        {/* Header */}
        <header className={`sticky top-0 z-20 ${sharedShellHeaderClass}`}>
          <div className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-start lg:justify-between lg:px-8">
            <div>
              <p className={`${sharedEyebrowClass} text-[11px]`}>{workspace.workspaceLabel}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {headerMeta.label}
              </h1>
              <p className={`mt-2 max-w-3xl ${sharedCompactTextClass}`}>{headerMeta.description}</p>
            </div>
            <div className="w-full max-w-md rounded-2xl border border-border bg-surface px-4 py-4 shadow-xs">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">
                Active tenant
              </p>
              <p className="mt-2 text-base font-semibold text-foreground">{branding.scopeName}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-border bg-surface-inset px-3 py-1 text-xs font-medium text-[color:var(--app-shell-text)]">
                  {branding.tenantCode ? branding.tenantCode : 'platform-workspace'}
                </span>
                <span className="inline-flex items-center rounded-full border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] px-3 py-1 text-xs font-medium text-foreground">
                  {workspace.accessLabel}
                </span>
                <span className="inline-flex items-center rounded-full border border-border bg-surface-inset px-3 py-1 text-xs font-medium text-[color:var(--app-shell-text)]">
                  {modules.contractedProducts.length} contracted module{modules.contractedProducts.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 py-8 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
