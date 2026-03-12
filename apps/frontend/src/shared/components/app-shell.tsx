'use client';

import { ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/shared/components/sidebar';
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
  const { workspace } = useFrontendPlatform();

  const moduleContext = useMemo(() => resolveModuleContext(pathname), [pathname]);
  const headerMeta = useMemo(
    () => resolveHeaderMeta(pathname, workspace.canManagePlatformAdministration),
    [pathname, workspace.canManagePlatformAdministration]
  );

  return (
    <div className="flex min-h-screen bg-background" data-module={moduleContext}>
      <Sidebar />

      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur-sm lg:px-8">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{headerMeta.label}</h1>
            <p className="mt-0.5 text-sm text-muted">{headerMeta.description}</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-6 py-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
