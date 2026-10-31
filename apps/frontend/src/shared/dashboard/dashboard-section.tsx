'use client';

import { DashboardSection as DashboardSectionType } from '@/shared/types/dashboard';
import {
  sharedPanelSurfaceClass,
  sharedSectionHeadingClass
} from '@/shared/components/public-visual-system';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { RecentItemsList } from '@/shared/dashboard/recent-items-list';
import { SimpleBarChart } from '@/shared/dashboard/simple-bar-chart';
import { SimpleLineChart } from '@/shared/dashboard/simple-line-chart';
import { workspacePanelSurfaceStyle } from '@/shared/modules/module-workspace-visual';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';

type DashboardSectionProps = {
  section: DashboardSectionType;
};

export function DashboardSection({ section }: DashboardSectionProps) {
  const copy = useAppMessages().screens.shell;
  const hasContent =
    section.cards.length > 0 ||
    section.metrics.length > 0 ||
    section.items.length > 0 ||
    section.timeSeries.length > 0;

  return (
    <section className={`${sharedPanelSurfaceClass} p-5`} style={workspacePanelSurfaceStyle}>
      <div className="mb-4">
        <h2 className={sharedSectionHeadingClass}>{section.title}</h2>
        {section.description && (
          <p className="mt-1 text-sm leading-6 text-slate-700">{section.description}</p>
        )}
      </div>

      {!hasContent ? (
        <EmptyStateCard
          title={section.title}
          description={copy.sectionEmpty}
        />
      ) : (
        <div className="space-y-4">
          <MetricGrid cards={section.cards} columns="sm:grid-cols-2 lg:grid-cols-3" />

          <div className="grid gap-4 lg:grid-cols-2">
            {section.metrics.length > 0 && (
              <SimpleBarChart
                title={`${section.title} · Metricas`}
                metrics={section.metrics}
                emptyMessage={copy.noMetrics}
              />
            )}

            {section.items.length > 0 && (
              <RecentItemsList
                title={`${section.title} · Itens recentes`}
                items={section.items}
                emptyMessage={copy.noRecentItems}
              />
            )}

            {section.timeSeries.length > 0 && (
              <SimpleLineChart
                title={`${section.title} · Tendencia`}
                points={section.timeSeries}
                emptyMessage={copy.noTimeSeries}
              />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
