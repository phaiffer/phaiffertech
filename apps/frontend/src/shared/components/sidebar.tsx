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
  icon: (props: { active: boolean }) => ReactNode;
};

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
          ? 'border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] text-[color:var(--app-shell-heading)]'
          : 'border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] text-[color:var(--app-shell-muted)]'
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
    path={<path d="M4 4h7v7H4zm9 0h7v7h-7zm-9 9h7v7H4zm9 3h7v4h-7z" />}
  />
);

const DeviceNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={(
      <>
        <rect x="8" y="3" width="8" height="18" rx="2" />
        <path d="M10 7h4M10 11h4M10 15h4" />
      </>
    )}
  />
);

const AlarmNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={(
      <>
        <path d="m12 4-8 14h16L12 4Z" />
        <path d="M12 9v4m0 3h.01" />
      </>
    )}
  />
);

const AnalysisNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={(
      <>
        <path d="M4 17 10 11l3 3 7-7" />
        <path d="M15 7h5v5" />
      </>
    )}
  />
);

const AddDeviceNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon active={active} path={<path d="M12 4v16M4 12h16" />} />
);

const WaveNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={<path d="M2 12c2.5 0 2.5-6 5-6s2.5 12 5 12 2.5-12 5-12 2.5 6 5 6" />}
  />
);

const RegistersNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={(
      <>
        <path d="M6 5h12M6 12h12M6 19h12" />
        <path d="M4 5h.01M4 12h.01M4 19h.01" />
      </>
    )}
  />
);

const ToolNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon active={active} path={<path d="M14 7a4 4 0 1 1-5 5L4 17l3 3 5-5a4 4 0 0 1 5-5l-3 3" />} />
);

const UserNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    viewBox="0 0 24 24"
    path={(
      <>
        <path d="M8 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8 2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M2 21a6 6 0 0 1 12 0M14 21a5 5 0 0 1 8 0" />
      </>
    )}
  />
);

const SettingsNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={(
      <>
        <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5Z" />
        <path d="m19.4 15 .8 1.3-1.5 2.5-1.5-.3a7.5 7.5 0 0 1-1.5.9l-.4 1.5H10.7l-.4-1.5a7.5 7.5 0 0 1-1.5-.9l-1.5.3-1.5-2.5.8-1.3a7.7 7.7 0 0 1 0-1.8l-.8-1.3 1.5-2.5 1.5.3a7.5 7.5 0 0 1 1.5-.9l.4-1.5h2.9l.4 1.5a7.5 7.5 0 0 1 1.5.9l1.5-.3 1.5 2.5-.8 1.3a7.7 7.7 0 0 1 0 1.8Z" />
      </>
    )}
  />
);

const ClipboardNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={(
      <>
        <path d="M9 4h6" />
        <path d="M9 7h6" />
        <path d="M8 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
        <path d="M9 3h6v3H9z" />
      </>
    )}
  />
);

const NoteNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={(
      <>
        <path d="M7 4h7l3 3v13H7z" />
        <path d="M14 4v4h4" />
        <path d="M10 12h4M10 16h4" />
      </>
    )}
  />
);

const CalendarNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon
    active={active}
    path={(
      <>
        <rect x="4" y="6" width="16" height="14" rx="2" />
        <path d="M8 3v6M16 3v6M4 10h16" />
      </>
    )}
  />
);

