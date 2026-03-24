'use client';

/* eslint-disable @next/next/no-img-element */

import { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/shared/auth/use-auth';
import {
  iotMonitorEntitlements,
  petClinicalEntitlements,
  petOperationalEntitlements,
  petSubmoduleEntitlements
} from '@/shared/entitlements/tenant-entitlements';
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

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <circle cx="17" cy="11" r="3" />
      <path d="M21 21v-1a3 3 0 0 0-3-3h-1" />
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

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4" />
      <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
    </svg>
  );
}

function IconDevice({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M9 6h6M9 10h6M9 14h4" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconWave({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 12c2-3 4-6 6-3s4 6 6 3 4-6 6-3" />
    </svg>
  );
}

function IconList({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function IconTool({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="m14.7 6.3-1.4 1.4 3 3 1.4-1.4a2.1 2.1 0 0 0 0-3 2.1 2.1 0 0 0-3 0Z" />
      <path d="m4 21 6-6" />
      <path d="m3 16 5 5" />
    </svg>
  );
}

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  );
}

function IconNote({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14,2 14,8 20,8" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconHeart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function IconBanknote({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

function IconReceipt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 2v20l3-2 2 2 3-2 3 2 2-2 3 2V2l-3 2-2-2-3 2-3-2-2 2Z" />
      <path d="M8 10h8M8 14h4" />
    </svg>
  );
}

function IconArrowLeftRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 3 4 7l4 4M4 7h16M16 21l4-4-4-4M20 17H4" />
    </svg>
  );
}

