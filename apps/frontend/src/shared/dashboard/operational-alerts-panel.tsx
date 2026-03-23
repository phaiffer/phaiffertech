'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiClientError } from '@/shared/lib/http';
import { notificationService } from '@/shared/services/notification-service';
import type { NotificationAlertItem, NotificationSummary } from '@/shared/types/notification';

function alertTypeClasses(type: NotificationAlertItem['type']) {
  if (type === 'ALERT') return 'border-destructive/30 bg-destructive/5 text-destructive';
  if (type === 'WARNING') return 'border-warning/30 bg-warning/5 text-warning';
  return 'border-info/30 bg-info/5 text-info';
}

function alertDotClasses(type: NotificationAlertItem['type']) {
  if (type === 'ALERT') return 'bg-destructive';
  if (type === 'WARNING') return 'bg-warning';
  return 'bg-info';
}

function AlertRow({ item }: { item: NotificationAlertItem }) {
  const content = (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${alertTypeClasses(item.type)}`}
    >
      <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${alertDotClasses(item.type)}`} />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{item.title}</p>
        <p className="mt-0.5 text-xs opacity-80">{item.description}</p>
      </div>
    </div>
  );

  return (
    <Link href={item.href} className="block">
      {content}
    </Link>
  );
}

type OperationalAlertsPanelProps = {
  className?: string;
};

export function OperationalAlertsPanel({ className = '' }: OperationalAlertsPanelProps) {
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    notificationService
      .getSummary()
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch((err) => {
        if (active && !(err instanceof ApiClientError)) {
          // Silently ignore – the panel is non-critical
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (loading || !summary || summary.items.length === 0) {
    return null;
  }

  return (
    <section className={`rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5 shadow-card ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[color:var(--app-shell-heading)]">
            Operational Alerts
          </h2>
          <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
            {summary.criticalCount > 0
              ? `${summary.criticalCount} critical signal${summary.criticalCount === 1 ? '' : 's'} need immediate attention.`
              : `${summary.totalCount} active signal${summary.totalCount === 1 ? '' : 's'} across the workspace.`}
          </p>
        </div>
        {summary.criticalCount > 0 && (
          <span className="flex-shrink-0 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
            {summary.criticalCount} critical
          </span>
        )}
      </div>
      <div className="space-y-2">
        {summary.items.map((item) => (
          <AlertRow key={item.key} item={item} />
        ))}
      </div>
    </section>
  );
}
