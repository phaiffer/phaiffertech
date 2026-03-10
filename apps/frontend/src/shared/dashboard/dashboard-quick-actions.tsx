import Link from 'next/link';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import type { DashboardQuickAction } from '@/shared/dashboard/contextual-dashboard';

type DashboardQuickActionsProps = {
  title: string;
  description: string;
  actions: DashboardQuickAction[];
};

export function DashboardQuickActions({
  title,
  description,
  actions
}: DashboardQuickActionsProps) {
  return (
    <section className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5 shadow-card">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-[color:var(--app-shell-heading)]">{title}</h2>
        <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">{description}</p>
      </div>

      {actions.length === 0 ? (
        <EmptyStateCard
          title="No quick actions available"
          description="No contextual action is currently exposed for this workspace."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {actions.map((action) => (
            <Link
              key={action.key}
              href={action.href}
              className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-5 shadow-sm transition hover:border-[color:var(--tenant-accent)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
                {action.eyebrow}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-[color:var(--app-shell-heading)]">
                {action.title}
              </h3>
              <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">{action.description}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
