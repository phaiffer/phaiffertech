import {
  sharedPanelSurfaceClass,
  sharedSectionHeadingClass
} from '@/shared/components/public-visual-system';
import { DashboardCountMetric } from '@/shared/types/dashboard';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { workspacePanelSurfaceStyle } from '@/shared/modules/module-workspace-visual';

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
    <div className={`${sharedPanelSurfaceClass} p-5`} style={workspacePanelSurfaceStyle}>
      <h3 className={sharedSectionHeadingClass}>{title}</h3>
      <div className="mt-4 space-y-3">
        {metrics.map((metric) => (
          <div key={metric.key}>
            <div className="mb-2 flex items-center justify-between text-sm leading-6 text-slate-800">
              <span>{metric.label}</span>
              <span className="font-semibold text-foreground">{formatValue(metric.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-surface-inset">
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${Math.max((metric.value / maxValue) * 100, 6)}%`,
                  backgroundImage: 'linear-gradient(90deg, var(--tenant-primary), var(--tenant-accent))'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
