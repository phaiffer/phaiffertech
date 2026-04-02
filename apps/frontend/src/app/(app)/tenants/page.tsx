'use client';

import { CSSProperties, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { useAuth } from '@/shared/auth/use-auth';
import { usePermissions } from '@/shared/auth/usePermissions';
import {
  sharedCompactTextClass,
  sharedInputClass,
  sharedInputLabelClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { setImpersonationBackupSession } from '@/shared/lib/session';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { useModuleCatalog } from '@/shared/modules/use-module-catalog';
import { featureFlagService, TenantFeatureFlag } from '@/shared/services/feature-flag-service';
import { supportImpersonationService } from '@/shared/services/support-impersonation-service';
import {
  tenantService,
  TenantCreateInput,
  TenantFormInput,
  TenantUpdateInput,
  TenantUsageMetric
} from '@/shared/services/tenant-service';
import { PageResponse } from '@/shared/types/common';
import { TenantThemeMode } from '@/shared/types/auth';
import { DashboardSummaryCard } from '@/shared/types/dashboard';
import { Tenant } from '@/shared/types/tenant';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormTextarea } from '@/shared/ui/form-textarea';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 10;

const initialPage: PageResponse<Tenant> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

const emptyTenantForm: TenantFormInput = {
  name: '',
  code: '',
  logoUrl: '',
  primaryColor: '#0f172a',
  accentColor: '#2563eb',
  defaultThemeMode: 'SYSTEM',
  allowUserThemeOverride: true,
  contractedModules: [],
  planCode: 'PETSHOP',
  featureEntitlements: [],
  trialEndDate: '',
  initialAdminFullName: '',
  initialAdminEmail: '',
  temporaryPassword: '',
  requirePasswordChangeOnFirstAccess: true
};

/** Available commercial packages exposed to platform administrators. */
const PLAN_CODES = ['PETSHOP', 'BANHO_TOSA', 'CLINICA_VETERINARIA', 'PETSHOP_BANHO_TOSA', 'BANHO_TOSA_CLINICA'] as const;

type ProductPackageCode = typeof PLAN_CODES[number];

type PlanDetails = {
  label: string;
  description: string;
  defaultModules: string[];
  defaultEntitlements: string[];
};

const PLAN_DETAILS: Record<ProductPackageCode, PlanDetails> = {
  PETSHOP: {
    label: 'Pet retail workspace',
    description: 'Retail-led PetFlow operation for storefront sales, service add-ons, and front-desk follow-through.',
    defaultModules: ['PET'],
    defaultEntitlements: ['pet.retail']
  },
  BANHO_TOSA: {
    label: 'Bath and grooming workspace',
    description: 'Banho e Tosa flow with aesthetics routines, recurring execution, and retail support in the same contract.',
    defaultModules: ['PET'],
    defaultEntitlements: ['pet.aesthetics', 'pet.retail']
  },
  CLINICA_VETERINARIA: {
    label: 'Veterinary clinic workspace',
    description: 'Clinical care with medical context, veterinary records, and retail support visible inside the same workspace.',
    defaultModules: ['PET'],
    defaultEntitlements: ['pet.clinic', 'pet.veterinary', 'pet.retail']
  },
  PETSHOP_BANHO_TOSA: {
    label: 'Retail plus grooming workspace',
    description: 'Hybrid PetShop and Banho e Tosa contract for stores that sell products and execute grooming operations together.',
    defaultModules: ['PET'],
    defaultEntitlements: ['pet.aesthetics', 'pet.retail']
  },
  BANHO_TOSA_CLINICA: {
    label: 'Grooming plus clinic workspace',
    description: 'Combined Banho e Tosa and clinic contract with grooming execution, veterinary care, and retail continuity.',
    defaultModules: ['PET'],
    defaultEntitlements: ['pet.aesthetics', 'pet.clinic', 'pet.veterinary', 'pet.retail']
  }
};

const autofillIgnoreProps = {
  'data-lpignore': 'true',
  'data-1p-ignore': 'true'
} as const;

const tenantAdminToneStyle = {
  colorScheme: 'light',
  '--background': '#f5f8f7',
  '--foreground': '#0f172a',
  '--surface': '#ffffff',
  '--surface-elevated': '#ffffff',
  '--surface-inset': '#edf2f7',
  '--border': 'rgba(100, 116, 139, 0.24)',
  '--app-shell-panel': '#ffffff',
  '--app-shell-panel-muted': '#f8fafc',
  '--app-shell-border': 'rgba(100, 116, 139, 0.24)',
  '--app-shell-text': '#0f172a',
  '--app-shell-heading': '#0f172a',
  '--app-shell-muted': '#475569',
  '--muted': '#334155',
  '--muted-foreground': '#64748b',
  '--accent': '#0f766e',
  '--tenant-accent': '#0f766e',
  '--tenant-accent-soft': 'color-mix(in srgb, var(--tenant-accent) 12%, #ffffff 88%)',
  '--tenant-admin-soft-border': 'rgba(100, 116, 139, 0.28)',
  '--tenant-admin-section-surface': '#ffffff',
  '--tenant-admin-soft-surface': '#f8fafc',
  '--tenant-admin-detail-surface': '#ffffff',
  '--tenant-admin-tag-surface': '#f8fafc',
  '--tenant-admin-selected-border': 'color-mix(in srgb, var(--tenant-accent) 42%, rgba(15, 23, 42, 0.18))',
  '--tenant-admin-selected-surface': 'color-mix(in srgb, var(--tenant-accent) 10%, #f8fafc)',
  '--tenant-admin-contrast-chip-border': 'color-mix(in srgb, var(--tenant-accent) 26%, rgba(100, 116, 139, 0.34))',
  '--tenant-admin-contrast-chip-surface': 'color-mix(in srgb, var(--tenant-accent) 8%, #ffffff 92%)',
  '--tenant-admin-supporting-text': '#475569',
  '--tenant-admin-secondary-text': '#334155',
  '--tenant-admin-placeholder': '#64748b',
  '--success': '#166534',
  '--success-muted': 'rgba(22, 101, 52, 0.12)',
  '--warning': '#b45309',
  '--warning-muted': 'rgba(180, 83, 9, 0.12)',
  '--destructive': '#b91c1c',
  '--destructive-muted': 'rgba(185, 28, 28, 0.12)',
  '--info': '#1d4ed8',
  '--info-muted': 'rgba(29, 78, 216, 0.12)'
} as CSSProperties;

const panelCopyClass = 'text-sm leading-6 text-[color:var(--tenant-admin-supporting-text)]';
const compactPanelCopyClass = 'text-[13px] leading-5 text-[color:var(--tenant-admin-supporting-text)]';
const contrastInputClass = `${sharedInputClass} placeholder:text-[color:var(--tenant-admin-placeholder)]`;
const contrastTextareaClass = 'placeholder:text-[color:var(--tenant-admin-placeholder)]';
const sectionPanelClass =
  'ui-surface-muted space-y-4 border-[color:var(--tenant-admin-soft-border)] bg-[color:var(--tenant-admin-soft-surface)] p-4 text-[color:var(--app-shell-text)] shadow-[0_18px_30px_-28px_rgba(15,23,42,0.18)] lg:p-5';
const detailPanelClass =
  'space-y-4 rounded-[1.5rem] border border-[color:var(--tenant-admin-soft-border)] bg-[color:var(--tenant-admin-detail-surface)] px-4 py-4 text-sm text-[color:var(--app-shell-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.74)]';
const surfaceToggleClass =
  'ui-surface-panel flex items-center gap-3 border-[color:var(--tenant-admin-soft-border)] bg-[color:var(--tenant-admin-detail-surface)] px-4 py-3 text-sm text-[color:var(--app-shell-text)]';
const surfaceTogglePillClass =
  'ui-surface-panel inline-flex items-center gap-2 rounded-full border-[color:var(--tenant-admin-soft-border)] bg-[color:var(--tenant-admin-detail-surface)] px-3 py-2 text-sm text-[color:var(--app-shell-text)]';
const contractReviewCardClass =
  'rounded-2xl border border-[color:var(--tenant-admin-soft-border)] bg-[color:var(--tenant-admin-detail-surface)] p-4 shadow-[0_16px_28px_-28px_rgba(15,23,42,0.18)]';
const packageMetaClass =
  'rounded-full border border-[color:var(--tenant-admin-contrast-chip-border)] bg-[color:var(--tenant-admin-tag-surface)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--tenant-admin-secondary-text)]';
const selectedPackageBadgeClass =
  'rounded-full border border-[color:var(--tenant-admin-selected-border)] bg-[color:var(--tenant-admin-selected-surface)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--app-shell-heading)]';
const contrastChipClass =
  'inline-flex items-center rounded-full border border-[color:var(--tenant-admin-contrast-chip-border)] bg-[color:var(--tenant-admin-contrast-chip-surface)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--app-shell-heading)]';
const contrastUppercaseChipClass = `${contrastChipClass} uppercase tracking-[0.14em]`;
const contrastPillClass =
  'inline-flex items-center rounded-full border border-[color:var(--tenant-admin-contrast-chip-border)] bg-[color:var(--tenant-admin-contrast-chip-surface)] px-3 py-2 text-xs font-semibold text-[color:var(--app-shell-heading)]';
const contrastUppercasePillClass = `${contrastPillClass} uppercase tracking-[0.16em]`;
const contrastActionChipClass =
  'inline-flex items-center gap-2 rounded-full border border-[color:var(--tenant-admin-contrast-chip-border)] bg-[color:var(--tenant-admin-contrast-chip-surface)] px-3 py-2 text-xs font-semibold text-[color:var(--app-shell-heading)]';
const secondaryEyebrowClass = 'text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--tenant-admin-secondary-text)]';

function resolvePlanDetails(planCode?: string) {
  const normalizedCode = (planCode ?? 'PETSHOP').toUpperCase() as keyof typeof PLAN_DETAILS;
  return PLAN_DETAILS[normalizedCode] ?? PLAN_DETAILS.PETSHOP;
}

function resolveEffectiveModuleSelection(planCode: string | undefined, moduleOverrides: string[]) {
  return Array.from(new Set([
    ...resolvePlanDetails(planCode).defaultModules,
    ...moduleOverrides
  ]));
}

function normalizeTenantInput(form: TenantFormInput): TenantFormInput {
  const planDetails = resolvePlanDetails(form.planCode);
  const manualOverrides = Array.from(new Set(
    form.contractedModules
      .map((moduleCode) => moduleCode.trim().toUpperCase())
      .filter(Boolean)
      .filter((moduleCode) => !planDetails.defaultModules.includes(moduleCode))
  ));

  return {
    ...form,
    name: form.name.trim(),
    code: form.code.trim().toLowerCase(),
    logoUrl: form.logoUrl?.trim() ? form.logoUrl.trim() : null,
    primaryColor: form.primaryColor?.trim() ? form.primaryColor.trim() : null,
    accentColor: form.accentColor?.trim() ? form.accentColor.trim() : null,
    trialEndDate: form.trialEndDate.trim(),
    initialAdminFullName: form.initialAdminFullName.trim(),
    initialAdminEmail: form.initialAdminEmail.trim().toLowerCase(),
    requirePasswordChangeOnFirstAccess: Boolean(form.requirePasswordChangeOnFirstAccess),
    contractedModules: resolveEffectiveModuleSelection(form.planCode, manualOverrides),
    featureEntitlements: Array.from(new Set(
      (form.featureEntitlements ?? [])
        .map((featureKey) => featureKey.trim().toLowerCase())
        .filter(Boolean)
    ))
  };
}

function toTenantCreateInput(form: TenantFormInput): TenantCreateInput {
  const normalized = normalizeTenantInput(form);

  return {
    ...toTenantUpdateInput(normalized),
    trialEndDate: normalized.trialEndDate,
    initialAdminFullName: normalized.initialAdminFullName,
    initialAdminEmail: normalized.initialAdminEmail,
    temporaryPassword: normalized.temporaryPassword,
    requirePasswordChangeOnFirstAccess: normalized.requirePasswordChangeOnFirstAccess
  };
}

function toTenantUpdateInput(form: TenantFormInput): TenantUpdateInput {
  const normalized = normalizeTenantInput(form);

  return {
    name: normalized.name,
    code: normalized.code,
    logoUrl: normalized.logoUrl,
    primaryColor: normalized.primaryColor,
    accentColor: normalized.accentColor,
    defaultThemeMode: normalized.defaultThemeMode,
    allowUserThemeOverride: normalized.allowUserThemeOverride,
    contractedModules: normalized.contractedModules,
    planCode: normalized.planCode,
    featureEntitlements: normalized.featureEntitlements,
    trialEndDate: normalized.trialEndDate || null
  };
}

function themeLabel(themeMode: TenantThemeMode) {
  if (themeMode === 'LIGHT') {
    return 'Light';
  }

  if (themeMode === 'DARK') {
    return 'Dark';
  }

  return 'System';
}

function formatTokenLabel(value: string) {
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resolveFilledState(value?: string | null) {
  return value && value.length > 0 ? 'true' : 'false';
}

function resolveManualModuleOverrides(tenant: Tenant) {
  return tenant.moduleOverrides
    ?? tenant.contractedModules.filter((moduleCode) => (
      moduleCode !== 'CORE_PLATFORM'
      && !resolvePlanDetails(tenant.planCode).defaultModules.includes(moduleCode)
    ));
}

function resolveEffectiveEntitlements(tenant: Tenant) {
  if (tenant.effectiveFeatureEntitlements && tenant.effectiveFeatureEntitlements.length > 0) {
    return tenant.effectiveFeatureEntitlements;
  }

  return Array.from(new Set([
    ...resolvePlanDetails(tenant.planCode).defaultEntitlements,
    ...(tenant.featureEntitlements ?? [])
  ]));
}

export default function TenantsPage() {
  const { session, signIn } = useAuth();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { modules, loading: modulesLoading, error: modulesError } = useModuleCatalog();

  const canReadTenants = hasPermission('TENANT_READ');
  const canWriteTenants = hasPermission('TENANT_WRITE');
  const canManagePlatform = Boolean(session?.user.platformAdmin);

  const [pageData, setPageData] = useState<PageResponse<Tenant>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [form, setForm] = useState<TenantFormInput>(emptyTenantForm);
  const [featureEntitlementDraft, setFeatureEntitlementDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tenantFeatureFlags, setTenantFeatureFlags] = useState<TenantFeatureFlag[]>([]);
  const [featureFlagsLoading, setFeatureFlagsLoading] = useState(false);
  const [featureFlagsError, setFeatureFlagsError] = useState<string | null>(null);
  const [savingFeatureFlagKey, setSavingFeatureFlagKey] = useState<string | null>(null);
  const [usageMetrics, setUsageMetrics] = useState<TenantUsageMetric[]>([]);
  const [usageMetricsLoading, setUsageMetricsLoading] = useState(false);
  const [usageMetricsError, setUsageMetricsError] = useState<string | null>(null);
  const [impersonationReason, setImpersonationReason] = useState('');
  const [impersonationDurationMinutes, setImpersonationDurationMinutes] = useState(15);
  const [impersonationSubmitting, setImpersonationSubmitting] = useState(false);
  const [impersonationError, setImpersonationError] = useState<string | null>(null);
  const selectedPlanDetails = useMemo(
    () => resolvePlanDetails(form.planCode),
    [form.planCode]
  );
  const selectedManualModuleOverrides = useMemo(
    () => (form.contractedModules ?? []).filter((moduleCode) => !selectedPlanDetails.defaultModules.includes(moduleCode)),
    [form.contractedModules, selectedPlanDetails]
  );
  const effectiveSelectedModules = useMemo(
    () => resolveEffectiveModuleSelection(form.planCode, form.contractedModules),
    [form.contractedModules, form.planCode]
  );
  const effectiveSelectedEntitlements = useMemo(
    () => Array.from(new Set([
      ...selectedPlanDetails.defaultEntitlements,
      ...(form.featureEntitlements ?? [])
    ])),
    [form.featureEntitlements, selectedPlanDetails]
  );
  const usageMetricGroups = useMemo(() => {
    const groups = new Map<string, TenantUsageMetric[]>();

    usageMetrics.forEach((metric) => {
      const currentItems = groups.get(metric.metricKey) ?? [];
      currentItems.push(metric);
      groups.set(metric.metricKey, currentItems);
    });

    return Array.from(groups.entries()).map(([metricKey, items]) => ({
      metricKey,
      items
    }));
  }, [usageMetrics]);

  const moduleOptions = useMemo(
    () => modules.filter((moduleItem) => moduleItem.code !== 'CORE_PLATFORM'),
    [modules]
  );

  async function loadTenants(page = 0) {
    setLoading(true);
    try {
      const result = await tenantService.list(page, pageSize);
      setPageData(result);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canReadTenants || !canManagePlatform) {
      return;
    }

    void loadTenants();
  }, [canManagePlatform, canReadTenants]);

  useEffect(() => {
    if (!editingTenantId || !canManagePlatform || !canReadTenants) {
      setTenantFeatureFlags([]);
      setFeatureFlagsLoading(false);
      setFeatureFlagsError(null);
      setUsageMetrics([]);
      setUsageMetricsLoading(false);
      setUsageMetricsError(null);
      return;
    }

    let active = true;
    setFeatureFlagsLoading(true);
    setUsageMetricsLoading(true);

    featureFlagService
      .listForTenant(editingTenantId)
      .then((result) => {
        if (!active) {
          return;
        }
        setTenantFeatureFlags(result);
        setFeatureFlagsError(null);
      })
      .catch((err: Error) => {
        if (!active) {
          return;
        }
        setTenantFeatureFlags([]);
        setFeatureFlagsError(err.message);
      })
      .finally(() => {
        if (active) {
          setFeatureFlagsLoading(false);
        }
      });

    tenantService
      .listUsageMetrics(editingTenantId)
      .then((result) => {
        if (!active) {
          return;
        }
        setUsageMetrics(result);
        setUsageMetricsError(null);
      })
      .catch((err: Error) => {
        if (!active) {
          return;
        }
        setUsageMetrics([]);
        setUsageMetricsError(err.message);
      })
      .finally(() => {
        if (active) {
          setUsageMetricsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [canManagePlatform, canReadTenants, editingTenantId]);

  function handleEdit(tenant: Tenant) {
    setEditingTenantId(tenant.id);
    setError(null);
    setSuccess(null);
      setForm({
      name: tenant.name,
      code: tenant.code,
      logoUrl: tenant.logoUrl ?? '',
      primaryColor: tenant.primaryColor ?? '#0f172a',
      accentColor: tenant.accentColor ?? '#2563eb',
      defaultThemeMode: tenant.defaultThemeMode,
      allowUserThemeOverride: tenant.allowUserThemeOverride,
      trialEndDate: tenant.trialEndDate ?? '',
      contractedModules: tenant.moduleOverrides
        ?? tenant.contractedModules.filter((moduleCode) => (
          moduleCode !== 'CORE_PLATFORM'
          && !resolvePlanDetails(tenant.planCode).defaultModules.includes(moduleCode)
        )),
      planCode: tenant.planCode ?? 'PETSHOP',
      featureEntitlements: tenant.featureEntitlements ?? [],
      initialAdminFullName: '',
      initialAdminEmail: '',
      temporaryPassword: '',
      requirePasswordChangeOnFirstAccess: true
    });
    setFeatureEntitlementDraft('');
    setImpersonationReason('');
    setImpersonationDurationMinutes(15);
    setImpersonationError(null);
  }

  function resetForm() {
    setEditingTenantId(null);
    setForm(emptyTenantForm);
    setFeatureEntitlementDraft('');
    setError(null);
    setImpersonationReason('');
    setImpersonationDurationMinutes(15);
    setImpersonationError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canWriteTenants || !canManagePlatform) {
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      let savedTenant: Tenant;
      if (editingTenantId) {
        savedTenant = await tenantService.update(editingTenantId, toTenantUpdateInput(form));
        setSuccess(
          `Workspace ${savedTenant.name} updated. Contracted modules, package defaults, and admin overrides are now aligned.`
        );
      } else {
        savedTenant = await tenantService.create(toTenantCreateInput(form));
        setSuccess(
          `Workspace ${savedTenant.name} created with initial admin access. Share the temporary password securely before handoff.`
        );
      }
      resetForm();
      await loadTenants(pageData.page);
    } catch (err) {
      setSuccess(null);
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function toggleModule(moduleCode: string) {
    setForm((current) => ({
      ...current,
      contractedModules: current.contractedModules.includes(moduleCode)
        ? current.contractedModules.filter((code) => code !== moduleCode)
        : [...current.contractedModules, moduleCode]
    }));
  }

  function addFeatureEntitlement() {
    const normalized = featureEntitlementDraft.trim().toLowerCase();
    if (!normalized) {
      return;
    }

    setForm((current) => ({
      ...current,
      featureEntitlements: Array.from(new Set([...(current.featureEntitlements ?? []), normalized]))
    }));
    setFeatureEntitlementDraft('');
  }

  function removeFeatureEntitlement(featureKey: string) {
    setForm((current) => ({
      ...current,
      featureEntitlements: (current.featureEntitlements ?? []).filter((item) => item !== featureKey)
    }));
  }

  async function refreshFeatureFlags(tenantId: string) {
    const result = await featureFlagService.listForTenant(tenantId);
    setTenantFeatureFlags(result);
    setFeatureFlagsError(null);
  }

  async function handleFeatureFlagToggle(flagKey: string, enabled: boolean) {
    if (!editingTenantId) {
      return;
    }

    setSavingFeatureFlagKey(flagKey);
    try {
      await featureFlagService.setTenantOverride(editingTenantId, flagKey, enabled);
      await refreshFeatureFlags(editingTenantId);
      setSuccess(`Feature flag ${flagKey} override updated for ${editingTenant?.name ?? 'the selected workspace'}.`);
    } catch (err) {
      setSuccess(null);
      setFeatureFlagsError((err as Error).message);
    } finally {
      setSavingFeatureFlagKey(null);
    }
  }

  async function handleFeatureFlagReset(flagKey: string) {
    if (!editingTenantId) {
      return;
    }

    setSavingFeatureFlagKey(flagKey);
    try {
      await featureFlagService.clearTenantOverride(editingTenantId, flagKey);
      await refreshFeatureFlags(editingTenantId);
      setSuccess(`Feature flag ${flagKey} now follows the global default for ${editingTenant?.name ?? 'the selected workspace'}.`);
    } catch (err) {
      setSuccess(null);
      setFeatureFlagsError((err as Error).message);
    } finally {
      setSavingFeatureFlagKey(null);
    }
  }

  const tenants = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const editingTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === editingTenantId) ?? null,
    [editingTenantId, tenants]
  );
  const tenantSummaryCards = useMemo<DashboardSummaryCard[]>(() => {
    const tenantsInScope = tenants.length;
    const tenantsWithOverrides = tenants.filter((tenant) => resolveManualModuleOverrides(tenant).length > 0).length;
    const tenantsWithCustomEntitlements = tenants.filter((tenant) => (tenant.featureEntitlements ?? []).length > 0).length;
    const enterpriseAccessTenants = tenants.filter((tenant) => resolveEffectiveEntitlements(tenant).includes('*')).length;

    return [
      {
        key: 'tenant-count',
        label: 'Workspaces in scope',
        value: totalItems,
        trend: tenantsInScope < totalItems
          ? 'Pagination is active. Current cards summarize the full result size.'
          : 'Current platform workspace count in this view.'
      },
      {
        key: 'tenant-overrides',
        label: 'Manual module overrides',
        value: tenantsWithOverrides,
        trend: 'Workspaces extending package defaults with additional module access.'
      },
      {
        key: 'tenant-entitlements',
        label: 'Custom entitlements',
        value: tenantsWithCustomEntitlements,
        trend: 'Workspaces with extra commercial access beyond the package baseline.'
      },
      {
        key: 'tenant-enterprise',
        label: 'Full access workspaces',
        value: enterpriseAccessTenants,
        trend: 'Workspaces whose effective entitlements currently include wildcard access.'
      }
    ];
  }, [tenants, totalItems]);
  const editingTenantPlanDetails = useMemo(
    () => editingTenant ? resolvePlanDetails(editingTenant.planCode) : null,
    [editingTenant]
  );
  const editingTenantManualModuleOverrides = useMemo(
    () => editingTenant ? resolveManualModuleOverrides(editingTenant) : [],
    [editingTenant]
  );
  const editingTenantEffectiveModules = useMemo(
    () => editingTenant ? resolveEffectiveModuleSelection(editingTenant.planCode, editingTenantManualModuleOverrides) : [],
    [editingTenant, editingTenantManualModuleOverrides]
  );
  const editingTenantEffectiveEntitlements = useMemo(
    () => editingTenant ? resolveEffectiveEntitlements(editingTenant) : [],
    [editingTenant]
  );
  const usageSummaryCards = useMemo<DashboardSummaryCard[]>(() => {
    const totalQuantity = usageMetrics.reduce((sum, metric) => sum + metric.quantity, 0);
    const trackedSignals = new Set(usageMetrics.map((metric) => metric.metricKey)).size;
    const activeSources = new Set(usageMetrics.map((metric) => metric.source)).size;
    const recentDays = new Set(usageMetrics.map((metric) => metric.metricDate)).size;

    return [
      {
        key: 'usage-total-quantity',
        label: 'Observed activity',
        value: totalQuantity,
        trend: 'Aggregated quantity across the currently visible telemetry rows.'
      },
      {
        key: 'usage-signals',
        label: 'Tracked signals',
        value: trackedSignals,
        trend: 'Distinct operational metric families recorded for this workspace.'
      },
      {
        key: 'usage-sources',
        label: 'Active sources',
        value: activeSources,
        trend: 'Modules or channels currently generating usage telemetry.'
      },
      {
        key: 'usage-days',
        label: 'Observed days',
        value: recentDays,
        trend: 'Distinct days represented in the telemetry sample.'
      }
    ];
  }, [usageMetrics]);

  async function handleStartImpersonation() {
    if (!editingTenantId || !session) {
      return;
    }

    const normalizedReason = impersonationReason.trim();
    if (normalizedReason.length < 10) {
      setImpersonationError('Support impersonation requires a reason with at least 10 characters.');
      return;
    }

    setImpersonationSubmitting(true);
    setImpersonationError(null);
    setSuccess(null);
    try {
      const tokenData = await supportImpersonationService.start({
        targetTenantId: editingTenantId,
        reason: normalizedReason,
        durationMinutes: impersonationDurationMinutes
      });

      setImpersonationBackupSession(session);
      signIn({
        accessToken: tokenData.accessToken,
        user: tokenData.user
      });
      router.push('/dashboard');
    } catch (err) {
      setImpersonationError((err as Error).message);
    } finally {
      setImpersonationSubmitting(false);
    }
  }
  const columns: DataTableColumn<Tenant>[] = [
    {
      key: 'tenant',
      header: 'Workspace',
      render: (tenant) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{tenant.name}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">{tenant.code}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (tenant) => <StatusBadge status={tenant.status} />
    },
    {
      key: 'plan',
      header: 'Contract',
      render: (tenant) => (
        <div className="space-y-2">
          <span className="text-sm font-medium text-[color:var(--app-shell-heading)]">
            {tenant.planCode ?? '-'}
          </span>
          <p className={sharedCompactTextClass}>
            Package modules {resolvePlanDetails(tenant.planCode).defaultModules.length} • Manual overrides {resolveManualModuleOverrides(tenant).length}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(tenant.featureEntitlements ?? []).length > 0 ? (
              tenant.featureEntitlements?.map((featureKey) => (
                <span
                  key={`${tenant.id}-${featureKey}`}
                  className={contrastChipClass}
                >
                  {featureKey}
                </span>
              ))
            ) : (
              <span className="text-xs text-[color:var(--app-shell-muted)]">
                No custom entitlements
              </span>
            )}
          </div>
          <p className={sharedCompactTextClass}>
            Effective access {resolveEffectiveEntitlements(tenant).includes('*')
              ? 'includes wildcard access'
              : `${resolveEffectiveEntitlements(tenant).length} entitlement signal(s)`}
          </p>
        </div>
      )
    },
    {
      key: 'theme',
      header: 'Theme',
      render: (tenant) => (
        <div className="text-sm text-[color:var(--app-shell-text)]">
          <p>{themeLabel(tenant.defaultThemeMode)}</p>
          <p className="text-xs text-[color:var(--app-shell-muted)]">
            {tenant.allowUserThemeOverride ? 'User override enabled' : 'Workspace-controlled'}
          </p>
        </div>
      )
    },
    {
      key: 'branding',
      header: 'Branding',
      render: (tenant) => (
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-5 w-5 rounded-full border"
            style={{
              borderColor: 'var(--app-shell-border)',
              backgroundColor: tenant.primaryColor ?? '#0f172a'
            }}
          />
          <span
            className="inline-flex h-5 w-5 rounded-full border"
            style={{
              borderColor: 'var(--app-shell-border)',
              backgroundColor: tenant.accentColor ?? '#2563eb'
            }}
          />
          <span className="text-xs text-[color:var(--app-shell-muted)]">
            {tenant.logoUrl ? 'Logo configured' : 'No logo'}
          </span>
        </div>
      )
    },
    {
      key: 'modules',
      header: 'Effective modules',
      render: (tenant) => (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {tenant.contractedModules.map((moduleCode) => (
              <span
                key={`${tenant.id}-${moduleCode}`}
                className="inline-flex items-center rounded-full border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--app-shell-text)]"
              >
                {moduleCode}
              </span>
            ))}
          </div>
          <p className={sharedCompactTextClass}>
            {resolveManualModuleOverrides(tenant).length > 0
              ? `Manual override modules: ${resolveManualModuleOverrides(tenant).join(', ')}`
              : 'No manual module overrides'}
          </p>
        </div>
      )
    },
    {
      key: 'access',
      header: 'Access',
      render: (tenant) => <StatusBadge status={tenant.platformOwner ? 'platform owner' : 'customer tenant'} />
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (tenant) =>
        canWriteTenants ? (
          <button
            type="button"
            onClick={() => handleEdit(tenant)}
            className="ui-secondary-button"
          >
            Edit
          </button>
        ) : null
    }
  ];

  return (
    <PermissionGuard
      permission="TENANT_READ"
      fallback={(
        <div className="ui-notice-warning">
          You do not have permission to view workspaces.
        </div>
      )}
    >
      {!canManagePlatform ? (
        <div className="ui-notice-warning">
          Workspace administration is restricted to platform owner administrators.
        </div>
      ) : (
        <div className={sharedPageStackClass} style={tenantAdminToneStyle}>
          <PageTitle
            eyebrow="Platform administration"
            title="Workspaces"
            description="Manage contracted modules, package baselines, commercial overrides, and workspace experience defaults from the platform owner view."
          />

          <MetricGrid cards={tenantSummaryCards} columns="md:grid-cols-2 xl:grid-cols-4" />

          {error ? (
            <div className="ui-notice-error">{error}</div>
          ) : null}

          {success ? (
            <div className="ui-notice-success">{success}</div>
          ) : null}

          {modulesError ? (
            <div className="ui-notice-warning">{modulesError}</div>
          ) : null}

          <PageSection
            title={editingTenantId ? 'Update workspace' : 'Create workspace'}
            description="Core platform access stays active by default. Package contracts and branding remain controlled here."
            className="border-[color:var(--tenant-admin-soft-border)] bg-[color:var(--tenant-admin-section-surface)] shadow-[0_24px_44px_-36px_rgba(15,23,42,0.2)]"
            actions={editingTenantId ? (
              <button
                type="button"
                onClick={resetForm}
                className="ui-secondary-button"
              >
                Cancel edit
              </button>
            ) : undefined}
          >
            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label htmlFor="tenant-workspace-name" className="space-y-2">
                      <span className={sharedInputLabelClass}>Workspace name</span>
                      <input
                        id="tenant-workspace-name"
                        name="tenantName"
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        autoComplete="section-tenant organization"
                        data-filled={resolveFilledState(form.name)}
                        className={contrastInputClass}
                        placeholder="PhaifferTech Clinic Network"
                        {...autofillIgnoreProps}
                        required
                      />
                    </label>

                    <label htmlFor="tenant-workspace-code" className="space-y-2">
                      <span className={sharedInputLabelClass}>Workspace code</span>
                      <input
                        id="tenant-workspace-code"
                        name="tenantCode"
                        value={form.code}
                        onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                        autoComplete="section-tenant off"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        data-filled={resolveFilledState(form.code)}
                        className={contrastInputClass}
                        placeholder="tenant-code"
                        {...autofillIgnoreProps}
                        required
                      />
                    </label>

                    <label htmlFor="tenant-logo-url" className="space-y-2 md:col-span-2">
                      <span className={sharedInputLabelClass}>Logo URL</span>
                      <input
                        id="tenant-logo-url"
                        name="tenantLogoUrl"
                        type="url"
                        value={form.logoUrl ?? ''}
                        onChange={(event) => setForm((current) => ({ ...current, logoUrl: event.target.value }))}
                        autoComplete="section-tenant off"
                        inputMode="url"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        data-filled={resolveFilledState(form.logoUrl)}
                        className={contrastInputClass}
                        placeholder="/branding/tenant-logo.png"
                        {...autofillIgnoreProps}
                      />
                    </label>
                  </div>

                  <div className={sectionPanelClass}>
                    <div>
                      <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Feature entitlements</p>
                      <p className={panelCopyClass}>
                        Package and commercial capability grants stay separate from contracted modules and rollout flags.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                      <label htmlFor="tenant-feature-entitlement" className="flex-1 space-y-2">
                        <span className={sharedInputLabelClass}>Entitlement key</span>
                        <input
                          id="tenant-feature-entitlement"
                          name="tenantFeatureEntitlement"
                          value={featureEntitlementDraft}
                          onChange={(event) => setFeatureEntitlementDraft(event.target.value)}
                          autoComplete="section-tenant off"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          data-filled={resolveFilledState(featureEntitlementDraft)}
                          className={contrastInputClass}
                          placeholder="beta.dashboard"
                          {...autofillIgnoreProps}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={addFeatureEntitlement}
                        className="ui-secondary-button"
                      >
                        Add entitlement
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(form.featureEntitlements ?? []).length > 0 ? (
                        form.featureEntitlements?.map((featureKey) => (
                          <button
                            key={featureKey}
                            type="button"
                            onClick={() => removeFeatureEntitlement(featureKey)}
                            className={contrastActionChipClass}
                          >
                            <span>{featureKey}</span>
                            <span className="text-[color:var(--tenant-admin-secondary-text)]">Remove</span>
                          </button>
                        ))
                      ) : (
                        <span className={panelCopyClass}>
                          No custom feature entitlements configured for this workspace.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={sectionPanelClass}>
                    <div>
                      <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Contracted modules</p>
                      <p className={panelCopyClass}>
                        CORE_PLATFORM remains active for every workspace. Modules included by the selected package stay enabled, and additional products remain explicit overrides.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <span className={contrastUppercasePillClass}>
                        CORE_PLATFORM
                      </span>

                      {modulesLoading ? (
                        <div className="ui-notice-neutral">Loading module catalog...</div>
                      ) : (
                        moduleOptions.map((moduleItem) => {
                          const includedByPlan = selectedPlanDetails.defaultModules.includes(moduleItem.code);
                          const checked = effectiveSelectedModules.includes(moduleItem.code);
                          return (
                            <label
                              key={moduleItem.code}
                              className={[
                                'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition',
                                checked
                                  ? 'border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] text-[color:var(--app-shell-heading)]'
                                  : 'border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] text-[color:var(--app-shell-text)]'
                              ].join(' ')}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={includedByPlan}
                                onChange={() => toggleModule(moduleItem.code)}
                                className="h-4 w-4 rounded border-[color:var(--app-shell-border)]"
                              />
                              {moduleItem.code}
                              {includedByPlan ? <span className={compactPanelCopyClass}>Included by package</span> : null}
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className={sectionPanelClass}>
                    <div className="space-y-3">
                      <div>
                        <p className={sharedInputLabelClass}>Package</p>
                        <p className={panelCopyClass}>
                          Keep the commercial package visible here so contract review, access preview, and downstream validation stay aligned.
                        </p>
                      </div>

                      <fieldset className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                        <legend className="sr-only">Commercial package options</legend>
                        {PLAN_CODES.map((code) => {
                          const plan = PLAN_DETAILS[code];
                          const selected = (form.planCode ?? 'PETSHOP') === code;

                          return (
                            <label
                              key={code}
                              htmlFor={`tenant-plan-${code}`}
                              className={[
                                'flex cursor-pointer flex-col gap-3 rounded-2xl border px-4 py-4 transition-colors duration-200',
                                selected
                                  ? 'border-[color:var(--tenant-admin-selected-border)] bg-[color:var(--tenant-admin-selected-surface)] shadow-[0_20px_36px_-30px_rgba(15,23,42,0.22)]'
                                  : 'border-[color:var(--tenant-admin-soft-border)] bg-[color:var(--tenant-admin-tag-surface)] shadow-[0_12px_22px_-24px_rgba(15,23,42,0.12)] hover:border-[color:var(--tenant-accent)]/30 hover:bg-white'
                              ].join(' ')}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-semibold text-[color:var(--app-shell-heading)]">{code}</span>
                                    <span className={selected ? selectedPackageBadgeClass : packageMetaClass}>
                                      {plan.label}
                                    </span>
                                    {selected ? <span className={selectedPackageBadgeClass}>Selected</span> : null}
                                  </div>
                                  <p className={panelCopyClass}>{plan.description}</p>
                                </div>

                                <input
                                  id={`tenant-plan-${code}`}
                                  type="radio"
                                  name="tenantPlanCode"
                                  value={code}
                                  checked={selected}
                                  onChange={(event) => setForm((current) => ({ ...current, planCode: event.target.value }))}
                                  className="mt-1 h-4 w-4 border-[color:var(--tenant-admin-selected-border)] text-[color:var(--tenant-accent)]"
                                />
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {plan.defaultModules.map((moduleCode) => (
                                  <span
                                    key={`${code}-module-${moduleCode}`}
                                    className="inline-flex items-center rounded-full border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--app-shell-text)]"
                                  >
                                    {moduleCode}
                                  </span>
                                ))}
                                {plan.defaultEntitlements.map((featureKey) => (
                                  <span
                                    key={`${code}-feature-${featureKey}`}
                                    className={contrastChipClass}
                                  >
                                    {featureKey}
                                  </span>
                                ))}
                              </div>
                            </label>
                          );
                        })}
                      </fieldset>
                    </div>

                    <label htmlFor="tenant-trial-end-date" className="space-y-2">
                      <span className={sharedInputLabelClass}>Trial end date</span>
                      <input
                        id="tenant-trial-end-date"
                        name="tenantTrialEndDate"
                        type="date"
                        value={form.trialEndDate}
                        onChange={(event) => setForm((current) => ({ ...current, trialEndDate: event.target.value }))}
                        autoComplete="section-tenant off"
                        data-filled={resolveFilledState(form.trialEndDate)}
                        className={contrastInputClass}
                        {...autofillIgnoreProps}
                        required={!editingTenantId}
                      />
                    </label>

                    <div className={detailPanelClass}>
                      <p className="font-medium text-[color:var(--app-shell-heading)]">
                        Package defines default modules and features.
                      </p>
                      <p className={panelCopyClass}>
                        Selected package: <strong>{form.planCode ?? 'PETSHOP'}</strong>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedPlanDetails.defaultModules.map((moduleCode) => (
                          <span
                            key={`plan-module-${moduleCode}`}
                            className="inline-flex items-center rounded-full border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--app-shell-text)]"
                          >
                            {moduleCode}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedPlanDetails.defaultEntitlements.map((featureKey) => (
                          <span
                            key={`plan-entitlement-${featureKey}`}
                            className={contrastChipClass}
                          >
                            {featureKey}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={detailPanelClass}>
                      <div>
                        <p className="font-medium text-[color:var(--app-shell-heading)]">
                          Contract preview
                        </p>
                        <p className={panelCopyClass}>
                          Separate the commercial package baseline from manual overrides before saving the workspace contract.
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-heading)]">
                          Package baseline
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[color:var(--app-shell-heading)]">
                          {form.planCode ?? 'PETSHOP'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedPlanDetails.defaultModules.map((moduleCode) => (
                            <span
                              key={`preview-plan-module-${moduleCode}`}
                              className="inline-flex items-center rounded-full border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--app-shell-text)]"
                            >
                              {moduleCode}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-heading)]">
                          Manual module overrides
                        </p>
                        {selectedManualModuleOverrides.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedManualModuleOverrides.map((moduleCode) => (
                              <span
                                key={`preview-manual-module-${moduleCode}`}
                                className={contrastUppercaseChipClass}
                              >
                                {moduleCode}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className={panelCopyClass}>
                            No manual module overrides selected.
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-heading)]">
                          Effective access
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {effectiveSelectedModules.map((moduleCode) => (
                            <span
                              key={`preview-effective-module-${moduleCode}`}
                              className="inline-flex items-center rounded-full border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--app-shell-text)]"
                            >
                              {moduleCode}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {effectiveSelectedEntitlements.length > 0 ? (
                            effectiveSelectedEntitlements.map((featureKey) => (
                              <span
                                key={`preview-feature-${featureKey}`}
                                className={contrastChipClass}
                              >
                                {featureKey}
                              </span>
                            ))
                          ) : (
                            <span className={panelCopyClass}>
                              No effective entitlement signals selected.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!editingTenantId ? (
                      <div className={detailPanelClass}>
                        <div>
                          <p className="font-medium text-[color:var(--app-shell-heading)]">
                            Initial admin access
                          </p>
                          <p className={panelCopyClass}>
                            The bootstrap admin account is created with the workspace and the temporary password is stored as a hash.
                          </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label htmlFor="tenant-initial-admin-full-name" className="space-y-2">
                            <span className={sharedInputLabelClass}>Initial admin full name</span>
                            <input
                              id="tenant-initial-admin-full-name"
                              name="initialAdminFullName"
                              value={form.initialAdminFullName}
                              onChange={(event) => setForm((current) => ({ ...current, initialAdminFullName: event.target.value }))}
                              autoComplete="section-workspace-admin off"
                              data-filled={resolveFilledState(form.initialAdminFullName)}
                              className={contrastInputClass}
                              placeholder="Jordan Smith"
                              {...autofillIgnoreProps}
                              required
                            />
                          </label>

                          <label htmlFor="tenant-initial-admin-email" className="space-y-2">
                            <span className={sharedInputLabelClass}>Initial admin email</span>
                            <input
                              id="tenant-initial-admin-email"
                              name="initialAdminEmail"
                              type="email"
                              value={form.initialAdminEmail}
                              onChange={(event) => setForm((current) => ({ ...current, initialAdminEmail: event.target.value }))}
                              autoComplete="section-workspace-admin email"
                              inputMode="email"
                              autoCapitalize="none"
                              autoCorrect="off"
                              spellCheck={false}
                              data-filled={resolveFilledState(form.initialAdminEmail)}
                              className={contrastInputClass}
                              placeholder="admin@tenant.test"
                              {...autofillIgnoreProps}
                              required
                            />
                          </label>

                          <label htmlFor="tenant-temporary-password" className="space-y-2 md:col-span-2">
                            <span className={sharedInputLabelClass}>Temporary password</span>
                            <input
                              id="tenant-temporary-password"
                              name="temporaryPassword"
                              type="password"
                              value={form.temporaryPassword}
                              onChange={(event) => setForm((current) => ({ ...current, temporaryPassword: event.target.value }))}
                              autoComplete="section-workspace-admin new-password"
                              data-filled={resolveFilledState(form.temporaryPassword)}
                              className={contrastInputClass}
                              placeholder="TempPassword@123"
                              {...autofillIgnoreProps}
                              required
                            />
                          </label>
                        </div>

                        <label className={surfaceToggleClass}>
                          <input
                            type="checkbox"
                            checked={form.requirePasswordChangeOnFirstAccess}
                            onChange={(event) => setForm((current) => ({
                              ...current,
                              requirePasswordChangeOnFirstAccess: event.target.checked
                            }))}
                            className="h-4 w-4 rounded border-[color:var(--app-shell-border)]"
                          />
                          Require password change on first access
                        </label>
                      </div>
                    ) : null}
                  </div>

                  <div className={sectionPanelClass}>
                    <div>
                      <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Branding defaults</p>
                      <p className={panelCopyClass}>
                        Keep branding controlled so workspace identity stays visible without overriding the shared platform structure.
                      </p>
                    </div>

                    <label htmlFor="tenant-primary-color" className="space-y-2">
                      <span className={sharedInputLabelClass}>Primary color</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={form.primaryColor ?? '#0f172a'}
                          onChange={(event) => setForm((current) => ({ ...current, primaryColor: event.target.value }))}
                          className="h-12 w-16 rounded-xl border border-[color:var(--app-shell-border)] bg-transparent shadow-xs"
                        />
                        <input
                          id="tenant-primary-color"
                          name="tenantPrimaryColor"
                          value={form.primaryColor ?? ''}
                          onChange={(event) => setForm((current) => ({ ...current, primaryColor: event.target.value }))}
                          autoComplete="section-tenant off"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          data-filled={resolveFilledState(form.primaryColor)}
                          className={contrastInputClass}
                          placeholder="#0f172a"
                          {...autofillIgnoreProps}
                        />
                      </div>
                    </label>

                    <label htmlFor="tenant-accent-color" className="space-y-2">
                      <span className={sharedInputLabelClass}>Accent color</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={form.accentColor ?? '#2563eb'}
                          onChange={(event) => setForm((current) => ({ ...current, accentColor: event.target.value }))}
                          className="h-12 w-16 rounded-xl border border-[color:var(--app-shell-border)] bg-transparent shadow-xs"
                        />
                        <input
                          id="tenant-accent-color"
                          name="tenantAccentColor"
                          value={form.accentColor ?? ''}
                          onChange={(event) => setForm((current) => ({ ...current, accentColor: event.target.value }))}
                          autoComplete="section-tenant off"
                          autoCapitalize="none"
                          autoCorrect="off"
                          spellCheck={false}
                          data-filled={resolveFilledState(form.accentColor)}
                          className={contrastInputClass}
                          placeholder="#2563eb"
                          {...autofillIgnoreProps}
                        />
                      </div>
                    </label>

                    <label htmlFor="tenant-default-theme" className="space-y-2">
                      <span className={sharedInputLabelClass}>Default theme</span>
                      <select
                        id="tenant-default-theme"
                        name="tenantDefaultThemeMode"
                        value={form.defaultThemeMode}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            defaultThemeMode: event.target.value as TenantThemeMode
                          }))}
                        data-filled={resolveFilledState(form.defaultThemeMode)}
                        className={contrastInputClass}
                      >
                        <option value="SYSTEM">System</option>
                        <option value="LIGHT">Light</option>
                        <option value="DARK">Dark</option>
                      </select>
                    </label>

                    <label className={surfaceToggleClass}>
                      <input
                        type="checkbox"
                        checked={form.allowUserThemeOverride}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            allowUserThemeOverride: event.target.checked
                          }))}
                        className="h-4 w-4 rounded border-[color:var(--app-shell-border)]"
                      />
                      Allow user theme override
                    </label>
                  </div>
                </div>
              </div>

              {editingTenantId ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  <section className={`${sectionPanelClass} xl:col-span-2`}>
                    <div>
                      <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Contract review</p>
                      <p className={panelCopyClass}>
                        Review the workspace package baseline, manual overrides, effective entitlements, and observed usage before approving the contract state.
                      </p>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                      <div className={contractReviewCardClass}>
                        <p className={secondaryEyebrowClass}>
                          Package baseline
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[color:var(--app-shell-heading)]">
                          {editingTenant?.planCode ?? 'No package assigned'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(editingTenantPlanDetails?.defaultModules ?? []).map((moduleCode) => (
                            <span
                              key={`editing-plan-module-${moduleCode}`}
                              className="inline-flex items-center rounded-full border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--app-shell-text)]"
                            >
                              {moduleCode}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(editingTenantPlanDetails?.defaultEntitlements ?? []).map((featureKey) => (
                            <span
                              key={`editing-plan-entitlement-${featureKey}`}
                              className={contrastChipClass}
                            >
                              {featureKey}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className={contractReviewCardClass}>
                        <p className={secondaryEyebrowClass}>
                          Manual module overrides
                        </p>
                        {editingTenantManualModuleOverrides.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {editingTenantManualModuleOverrides.map((moduleCode) => (
                              <span
                                key={`editing-manual-module-${moduleCode}`}
                                className={contrastUppercaseChipClass}
                              >
                                {moduleCode}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className={panelCopyClass}>
                            No manual module overrides are active for this workspace.
                          </p>
                        )}

                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-heading)]">
                          Custom entitlements
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(editingTenant?.featureEntitlements ?? []).length > 0 ? (
                            editingTenant?.featureEntitlements?.map((featureKey) => (
                              <span
                                key={`editing-feature-${featureKey}`}
                                className={contrastChipClass}
                              >
                                {featureKey}
                              </span>
                            ))
                          ) : (
                            <span className={panelCopyClass}>
                              No custom entitlements applied.
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={contractReviewCardClass}>
                        <p className={secondaryEyebrowClass}>
                          Effective access
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {editingTenantEffectiveModules.map((moduleCode) => (
                            <span
                              key={`editing-effective-module-${moduleCode}`}
                              className="inline-flex items-center rounded-full border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--app-shell-text)]"
                            >
                              {moduleCode}
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {editingTenantEffectiveEntitlements.length > 0 ? (
                            editingTenantEffectiveEntitlements.map((featureKey) => (
                              <span
                                key={`editing-effective-feature-${featureKey}`}
                                className="inline-flex items-center rounded-full border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--app-shell-text)]"
                              >
                                {featureKey}
                              </span>
                            ))
                          ) : (
                            <span className={panelCopyClass}>
                              No effective entitlement signals returned by the backend.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className={`${sectionPanelClass} space-y-3`}>
                    <div>
                      <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Feature flags</p>
                      <p className={panelCopyClass}>
                        Rollout controls sit on top of contracts. A disabled flag can still block a contracted module.
                      </p>
                    </div>

                    {featureFlagsError ? (
                      <div className="ui-notice-warning">{featureFlagsError}</div>
                    ) : null}

                    {featureFlagsLoading ? (
                      <div className="ui-notice-neutral">Loading feature flags...</div>
                    ) : tenantFeatureFlags.length > 0 ? (
                      <div className="space-y-3">
                        {tenantFeatureFlags.map((featureFlag) => {
                          const isSaving = savingFeatureFlagKey === featureFlag.key;
                          return (
                            <div
                              key={featureFlag.key}
                              className="flex flex-col gap-3 rounded-2xl border border-[color:var(--tenant-admin-soft-border)] bg-[color:var(--tenant-admin-detail-surface)] p-4 shadow-[0_14px_24px_-24px_rgba(15,23,42,0.16)]"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">
                                    {featureFlag.key}
                                  </p>
                                  <p className="text-xs text-[color:var(--app-shell-muted)]">
                                    {featureFlag.scope === 'TENANT' ? 'Workspace override active' : 'Using global rollout'}
                                  </p>
                                </div>
                                <StatusBadge status={featureFlag.enabled ? 'active' : 'warn'} />
                              </div>

                              <div className="flex flex-wrap items-center gap-3">
                                <label className={surfaceTogglePillClass}>
                                  <input
                                    type="checkbox"
                                    checked={featureFlag.enabled}
                                    disabled={isSaving}
                                    onChange={(event) => void handleFeatureFlagToggle(featureFlag.key, event.target.checked)}
                                    className="h-4 w-4 rounded border-[color:var(--app-shell-border)]"
                                  />
                                  Enable for this workspace
                                </label>
                                {featureFlag.scope === 'TENANT' ? (
                                  <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => void handleFeatureFlagReset(featureFlag.key)}
                                    className="ui-secondary-button"
                                  >
                                    Use global default
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className={panelCopyClass}>
                        No feature flags available for workspace override.
                      </p>
                    )}
                  </section>

                  <section className={`${sectionPanelClass} space-y-3`}>
                    <div>
                      <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Usage telemetry</p>
                      <p className={panelCopyClass}>
                        Read-only daily aggregates from successful logins, API requests, and auditable entity creation. Use this to explain what this workspace is actually consuming today.
                      </p>
                    </div>

                    {usageMetricsError ? (
                      <div className="ui-notice-warning">{usageMetricsError}</div>
                    ) : null}

                    {usageMetricsLoading ? (
                      <div className="ui-notice-neutral">Loading recent usage metrics...</div>
                    ) : usageMetrics.length > 0 ? (
                      <>
                        <MetricGrid cards={usageSummaryCards} columns="md:grid-cols-2 xl:grid-cols-4" />
                        <div className="overflow-x-auto rounded-[var(--radius-xl)] border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)]">
                        <table className="min-w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-[color:var(--app-shell-border)] text-xs uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                              <th className="px-4 py-3 font-semibold">Source</th>
                              <th className="px-4 py-3 font-semibold">Quantity</th>
                              <th className="px-4 py-3 font-semibold">Last active day</th>
                              <th className="px-4 py-3 font-semibold">Last updated</th>
                            </tr>
                          </thead>
                          {usageMetricGroups.map((group) => (
                            <tbody key={group.metricKey}>
                              <tr className="border-b border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)]">
                                <th
                                  colSpan={4}
                                  className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-heading)]"
                                >
                                  {formatTokenLabel(group.metricKey)}
                                </th>
                              </tr>
                              {group.items.map((metric) => (
                                <tr
                                  key={`${metric.metricKey}-${metric.source}-${metric.metricDate}`}
                                  className="border-b border-[color:var(--app-shell-border)] last:border-b-0"
                                >
                                  <td className="px-4 py-3 text-[color:var(--app-shell-text)]">
                                    {formatTokenLabel(metric.source)}
                                  </td>
                                  <td className="px-4 py-3 text-[color:var(--app-shell-text)]">
                                    {metric.quantity} {metric.unit}
                                  </td>
                                  <td className="px-4 py-3 text-[color:var(--app-shell-text)]">
                                    {metric.metricDate}
                                  </td>
                                  <td className="px-4 py-3 text-[color:var(--app-shell-text)]">
                                    {new Date(metric.lastRecordedAt).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          ))}
                        </table>
                        </div>
                      </>
                    ) : (
                      <p className={panelCopyClass}>
                        No recent usage telemetry has been recorded for this workspace.
                      </p>
                    )}
                  </section>

                  <section className={`${sectionPanelClass} xl:col-span-2`}>
                    <div>
                      <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Support impersonation</p>
                      <p className={panelCopyClass}>
                        Start a time-boxed support session inside this workspace while keeping your original platform operator identity fully auditable.
                      </p>
                    </div>

                    {session?.user.impersonation ? (
                      <div className="ui-notice-warning">
                        Support impersonation is already active for the current browser session. Exit from the top
                        banner before starting a new support session.
                      </div>
                    ) : editingTenant?.platformOwner ? (
                      <div className="ui-notice-warning">
                        Support impersonation is only available for customer workspaces.
                      </div>
                    ) : (
                      <>
                        <div className="ui-notice-neutral">
                          You are preparing support access for <strong>{editingTenant?.name}</strong> (
                          {editingTenant?.code}). Exiting from the impersonation banner restores your original
                          platform workspace automatically.
                        </div>

                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
                          <FormTextarea
                            label="Reason"
                            value={impersonationReason}
                            onChange={setImpersonationReason}
                            description="The reason becomes part of the auditable support-session record."
                            placeholder="Describe why support access is needed for this workspace."
                            disabled={impersonationSubmitting}
                            className={contrastTextareaClass}
                          />

                          <label className="space-y-2">
                            <span className={sharedInputLabelClass}>Access duration</span>
                            <select
                              value={impersonationDurationMinutes}
                              onChange={(event) => setImpersonationDurationMinutes(Number(event.target.value))}
                              disabled={impersonationSubmitting}
                              className={contrastInputClass}
                            >
                              <option value={15}>15 minutes</option>
                              <option value={30}>30 minutes</option>
                              <option value={45}>45 minutes</option>
                              <option value={60}>60 minutes</option>
                            </select>
                            <p className={compactPanelCopyClass}>
                              Short sessions reduce ambiguity and keep operator recovery simple.
                            </p>
                          </label>
                        </div>

                        <div className="ui-notice-warning">
                          The resulting session stays workspace-scoped, keeps your real operator identity on audit records, and expires automatically.
                        </div>

                        {impersonationError ? (
                          <div className="ui-notice-error">{impersonationError}</div>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => void handleStartImpersonation()}
                          disabled={impersonationSubmitting}
                          className="ui-primary-button"
                        >
                          {impersonationSubmitting ? 'Starting support access...' : 'Start support impersonation'}
                        </button>
                      </>
                    )}
                  </section>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="ui-primary-button"
                >
                  {submitting ? 'Saving...' : editingTenantId ? 'Update workspace' : 'Create workspace'}
                </button>
              </div>
            </form>
          </PageSection>

          <DataTable
            columns={columns}
            rows={tenants}
            getRowKey={(tenant) => tenant.id}
            loading={loading}
            loadingTitle="Loading tenant workspaces"
            loadingDescription="Preparing contracted modules, branding defaults, and access posture for the platform control panel."
            emptyState={{
              title: 'No workspaces registered',
              description:
                'Create the first workspace to define branding, contracted modules, and default behavior.'
            }}
          />

          <Pagination
            page={pageData.page}
            totalPages={pageData.totalPages}
            totalElements={totalItems}
            onPageChange={(nextPage) => void loadTenants(nextPage)}
          />
        </div>
      )}
    </PermissionGuard>
  );
}
