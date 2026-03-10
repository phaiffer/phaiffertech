import type { DashboardContextCard } from '@/shared/dashboard/contextual-dashboard';

type DashboardContextCardGridProps = {
  cards: DashboardContextCard[];
};

const toneClassMap = {
  accent: 'text-[color:var(--tenant-accent)]',
  primary: 'text-[color:var(--tenant-primary)]',
  neutral: 'text-[color:var(--app-shell-heading)]'
};

export function DashboardContextCardGrid({ cards }: DashboardContextCardGridProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.key}
          className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">
            {card.label}
          </p>
          <p className={`mt-3 text-2xl font-semibold ${toneClassMap[card.tone ?? 'neutral']}`}>
            {card.value}
          </p>
          <p className="mt-3 text-sm text-[color:var(--app-shell-muted)]">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
