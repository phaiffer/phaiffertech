'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';

function isActive(pathname: string | null, href: string) {
  if (!pathname) {
    return false;
  }

  if (href === '/pet') {
    return pathname === '/pet';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PetModuleSubnav() {
  const pathname = usePathname();
  const t = useAppMessages().petSubnav;
  const items = [
    { href: '/pet', label: t.workspace },
    { href: '/pet/dashboard', label: t.dashboard },
    { href: '/pet/clients', label: t.clients },
    { href: '/pet/pets', label: t.pets },
    { href: '/pet/appointments', label: t.appointments },
    { href: '/pet/clinic', label: t.clinic },
    { href: '/pet/pos', label: t.pos },
    { href: '/pet/plans', label: t.plans },
    { href: '/pet/inventory', label: t.inventory },
    { href: '/pet/invoices', label: t.invoices },
    { href: '/pet/professionals', label: t.professionals }
  ];

  return (
    <nav className="overflow-x-auto rounded-[calc(var(--radius-2xl)-0.1rem)] border border-slate-200 bg-white px-2 py-2 shadow-sm">
      <div className="flex min-w-max items-center gap-2">
        {items.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex h-10 items-center rounded-[1rem] px-3.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? 'text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-foreground'
              }`}
              style={active ? {
                background: 'var(--accent)'
              } : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
