'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
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
import { tenantService, TenantUpsertInput, TenantUsageMetric } from '@/shared/services/tenant-service';
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

const emptyTenantForm: TenantUpsertInput = {
  name: '',
  code: '',
  logoUrl: '',
  primaryColor: '#0f172a',
  accentColor: '#2563eb',
  defaultThemeMode: 'SYSTEM',
  allowUserThemeOverride: true,
  contractedModules: [],

  planCode: 'BASIC',
  featureEntitlements: [],
};

/** Available plan tiers exposed to platform administrators. */
const PLAN_CODES = ['BASIC', 'STANDARD', 'PRO', 'ENTERPRISE'] as const;

const PLAN_DETAILS: Record<typeof PLAN_CODES[number], { defaultModules: string[]; defaultEntitlements: string[] }> = {
  BASIC: {
    defaultModules: ['CRM'],
    defaultEntitlements: ['crm.basic']
  },
  STANDARD: {
    defaultModules: ['CRM', 'PET'],
    defaultEntitlements: ['crm.full', 'pet.basic']
  },
  PRO: {
    defaultModules: ['CRM', 'PET', 'IOT'],
    defaultEntitlements: ['crm.full', 'pet.full', 'iot.basic']
  },
  ENTERPRISE: {
    defaultModules: ['CRM', 'PET', 'IOT'],
    defaultEntitlements: ['*']
  }
};

function resolvePlanDetails(planCode?: string) {
  const normalizedCode = (planCode ?? 'STANDARD').toUpperCase() as keyof typeof PLAN_DETAILS;
  return PLAN_DETAILS[normalizedCode] ?? PLAN_DETAILS.STANDARD;
}

function resolveEffectiveModuleSelection(planCode: string | undefined, moduleOverrides: string[]) {
  return Array.from(new Set([
    ...resolvePlanDetails(planCode).defaultModules,
    ...moduleOverrides
  ]));
}

