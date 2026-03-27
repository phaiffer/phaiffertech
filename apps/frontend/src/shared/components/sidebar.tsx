'use client';

/* eslint-disable @next/next/no-img-element */

import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/shared/auth/use-auth';
import { petSubmoduleEntitlements } from '@/shared/entitlements/tenant-entitlements';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { groupSidebarItems, SidebarGroup, filterSidebarItems } from '@/shared/platform/sidebar-navigation';

type SidebarItem = {
  href: string;
  label: string;
  anyOf?: string[];
  anyEntitlements?: readonly string[];
  moduleCode?: 'CRM' | 'IOT' | 'PET' | 'FINANCE';
  group: SidebarGroup;
  platformOnly?: boolean;
  icon: (props: { className?: string }) => ReactNode;
};

/* ═══════════════════════════════════════════════════════════════════════════
   Icon Components - Minimal stroke-based icons
   ═══════════════════════════════════════════════════════════════════════════ */

function IconGrid({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Navigation Items Configuration
   ═══════════════════════════════════════════════════════════════════════════ */

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name?: string) {
  if (!name) return 'PT';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sidebar Component
   ═══════════════════════════════════════════════════════════════════════════ */

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const messages = useAppMessages().sidebar;
  const { branding, modules, user, workspace } = useFrontendPlatform();
  const items = useMemo<SidebarItem[]>(() => [
    { href: '/dashboard', label: messages.overview, group: 'core', icon: IconGrid },
    { href: '/settings', label: messages.settings, group: 'core', icon: IconSettings },
    {
      href: '/pet',
      label: messages.petFlow,
      anyOf: ['pet.dashboard.read', 'pet.client.read', 'pet.profile.read', 'pet.appointment.read', 'pet.invoice.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet',
      icon: IconGrid
    },
  ], [messages.overview, messages.petFlow, messages.settings]);

  const visibleItems = useMemo(() => {
    return filterSidebarItems(items, {
      user,
      modules: { availableCodes: modules.availableCodes, loading: modules.loading },
      workspace: { canManagePlatformAdministration: workspace.canManagePlatformAdministration },
    });
  }, [items, modules.availableCodes, modules.loading, user, workspace.canManagePlatformAdministration]);

  const groupedItems = useMemo(
    () => groupSidebarItems(visibleItems, workspace.canManagePlatformAdministration),
    [visibleItems, workspace.canManagePlatformAdministration]
  );

  return (
    <aside className="sticky top-0 hidden h-screen w-72 flex-col border-r border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] lg:flex">
      <div className="border-b border-border px-4 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[1.15rem] border border-border bg-[linear-gradient(180deg,#ffffff,#eff6ff)] p-2 shadow-sm">
            <img
              src="/PhaifferTech_logo.png"
              alt="Phaiffer Tech"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">PhaifferTech</p>
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-muted">{messages.focusLabel}</p>
          </div>
        </Link>
        <div className="mt-4 rounded-[1.3rem] border border-border bg-surface-inset p-3 shadow-xs">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{messages.workspaceLabel}</p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">{branding.scopeName}</p>
          <p className="mt-1 truncate text-xs text-muted">{workspace.accessLabel}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {groupedItems.map((group) => (
            <div key={group.key}>
              {group.key === 'core' || group.items.length > 1 ? (
                <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {group.key === 'core'
                    ? messages.workspaceLabel
                    : group.key === 'pet'
                      ? messages.petFlow
                      : group.title}
                </p>
              ) : null}
              <div className={`${group.key === 'core' || group.items.length > 1 ? 'mt-2' : ''} space-y-1`}>
                {group.items.map((item) => {
                  const active = isItemActive(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 ${
                        active
                          ? 'text-white shadow-sm'
                          : 'border-transparent text-muted hover:border-border hover:bg-surface-inset hover:text-foreground'
                      }`}
                      style={active ? {
                        background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 76%, #0f172a 24%))',
                        borderColor: 'color-mix(in srgb, var(--accent) 30%, var(--border))'
                      } : undefined}
                    >
                      <span
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[0.9rem] border border-border bg-surface shadow-xs transition-colors"
                        style={active ? {
                          borderColor: 'rgba(255,255,255,0.18)',
                          backgroundColor: 'rgba(255,255,255,0.12)',
                          color: '#ffffff'
                        } : undefined}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-border p-4">
        <div className="mb-4 rounded-[1.3rem] border border-border bg-surface p-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface-inset text-sm font-semibold text-foreground">
              {getInitials(user?.fullName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{user?.fullName}</p>
              <p className="truncate text-[11px] text-muted">{user?.email}</p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-muted shadow-xs transition-colors hover:border-destructive hover:bg-destructive-muted hover:text-destructive hover:shadow-sm"
        >
          <IconLogout className="h-4 w-4" />
          <span>{messages.signOut}</span>
        </button>
      </div>
    </aside>
  );
}
