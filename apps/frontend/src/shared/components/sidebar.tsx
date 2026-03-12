'use client';

/* eslint-disable @next/next/no-img-element */

import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/shared/auth/use-auth';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { groupSidebarItems, SidebarGroup, filterSidebarItems } from '@/shared/platform/sidebar-navigation';

type SidebarItem = {
  href: string;
  label: string;
  anyOf?: string[];
  moduleCode?: 'CRM' | 'IOT' | 'PET';
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
  { href: '/dashboard', label: 'Overview', group: 'core', icon: IconGrid },
  { href: '/users', label: 'Usuários', anyOf: ['USER_READ'], group: 'core', icon: IconUsers },
  { href: '/tenants', label: 'Tenants', anyOf: ['TENANT_READ'], group: 'core', platformOnly: true, icon: IconBuilding },
  { href: '/settings', label: 'Configurações', group: 'core', icon: IconSettings },
  
  // IoT
  { href: '/iot/dashboard', label: 'Dashboard', anyOf: ['iot.dashboard.read'], moduleCode: 'IOT', group: 'iot', icon: IconGrid },
  { href: '/iot/alarms', label: 'Alarmes', anyOf: ['iot.alarm.read'], moduleCode: 'IOT', group: 'iot', icon: IconBell },
  { href: '/iot/observability', label: 'Observabilidade', anyOf: ['iot.report.read'], moduleCode: 'IOT', group: 'iot', icon: IconChart },
  { href: '/iot/devices', label: 'Dispositivos', anyOf: ['iot.device.read'], moduleCode: 'IOT', group: 'iot', icon: IconDevice },
  { href: '/iot/add-device', label: 'Adicionar Dispositivo', anyOf: ['iot.device.create'], moduleCode: 'IOT', group: 'iot', icon: IconPlus },
  { href: '/iot/telemetry', label: 'Telemetria', anyOf: ['iot.telemetry.read'], moduleCode: 'IOT', group: 'iot', icon: IconWave },
  { href: '/iot/registers', label: 'Registros', anyOf: ['iot.register.read'], moduleCode: 'IOT', group: 'iot', icon: IconList },
  { href: '/iot/maintenance', label: 'Manutenção', anyOf: ['iot.maintenance.read'], moduleCode: 'IOT', group: 'iot', icon: IconTool },
  
  // CRM
  { href: '/crm', label: 'Hub CRM', anyOf: crmOverviewPermissions, moduleCode: 'CRM', group: 'crm', icon: IconGrid },
  { href: '/crm/dashboard', label: 'Dashboard', anyOf: ['crm.dashboard.read'], moduleCode: 'CRM', group: 'crm', icon: IconChart },
  { href: '/crm/tasks', label: 'Tarefas', anyOf: ['crm.task.read'], moduleCode: 'CRM', group: 'crm', icon: IconClipboard },
  { href: '/crm/notes', label: 'Notas', anyOf: ['crm.note.read'], moduleCode: 'CRM', group: 'crm', icon: IconNote },
  { href: '/crm/activity', label: 'Atividades', anyOf: ['crm.activity.read'], moduleCode: 'CRM', group: 'crm', icon: IconWave },
  
  // PetFlow
  { href: '/pet', label: 'Hub Pet', anyOf: petOverviewPermissions, moduleCode: 'PET', group: 'pet', icon: IconGrid },
  { href: '/pet/dashboard', label: 'Dashboard', anyOf: ['pet.dashboard.read'], moduleCode: 'PET', group: 'pet', icon: IconChart },
  { href: '/pet/clients', label: 'Clientes', anyOf: ['pet.client.read'], moduleCode: 'PET', group: 'pet', icon: IconUsers },
  { href: '/pet/appointments', label: 'Agendamentos', anyOf: ['pet.appointment.read'], moduleCode: 'PET', group: 'pet', icon: IconCalendar },
  { href: '/pet/medical-records', label: 'Prontuários', anyOf: ['pet.medical-record.read', 'pet.vaccination.read', 'pet.prescription.read'], moduleCode: 'PET', group: 'pet', icon: IconHeart },
];

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

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-white/10 glass-surface">
      {/* Brand Header */}
      <div className="border-b border-white/10 px-4 py-6 flex flex-col items-center justify-center gap-3">
        <img
          src="/PhaifferTech_logo.png"
          alt="Phaiffer Tech"
          className="h-8 w-auto object-contain drop-shadow-[0_0_10px_rgba(0,180,216,0.5)]"
        />
        <div className="w-full rounded bg-white/5 py-1 text-center border border-white/10">
          <p className="truncate text-xs font-semibold text-accent tracking-widest uppercase">{branding.scopeName}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {groupedItems.map((group) => (
            <div key={group.key}>
              <p className="mb-2 px-2 text-2xs font-semibold uppercase tracking-wider text-muted">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isItemActive(pathname, item.href);
                  const Icon = item.icon;

                  const getNeonClass = (code?: string) => {
                    if (code === 'IOT') return 'text-[color:var(--accent-iot)] drop-shadow-[0_0_8px_var(--accent-iot)]';
                    if (code === 'PET') return 'text-[color:var(--accent-pet)] drop-shadow-[0_0_8px_var(--accent-pet)]';
                    if (code === 'CRM') return 'text-[color:var(--accent-crm)] drop-shadow-[0_0_8px_var(--accent-crm)]';
                    return 'text-[color:var(--accent-core)] drop-shadow-[0_0_8px_var(--accent-core)]';
                  };

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-all duration-300 ${
                        active
                          ? 'bg-white/10 text-foreground font-medium border border-white/5'
                          : 'text-muted hover:bg-white/5 hover:text-foreground'
                      }`}
                    >
                      <Icon className={`h-4 w-4 flex-shrink-0 transition-all duration-300 ${active ? getNeonClass(item.moduleCode) : 'group-hover:' + getNeonClass(item.moduleCode)}`} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-border p-4">
        <div className="mb-3">
          <p className="truncate text-sm font-medium text-foreground">{user?.fullName}</p>
          <p className="truncate text-2xs text-muted">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted shadow-xs transition-colors hover:border-destructive hover:bg-destructive-muted hover:text-destructive hover:shadow-sm"
        >
          <IconLogout className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
