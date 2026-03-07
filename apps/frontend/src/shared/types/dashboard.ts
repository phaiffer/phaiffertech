export type DashboardSummaryCard = {
  key: string;
  label: string;
  value: number;
  trend?: string | null;
  status?: string | null;
  href?: string | null;
};

export type DashboardCountMetric = {
  key: string;
  label: string;
  value: number;
};

export type DashboardListItem = {
  id: string;
  label: string;
  sublabel?: string | null;
  status?: string | null;
  timestamp?: string | null;
  href?: string | null;
};

export type DashboardTimeSeriesPoint = {
  label: string;
  value: number;
};

export type DashboardSection = {
  key: string;
  title: string;
  description?: string | null;
  cards: DashboardSummaryCard[];
  metrics: DashboardCountMetric[];
  items: DashboardListItem[];
  timeSeries: DashboardTimeSeriesPoint[];
};

export type DashboardModuleSummary = {
  moduleCode: string;
  title: string;
  description: string;
  href: string;
  summaryCards: DashboardSummaryCard[];
};
