'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/shared/components/sidebar';
import {
  APP_THEME_OPTIONS,
  getAppThemeModeLabel
} from '@/shared/lib/tenant-branding';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';

function ShellToggle({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition',
        active
          ? 'border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] text-[color:var(--app-shell-heading)]'
          : 'text-[color:var(--app-shell-muted)] hover:text-[color:var(--app-shell-heading)]'
      ].join(' ')}
    >
      {label}
    </button>
  );
}

function resolveHeaderMeta(pathname: string, platformAdmin?: boolean) {
  if (pathname.startsWith('/iot')) {
    return {
      label: 'Industrial IoT',
      description: 'Operational monitoring, telemetry, alarms and industrial device management.'
    };
  }

  if (pathname.startsWith('/crm')) {
    return {
      label: 'CRM Workspace',
      description: 'Commercial operations, relationship flow and contextual records for active products.'
    };
  }

  if (pathname.startsWith('/pet')) {
    return {
      label: 'PetFlow',
      description: 'Clinical and operational workflows connected to the tenant service scope.'
    };
  }

  if (pathname.startsWith('/tenants')) {
    return {
      label: 'Tenant Administration',
      description: 'Contracted modules, branding and experience defaults managed at platform level.'
    };
  }

  if (pathname.startsWith('/users')) {
    return {
      label: 'User Access',
      description: 'Tenant-scoped users, role assignments and controlled access to contracted products.'
    };
  }

  if (pathname.startsWith('/settings')) {
    return {
      label: 'Workspace Settings',
      description: 'Shared platform configuration, preferences and support settings.'
    };
  }

  return {
    label: platformAdmin ? 'Platform Overview' : 'Workspace Overview',
    description: platformAdmin
      ? 'Cross-platform administration with capability-driven dashboard aggregation.'
      : 'Tenant workspace shaped by contracted modules, feature flags and role permissions.'
  };
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { branding, theme, workspace } = useFrontendPlatform();

  const headerMeta = resolveHeaderMeta(pathname, workspace.canManagePlatformAdministration);

  return (
    <div className="min-h-screen text-[color:var(--app-shell-text)]" style={branding.style}>
      <div
        className="flex min-h-screen"
        style={{
          background:
            'radial-gradient(circle at top, var(--tenant-accent-soft), transparent 28%), '
            + 'radial-gradient(circle at bottom right, var(--tenant-primary-soft), transparent 34%), '
            + 'linear-gradient(180deg, var(--app-shell-bg) 0%, var(--app-shell-panel-muted) 55%, var(--app-shell-bg) 100%)'
        }}
      >
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <header
            className="sticky top-0 z-20 border-b px-6 py-4 backdrop-blur-xl lg:px-8"
            style={{
              borderColor: 'var(--app-shell-border)',
              backgroundColor: 'var(--app-shell-panel)'
            }}
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--tenant-accent)]">
                  {branding.scopeName}
                </p>
                <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:gap-4">
                  <p className="text-2xl font-semibold uppercase tracking-[0.08em] text-[color:var(--app-shell-heading)]">
                    {headerMeta.label}
                  </p>
                  <p className="text-sm text-[color:var(--app-shell-muted)]">{headerMeta.description}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-[0.16em]">
                  <span
                    className="inline-flex items-center rounded-full border px-3 py-1"
                    style={{
                      borderColor: 'var(--tenant-accent)',
                      backgroundColor: 'var(--tenant-accent-soft)',
                      color: 'var(--app-shell-heading)'
                    }}
                  >
                    {workspace.workspaceLabel}
                  </span>
                  {branding.tenantCode ? (
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1"
                      style={{
                        borderColor: 'var(--app-shell-border)',
                        backgroundColor: 'var(--app-shell-panel-muted)',
                        color: 'var(--app-shell-muted)'
                      }}
                    >
                      {branding.tenantCode}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                {theme.canOverride ? (
                  <div
                    className="inline-flex rounded-full border p-1"
                    style={{
                      borderColor: 'var(--app-shell-border)',
                      backgroundColor: 'var(--app-shell-panel-muted)'
                    }}
                  >
                    {APP_THEME_OPTIONS.map((option) => (
                      <ShellToggle
                        key={option}
                        label={getAppThemeModeLabel(option)}
                        active={theme.mode === option}
                        onClick={() => theme.setMode(option)}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="rounded-2xl border px-4 py-3 text-sm"
                    style={{
                      borderColor: 'var(--app-shell-border)',
                      backgroundColor: 'var(--app-shell-panel-muted)',
                      color: 'var(--app-shell-muted)'
                    }}
                  >
                    Theme managed by tenant:{' '}
                    <span className="font-semibold text-[color:var(--app-shell-heading)]">
                      {getAppThemeModeLabel(theme.tenantDefaultMode)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-6 pb-10 lg:px-8">
            <div className="space-y-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