function IconBox({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
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

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6,9 12,15 18,9" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Navigation Items Configuration
   ═══════════════════════════════════════════════════════════════════════════ */

const crmOverviewPermissions = [
  'crm.dashboard.read',
  'crm.company.read',
  'crm.contact.read',
  'crm.lead.read',
  'crm.deal.read',
  'crm.pipeline.read',
  'crm.task.read',
  'crm.note.read',
  'crm.activity.read',
];

const petOverviewPermissions = [
  'pet.dashboard.read',
  'pet.client.read',
  'pet.profile.read',
  'pet.appointment.read',
  'pet.service.read',
  'pet.professional.read',
  'pet.medical-record.read',
  'pet.vaccination.read',
  'pet.prescription.read',
  'pet.product.read',
  'pet.inventory.read',
  'pet.invoice.read',
];

const items: SidebarItem[] = [
  // Platform / Workspace
  { href: '/dashboard', label: 'Overview', group: 'core', icon: IconGrid },
  { href: '/users', label: 'Usuários', anyOf: ['USER_READ'], group: 'core', icon: IconUsers },
  { href: '/tenants', label: 'Workspaces', anyOf: ['TENANT_READ'], group: 'core', platformOnly: true, icon: IconBuilding },
  { href: '/inventory', label: 'Inventory', anyOf: ['pet.inventory.read', 'iot.part.read'], group: 'core', icon: IconBox },
  { href: '/settings', label: 'Configurações', group: 'core', icon: IconSettings },

  // Finance (platform foundation)
  { href: '/finance/invoices', label: 'Faturas', anyOf: ['finance.invoice.read'], group: 'finance', icon: IconReceipt },
  { href: '/finance/payments', label: 'Pagamentos', anyOf: ['finance.payment.read'], group: 'finance', icon: IconBanknote },
  { href: '/finance/cash', label: 'Fluxo de Caixa', anyOf: ['finance.cash-movement.read'], group: 'finance', icon: IconArrowLeftRight },

  // IoT
  { href: '/iot/dashboard', label: 'Dashboard', anyOf: ['iot.dashboard.read'], anyEntitlements: iotMonitorEntitlements, moduleCode: 'IOT', group: 'iot', icon: IconGrid },
  { href: '/iot/alarms', label: 'Alarmes', anyOf: ['iot.alarm.read'], anyEntitlements: iotMonitorEntitlements, moduleCode: 'IOT', group: 'iot', icon: IconBell },
  { href: '/iot/observability', label: 'Observabilidade', anyOf: ['iot.report.read'], anyEntitlements: iotMonitorEntitlements, moduleCode: 'IOT', group: 'iot', icon: IconChart },
  { href: '/iot/devices', label: 'Dispositivos', anyOf: ['iot.device.read'], anyEntitlements: iotMonitorEntitlements, moduleCode: 'IOT', group: 'iot', icon: IconDevice },
  { href: '/iot/add-device', label: 'Adicionar Dispositivo', anyOf: ['iot.device.create'], anyEntitlements: iotMonitorEntitlements, moduleCode: 'IOT', group: 'iot', icon: IconPlus },
  { href: '/iot/telemetry', label: 'Telemetria', anyOf: ['iot.telemetry.read'], anyEntitlements: iotMonitorEntitlements, moduleCode: 'IOT', group: 'iot', icon: IconWave },
  { href: '/iot/registers', label: 'Registros', anyOf: ['iot.register.read'], anyEntitlements: iotMonitorEntitlements, moduleCode: 'IOT', group: 'iot', icon: IconList },
  { href: '/iot/maintenance', label: 'Manutenção', anyOf: ['iot.maintenance.read'], anyEntitlements: iotMonitorEntitlements, moduleCode: 'IOT', group: 'iot', icon: IconTool },
  { href: '/iot/parts', label: 'Peças', anyOf: ['iot.part.read'], anyEntitlements: iotMonitorEntitlements, moduleCode: 'IOT', group: 'iot', icon: IconClipboard },

  // CRM
  { href: '/crm', label: 'Hub CRM', anyOf: crmOverviewPermissions, moduleCode: 'CRM', group: 'crm', icon: IconGrid },
  { href: '/crm/dashboard', label: 'Dashboard', anyOf: ['crm.dashboard.read'], moduleCode: 'CRM', group: 'crm', icon: IconChart },
  { href: '/crm/tasks', label: 'Tarefas', anyOf: ['crm.task.read'], moduleCode: 'CRM', group: 'crm', icon: IconClipboard },
  { href: '/crm/notes', label: 'Notas', anyOf: ['crm.note.read'], moduleCode: 'CRM', group: 'crm', icon: IconNote },
  { href: '/crm/activity', label: 'Atividades', anyOf: ['crm.activity.read'], moduleCode: 'CRM', group: 'crm', icon: IconWave },

  // PetFlow
  { href: '/pet', label: 'PetFlow Home', anyOf: petOverviewPermissions, anyEntitlements: petSubmoduleEntitlements, moduleCode: 'PET', group: 'pet', icon: IconGrid },
  { href: '/pet/dashboard', label: 'Dashboard', anyOf: ['pet.dashboard.read'], anyEntitlements: petSubmoduleEntitlements, moduleCode: 'PET', group: 'pet', icon: IconChart },
  { href: '/pet/clients', label: 'Clients', anyOf: ['pet.client.read'], anyEntitlements: petSubmoduleEntitlements, moduleCode: 'PET', group: 'pet', icon: IconUsers },
  { href: '/pet/pets', label: 'Pets', anyOf: ['pet.profile.read'], anyEntitlements: petClinicalEntitlements, moduleCode: 'PET', group: 'pet', icon: IconHeart },
  { href: '/pet/appointments', label: 'Appointments', anyOf: ['pet.appointment.read'], anyEntitlements: petOperationalEntitlements, moduleCode: 'PET', group: 'pet', icon: IconCalendar },
  { href: '/pet/invoices', label: 'Billing', anyOf: ['pet.invoice.read'], anyEntitlements: petSubmoduleEntitlements, moduleCode: 'PET', group: 'pet', icon: IconReceipt },
  { href: '/pet/insights', label: 'Insights', anyOf: ['pet.dashboard.read'], anyEntitlements: petSubmoduleEntitlements, moduleCode: 'PET', group: 'pet', icon: IconChart },
  { href: '/pet/medical-records', label: 'Medical Records', anyOf: ['pet.medical-record.read', 'pet.vaccination.read', 'pet.prescription.read'], anyEntitlements: petClinicalEntitlements, moduleCode: 'PET', group: 'pet', icon: IconHeart },
];

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Collapsible Group Sub-component
   ═══════════════════════════════════════════════════════════════════════════ */

type SidebarCollapsibleGroupProps = {
  groupKey: string;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

function SidebarCollapsibleGroup({
  groupKey,
  title,
  isOpen,
  onToggle,
  children,
}: SidebarCollapsibleGroupProps) {
  return (
    <div>
      <button
        type="button"
        id={`sidebar-group-${groupKey}`}
        aria-expanded={isOpen}
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors hover:bg-surface-inset"
      >
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
          {title}
        </span>
        <IconChevronDown
          className={`h-3 w-3 flex-shrink-0 text-muted transition-transform duration-200 ${
            isOpen ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>
      {isOpen && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  );
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
  const { branding, modules, user, workspace } = useFrontendPlatform();

  const visibleItems = useMemo(() => {
    return filterSidebarItems(items, {
      user,
      modules: { availableCodes: modules.availableCodes, loading: modules.loading },
      workspace: { canManagePlatformAdministration: workspace.canManagePlatformAdministration },
    });
  }, [modules.availableCodes, modules.loading, user, workspace.canManagePlatformAdministration]);

  const groupedItems = useMemo(
    () => groupSidebarItems(visibleItems, workspace.canManagePlatformAdministration),
    [visibleItems, workspace.canManagePlatformAdministration]
  );

  // Determine which group contains the currently active route so it can auto-expand
  const activeGroupKey = useMemo<SidebarGroup>(() => {
    for (const group of groupedItems) {
      if (group.items.some((item) => isItemActive(pathname, item.href))) {
        return group.key as SidebarGroup;
      }
    }
    return groupedItems[0]?.key as SidebarGroup ?? 'core';
  }, [groupedItems, pathname]);

  // Accordion state: track which single group is open. Initialise to the active group.
  const [openGroup, setOpenGroup] = useState<SidebarGroup | null>(activeGroupKey);

  useEffect(() => {
    setOpenGroup(activeGroupKey);
  }, [activeGroupKey]);

  function handleToggle(key: SidebarGroup) {
    setOpenGroup((prev) => (prev === key ? null : key));
  }

  const resolveModuleAccent = (code?: string) => {
    if (code === 'IOT') return 'var(--accent-iot)';
    if (code === 'PET') return 'var(--accent-pet)';
    if (code === 'CRM') return 'var(--accent-crm)';
    if (code === 'FINANCE') return 'var(--accent-core)';
    return 'var(--accent-core)';
  };

  return (
    <aside className="sticky top-0 flex h-screen w-72 flex-col border-r border-border bg-surface">
      {/* Brand Header */}
      <div className="border-b border-border px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface-inset p-2 shadow-xs">
            <img
              src="/PhaifferTech_logo.png"
              alt="Phaiffer Tech"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">PhaifferTech</p>
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Software & Data</p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-border bg-surface-inset px-3 py-3 shadow-xs">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Workspace</p>
          <p className="mt-1 truncate text-sm font-semibold text-foreground">{branding.scopeName}</p>
          <p className="mt-1 truncate text-xs text-muted">{workspace.accessLabel}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-5">
          {groupedItems.map((group) => (
            <SidebarCollapsibleGroup
              key={group.key}
              groupKey={group.key}
              title={group.title}
              isOpen={openGroup === group.key}
              onToggle={() => handleToggle(group.key as SidebarGroup)}
            >
              {group.items.map((item) => {
                const active = isItemActive(pathname, item.href);
                const Icon = item.icon;
                const accent = resolveModuleAccent(item.moduleCode);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200 ${
                      active
                        ? 'border-border bg-[color:var(--accent-muted)] text-foreground shadow-xs'
                        : 'border-transparent text-muted hover:border-border hover:bg-surface-inset hover:text-foreground'
                    }`}
                  >
                    <span
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-surface shadow-xs transition-colors"
                      style={active ? {
                        borderColor: `color-mix(in srgb, ${accent} 24%, var(--border))`,
                        backgroundColor: `color-mix(in srgb, ${accent} 10%, var(--surface-inset))`,
                        color: accent
                      } : undefined}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </SidebarCollapsibleGroup>
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-4">
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-surface-inset px-3 py-3 shadow-xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-foreground">
            {getInitials(user?.fullName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{user?.fullName}</p>
            <p className="truncate text-[11px] text-muted">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-muted shadow-xs transition-colors hover:border-destructive hover:bg-destructive-muted hover:text-destructive hover:shadow-sm"
        >
          <IconLogout className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
