'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/shared/auth/use-auth';
import { usePermissions } from '@/shared/auth/usePermissions';
import { useModuleCatalog } from '@/shared/modules/use-module-catalog';

type SidebarGroup = 'core' | 'crm' | 'iot' | 'pet';

type SidebarItem = {
  href: string;
  label: string;
  anyOf?: string[];
  moduleCode?: 'CRM' | 'IOT' | 'PET';
  group: SidebarGroup;
};

const items: SidebarItem[] = [
  { href: '/dashboard', label: 'Dashboard', group: 'core' },
  { href: '/tenants', label: 'Tenants', anyOf: ['TENANT_READ'], group: 'core' },
  { href: '/users', label: 'Users', anyOf: ['USER_READ'], group: 'core' },
  { href: '/settings', label: 'Settings', group: 'core' },

  {
    href: '/crm',
    label: 'Overview',
    anyOf: [
      'crm.dashboard.read',
      'crm.activity.read',
      'crm.company.read',
      'crm.contact.read',
      'crm.lead.read',
      'crm.deal.read',
      'crm.pipeline.read',
      'crm.task.read',
      'crm.note.read'
    ],
    moduleCode: 'CRM',
    group: 'crm'
  },
  {
    href: '/crm/dashboard',
    label: 'Dashboard',
    anyOf: ['crm.dashboard.read'],
    moduleCode: 'CRM',
    group: 'crm'
  },
  {
    href: '/crm/activity',
    label: 'Activity',
    anyOf: ['crm.activity.read'],
    moduleCode: 'CRM',
    group: 'crm'
  },
  {
    href: '/crm/companies',
    label: 'Companies',
    anyOf: ['crm.company.read'],
    moduleCode: 'CRM',
    group: 'crm'
  },
  {
    href: '/crm/contacts',
    label: 'Contacts',
    anyOf: ['crm.contact.read'],
    moduleCode: 'CRM',
    group: 'crm'
  },
  {
    href: '/crm/leads',
    label: 'Leads',
    anyOf: ['crm.lead.read'],
    moduleCode: 'CRM',
    group: 'crm'
  },
  {
    href: '/crm/deals',
    label: 'Deals',
    anyOf: ['crm.deal.read'],
    moduleCode: 'CRM',
    group: 'crm'
  },
  {
    href: '/crm/pipeline',
    label: 'Pipeline',
    anyOf: ['crm.pipeline.read'],
    moduleCode: 'CRM',
    group: 'crm'
  },
  {
    href: '/crm/tasks',
    label: 'Tasks',
    anyOf: ['crm.task.read'],
    moduleCode: 'CRM',
    group: 'crm'
  },
  {
    href: '/crm/notes',
    label: 'Notes',
    anyOf: ['crm.note.read'],
    moduleCode: 'CRM',
    group: 'crm'
  },

  {
    href: '/iot',
    label: 'Overview',
    anyOf: [
      'iot.dashboard.read',
      'iot.device.read',
      'iot.register.read',
      'iot.telemetry.read',
      'iot.alarm.read',
      'iot.maintenance.read',
      'iot.report.read'
    ],
    moduleCode: 'IOT',
    group: 'iot'
  },
  {
    href: '/iot/dashboard',
    label: 'Dashboard',
    anyOf: ['iot.dashboard.read'],
    moduleCode: 'IOT',
    group: 'iot'
  },
  {
    href: '/iot/devices',
    label: 'Devices',
    anyOf: ['iot.device.read'],
    moduleCode: 'IOT',
    group: 'iot'
  },
  {
    href: '/iot/registers',
    label: 'Registers',
    anyOf: ['iot.register.read'],
    moduleCode: 'IOT',
    group: 'iot'
  },
  {
    href: '/iot/alarms',
    label: 'Alarms',
    anyOf: ['iot.alarm.read'],
    moduleCode: 'IOT',
    group: 'iot'
  },
  {
    href: '/iot/telemetry',
    label: 'Telemetry',
    anyOf: ['iot.telemetry.read'],
    moduleCode: 'IOT',
    group: 'iot'
  },
  {
    href: '/iot/maintenance',
    label: 'Maintenance',
    anyOf: ['iot.maintenance.read'],
    moduleCode: 'IOT',
    group: 'iot'
  },
  {
    href: '/iot/reports',
    label: 'Reports',
    anyOf: ['iot.report.read'],
    moduleCode: 'IOT',
    group: 'iot'
  },

  {
    href: '/pet',
    label: 'Overview',
    anyOf: ['pet.client.read', 'pet.profile.read', 'pet.appointment.read'],
    moduleCode: 'PET',
    group: 'pet'
  },
  {
    href: '/pet/dashboard',
    label: 'Dashboard',
    anyOf: ['pet.dashboard.read'],
    moduleCode: 'PET',
    group: 'pet'
  },
  {
    href: '/pet/clients',
    label: 'Clients',
    anyOf: ['pet.client.read'],
    moduleCode: 'PET',
    group: 'pet'
  },
  {
    href: '/pet/pets',
    label: 'Profiles',
    anyOf: ['pet.profile.read'],
    moduleCode: 'PET',
    group: 'pet'
  },
  {
    href: '/pet/services',
    label: 'Services',
    anyOf: ['pet.service.read'],
    moduleCode: 'PET',
    group: 'pet'
  },
  {
    href: '/pet/professionals',
    label: 'Professionals',
    anyOf: ['pet.professional.read'],
    moduleCode: 'PET',
    group: 'pet'
  },
  {
    href: '/pet/appointments',
    label: 'Appointments',
    anyOf: ['pet.appointment.read'],
    moduleCode: 'PET',
    group: 'pet'
  },
  {
    href: '/pet/medical-records',
    label: 'Medical Records',
    anyOf: ['pet.medical-record.read'],
    moduleCode: 'PET',
    group: 'pet'
  },
  {
    href: '/pet/products',
    label: 'Products',
    anyOf: ['pet.product.read'],
    moduleCode: 'PET',
    group: 'pet'
  },
  {
    href: '/pet/inventory',
    label: 'Inventory',
    anyOf: ['pet.inventory.read'],
    moduleCode: 'PET',
    group: 'pet'
  },
  {
    href: '/pet/invoices',
    label: 'Invoices',
    anyOf: ['pet.invoice.read'],
    moduleCode: 'PET',
    group: 'pet'
  }
];

