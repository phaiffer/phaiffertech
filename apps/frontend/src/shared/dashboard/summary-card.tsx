'use client';

import Link from 'next/link';
import {
  sharedCompactTextClass,
  sharedInteractiveSurfaceClass
} from '@/shared/components/public-visual-system';
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{card.label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">
            {formatValue(card.value)}
          </p>
        </div>
        <StatusBadge status={card.status} />
      </div>
      {card.trend ? <p className={`mt-3 ${sharedCompactTextClass}`}>{card.trend}</p> : null}
    </>
  );
}

export function SummaryCard({ card }: SummaryCardProps) {
  const className = `${sharedInteractiveSurfaceClass} p-5`;

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
