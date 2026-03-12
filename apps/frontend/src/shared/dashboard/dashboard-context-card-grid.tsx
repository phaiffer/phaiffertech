import type { DashboardContextCard } from '@/shared/dashboard/contextual-dashboard';
import {
  sharedCompactTextClass,
  sharedMutedSurfaceClass
} from '@/shared/components/public-visual-system';

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
          className={`${sharedMutedSurfaceClass} p-5`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">
            {card.label}
          </p>
          <p className={`mt-3 text-2xl font-semibold ${toneClassMap[card.tone ?? 'neutral']}`}>
            {card.value}
          </p>
          <p className={`mt-3 ${sharedCompactTextClass}`}>{card.description}</p>
        </div>
      ))}
    </div>
  );
}
