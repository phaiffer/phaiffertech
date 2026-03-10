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
  const hasContent = section.cards.length > 0
    || section.metrics.length > 0
    || section.items.length > 0
    || section.timeSeries.length > 0;

  return (
    <section className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5 shadow-card">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-[color:var(--app-shell-heading)]">{section.title}</h2>
        {section.description ? (
          <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">{section.description}</p>
        ) : null}
      </div>

      {!hasContent ? (
        <EmptyStateCard title={section.title} description="Nenhum dado disponível para esta seção no tenant atual." />
      ) : (
        <div className="space-y-4">
          <MetricGrid cards={section.cards} columns="md:grid-cols-2 xl:grid-cols-3" />

          <div className="grid gap-4 xl:grid-cols-2">
            {section.metrics.length > 0 ? (
              <SimpleBarChart
                title={`${section.title} Metrics`}
                metrics={section.metrics}
                emptyMessage="Nenhuma métrica disponível."
              />
            ) : null}

            {section.items.length > 0 ? (
              <RecentItemsList
                title={`${section.title} Recent Items`}
                items={section.items}
                emptyMessage="Nenhum item recente disponível."
              />
            ) : null}

            {section.timeSeries.length > 0 ? (
              <SimpleLineChart
                title={`${section.title} Trend`}
                points={section.timeSeries}
                emptyMessage="Nenhum ponto temporal disponível."
              />
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
