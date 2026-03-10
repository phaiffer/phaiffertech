'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/shared/components/sidebar';
import { useAuth } from '@/shared/auth/use-auth';
import {
  AppThemeMode,
  buildTenantBrandingStyle,
  getTenantScopeName,
  getTenantWorkspaceLabel,
  toAppThemeMode
} from '@/shared/lib/tenant-branding';

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

function themeLabel(mode: AppThemeMode) {
  if (mode === 'light') {
    return 'Light';
  }

  if (mode === 'dark') {
    return 'Dark';
  }

  return 'System';
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { session } = useAuth();
  const user = session?.user;
  const [themeMode, setThemeMode] = useState<AppThemeMode>('system');

  const brandingStyle = useMemo(() => buildTenantBrandingStyle(user), [user]);
  const tenantDefaultTheme = toAppThemeMode(user?.tenantDefaultThemeMode);
  const canOverrideTheme = user?.tenantAllowUserThemeOverride ?? true;

  useEffect(() => {
    if (!user) {
      return;
    }

    const savedTheme = window.localStorage.getItem('app-shell-theme');
    const hasSavedOverride = savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system';

    if (canOverrideTheme && hasSavedOverride) {
      setThemeMode(savedTheme);
      return;
    }

    setThemeMode(tenantDefaultTheme);
  }, [canOverrideTheme, tenantDefaultTheme, user]);

  useEffect(() => {
    const root = document.documentElement;
    const media = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : {
          matches: false,
          addEventListener: () => undefined,
          removeEventListener: () => undefined
        };

    const applyTheme = () => {
      root.dataset.theme = themeMode === 'system' ? (media.matches ? 'dark' : 'light') : themeMode;
    };

    applyTheme();

    if (canOverrideTheme) {
      window.localStorage.setItem('app-shell-theme', themeMode);
    } else {
      window.localStorage.removeItem('app-shell-theme');
    }

    if (themeMode !== 'system') {
      return undefined;
    }

    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [canOverrideTheme, themeMode]);

  const headerMeta = resolveHeaderMeta(pathname, user?.platformAdmin);

  return (
    <div className="min-h-screen text-[color:var(--app-shell-text)]" style={brandingStyle}>
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
                  {getTenantScopeName(user)}
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
                    {getTenantWorkspaceLabel(user)}
                  </span>
                  {user?.tenantCode ? (
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1"
                      style={{
                        borderColor: 'var(--app-shell-border)',
                        backgroundColor: 'var(--app-shell-panel-muted)',
                        color: 'var(--app-shell-muted)'
                      }}
                    >
                      {user.tenantCode}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                {canOverrideTheme ? (
                  <div
                    className="inline-flex rounded-full border p-1"
                    style={{
                      borderColor: 'var(--app-shell-border)',
                      backgroundColor: 'var(--app-shell-panel-muted)'
                    }}
                  >
                    {(['dark', 'light', 'system'] as AppThemeMode[]).map((option) => (
                      <ShellToggle
                        key={option}
                        label={option === 'dark' ? 'Dark' : option === 'light' ? 'Light' : 'System'}
                        active={themeMode === option}
                        onClick={() => setThemeMode(option)}
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
                    Theme managed by tenant: <span className="font-semibold text-[color:var(--app-shell-heading)]">{themeLabel(tenantDefaultTheme)}</span>
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