function normalizeTenantInput(form: TenantUpsertInput): TenantUpsertInput {
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
    contractedModules: resolveEffectiveModuleSelection(form.planCode, manualOverrides),
    featureEntitlements: Array.from(new Set(
      (form.featureEntitlements ?? [])
        .map((featureKey) => featureKey.trim().toLowerCase())
        .filter(Boolean)
    ))
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
  const [form, setForm] = useState<TenantUpsertInput>(emptyTenantForm);
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
  const effectiveSelectedModules = useMemo(
    () => resolveEffectiveModuleSelection(form.planCode, form.contractedModules),
    [form.contractedModules, form.planCode]
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
      contractedModules: tenant.moduleOverrides
        ?? tenant.contractedModules.filter((moduleCode) => (
          moduleCode !== 'CORE_PLATFORM'
          && !resolvePlanDetails(tenant.planCode).defaultModules.includes(moduleCode)
        )),
      planCode: tenant.planCode ?? 'BASIC',
      featureEntitlements: tenant.featureEntitlements ?? []
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
      const payload = normalizeTenantInput(form);
      let savedTenant: Tenant;
      if (editingTenantId) {
        savedTenant = await tenantService.update(editingTenantId, payload);
        setSuccess(
          `Workspace ${savedTenant.name} updated. Contracted modules, branding defaults, and admin overrides are now aligned.`
        );
      } else {
        savedTenant = await tenantService.create(payload);
        setSuccess(
          `Workspace ${savedTenant.name} created. Review plan defaults, feature entitlements, and rollout overrides before handoff.`
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
        trend: 'Workspaces extending plan defaults with additional module access.'
      },
      {
        key: 'tenant-entitlements',
        label: 'Custom entitlements',
        value: tenantsWithCustomEntitlements,
        trend: 'Workspaces with extra commercial access beyond the plan baseline.'
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
            Plan modules {resolvePlanDetails(tenant.planCode).defaultModules.length} • Manual overrides {resolveManualModuleOverrides(tenant).length}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(tenant.featureEntitlements ?? []).length > 0 ? (
              tenant.featureEntitlements?.map((featureKey) => (
                <span
                  key={`${tenant.id}-${featureKey}`}
                  className="inline-flex items-center rounded-full border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] px-2 py-1 text-[11px] font-semibold text-[color:var(--app-shell-heading)]"
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
        <div className={sharedPageStackClass}>
          <PageTitle
            eyebrow="Platform administration"
            title="Workspaces"
            description="Manage contracted modules, plan baselines, commercial overrides, and workspace experience defaults from the platform owner view."
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
            description="Core platform access stays active by default. Contracted products and branding remain controlled here."
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className={sharedInputLabelClass}>Workspace name</span>
                      <input
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        className={sharedInputClass}
                        placeholder="PhaifferTech Clinic Network"
                        required
                      />
                    </label>

                    <label className="space-y-2">
                      <span className={sharedInputLabelClass}>Workspace code</span>
                      <input
                        value={form.code}
                        onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                        className={sharedInputClass}
                        placeholder="tenant-code"
                        required
                      />
                    </label>

                    <label className="space-y-2 md:col-span-2">
                      <span className={sharedInputLabelClass}>Logo URL</span>
                      <input
                        value={form.logoUrl ?? ''}
                        onChange={(event) => setForm((current) => ({ ...current, logoUrl: event.target.value }))}
                        className={sharedInputClass}
                        placeholder="/branding/tenant-logo.png"
                      />
                    </label>
                  </div>

                  <div className="ui-surface-muted space-y-4 p-4 lg:p-5">
                    <div>
                      <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Feature entitlements</p>
                      <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
                        Plan and commercial capability grants stay separate from contracted modules and rollout flags.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                      <label className="flex-1 space-y-2">
                        <span className={sharedInputLabelClass}>Entitlement key</span>
                        <input
                          value={featureEntitlementDraft}
                          onChange={(event) => setFeatureEntitlementDraft(event.target.value)}
                          className={sharedInputClass}
                          placeholder="beta.dashboard"
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
                            className="inline-flex items-center gap-2 rounded-full border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--app-shell-heading)]"
                          >
                            <span>{featureKey}</span>
                            <span className="text-[color:var(--app-shell-muted)]">Remove</span>
                          </button>
                        ))
                      ) : (
                        <span className="text-sm text-[color:var(--app-shell-muted)]">
                          No custom feature entitlements configured for this workspace.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ui-surface-muted space-y-4 p-4 lg:p-5">
                    <div>
                      <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Contracted modules</p>
                      <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
                        CORE_PLATFORM remains active for every workspace. Modules included by the selected plan stay enabled, and additional products remain explicit overrides.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <span className="inline-flex items-center rounded-full border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-heading)]">
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
                              {includedByPlan ? <span className="text-[10px] text-[color:var(--app-shell-muted)]">Included by plan</span> : null}
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="ui-surface-muted space-y-4 p-4 lg:p-5">
                    <label className="space-y-2">
                      <span className={sharedInputLabelClass}>Plan</span>
                      <select
                        value={form.planCode ?? 'BASIC'}
                        onChange={(event) => setForm((current) => ({ ...current, planCode: event.target.value }))}
                        className={sharedInputClass}
                      >
                        {PLAN_CODES.map((code) => (
                          <option key={code} value={code}>{code}</option>
                        ))}
                      </select>
                    </label>

                    <div className="ui-surface-panel space-y-2 px-4 py-4 text-sm">
                      <p className="font-medium text-[color:var(--app-shell-heading)]">
                        Plan defines default modules and features.
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
                            className="inline-flex items-center rounded-full border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--app-shell-heading)]"
                          >
                            {featureKey}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="ui-surface-panel space-y-4 px-4 py-4 text-sm">
                      <div>
                        <p className="font-medium text-[color:var(--app-shell-heading)]">
                          Contract preview
                        </p>
                        <p className="mt-1 text-[color:var(--app-shell-muted)]">
                          Separate the commercial baseline from manual overrides before saving the workspace contract.
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                          Plan baseline
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
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                          Manual module overrides
                        </p>
                        {(form.contractedModules ?? []).length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {form.contractedModules.map((moduleCode) => (
                              <span
                                key={`preview-manual-module-${moduleCode}`}
                                className="inline-flex items-center rounded-full border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--app-shell-heading)]"
                              >
                                {moduleCode}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-[color:var(--app-shell-muted)]">
                            No manual module overrides selected.
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
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
                          {form.featureEntitlements && form.featureEntitlements.length > 0 ? (
                            form.featureEntitlements.map((featureKey) => (
                              <span
                                key={`preview-feature-${featureKey}`}
                                className="inline-flex items-center rounded-full border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--app-shell-heading)]"
                              >
                                {featureKey}
                              </span>
                            ))
                          ) : (
                            <span className="text-[color:var(--app-shell-muted)]">
                              No custom feature entitlement overrides.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="ui-surface-muted space-y-4 p-4 lg:p-5">
                    <div>
                      <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Branding defaults</p>
                      <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
                        Keep branding controlled so workspace identity stays visible without overriding the shared platform structure.
                      </p>
                    </div>

                    <label className="space-y-2">
                      <span className={sharedInputLabelClass}>Primary color</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={form.primaryColor ?? '#0f172a'}
                          onChange={(event) => setForm((current) => ({ ...current, primaryColor: event.target.value }))}
                          className="h-12 w-16 rounded-xl border border-[color:var(--app-shell-border)] bg-transparent shadow-xs"
                        />
                        <input
                          value={form.primaryColor ?? ''}
                          onChange={(event) => setForm((current) => ({ ...current, primaryColor: event.target.value }))}
                          className={sharedInputClass}
                          placeholder="#0f172a"
                        />
                      </div>
                    </label>

                    <label className="space-y-2">
                      <span className={sharedInputLabelClass}>Accent color</span>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={form.accentColor ?? '#2563eb'}
                          onChange={(event) => setForm((current) => ({ ...current, accentColor: event.target.value }))}
                          className="h-12 w-16 rounded-xl border border-[color:var(--app-shell-border)] bg-transparent shadow-xs"
                        />
                        <input
                          value={form.accentColor ?? ''}
                          onChange={(event) => setForm((current) => ({ ...current, accentColor: event.target.value }))}
                          className={sharedInputClass}
                          placeholder="#2563eb"
                        />
                      </div>
                    </label>

                    <label className="space-y-2">
                      <span className={sharedInputLabelClass}>Default theme</span>
                      <select
                        value={form.defaultThemeMode}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            defaultThemeMode: event.target.value as TenantThemeMode
                          }))}
                        className={sharedInputClass}
                      >
                        <option value="SYSTEM">System</option>
                        <option value="LIGHT">Light</option>
                        <option value="DARK">Dark</option>
                      </select>
                    </label>

                    <label className="ui-surface-panel flex items-center gap-3 px-4 py-3 text-sm text-[color:var(--app-shell-text)]">
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
                  <section className="ui-surface-muted space-y-4 p-4 lg:p-5 xl:col-span-2">
                    <div>
                      <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Contract review</p>
                      <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
                        Review the workspace baseline, manual overrides, effective entitlements, and observed usage before approving the contract state.
                      </p>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                      <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                          Plan baseline
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[color:var(--app-shell-heading)]">
                          {editingTenant?.planCode ?? 'No plan assigned'}
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
                              className="inline-flex items-center rounded-full border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--app-shell-heading)]"
                            >
                              {featureKey}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                          Manual module overrides
                        </p>
                        {editingTenantManualModuleOverrides.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {editingTenantManualModuleOverrides.map((moduleCode) => (
                              <span
                                key={`editing-manual-module-${moduleCode}`}
                                className="inline-flex items-center rounded-full border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--app-shell-heading)]"
                              >
                                {moduleCode}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-[color:var(--app-shell-muted)]">
                            No manual module overrides are active for this workspace.
                          </p>
                        )}

                        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                          Custom entitlements
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(editingTenant?.featureEntitlements ?? []).length > 0 ? (
                            editingTenant?.featureEntitlements?.map((featureKey) => (
                              <span
                                key={`editing-feature-${featureKey}`}
                                className="inline-flex items-center rounded-full border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--app-shell-heading)]"
                              >
                                {featureKey}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-[color:var(--app-shell-muted)]">
                              No custom entitlements applied.
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
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
                            <span className="text-sm text-[color:var(--app-shell-muted)]">
                              No effective entitlement signals returned by the backend.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="ui-surface-muted space-y-3 p-4 lg:p-5">
                    <div>
                      <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Feature flags</p>
                      <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
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
                              className="flex flex-col gap-3 rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-4"
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
                                <label className="ui-surface-panel inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-[color:var(--app-shell-text)]">
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
                      <p className="text-sm text-[color:var(--app-shell-muted)]">
                        No feature flags available for workspace override.
                      </p>
                    )}
                  </section>

                  <section className="ui-surface-muted space-y-3 p-4 lg:p-5">
                    <div>
                      <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Usage telemetry</p>
                      <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
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
                      <p className="text-sm text-[color:var(--app-shell-muted)]">
                        No recent usage telemetry has been recorded for this workspace.
                      </p>
                    )}
                  </section>

                  <section className="ui-surface-muted space-y-4 p-4 lg:p-5 xl:col-span-2">
                    <div>
                      <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Support impersonation</p>
                      <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
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
                          />

                          <label className="space-y-2">
                            <span className={sharedInputLabelClass}>Access duration</span>
                            <select
                              value={impersonationDurationMinutes}
                              onChange={(event) => setImpersonationDurationMinutes(Number(event.target.value))}
                              disabled={impersonationSubmitting}
                              className={sharedInputClass}
                            >
                              <option value={15}>15 minutes</option>
                              <option value={30}>30 minutes</option>
                              <option value={45}>45 minutes</option>
                              <option value={60}>60 minutes</option>
                            </select>
                            <p className="text-xs leading-5 text-[color:var(--app-shell-muted)]">
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
