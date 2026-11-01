'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '@/shared/auth/use-auth';
import { petCommercialNavigationPermissions } from '@/shared/auth/pet-commercial-permissions';
import {
  petClinicalEntitlements,
  petRetailEntitlements,
  petSubmoduleEntitlements
} from '@/shared/entitlements/tenant-entitlements';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import {
  filterSidebarItems,
  banhoTosaOnlyPlanCodes,
  petClinicNavigationPlanCodes,
  petCommercialNavigationPlanCodes,
  petPosNavigationPlanCodes
} from '@/shared/platform/sidebar-navigation';

type SidebarSection = 'operation' | 'registry' | 'management' | 'support';

type SidebarItem = {
  href: string;
  label: string;
  anyOf?: string[];
  anyEntitlements?: readonly string[];
  allowedPlanCodes?: readonly string[];
  blockedPlanCodes?: readonly string[];
  moduleCode?: 'PET';
  section: SidebarSection;
};

type SidebarProps = {
  /** Below 900px the sidebar is a drawer; AppShell owns its open state. */
  mobileOpen?: boolean;
  /** Called when a link is followed or the drawer is closed. */
  onNavigate?: () => void;
};

function isItemActive(pathname: string, href: string) {
  if (href === '/dashboard' && pathname === '/pet/dashboard') {
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name?: string | null) {
  if (!name) return 'PT';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

// Comanda v2 sidebar: light, labelled, grouped as Operação / Cadastros / Gestão.
// Visibility rules (module, permission, entitlement, plan) are unchanged and still
// resolved by filterSidebarItems.
export function Sidebar({ mobileOpen = false, onNavigate }: SidebarProps) {
  const copy = useAppMessages().screens.shell;
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { locale, setLocale } = useAppI18n();
  const shellMessages = useAppMessages().sidebar;
  const petMessages = useAppMessages().petSubnav;
  const { branding, modules, user, workspace } = useFrontendPlatform();

  const items = useMemo<SidebarItem[]>(
    () => [
      {
        href: '/dashboard',
        label: shellMessages.overview,
        anyOf: ['pet.dashboard.read', 'pet.appointment.read', 'pet.invoice.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        section: 'operation',
      },
      {
        href: '/pet/appointments',
        label: petMessages.appointments,
        anyOf: ['pet.appointment.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        section: 'operation',
      },
      {
        href: '/pet/pos',
        label: petMessages.pos,
        anyOf: ['pet.product.read', 'pet.invoice.write'],
        anyEntitlements: petRetailEntitlements,
        allowedPlanCodes: petPosNavigationPlanCodes,
        blockedPlanCodes: banhoTosaOnlyPlanCodes,
        moduleCode: 'PET',
        section: 'operation',
      },
      {
        href: '/pet/follow-up',
        label: petMessages.followUp,
        anyOf: ['crm.task.read', 'crm.note.read', 'crm.activity.read'],
        anyEntitlements: petSubmoduleEntitlements,
        allowedPlanCodes: petCommercialNavigationPlanCodes,
        blockedPlanCodes: banhoTosaOnlyPlanCodes,
        moduleCode: 'PET',
        section: 'operation',
      },
      {
        href: '/pet/clients',
        label: petMessages.clients,
        anyOf: ['pet.client.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        section: 'registry',
      },
      {
        href: '/pet/pets',
        label: petMessages.pets,
        anyOf: ['pet.profile.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        section: 'registry',
      },
      {
        href: '/pet/services',
        label: petMessages.services,
        anyOf: ['pet.service.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        section: 'registry',
      },
      {
        href: '/pet/plans',
        label: petMessages.plans,
        anyOf: ['pet.plan.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        section: 'registry',
      },
      {
        href: '/pet/inventory',
        label: petMessages.inventory,
        anyOf: ['pet.product.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        section: 'management',
      },
      {
        href: '/pet/finance',
        label: petMessages.finance,
        anyOf: ['finance.read', 'pet.invoice.read'],
        anyEntitlements: petSubmoduleEntitlements,
        blockedPlanCodes: banhoTosaOnlyPlanCodes,
        moduleCode: 'PET',
        section: 'management',
      },
      {
        href: '/pet/invoices',
        label: petMessages.invoices,
        anyOf: ['pet.invoice.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        section: 'management',
      },
      {
        href: '/pet/professionals',
        label: petMessages.professionals,
        anyOf: ['pet.professional.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        section: 'management',
      },
      {
        href: '/pet/commissions',
        label: petMessages.commissions,
        anyOf: ['pet.appointment.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        section: 'management',
      },
      {
        href: '/pet/clinic',
        label: petMessages.clinic,
        anyOf: ['pet.medical-record.read'],
        anyEntitlements: petClinicalEntitlements,
        allowedPlanCodes: petClinicNavigationPlanCodes,
        blockedPlanCodes: banhoTosaOnlyPlanCodes,
        moduleCode: 'PET',
        section: 'management',
      },
      {
        href: '/pet/commercial',
        label: petMessages.commercial,
        anyOf: [...petCommercialNavigationPermissions],
        anyEntitlements: petSubmoduleEntitlements,
        allowedPlanCodes: petCommercialNavigationPlanCodes,
        blockedPlanCodes: banhoTosaOnlyPlanCodes,
        moduleCode: 'PET',
        section: 'management',
      },
      {
        href: '/settings',
        label: shellMessages.settings,
        section: 'support',
      },
    ],
    [
      petMessages.appointments,
      petMessages.clients,
      petMessages.clinic,
      petMessages.commissions,
      petMessages.commercial,
      petMessages.pos,
      petMessages.finance,
      petMessages.followUp,
      petMessages.invoices,
      petMessages.inventory,
      petMessages.pets,
      petMessages.plans,
      petMessages.professionals,
      petMessages.services,
      shellMessages.overview,
      shellMessages.settings,
    ]
  );

  const filterableItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        group: item.section === 'support' ? ('core' as const) : ('pet' as const),
      })),
    [items]
  );

  const visibleIds = useMemo(() => {
    const filtered = filterSidebarItems(filterableItems, {
      user,
      modules: { availableCodes: modules.availableCodes, loading: modules.loading },
      workspace: {
        canManagePlatformAdministration: workspace.canManagePlatformAdministration,
        hasFullPlatformVisibility: workspace.hasFullPlatformVisibility
      },
    });
    return new Set(filtered.map((i) => i.href));
  }, [
    filterableItems,
    modules.availableCodes,
    modules.loading,
    user,
    workspace.canManagePlatformAdministration,
    workspace.hasFullPlatformVisibility
  ]);

  const visibleItems = (section: SidebarSection) =>
    items.filter((item) => item.section === section && visibleIds.has(item.href));

  const sections: Array<{ key: SidebarSection; title: string }> = [
    { key: 'operation', title: copy.groupOperation },
    { key: 'registry', title: copy.groupRegistry },
    { key: 'management', title: copy.groupManagement },
  ];
  const supportItems = visibleItems('support');
  const workspaceName = branding.scopeName || user?.tenantName || shellMessages.petWorkspace;

  return (
    <aside
      id="app-sidebar"
      aria-label={copy.mainNavigation}
      className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-3.5 overflow-y-auto border-r border-[color:var(--line)] bg-[var(--bg-subtle)] px-2.5 py-3 transition-transform duration-200 nav:sticky nav:top-0 nav:z-auto nav:h-screen nav:w-[220px] nav:shrink-0 nav:translate-x-0 nav:visible ${
        mobileOpen ? 'translate-x-0' : 'invisible -translate-x-full'
      }`}
    >
      <div className="flex min-h-11 items-center gap-2.5 px-2">
        <span
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] bg-[var(--ink)] text-[11px] font-semibold text-[var(--bg)]"
          aria-hidden="true"
        >
          {getInitials(workspaceName)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate font-semibold text-[var(--ink)]">{workspaceName}</span>
          <span className="truncate text-xs text-[var(--muted)]">{shellMessages.petWorkspace}</span>
        </span>
        <button
          type="button"
          onClick={onNavigate}
          aria-label={copy.closeMenu}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--selected)] hover:text-[var(--ink)] nav:hidden"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <nav className="flex flex-col gap-3.5" aria-label={copy.mainNavigation}>
        {sections.map((section) => (
          <SidebarGroup
            key={section.key}
            title={section.title}
            items={visibleItems(section.key)}
            pathname={pathname}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-px border-t border-[color:var(--line)] pt-2.5">
        {supportItems.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
        ))}
        <button
          type="button"
          onClick={() => setLocale(locale === 'pt-BR' ? 'en-US' : 'pt-BR')}
          aria-label={copy.language}
          className="flex min-h-9 items-center justify-between rounded-md px-2.5 text-left text-[var(--ink-2)] hover:bg-[var(--selected)]"
        >
          <span>{copy.language}</span>
          <span className="ui-mono text-xs text-[var(--muted)]">{locale === 'pt-BR' ? 'PT-BR' : 'EN-US'}</span>
        </button>
        <div className="flex min-h-9 items-center gap-2 px-2.5">
          <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--muted)]" title={user?.email ?? undefined}>
            {user?.fullName ?? user?.email}
          </span>
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label={copy.signOut}
            title={copy.signOut}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--selected)] hover:text-[var(--ink)]"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarGroup({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: SidebarItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-px">
      <span className="px-2.5 pb-1 text-xs text-[var(--muted)]">{title}</span>
      {items.map((item) => (
        <SidebarLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
      ))}
    </div>
  );
}

function SidebarLink({
  item,
  pathname,
  onNavigate,
}: {
  item: SidebarItem;
  pathname: string;
  onNavigate?: () => void;
}) {
  const active = isItemActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-9 items-center rounded-md px-2.5 ${
        active
          ? 'bg-[var(--selected-strong)] font-semibold text-[var(--ink)]'
          : 'text-[var(--ink-2)] hover:bg-[var(--selected)] hover:text-[var(--ink)]'
      }`}
    >
      <span className="truncate">{item.label}</span>
    </Link>
  );
}
