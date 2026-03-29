'use client';

import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/shared/auth/use-auth';
import { BrandMark } from '@/shared/components/brand-assets';
import { petSubmoduleEntitlements } from '@/shared/entitlements/tenant-entitlements';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { filterSidebarItems } from '@/shared/platform/sidebar-navigation';

type SidebarItem = {
  href: string;
  label: string;
  anyOf?: string[];
  anyEntitlements?: readonly string[];
  moduleCode?: 'PET';
  group: 'pet' | 'core';
  icon: (props: { className?: string }) => ReactNode;
};

function isItemActive(pathname: string, href: string) {
  if (href === '/dashboard' && pathname === '/pet/dashboard') {
    return true;
  }

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

function IconOverview({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="5" rx="2" />
      <rect x="13" y="10" width="8" height="11" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M16 3v4M8 3v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function IconLayers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="m12 4 8 4-8 4-8-4 8-4Z" />
      <path d="m4 12 8 4 8-4" strokeLinecap="round" />
      <path d="m4 16 8 4 8-4" strokeLinecap="round" />
    </svg>
  );
}

function IconPackage({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" strokeLinecap="round" />
    </svg>
  );
}

function IconReceipt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2Z" />
      <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M4 19c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" strokeLinecap="round" />
      <path d="M14 18c.3-1.8 1.8-3.2 3.8-3.2 1 0 1.9.3 2.7.9" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" strokeLinecap="round" />
    </svg>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M10 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m15 16 5-4-5-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 12H9" strokeLinecap="round" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const shellMessages = useAppMessages().sidebar;
  const petMessages = useAppMessages().petSubnav;
  const { branding, modules, user, workspace } = useFrontendPlatform();

  const items = useMemo<SidebarItem[]>(() => [
    {
      href: '/dashboard',
      label: shellMessages.overview,
      anyOf: ['pet.dashboard.read', 'pet.appointment.read', 'pet.invoice.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet',
      icon: IconOverview
    },
    {
      href: '/pet/appointments',
      label: petMessages.appointments,
      anyOf: ['pet.appointment.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet',
      icon: IconCalendar
    },
    {
      href: '/pet/plans',
      label: petMessages.plans,
      anyOf: ['pet.plan.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet',
      icon: IconLayers
    },
    {
      href: '/pet/inventory',
      label: petMessages.inventory,
      anyOf: ['pet.product.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet',
      icon: IconPackage
    },
    {
      href: '/pet/invoices',
      label: petMessages.invoices,
      anyOf: ['pet.invoice.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet',
      icon: IconReceipt
    },
    {
      href: '/pet/professionals',
      label: petMessages.professionals,
      anyOf: ['pet.professional.read'],
      anyEntitlements: petSubmoduleEntitlements,
      moduleCode: 'PET',
      group: 'pet',
      icon: IconUsers
    },
    {
      href: '/settings',
      label: shellMessages.settings,
      group: 'core',
      icon: IconSettings
    }
  ], [petMessages.appointments, petMessages.invoices, petMessages.inventory, petMessages.plans, petMessages.professionals, shellMessages.overview, shellMessages.settings]);

  const visibleItems = useMemo(() => {
    return filterSidebarItems(items, {
      user,
      modules: { availableCodes: modules.availableCodes, loading: modules.loading },
      workspace: { canManagePlatformAdministration: workspace.canManagePlatformAdministration }
    });
  }, [items, modules.availableCodes, modules.loading, user, workspace.canManagePlatformAdministration]);

  const primaryItems = visibleItems.filter((item) => item.group === 'pet');
  const workspaceItems = visibleItems.filter((item) => item.group === 'core');

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex h-20 items-center gap-3 border-b border-slate-200 px-6">
        <BrandMark className="h-11 w-11 shrink-0 rounded-2xl" imageClassName="scale-[1.08]" />
        <div className="min-w-0">
          <p className="truncate text-lg font-bold tracking-[-0.03em] text-slate-900">PetFlow</p>
          <p className="mt-0.5 truncate text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
            by PhaifferTech
          </p>
        </div>
      </div>

      <div className="border-b border-slate-200 px-4 py-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{shellMessages.workspaceLabel}</p>
          <p className="mt-2 truncate text-sm font-semibold text-slate-900">{branding.scopeName}</p>
          <p className="mt-1 truncate text-xs text-slate-600">{workspace.accessLabel}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{shellMessages.petFlow}</p>
          <div className="mt-3 space-y-1">
            {primaryItems.map((item) => {
              const active = isItemActive(pathname, item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[linear-gradient(135deg,var(--accent),#1d4ed8)] text-white shadow-lg shadow-blue-950/20'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${
                      active
                        ? 'border-white/15 bg-white/10 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {workspaceItems.length > 0 ? (
          <div className="mt-8">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{shellMessages.workspaceLabel}</p>
            <div className="mt-3 space-y-1">
              {workspaceItems.map((item) => {
                const active = isItemActive(pathname, item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${
                        active
                          ? 'border-white/15 bg-white/10 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-900">
              {getInitials(user?.fullName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user?.fullName}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-destructive hover:bg-destructive-muted hover:text-destructive"
        >
          <IconLogout className="h-4 w-4" />
          <span>{shellMessages.signOut}</span>
        </button>
      </div>
    </aside>
  );
}