const groupOrder: SidebarGroup[] = ['core', 'crm', 'iot', 'pet'];

const groupMeta: Record<SidebarGroup, { title: string }> = {
  core: { title: 'Core' },
  crm: { title: 'CRM' },
  iot: { title: 'IoT' },
  pet: { title: 'Pet' }
};

function isItemActive(pathname: string, href: string) {
  if (href === '/crm' || href === '/iot' || href === '/pet') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveActiveGroup(pathname: string): SidebarGroup {
  if (pathname.startsWith('/crm')) {
    return 'crm';
  }

  if (pathname.startsWith('/iot')) {
    return 'iot';
  }

  if (pathname.startsWith('/pet')) {
    return 'pet';
  }

  return 'core';
}

function Caret({ expanded }: { expanded: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        'inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold text-slate-500 transition-transform',
        expanded ? 'rotate-90' : ''
      ].join(' ')}
    >
      ▶
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { session, signOut } = useAuth();
  const { hasAnyPermission } = usePermissions();
  const { modules, loading } = useModuleCatalog();

  const [expandedGroup, setExpandedGroup] = useState<SidebarGroup>('core');

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

  const groupedItems = useMemo(() => {
    return groupOrder
      .map((groupKey) => ({
        key: groupKey,
        title: groupMeta[groupKey].title,
        items: visibleItems.filter((item) => item.group === groupKey)
      }))
      .filter((group) => group.items.length > 0);
  }, [visibleItems]);

  useEffect(() => {
    setExpandedGroup(resolveActiveGroup(pathname));
  }, [pathname]);

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white px-3 py-4">
      <div className="mb-4 rounded-2xl bg-gradient-to-r from-ink to-action px-4 py-4 text-white shadow-card">
        <p className="text-[10px] uppercase tracking-[0.18em] text-blue-100">
          Phaiffer Platform
        </p>
        <p className="mt-1 text-base font-semibold">SaaS Control Plane</p>
      </div>

      <nav className="flex-1 overflow-y-auto pr-1">
        <div className="space-y-3">
          {groupedItems.map((group) => {
            const expanded = expandedGroup === group.key;
            const groupHasActiveItem = group.items.some((item) =>
              isItemActive(pathname, item.href)
            );

            return (
              <section
                key={group.key}
                className={[
                  'rounded-2xl border p-2 transition',
                  groupHasActiveItem
                    ? 'border-slate-300 bg-slate-50'
                    : 'border-slate-200 bg-white'
                ].join(' ')}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroup((current) =>
                      current === group.key ? 'core' : group.key
                    )
                  }
                  className={[
                    'flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition',
                    groupHasActiveItem
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50'
                  ].join(' ')}
                  aria-expanded={expanded}
                  aria-controls={`sidebar-group-${group.key}`}
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {group.title}
                  </span>
                  <Caret expanded={expanded} />
                </button>

                {expanded ? (
                  <div
                    id={`sidebar-group-${group.key}`}
                    className="mt-2 space-y-1 border-t border-slate-200 pt-2"
                  >
                    {group.items.map((item) => {
                      const active = isItemActive(pathname, item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={[
                            'flex items-center rounded-xl px-3 py-2 text-sm transition',
                            active
                              ? 'bg-ink text-white shadow-sm'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          ].join(' ')}
                        >
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </nav>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600">
        <p className="truncate font-semibold text-slate-800">{session?.user.fullName}</p>
        <p className="truncate">{session?.user.email}</p>
        <p className="mt-1 uppercase text-slate-500">{session?.user.role}</p>

        <button
          type="button"
          onClick={signOut}
          className="mt-3 w-full rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}