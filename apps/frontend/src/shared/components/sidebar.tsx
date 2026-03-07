'use client';

import { useAuth } from '@/shared/auth/use-auth';
import { usePermissions } from '@/shared/auth/usePermissions';
import { moduleService } from '@/shared/services/module-service';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const items = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tenants', label: 'Tenants', anyOf: ['TENANT_READ'] },
  { href: '/users', label: 'Users', anyOf: ['USER_READ'] },
  {
    href: '/crm',
    label: 'CRM Home',
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
    moduleCode: 'CRM'
  },
  { href: '/crm/dashboard', label: 'CRM Dashboard', anyOf: ['crm.dashboard.read'], moduleCode: 'CRM' },
  { href: '/crm/activity', label: 'CRM Activity', anyOf: ['crm.activity.read'], moduleCode: 'CRM' },
  { href: '/crm/companies', label: 'CRM Companies', anyOf: ['crm.company.read'], moduleCode: 'CRM' },
  { href: '/crm/contacts', label: 'CRM Contacts', anyOf: ['crm.contact.read'], moduleCode: 'CRM' },
  { href: '/crm/leads', label: 'CRM Leads', anyOf: ['crm.lead.read'], moduleCode: 'CRM' },
  { href: '/crm/deals', label: 'CRM Deals', anyOf: ['crm.deal.read'], moduleCode: 'CRM' },
  { href: '/crm/pipeline', label: 'CRM Pipeline', anyOf: ['crm.pipeline.read'], moduleCode: 'CRM' },
  { href: '/crm/tasks', label: 'CRM Tasks', anyOf: ['crm.task.read'], moduleCode: 'CRM' },
  { href: '/crm/notes', label: 'CRM Notes', anyOf: ['crm.note.read'], moduleCode: 'CRM' },
  { href: '/pet', label: 'Pet Home', anyOf: ['pet.client.read', 'pet.profile.read', 'pet.appointment.read'], moduleCode: 'PET' },
  { href: '/pet/clients', label: 'Pet Clients', anyOf: ['pet.client.read'], moduleCode: 'PET' },
  { href: '/pet/pets', label: 'Pet Profiles', anyOf: ['pet.profile.read'], moduleCode: 'PET' },
  { href: '/pet/appointments', label: 'Pet Appointments', anyOf: ['pet.appointment.read'], moduleCode: 'PET' },
  { href: '/iot', label: 'IoT Home', anyOf: ['iot.device.read', 'iot.alarm.read', 'iot.telemetry.read'], moduleCode: 'IOT' },
  { href: '/iot/devices', label: 'IoT Devices', anyOf: ['iot.device.read'], moduleCode: 'IOT' },
  { href: '/iot/alarms', label: 'IoT Alarms', anyOf: ['iot.alarm.read'], moduleCode: 'IOT' },
  { href: '/iot/telemetry', label: 'IoT Telemetry', anyOf: ['iot.telemetry.read'], moduleCode: 'IOT' },
  { href: '/settings', label: 'Settings' }
];

export function Sidebar() {
  const pathname = usePathname();
  const { session, signOut } = useAuth();
  const { hasAnyPermission } = usePermissions();
  const [enabledModules, setEnabledModules] = useState<Set<string> | null>(null);

  useEffect(() => {
    moduleService
      .list()
      .then((modules) => setEnabledModules(new Set(modules.filter((moduleItem) => moduleItem.enabled).map((moduleItem) => moduleItem.code))))
      .catch(() => setEnabledModules(new Set()));
  }, []);

  const visibleItems = items.filter((item) => {
    if (item.moduleCode && enabledModules === null) {
      return false;
    }
    if (item.moduleCode && enabledModules && !enabledModules.has(item.moduleCode)) {
      return false;
    }
    if (!item.anyOf || item.anyOf.length === 0) {
      return true;
    }
    return hasAnyPermission(item.anyOf);
  });

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-slate-200 bg-white/90 px-4 py-5 backdrop-blur">
      <div className="mb-8 rounded-xl bg-gradient-to-r from-ink to-action px-4 py-4 text-white shadow-card">
        <p className="text-xs uppercase tracking-wider text-blue-100">Phaiffer Platform</p>
        <p className="mt-1 text-lg font-semibold">SaaS Control Plane</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const active = item.href === '/crm' || item.href === '/pet' || item.href === '/iot'
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm transition ${
                active ? 'bg-ink text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-2 border-t border-slate-200 pt-4 text-xs text-slate-600">
        <p className="font-semibold text-slate-700">{session?.user.fullName}</p>
        <p>{session?.user.email}</p>
        <p className="uppercase">{session?.user.role}</p>
        <button
          type="button"
          onClick={signOut}
          className="mt-2 w-full rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
