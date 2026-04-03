import type { ModuleItem } from '@/shared/types/module';

const visibleWorkspaceModuleCodes = new Set(['CORE_PLATFORM', 'PET']);
const visibleProductModuleCodes = new Set(['PET']);
// Historical rollout keys and usage metrics can still exist in upgraded tenants.
const historicalHiddenStandaloneModuleFlagKeys = new Set(['crm.enabled', 'iot.enabled']);
const historicalHiddenUsageMetricSources = new Set(['crm', 'iot']);

function normalize(value: string | null | undefined) {
  return value?.trim().toUpperCase() ?? '';
}

function normalizeFlagKey(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

export function isVisibleWorkspaceModuleCode(moduleCode: string | null | undefined) {
  return visibleWorkspaceModuleCodes.has(normalize(moduleCode));
}

export function isVisibleProductModuleCode(moduleCode: string | null | undefined) {
  return visibleProductModuleCodes.has(normalize(moduleCode));
}

export function filterVisibleModuleCatalogItems<T extends Pick<ModuleItem, 'code'>>(modules: T[]) {
  return modules.filter((moduleItem) => isVisibleWorkspaceModuleCode(moduleItem.code));
}

export function filterVisibleWorkspaceModuleCodes(moduleCodes: string[]) {
  return moduleCodes.filter((moduleCode) => isVisibleWorkspaceModuleCode(moduleCode));
}

export function filterVisibleProductModuleCodes(moduleCodes: string[]) {
  return moduleCodes.filter((moduleCode) => isVisibleProductModuleCode(moduleCode));
}

export function isVisibleWorkspaceFeatureFlagKey(flagKey: string | null | undefined) {
  return !historicalHiddenStandaloneModuleFlagKeys.has(normalizeFlagKey(flagKey));
}

export function filterVisibleWorkspaceFeatureFlags<T extends { key: string }>(flags: T[]) {
  return flags.filter((flag) => isVisibleWorkspaceFeatureFlagKey(flag.key));
}

export function isVisibleUsageMetricSource(source: string | null | undefined) {
  return !historicalHiddenUsageMetricSources.has(normalizeFlagKey(source));
}

export function filterVisibleUsageMetrics<T extends { source: string }>(metrics: T[]) {
  return metrics.filter((metric) => isVisibleUsageMetricSource(metric.source));
}
