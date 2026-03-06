'use client';

import { useAuth } from '@/shared/components/auth-provider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tenants', label: 'Tenants' },
  { href: '/users', label: 'Users' },
  { href: '/crm', label: 'CRM Home' },
  { href: '/crm/contacts', label: 'CRM Contacts' },
  { href: '/crm/leads', label: 'CRM Leads' },
  { href: '/pet', label: 'Pet' },
  { href: '/iot', label: 'IoT' },
  { href: '/settings', label: 'Settings' }
];

export function Sidebar() {
  const pathname = usePathname();
  const { session, signOut } = useAuth();

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-slate-200 bg-white/90 px-4 py-5 backdrop-blur">
      <div className="mb-8 rounded-xl bg-gradient-to-r from-ink to-action px-4 py-4 text-white shadow-card">
        <p className="text-xs uppercase tracking-wider text-blue-100">Phaiffer Platform</p>
        <p className="mt-1 text-lg font-semibold">SaaS Control Plane</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active = item.href === '/crm'
            ? pathname === '/crm'
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
