import { DashboardTimeSeriesPoint } from '@/shared/types/dashboard';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';

type SimpleLineChartProps = {
  title: string;
  points: DashboardTimeSeriesPoint[];
  emptyMessage: string;
};

function buildPoints(points: DashboardTimeSeriesPoint[]) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - (point.value / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(' ');
}

export function SimpleLineChart({ title, points, emptyMessage }: SimpleLineChartProps) {
  if (points.length === 0) {
    return <EmptyStateCard title={title} description={emptyMessage} />;
  }

  const polyline = buildPoints(points);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-4">
        <svg viewBox="0 0 100 100" className="h-40 w-full overflow-visible">
          <polyline
            fill="none"
            stroke="rgb(37 99 235)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={polyline}
          />
        </svg>
        <div className="mt-3 grid gap-2 text-xs uppercase tracking-[0.16em] text-slate-400 md:grid-cols-4">
          {points.map((point) => (
            <div key={point.label} className="rounded-xl bg-slate-50 px-3 py-2">
              <span className="block text-[11px]">{point.label}</span>
              <span className="mt-1 block text-sm font-semibold text-slate-800">{point.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
