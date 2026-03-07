import { DashboardModuleSummary, DashboardSection } from '@/shared/types/dashboard';

export type ModuleItem = {
  code: string;
  name: string;
  description: string;
  enabled: boolean;
  moduleEnabled: boolean;
  featureFlagEnabled: boolean;
  available: boolean;
};

export type PlatformDashboardSummary = {
  coreSummary: DashboardSection;
  modules: DashboardModuleSummary[];
};
