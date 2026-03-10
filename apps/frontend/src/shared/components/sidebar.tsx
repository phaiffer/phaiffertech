'use client';

import { ReactNode, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/shared/auth/use-auth';
import { usePermissions } from '@/shared/auth/usePermissions';
import { useModuleCatalog } from '@/shared/modules/use-module-catalog';

type SidebarGroup = 'iot' | 'core' | 'crm' | 'pet';

type SidebarItem = {
  href: string;
  label: string;
  anyOf?: string[];
  moduleCode?: 'CRM' | 'IOT' | 'PET';
  group: SidebarGroup;
  icon: (props: { active: boolean }) => ReactNode;
};

function resolveScopeName(email?: string, tenantId?: string) {
  const normalized = `${email ?? ''} ${tenantId ?? ''}`.toLowerCase();

  if (normalized.includes('phaiffer')) {
    return 'Phaiffer Industrial';
  }

  if (normalized.includes('innotech')) {
    return 'InnoTech Solutions';
  }

  return tenantId ? `Tenant ${tenantId.slice(0, 8)}` : 'Escopo Industrial';
}

function resolveScopeSubtitle(email?: string) {
  if (!email) {
    return 'Industrial IoT';
  }

  if (email.includes('phaiffer')) {
    return 'Industrial IoT';
  }

  return 'Operação conectada';
}

function NavIcon({
  active,
  path,
  viewBox = '0 0 24 24'
}: {
  active: boolean;
  path: ReactNode;
  viewBox?: string;
}) {
  return (
    <span
      className={[
        'inline-flex h-8 w-8 items-center justify-center rounded-xl border transition',
        active
          ? 'border-cyan-400/35 bg-cyan-400/14 text-cyan-200'
          : 'border-slate-800 bg-slate-950/30 text-slate-400'
      ].join(' ')}
    >
      <svg viewBox={viewBox} className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
        {path}
      </svg>
    </span>
  );
}

const DashboardNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={
      <>
        <path d="M4 4h7v7H4zm9 0h7v7h-7zm-9 9h7v7H4zm9 3h7v4h-7z" />
      </>
    }
  />
);

const DeviceNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={
      <>
        <rect x="8" y="3" width="8" height="18" rx="2" />
        <path d="M10 7h4M10 11h4M10 15h4" />
      </>
    }
  />
);

const AlarmNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={
      <>
        <path d="m12 4-8 14h16L12 4Z" />
        <path d="M12 9v4m0 3h.01" />
      </>
    }
  />
);

const AnalysisNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={
      <>
        <path d="M4 17 10 11l3 3 7-7" />
        <path d="M15 7h5v5" />
      </>
    }
  />
);

const AddDeviceNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={
      <>
        <path d="M12 4v16M4 12h16" />
      </>
    }
  />
);

const WaveNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={
      <>
        <path d="M2 12c2.5 0 2.5-6 5-6s2.5 12 5 12 2.5-12 5-12 2.5 6 5 6" />
      </>
    }
  />
);

const RegistersNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={
      <>
        <path d="M6 5h12M6 12h12M6 19h12" />
        <path d="M4 5h.01M4 12h.01M4 19h.01" />
      </>
    }
  />
);

const ToolNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={
      <>
        <path d="M14 7a4 4 0 1 1-5 5L4 17l3 3 5-5a4 4 0 0 1 5-5l-3 3" />
      </>
    }
  />
);

const UserNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={
      <>
        <path d="M8 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M2 21a6 6 0 0 1 12 0M14 21a5 5 0 0 1 8 0" />
      </>
    }
    viewBox="0 0 24 24"
  />
);

const SettingsNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={
      <>
        <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5Z" />
        <path d="m19.4 15 .8 1.3-1.5 2.5-1.5-.3a7.5 7.5 0 0 1-1.5.9l-.4 1.5H10.7l-.4-1.5a7.5 7.5 0 0 1-1.5-.9l-1.5.3-1.5-2.5.8-1.3a7.7 7.7 0 0 1 0-1.8l-.8-1.3 1.5-2.5 1.5.3a7.5 7.5 0 0 1 1.5-.9l.4-1.5h2.9l.4 1.5a7.5 7.5 0 0 1 1.5.9l1.5-.3 1.5 2.5-.8 1.3a7.7 7.7 0 0 1 0 1.8Z" />
      </>
    }
  />
);

const ClipboardNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={
      <>
        <path d="M9 4h6" />
        <path d="M9 7h6" />
        <path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
        <path d="M9 3h6v3H9z" />
      </>
    }
  />
);

const NoteNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={
      <>
        <path d="M7 4h7l3 3v13H7z" />
        <path d="M14 4v4h4" />
        <path d="M10 12h4M10 16h4" />
      </>
    }
  />
);

const CalendarNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={
      <>
        <rect x="4" y="6" width="16" height="14" rx="2" />
        <path d="M8 3v6M16 3v6M4 10h16" />
      </>
    }
  />
);

const HeartbeatNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={
      <>
        <path d="M3 12h4l2-3 3 6 2-3h7" />
      </>
    }
  />
);

const crmOverviewPermissions = [
  'crm.dashboard.read',
  'crm.company.read',
  'crm.contact.read',
  'crm.lead.read',
  'crm.deal.read',
  'crm.pipeline.read',
  'crm.task.read',
  'crm.note.read',
  'crm.activity.read'
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
  'pet.invoice.read'
];

const items: SidebarItem[] = [
  {
    href: '/iot/dashboard',
    label: 'Dashboard',
    anyOf: ['iot.dashboard.read'],
    moduleCode: 'IOT',
    group: 'iot',
    icon: DashboardNavIcon
  },
  {
    href: '/iot/alarms',
    label: 'Alarmes',
    anyOf: ['iot.alarm.read'],
    moduleCode: 'IOT',
    group: 'iot',
    icon: AlarmNavIcon
  },
  {
    href: '/iot/observability',
    label: 'Observabilidade',
    anyOf: ['iot.report.read'],
    moduleCode: 'IOT',
    group: 'iot',
    icon: AnalysisNavIcon
  },
  {
    href: '/iot/devices',
    label: 'Dispositivos',
    anyOf: ['iot.device.read'],
    moduleCode: 'IOT',
    group: 'iot',
    icon: DeviceNavIcon
  },
  {
    href: '/iot/add-device',
    label: 'Cadastro Modbus',
    anyOf: ['iot.device.create'],
    moduleCode: 'IOT',
    group: 'iot',
    icon: AddDeviceNavIcon
  },
  {
    href: '/iot/telemetry',
    label: 'Telemetria',
    anyOf: ['iot.telemetry.read'],
    moduleCode: 'IOT',
    group: 'iot',
    icon: WaveNavIcon
  },
  {
    href: '/iot/registers',
    label: 'Registradores',
    anyOf: ['iot.register.read'],
    moduleCode: 'IOT',
    group: 'iot',
    icon: RegistersNavIcon
  },
  {
    href: '/iot/maintenance',
    label: 'Manutenção',
    anyOf: ['iot.maintenance.read'],
    moduleCode: 'IOT',
    group: 'iot',
    icon: ToolNavIcon
  },
  {
    href: '/dashboard',
    label: 'Dashboard Geral',
    group: 'core',
    icon: DashboardNavIcon
  },
  {
    href: '/users',
    label: 'Usuários',
    anyOf: ['USER_READ'],
    group: 'core',
    icon: UserNavIcon
  },
  {
    href: '/tenants',
    label: 'Tenants',
    anyOf: ['TENANT_READ'],
    group: 'core',
    icon: SettingsNavIcon
  },
  {
    href: '/settings',
    label: 'Settings',
    group: 'core',
    icon: SettingsNavIcon
  },
  {
    href: '/crm',
    label: 'Central CRM',
    anyOf: crmOverviewPermissions,
    moduleCode: 'CRM',
    group: 'crm',
    icon: DashboardNavIcon
  },
  {
    href: '/crm/dashboard',
    label: 'Dashboard',
    anyOf: ['crm.dashboard.read'],
    moduleCode: 'CRM',
    group: 'crm',
    icon: AnalysisNavIcon
  },
  {
    href: '/crm/tasks',
    label: 'Tasks',
    anyOf: ['crm.task.read'],
    moduleCode: 'CRM',
    group: 'crm',
    icon: ClipboardNavIcon
  },
  {
    href: '/crm/notes',
    label: 'Notes',
    anyOf: ['crm.note.read'],
    moduleCode: 'CRM',
    group: 'crm',
    icon: NoteNavIcon
  },
  {
    href: '/crm/activity',
    label: 'Activity',
    anyOf: ['crm.activity.read'],
    moduleCode: 'CRM',
    group: 'crm',
    icon: WaveNavIcon
  },
  {
    href: '/pet',
    label: 'Central Pet',
    anyOf: petOverviewPermissions,
    moduleCode: 'PET',
    group: 'pet',
    icon: DashboardNavIcon
  },
  {
    href: '/pet/dashboard',
    label: 'Dashboard',
    anyOf: ['pet.dashboard.read'],
    moduleCode: 'PET',
    group: 'pet',
    icon: AnalysisNavIcon
  },
  {
    href: '/pet/clients',
    label: 'Clients',
    anyOf: ['pet.client.read'],
    moduleCode: 'PET',
    group: 'pet',
    icon: UserNavIcon
  },
  {
    href: '/pet/appointments',
    label: 'Appointments',
    anyOf: ['pet.appointment.read'],
    moduleCode: 'PET',
    group: 'pet',
    icon: CalendarNavIcon
  },
  {
    href: '/pet/medical-records',
    label: 'Medical',
    anyOf: ['pet.medical-record.read', 'pet.vaccination.read', 'pet.prescription.read'],
    moduleCode: 'PET',
    group: 'pet',
    icon: HeartbeatNavIcon
  }
];

