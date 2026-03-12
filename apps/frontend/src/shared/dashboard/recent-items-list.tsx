'use client';

import Link from 'next/link';
import {
  sharedCompactTextClass,
  sharedMutedSurfaceClass,
  sharedPanelSurfaceClass,
  sharedSectionHeadingClass
} from '@/shared/components/public-visual-system';
import { DashboardListItem } from '@/shared/types/dashboard';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import {
  workspaceMutedSurfaceStyle,
  workspacePanelSurfaceStyle
} from '@/shared/modules/module-workspace-visual';

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
    <div className={`${sharedPanelSurfaceClass} p-5`} style={workspacePanelSurfaceStyle}>
      <h3 className={sharedSectionHeadingClass}>{title}</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const content = (
            <div
              className={`${sharedMutedSurfaceClass} px-4 py-3 transition-all duration-200 hover:border-accent hover:shadow-sm`}
              style={workspaceMutedSurfaceStyle}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  {item.sublabel ? <p className={`mt-1 ${sharedCompactTextClass}`}>{item.sublabel}</p> : null}
                </div>
                <StatusBadge status={item.status} />
              </div>
              {item.timestamp ? (
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted">
                  {formatDateTime(item.timestamp)}
                </p>
              ) : null}
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
