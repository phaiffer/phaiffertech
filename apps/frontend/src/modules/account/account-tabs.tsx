'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/shared/auth/use-auth';
import { usePermissions } from '@/shared/auth/usePermissions';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';

export function AccountTabs() {
  const copy = useAppMessages().screens.accountTabs;
  const pathname = usePathname();
  const { session } = useAuth();
  const { hasPermission } = usePermissions();
  const items = [
    { href: '/settings', label: copy.workspace, visible: true },
    { href: '/users', label: copy.users, visible: hasPermission('USER_READ') },
    { href: '/tenants', label: copy.platform, visible: Boolean(session?.user.platformAdmin) && hasPermission('TENANT_READ') }
  ].filter((item) => item.visible);

  return (
    <nav aria-label={copy.label} className="flex gap-4 overflow-x-auto overflow-y-hidden border-b border-[color:var(--line)]">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`-mb-px whitespace-nowrap border-b-2 py-2 text-sm ${
              active
                ? 'border-[color:var(--ink)] font-medium text-[var(--ink)]'
                : 'border-transparent text-[var(--ink-2)] hover:text-[var(--ink)]'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