const groupOrder: SidebarGroup[] = ['iot', 'core', 'crm', 'pet'];

const groupMeta: Record<SidebarGroup, { title: string }> = {
  iot: { title: 'IoT System' },
  core: { title: 'Plataforma' },
  crm: { title: 'CRM' },
  pet: { title: 'Pet' }
};

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { session, signOut } = useAuth();
  const { hasAnyPermission } = usePermissions();
  const { modules, loading } = useModuleCatalog();
  const [selectedScope, setSelectedScope] = useState('current');

  const availableModules = useMemo(
    () =>
      new Set(
        modules.filter((moduleItem) => moduleItem.available).map((moduleItem) => moduleItem.code)
      ),
    [modules]
  );

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (item.moduleCode && loading) {
        return false;
      }

      if (item.moduleCode && !availableModules.has(item.moduleCode)) {
        return false;
      }

      if (!item.anyOf || item.anyOf.length === 0) {
        return true;
      }

      return hasAnyPermission(item.anyOf);
    });
  }, [availableModules, hasAnyPermission, loading]);

  const groupedItems = useMemo(
    () =>
      groupOrder
        .map((group) => ({
          key: group,
          title: groupMeta[group].title,
          items: visibleItems.filter((item) => item.group === group)
        }))
        .filter((group) => group.items.length > 0),
    [visibleItems]
  );

  const scopeName = resolveScopeName(session?.user.email, session?.user.tenantId);
  const scopeSubtitle = resolveScopeSubtitle(session?.user.email);

  return (
    <aside className="sticky top-0 flex h-screen w-[310px] flex-col border-r border-cyan-500/12 bg-[#020916]/96 px-4 py-5">
      <div className="rounded-[28px] border border-cyan-500/16 bg-[linear-gradient(180deg,rgba(7,20,38,0.95),rgba(4,12,25,0.9))] p-4 shadow-[0_18px_60px_rgba(2,6,18,0.55)]">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-500/22 bg-cyan-500/8 text-cyan-200">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 5h5v5H5zm9-1h5v6h-5zm-9 10h6v5H5zm10 0h4v4h-4z" />
              <path d="M10 8h4m-1 6v-3" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-white">{scopeName}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
              {scopeSubtitle}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-[24px] border border-slate-800 bg-slate-950/35 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Escopo</p>
          <p className="mt-2 text-sm font-medium text-white">Empresa ativa para operação</p>
          <select
            value={selectedScope}
            onChange={(event) => setSelectedScope(event.target.value)}
            className="mt-3 w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
          >
            <option value="current">{scopeName}</option>
            <option value="multi-site">Operação Multi-site</option>
            <option value="demo">Ambiente Demo IoT</option>
          </select>
          <p className="mt-2 text-xs text-slate-500">
            O seletor está visualmente alinhado com a referência aprovada; nesta etapa ele não altera o tenant real da sessão.
          </p>
        </div>
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto pr-1">
        <div className="space-y-6">
          {groupedItems.map((group) => (
            <section key={group.key}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">
                {group.title}
              </p>
              <div className="mt-3 space-y-1.5">
                {group.items.map((item) => {
                  const active = isItemActive(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        'flex items-center gap-3 rounded-[22px] px-3 py-3 transition',
                        active
                          ? 'bg-cyan-400/10 text-white shadow-[inset_0_0_0_1px_rgba(34,211,238,0.25)]'
                          : 'text-slate-300 hover:bg-slate-900/55 hover:text-white'
                      ].join(' ')}
                    >
                      <Icon active={active} />
                      <span className="truncate text-[15px] font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>

      <div className="mt-5 rounded-[28px] border border-slate-800 bg-slate-950/40 px-4 py-4">
        <p className="truncate text-sm font-semibold text-white">{session?.user.fullName}</p>
        <p className="mt-1 truncate text-sm text-slate-400">{session?.user.email}</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {session?.user.role}
        </p>

        <button
          type="button"
          onClick={() => {
            void signOut();
          }}
          className="mt-4 w-full rounded-2xl border border-rose-500/30 bg-rose-500/8 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/14"
        >
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}
