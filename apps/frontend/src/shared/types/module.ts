export type ModuleItem = {
  code: string;
  name: string;
  description: string;
  enabled: boolean;
  moduleEnabled: boolean;
  featureFlagEnabled: boolean;
  available: boolean;
};

export type ModuleMetric = {
  key: string;
  label: string;
  value: number;
};

export type ModuleSummary = {
  moduleCode: string;
  title: string;
  description: string;
  href: string;
  metrics: ModuleMetric[];
};

export type PlatformDashboardSummary = {
  modules: ModuleSummary[];
};
