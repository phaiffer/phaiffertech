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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold text-ink">{formatValue(card.value)}</p>
        </div>
        <StatusBadge status={card.status} />
      </div>
      {card.trend ? <p className="mt-4 text-sm text-slate-500">{card.trend}</p> : <div className="mt-4 h-[20px]" />}
    </>
  );
}

export function SummaryCard({ card }: SummaryCardProps) {
  const className = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-action hover:shadow-md';

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