const HeartbeatNavIcon = ({ active }: { active: boolean }) => (
  <NavIcon active={active} path={<path d="M3 12h4l2-3 3 6 2-3h7" />} />
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
    href: '/dashboard',
    label: 'Overview',
    group: 'core',
    icon: DashboardNavIcon
  },
  {
    href: '/users',
    label: 'Users',
    anyOf: ['USER_READ'],
    group: 'core',
    icon: UserNavIcon
  },
  {
    href: '/tenants',
    label: 'Tenants',
    anyOf: ['TENANT_READ'],
    group: 'core',
    platformOnly: true,
    icon: SettingsNavIcon
  },
  {
    href: '/settings',
    label: 'Settings',
    group: 'core',
    icon: SettingsNavIcon
  },
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
    label: 'Alarms',
    anyOf: ['iot.alarm.read'],
    moduleCode: 'IOT',
    group: 'iot',
    icon: AlarmNavIcon
  },
  {
    href: '/iot/observability',
    label: 'Observability',
    anyOf: ['iot.report.read'],
    moduleCode: 'IOT',
    group: 'iot',
    icon: AnalysisNavIcon
  },
  {
    href: '/iot/devices',
    label: 'Devices',
    anyOf: ['iot.device.read'],
    moduleCode: 'IOT',
    group: 'iot',
    icon: DeviceNavIcon
  },
  {
    href: '/iot/add-device',
    label: 'Modbus registration',
    anyOf: ['iot.device.create'],
    moduleCode: 'IOT',
    group: 'iot',
    icon: AddDeviceNavIcon
  },
  {
    href: '/iot/telemetry',
    label: 'Telemetry',
    anyOf: ['iot.telemetry.read'],
    moduleCode: 'IOT',
    group: 'iot',
    icon: WaveNavIcon
  },
  {
    href: '/iot/registers',
    label: 'Registers',
    anyOf: ['iot.register.read'],
    moduleCode: 'IOT',
    group: 'iot',
    icon: RegistersNavIcon
  },
  {
    href: '/iot/maintenance',
    label: 'Maintenance',
    anyOf: ['iot.maintenance.read'],
    moduleCode: 'IOT',
    group: 'iot',
    icon: ToolNavIcon
  },
  {
    href: '/crm',
    label: 'CRM hub',
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
    label: 'Pet hub',
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

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function monogram(name?: string) {
  if (!name) {
    return 'PT';
  }

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { branding, modules, user, workspace } = useFrontendPlatform();

  const visibleItems = useMemo(() => {
    return filterSidebarItems(items, {
      user,
      modules: {
        availableCodes: modules.availableCodes,
        loading: modules.loading
      },
      workspace: {
        canManagePlatformAdministration: workspace.canManagePlatformAdministration
      }
    });
  }, [modules.availableCodes, modules.loading, user, workspace.canManagePlatformAdministration]);

  const groupedItems = useMemo(
    () => groupSidebarItems(visibleItems, workspace.canManagePlatformAdministration),
    [visibleItems, workspace.canManagePlatformAdministration]
  );

  return (
    <aside
      className="sticky top-0 flex h-screen w-[320px] flex-col border-r px-4 py-5"
      style={{
        borderColor: 'var(--app-shell-border)',
        backgroundColor: 'var(--app-shell-panel-strong)'
      }}
    >
      <div
        className="rounded-[28px] border p-4 shadow-card"
        style={{
          borderColor: 'var(--app-shell-border)',
          background:
            'linear-gradient(180deg, var(--app-shell-panel) 0%, var(--app-shell-panel-muted) 100%)'
        }}
      >
        <div className="flex items-start gap-3">
          {branding.logoUrl ? (
            <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)]">
              <img src={branding.logoUrl} alt={`${branding.scopeName} logo`} className="h-full w-full object-contain" />
            </span>
          ) : (
            <span
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-semibold uppercase"
              style={{
                borderColor: 'var(--tenant-accent)',
                backgroundColor: 'var(--tenant-accent-soft)',
                color: 'var(--app-shell-heading)'
              }}
            >
              {monogram(branding.scopeName)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-[color:var(--app-shell-heading)]">{branding.scopeName}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
              {workspace.accessLabel}
            </p>
            {branding.tenantCode ? (
              <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">Tenant code: {branding.tenantCode}</p>
            ) : null}
          </div>
        </div>

        <div
          className="mt-5 rounded-[24px] border p-4"
          style={{
            borderColor: 'var(--app-shell-border)',
            backgroundColor: 'var(--app-shell-panel)'
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">Contracted products</p>
          {modules.contractedProducts.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {modules.contractedProducts.map((moduleItem) => (
                <span
                  key={moduleItem.code}
                  className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{
                    borderColor: 'var(--tenant-accent)',
                    backgroundColor: 'var(--tenant-accent-soft)',
                    color: 'var(--app-shell-heading)'
                  }}
                >
                  {moduleItem.code}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">
              Core platform active. Additional contracted products are not visible for this user.
            </p>
          )}
        </div>
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto pr-1">
        <div className="space-y-6">
          {groupedItems.map((group, index) => (
            <section
              key={group.key}
              className={index > 0 ? 'border-t pt-6' : ''}
              style={index > 0 ? { borderColor: 'var(--app-shell-border)' } : undefined}
            >
              <p className="px-3 text-[length:var(--font-size-xs)] font-semibold uppercase tracking-[0.24em] text-[color:var(--app-shell-muted)]">
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
                          ? 'text-[color:var(--app-shell-heading)]'
                          : 'text-[color:var(--app-shell-text)] hover:text-[color:var(--app-shell-heading)]'
                      ].join(' ')}
                      style={active ? { backgroundColor: 'var(--tenant-accent-soft)' } : undefined}
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

      <div
        className="mt-5 rounded-[28px] border px-4 py-4"
        style={{
          borderColor: 'var(--app-shell-border)',
          backgroundColor: 'var(--app-shell-panel)'
        }}
      >
        <p className="truncate text-sm font-semibold text-[color:var(--app-shell-heading)]">{user?.fullName}</p>
        <p className="mt-1 truncate text-sm text-[color:var(--app-shell-muted)]">{user?.email}</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
          {workspace.canManagePlatformAdministration ? 'PLATFORM_ADMIN' : user?.role}
        </p>

        <button
          type="button"
          onClick={() => {
            void signOut();
          }}
          className="mt-4 w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition"
          style={{
            borderColor: 'var(--color-danger)',
            backgroundColor: 'var(--color-danger-soft)',
            color: 'var(--color-danger)'
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
