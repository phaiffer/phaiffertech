'use client';

import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Users,
  PawPrint,
  Calendar,
  ClipboardList,
  FileText,
  Package,
  CreditCard,
  UserCog,
  Banknote,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Stethoscope,
  ShoppingCart,
} from 'lucide-react';
import { useAuth } from '@/shared/auth/use-auth';
import { BrandMark, PetFlowMark } from '@/shared/components/brand-assets';
import {
  petClinicalEntitlements,
  petRetailEntitlements,
  petSubmoduleEntitlements
} from '@/shared/entitlements/tenant-entitlements';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import {
  filterSidebarItems,
  petClinicNavigationPlanCodes,
  petPosNavigationPlanCodes
} from '@/shared/platform/sidebar-navigation';
import { Avatar, AvatarFallback } from '@/shared/ui/shadcn/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/shadcn/dropdown-menu';

type SidebarItem = {
  href: string;
  label: string;
  anyOf?: string[];
  anyEntitlements?: readonly string[];
  allowedPlanCodes?: readonly string[];
  moduleCode?: 'PET';
  group: 'principal' | 'gestao' | 'suporte';
  icon: ReactNode;
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

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const shellMessages = useAppMessages().sidebar;
  const petMessages = useAppMessages().petSubnav;
  const { modules, user, workspace } = useFrontendPlatform();
  const [collapsed, setCollapsed] = useState(false);

  const items = useMemo<SidebarItem[]>(
    () => [
      {
        href: '/dashboard',
        label: shellMessages.overview,
        anyOf: ['pet.dashboard.read', 'pet.appointment.read', 'pet.invoice.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        group: 'principal',
        icon: <LayoutGrid className="h-4 w-4" />,
      },
      {
        href: '/pet/clients',
        label: petMessages.clients,
        anyOf: ['pet.client.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        group: 'principal',
        icon: <Users className="h-4 w-4" />,
      },
      {
        href: '/pet/pets',
        label: petMessages.pets,
        anyOf: ['pet.profile.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        group: 'principal',
        icon: <PawPrint className="h-4 w-4" />,
      },
      {
        href: '/pet/appointments',
        label: petMessages.appointments,
        anyOf: ['pet.appointment.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        group: 'principal',
        icon: <Calendar className="h-4 w-4" />,
      },
      {
        href: '/pet/follow-up',
        label: petMessages.followUp,
        anyOf: ['crm.task.read', 'crm.note.read', 'crm.activity.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        group: 'principal',
        icon: <ClipboardList className="h-4 w-4" />,
      },
      {
        href: '/pet/clinic',
        label: petMessages.clinic,
        anyOf: ['pet.medical-record.read'],
        anyEntitlements: petClinicalEntitlements,
        allowedPlanCodes: petClinicNavigationPlanCodes,
        moduleCode: 'PET',
        group: 'principal',
        icon: <Stethoscope className="h-4 w-4" />,
      },
      {
        href: '/pet/pos',
        label: petMessages.pos,
        anyOf: ['pet.product.read', 'pet.invoice.write'],
        anyEntitlements: petRetailEntitlements,
        allowedPlanCodes: petPosNavigationPlanCodes,
        moduleCode: 'PET',
        group: 'principal',
        icon: <ShoppingCart className="h-4 w-4" />,
      },
      {
        href: '/pet/finance',
        label: petMessages.finance,
        anyOf: ['finance.read', 'pet.invoice.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        group: 'gestao',
        icon: <Banknote className="h-4 w-4" />,
      },
      {
        href: '/pet/plans',
        label: petMessages.plans,
        anyOf: ['pet.plan.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        group: 'gestao',
        icon: <FileText className="h-4 w-4" />,
      },
      {
        href: '/pet/inventory',
        label: petMessages.inventory,
        anyOf: ['pet.product.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        group: 'gestao',
        icon: <Package className="h-4 w-4" />,
      },
      {
        href: '/pet/invoices',
        label: petMessages.invoices,
        anyOf: ['pet.invoice.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        group: 'gestao',
        icon: <CreditCard className="h-4 w-4" />,
      },
      {
        href: '/pet/professionals',
        label: petMessages.professionals,
        anyOf: ['pet.professional.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        group: 'gestao',
        icon: <UserCog className="h-4 w-4" />,
      },
      {
        href: '/pet/commissions',
        label: 'Comissões',
        anyOf: ['pet.commission.read'],
        anyEntitlements: petSubmoduleEntitlements,
        moduleCode: 'PET',
        group: 'gestao',
        icon: <Banknote className="h-4 w-4" />,
      },
      {
        href: '/settings',
        label: shellMessages.settings,
        group: 'suporte',
        icon: <Settings className="h-4 w-4" />,
      },
    ],
    [
      petMessages.appointments,
      petMessages.clients,
      petMessages.clinic,
      petMessages.pos,
      petMessages.finance,
      petMessages.followUp,
      petMessages.invoices,
      petMessages.inventory,
      petMessages.pets,
      petMessages.plans,
      petMessages.professionals,
      shellMessages.overview,
      shellMessages.settings,
    ]
  );

  const filterableItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        group: item.group === 'suporte' ? ('core' as const) : ('pet' as const),
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

  const principalItems = items.filter((i) => i.group === 'principal' && visibleIds.has(i.href));
  const gestaoItems = items.filter((i) => i.group === 'gestao' && visibleIds.has(i.href));
  const suporteItems = items.filter((i) => i.group === 'suporte' && visibleIds.has(i.href));

  return (
    <aside
      className={`sticky top-0 hidden h-screen flex-col border-r border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,250,248,0.96)_180px,rgba(243,248,245,0.94))] shadow-[10px_0_28px_-28px_rgba(15,23,42,0.18)] transition-all duration-200 lg:flex ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/50 px-3">
        {collapsed ? (
          <div className="flex w-full items-center justify-center">
            <PetFlowMark className="h-9 w-9 shrink-0 rounded-[1rem]" />
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-2.5">
            <PetFlowMark className="h-9 w-9 shrink-0 rounded-[1rem]" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-[-0.02em] text-[var(--sidebar-foreground)]">
                PetFlow
              </p>
              <span className="mt-0.5 inline-flex items-center gap-1 truncate text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                by
                <BrandMark className="h-3 w-3 rounded-[0.35rem] p-[0.06rem]" imageClassName="scale-[1.08]" />
                PhaifferTech
              </span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-emerald-50 hover:text-slate-900 ${
            collapsed ? 'mx-auto' : ''
          }`}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <SidebarGroup
          label="Principal"
          items={principalItems}
          pathname={pathname}
          collapsed={collapsed}
        />
        <SidebarGroup
          label="Gestão"
          items={gestaoItems}
          pathname={pathname}
          collapsed={collapsed}
          className="mt-4"
        />
        {suporteItems.length > 0 && (
          <SidebarGroup
            label="Suporte"
            items={suporteItems}
            pathname={pathname}
            collapsed={collapsed}
            className="mt-4"
          />
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--sidebar-border)] p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`flex w-full items-center gap-2.5 rounded-xl border border-transparent p-2 text-left transition-colors hover:border-slate-200 hover:bg-white/80 ${
                collapsed ? 'justify-center' : ''
              }`}
            >
              <Avatar className="h-8 w-8 shrink-0 text-xs">
                <AvatarFallback className="bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--sidebar-foreground)]">
                      {user?.fullName}
                    </p>
                    <p className="truncate text-xs text-[var(--muted-foreground)]">{user?.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium text-[var(--foreground)]">{user?.fullName}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => void signOut()}
              className="cursor-pointer text-[var(--destructive)] focus:text-[var(--destructive)]"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

function SidebarGroup({
  label,
  items,
  pathname,
  collapsed,
  className = '',
}: {
  label: string;
  items: SidebarItem[];
  pathname: string;
  collapsed: boolean;
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className={className}>
      {!collapsed && (
        <p className="mb-2 px-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
          {label}
        </p>
      )}
      <div className="space-y-0.5 px-2">
        {items.map((item) => {
          const active = isItemActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-xl border px-2.5 py-2.5 text-sm transition-all ${
                active
                  ? 'border-emerald-100/90 bg-emerald-50/80 font-medium text-emerald-800 shadow-[0_12px_24px_-22px_rgba(16,185,129,0.35)]'
                  : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-white/82 hover:text-slate-900'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
