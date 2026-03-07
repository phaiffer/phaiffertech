'use client';

import Link from 'next/link';
import { DashboardListItem } from '@/shared/types/dashboard';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { StatusBadge } from '@/shared/dashboard/status-badge';

type RecentItemsListProps = {
  title: string;
  items: DashboardListItem[];
  emptyMessage: string;
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function RecentItemsList({ title, items, emptyMessage }: RecentItemsListProps) {
  if (items.length === 0) {
    return <EmptyStateCard title={title} description={emptyMessage} />;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const content = (
            <div className="rounded-xl border border-slate-200 px-4 py-3 transition hover:border-action/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  {item.sublabel ? <p className="mt-1 text-sm text-slate-500">{item.sublabel}</p> : null}
                </div>
                <StatusBadge status={item.status} />
              </div>
              {item.timestamp ? <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">{formatDateTime(item.timestamp)}</p> : null}
            </div>
          );

          return item.href ? (
            <Link key={item.id} href={item.href}>
              {content}
            </Link>
          ) : (
            <div key={item.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
