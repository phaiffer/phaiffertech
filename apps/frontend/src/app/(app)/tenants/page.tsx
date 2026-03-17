'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { useAuth } from '@/shared/auth/use-auth';
import { usePermissions } from '@/shared/auth/usePermissions';
import { sharedInputClass, sharedInputLabelClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { useModuleCatalog } from '@/shared/modules/use-module-catalog';
import { tenantService, TenantUpsertInput } from '@/shared/services/tenant-service';
import { PageResponse } from '@/shared/types/common';
import { TenantThemeMode } from '@/shared/types/auth';
import { Tenant } from '@/shared/types/tenant';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
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

function normalizeTenantInput(form: TenantUpsertInput): TenantUpsertInput {
  return {
    ...form,
    name: form.name.trim(),
    code: form.code.trim().toLowerCase(),
    logoUrl: form.logoUrl?.trim() ? form.logoUrl.trim() : null,
    primaryColor: form.primaryColor?.trim() ? form.primaryColor.trim() : null,
    accentColor: form.accentColor?.trim() ? form.accentColor.trim() : null,
    contractedModules: Array.from(new Set(form.contractedModules))
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

export default function TenantsPage() {
  const { session } = useAuth();
  const { hasPermission } = usePermissions();
  const { modules, loading: modulesLoading, error: modulesError } = useModuleCatalog();

  const canReadTenants = hasPermission('TENANT_READ');
  const canWriteTenants = hasPermission('TENANT_WRITE');
  const canManagePlatform = Boolean(session?.user.platformAdmin);

  const [pageData, setPageData] = useState<PageResponse<Tenant>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [form, setForm] = useState<TenantUpsertInput>(emptyTenantForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  function handleEdit(tenant: Tenant) {
    setEditingTenantId(tenant.id);
    setForm({
      name: tenant.name,
      code: tenant.code,
      logoUrl: tenant.logoUrl ?? '',
      primaryColor: tenant.primaryColor ?? '#0f172a',
      accentColor: tenant.accentColor ?? '#2563eb',
      defaultThemeMode: tenant.defaultThemeMode,
      allowUserThemeOverride: tenant.allowUserThemeOverride,
      contractedModules: tenant.contractedModules.filter((moduleCode) => moduleCode !== 'CORE_PLATFORM'),
      planCode: tenant.planCode ?? 'BASIC'
    });
  }

  function resetForm() {
    setEditingTenantId(null);
    setForm(emptyTenantForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canWriteTenants || !canManagePlatform) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = normalizeTenantInput(form);
      if (editingTenantId) {
        await tenantService.update(editingTenantId, payload);
      } else {
        await tenantService.create(payload);
      }
      resetForm();
      await loadTenants(pageData.page);
    } catch (err) {
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

  const tenants = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const columns: DataTableColumn<Tenant>[] = [
    {
      key: 'tenant',
      header: 'Tenant',
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
      header: 'Plan',
      render: (tenant) => (
        <span className="text-sm font-medium text-[color:var(--app-shell-heading)]">
          {tenant.planCode ?? '-'}
        </span>
      )
    },
    {
      key: 'theme',
      header: 'Theme',
      render: (tenant) => (
        <div className="text-sm text-[color:var(--app-shell-text)]">
          <p>{themeLabel(tenant.defaultThemeMode)}</p>
          <p className="text-xs text-[color:var(--app-shell-muted)]">
            {tenant.allowUserThemeOverride ? 'User override enabled' : 'Tenant-controlled'}
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
      header: 'Modules',
      render: (tenant) => (
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
          You do not have permission to view tenants.
        </div>
      )}
    >
      {!canManagePlatform ? (
        <div className="ui-notice-warning">
          Tenant administration is restricted to platform owner administrators.
        </div>
      ) : (
        <div className="space-y-6">
          <PageTitle
            title="Tenants"
            description="Manage contracted modules, tenant branding and experience defaults from the platform owner workspace."
          />

          {error ? (
            <div className="ui-notice-error">{error}</div>
          ) : null}

          {modulesError ? (
            <div className="ui-notice-warning">{modulesError}</div>
          ) : null}

          <section className="ui-surface-panel p-5">
            <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-[color:var(--app-shell-heading)]">
                  {editingTenantId ? 'Update tenant experience' : 'Create tenant workspace'}
                </h2>
                <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
                  Core platform access stays active by default. Contracted products and branding remain controlled here.
                </p>
              </div>
              {editingTenantId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="ui-secondary-button"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2">
                <span className={sharedInputLabelClass}>Tenant name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className={sharedInputClass}
                  placeholder="PhaifferTech Clinic Network"
                  required
                />
              </label>

              <label className="space-y-2">
                <span className={sharedInputLabelClass}>Tenant code</span>
                <input
                  value={form.code}
                  onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                  className={sharedInputClass}
                  placeholder="tenant-code"
                  required
                />
              </label>

              <label className="space-y-2 lg:col-span-2">
                <span className={sharedInputLabelClass}>Plan code</span>
                <input
                  value={form.planCode ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, planCode: event.target.value }))}
                  className={sharedInputClass}
                  placeholder="BASIC"
                />
              </label>

              <label className="space-y-2 lg:col-span-2">
                <span className={sharedInputLabelClass}>Logo URL</span>
                <input
                  value={form.logoUrl ?? ''}
                  onChange={(event) => setForm((current) => ({ ...current, logoUrl: event.target.value }))}
                  className={sharedInputClass}
                  placeholder="/branding/tenant-logo.png"
                />
              </label>

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

              <label className="ui-surface-muted flex items-center gap-3 px-4 py-3 text-sm text-[color:var(--app-shell-text)]">
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

              <div className="space-y-3 lg:col-span-2">
                <div>
                  <p className="text-sm font-medium text-[color:var(--app-shell-heading)]">Contracted modules</p>
                  <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
                    CORE_PLATFORM remains active for every tenant. Additional products are explicit contract decisions.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center rounded-full border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-heading)]">
                    CORE_PLATFORM
                  </span>

                  {modulesLoading ? (
                    <span className="ui-notice-neutral">Loading module catalog...</span>
                  ) : (
                    moduleOptions.map((moduleItem) => {
                      const checked = form.contractedModules.includes(moduleItem.code);
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
                            onChange={() => toggleModule(moduleItem.code)}
                            className="h-4 w-4 rounded border-[color:var(--app-shell-border)]"
                          />
                          {moduleItem.code}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 lg:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="ui-primary-button"
                >
                  {submitting ? 'Saving...' : editingTenantId ? 'Update tenant' : 'Create tenant'}
                </button>
              </div>
            </form>
          </section>

          <DataTable
            columns={columns}
            rows={tenants}
            getRowKey={(tenant) => tenant.id}
            loading={loading}
            loadingTitle="Loading tenant workspaces"
            loadingDescription="Preparing contracted modules, branding defaults, and access posture for the platform control panel."
            emptyState={{
              title: 'No tenant workspaces registered',
              description:
                'Create the first tenant to define branding, contracted modules, and default workspace behavior.'
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
