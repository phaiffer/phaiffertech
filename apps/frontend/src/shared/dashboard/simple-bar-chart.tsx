import { DashboardCountMetric } from '@/shared/types/dashboard';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';

type SimpleBarChartProps = {
  title: string;
  metrics: DashboardCountMetric[];
  emptyMessage: string;
};

function formatValue(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function SimpleBarChart({ title, metrics, emptyMessage }: SimpleBarChartProps) {
  if (metrics.length === 0) {
    return <EmptyStateCard title={title} description={emptyMessage} />;
  }

  const maxValue = Math.max(...metrics.map((metric) => metric.value), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 space-y-3">
        {metrics.map((metric) => (
          <div key={metric.key}>
            <div className="mb-1 flex items-center justify-between text-sm text-slate-600">
              <span>{metric.label}</span>
              <span className="font-semibold text-slate-900">{formatValue(metric.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-action to-accent"
                style={{ width: `${Math.max((metric.value / maxValue) * 100, 6)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
