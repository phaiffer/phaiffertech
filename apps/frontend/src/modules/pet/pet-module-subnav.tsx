'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/pet', label: 'Workspace' },
  { href: '/pet/dashboard', label: 'Dashboard' },
  { href: '/pet/appointments', label: 'Atendimentos' },
  { href: '/pet/plans', label: 'Planos' },
  { href: '/pet/inventory', label: 'Estoque' },
  { href: '/pet/invoices', label: 'Cobranca' },
  { href: '/pet/professionals', label: 'Equipe' }
];

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

  return (
    <nav className="overflow-x-auto rounded-[calc(var(--radius-2xl)-0.1rem)] border border-border bg-surface px-2 py-2 shadow-sm">
      <div className="flex min-w-max items-center gap-2">
        {items.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex h-10 items-center rounded-2xl px-3.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? 'text-white shadow-sm'
                  : 'text-muted hover:bg-surface-inset hover:text-foreground'
              }`}
              style={active ? {
                background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 76%, #0f172a 24%))'
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
