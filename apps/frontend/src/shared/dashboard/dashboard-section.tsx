import { DashboardSection as DashboardSectionType } from '@/shared/types/dashboard';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { RecentItemsList } from '@/shared/dashboard/recent-items-list';
import { SimpleBarChart } from '@/shared/dashboard/simple-bar-chart';
import { SimpleLineChart } from '@/shared/dashboard/simple-line-chart';

type DashboardSectionProps = {
  section: DashboardSectionType;
};

export function DashboardSection({ section }: DashboardSectionProps) {
  const hasContent =
    section.cards.length > 0 ||
    section.metrics.length > 0 ||
    section.items.length > 0 ||
    section.timeSeries.length > 0;

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">{section.title}</h2>
        {section.description && (
          <p className="mt-1 text-sm text-muted">{section.description}</p>
        )}
      </div>

      {!hasContent ? (
        <EmptyStateCard
          title={section.title}
          description="Nenhum dado disponível para esta seção no tenant atual."
        />
      ) : (
        <div className="space-y-4">
          <MetricGrid cards={section.cards} columns="sm:grid-cols-2 lg:grid-cols-3" />

          <div className="grid gap-4 lg:grid-cols-2">
            {section.metrics.length > 0 && (
              <SimpleBarChart
                title={`${section.title} Metrics`}
                metrics={section.metrics}
                emptyMessage="Nenhuma métrica disponível."
              />
            )}

            {section.items.length > 0 && (
              <RecentItemsList
                title={`${section.title} Recent Items`}
                items={section.items}
                emptyMessage="Nenhum item recente disponível."
              />
            )}

            {section.timeSeries.length > 0 && (
              <SimpleLineChart
                title={`${section.title} Trend`}
                points={section.timeSeries}
                emptyMessage="Nenhum ponto temporal disponível."
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
