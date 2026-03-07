import { DashboardSummaryCard as DashboardSummaryCardType } from '@/shared/types/dashboard';
import { SummaryCard } from '@/shared/dashboard/summary-card';

type MetricGridProps = {
  cards: DashboardSummaryCardType[];
  columns?: string;
};

export function MetricGrid({ cards, columns = 'md:grid-cols-2 xl:grid-cols-4' }: MetricGridProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className={`grid gap-4 ${columns}`}>
      {cards.map((card) => (
        <SummaryCard key={card.key} card={card} />
      ))}
    </div>
  );
}
