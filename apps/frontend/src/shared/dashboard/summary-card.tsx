'use client';

import Link from 'next/link';
import { DashboardSummaryCard as DashboardSummaryCardType } from '@/shared/types/dashboard';
import { StatusBadge } from '@/shared/dashboard/status-badge';

type SummaryCardProps = {
  card: DashboardSummaryCardType;
};

function formatValue(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function SummaryCardBody({ card }: SummaryCardProps) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted">{card.label}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
            {formatValue(card.value)}
          </p>
        </div>
        <StatusBadge status={card.status} />
      </div>
      {card.trend && <p className="mt-3 text-xs text-muted">{card.trend}</p>}
    </>
  );
}

export function SummaryCard({ card }: SummaryCardProps) {
  const className =
    'rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent';

  if (card.href) {
    return (
      <Link href={card.href} className={className}>
        <SummaryCardBody card={card} />
      </Link>
    );
  }

  return (
    <div className={className}>
      <SummaryCardBody card={card} />
    </div>
  );
}
