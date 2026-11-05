'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  emptyTenantForm,
  formatTokenLabel,
  PLAN_CODES,
  resolveManualModuleOverrides,
  resolvePlanDefaults,
  resolveVisibleEffectiveModules,
  toTenantCreateInput,
  toTenantUpdateInput
} from '@/modules/account/tenant-plans';
import { useAuth } from '@/shared/auth/use-auth';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatDateForLocale, formatDateTimeForLocale } from '@/shared/i18n/formatters';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { setImpersonationBackupSession } from '@/shared/lib/session';
import { useModuleCatalog } from '@/shared/modules/use-module-catalog';
import {
  filterVisibleModuleCatalogItems,
  filterVisibleUsageMetrics,
  filterVisibleWorkspaceFeatureFlags
} from '@/shared/modules/visible-product-modules';
import { featureFlagService, TenantFeatureFlag } from '@/shared/services/feature-flag-service';
import { supportImpersonationService } from '@/shared/services/support-impersonation-service';
import { tenantService, TenantFormInput, TenantUsageMetric } from '@/shared/services/tenant-service';
import { TenantThemeMode } from '@/shared/types/auth';
import { Tenant } from '@/shared/types/tenant';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSection } from '@/shared/ui/form-section';
import { FormSelect } from '@/shared/ui/form-select';
import { FormTextarea } from '@/shared/ui/form-textarea';

const autofillIgnoreProps = {
  'data-lpignore': 'true',
  'data-1p-ignore': 'true'
} as const;

const durationOptions = [15, 30, 45, 60];
const minimumReasonLength = 10;

function formFromTenant(tenant: Tenant): TenantFormInput {
  return {
    ...emptyTenantForm,
    name: tenant.name,
    code: tenant.code,
    status: tenant.status || 'ACTIVE',
    logoUrl: tenant.logoUrl ?? '',
    primaryColor: tenant.primaryColor ?? emptyTenantForm.primaryColor,
    accentColor: tenant.accentColor ?? emptyTenantForm.accentColor,
    defaultThemeMode: tenant.defaultThemeMode,
    allowUserThemeOverride: tenant.allowUserThemeOverride,
    trialEndDate: tenant.trialEndDate ?? '',
    contractedModules: resolveManualModuleOverrides(tenant),
    planCode: tenant.planCode ?? 'PETSHOP',
    featureEntitlements: tenant.featureEntitlements ?? []
  };
}

type TenantEditorProps = {
  tenant: Tenant | null;
  onSaved: (message: string) => void;
  onCancel: () => void;
};

export function TenantEditor({ tenant, onSaved, onCancel }: TenantEditorProps) {
  const { locale } = useAppI18n();
  const copy = useAppMessages().screens.accountTenants;
  const { session, signIn } = useAuth();
  const router = useRouter();
  const { modules, loading: modulesLoading, error: modulesError } = useModuleCatalog();
  const tenantId = tenant?.id ?? null;

  const [form, setForm] = useState<TenantFormInput>(() => (tenant ? formFromTenant(tenant) : emptyTenantForm));
  const [entitlementDraft, setEntitlementDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [flags, setFlags] = useState<TenantFeatureFlag[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [flagsError, setFlagsError] = useState<string | null>(null);
  const [savingFlagKey, setSavingFlagKey] = useState<string | null>(null);
  const [usage, setUsage] = useState<TenantUsageMetric[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('15');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      return;
    }

    let active = true;
    setFlagsLoading(true);
    setUsageLoading(true);

    featureFlagService.listForTenant(tenantId)
      .then((result) => {
        if (active) {
          setFlags(filterVisibleWorkspaceFeatureFlags(result));
          setFlagsError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setFlagsError(resolveApiErrorMessage(err, copy.flagError));
        }
      })
      .finally(() => {
        if (active) {
          setFlagsLoading(false);
        }
      });

    tenantService.listUsageMetrics(tenantId)
      .then((result) => {
        if (active) {
          setUsage(filterVisibleUsageMetrics(result));
          setUsageError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setUsageError(resolveApiErrorMessage(err, copy.usageError));
        }
      })
      .finally(() => {
        if (active) {
          setUsageLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [copy.flagError, copy.usageError, tenantId]);

  const planDefaults = resolvePlanDefaults(form.planCode);
  const planCopy: Record<string, { label: string; description: string }> = copy.plans;
  const moduleOptions = useMemo(
    () => filterVisibleModuleCatalogItems(modules).filter((moduleItem) => moduleItem.code !== 'CORE_PLATFORM'),
    [modules]
  );
  const effectiveModules = resolveVisibleEffectiveModules(form.planCode, form.contractedModules);
  const effectiveEntitlements = Array.from(new Set([...planDefaults.defaultEntitlements, ...(form.featureEntitlements ?? [])]));

  function updateForm(changes: Partial<TenantFormInput>) {
    setForm((current) => ({ ...current, ...changes }));
  }

  function toggleModule(moduleCode: string) {
    updateForm({
      contractedModules: form.contractedModules.includes(moduleCode)
        ? form.contractedModules.filter((code) => code !== moduleCode)
        : [...form.contractedModules, moduleCode]
    });
  }

  function addEntitlement() {
    const normalized = entitlementDraft.trim().toLowerCase();
    if (!normalized) {
      return;
    }

    updateForm({ featureEntitlements: Array.from(new Set([...(form.featureEntitlements ?? []), normalized])) });
    setEntitlementDraft('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (tenantId) {
        const saved = await tenantService.update(tenantId, toTenantUpdateInput(form));
        onSaved(copy.updated.replace('{name}', saved.name));
      } else {
        const saved = await tenantService.create(toTenantCreateInput(form));
        onSaved(copy.created.replace('{name}', saved.name));
      }
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.saveError));
    } finally {
      setSubmitting(false);
    }
  }

  async function runFlagChange(flagKey: string, change: (id: string) => Promise<unknown>) {
    if (!tenantId) {
      return;
    }

    setSavingFlagKey(flagKey);
    try {
      await change(tenantId);
      setFlags(filterVisibleWorkspaceFeatureFlags(await featureFlagService.listForTenant(tenantId)));
      setFlagsError(null);
      setNotice(copy.flagUpdated.replace('{flag}', flagKey));
    } catch (err) {
      setNotice(null);
      setFlagsError(resolveApiErrorMessage(err, copy.flagError));
    } finally {
      setSavingFlagKey(null);
    }
  }

  async function handleStartSupport() {
    if (!tenantId || !session) {
      return;
    }

    const normalizedReason = reason.trim();
    if (normalizedReason.length < minimumReasonLength) {
      setSupportError(copy.reasonTooShort);
      return;
    }

    setSupportSubmitting(true);
    setSupportError(null);
    try {
      const tokenData = await supportImpersonationService.start({
        targetTenantId: tenantId,
        reason: normalizedReason,
        durationMinutes: Number(duration)
      });

      setImpersonationBackupSession(session);
      signIn({ accessToken: tokenData.accessToken, user: tokenData.user });
      router.push('/dashboard');
    } catch (err) {
      setSupportError(resolveApiErrorMessage(err, copy.supportError));
    } finally {
      setSupportSubmitting(false);
    }
  }

  const usageColumns: DataTableColumn<TenantUsageMetric>[] = [
    { key: 'metric', header: copy.columnMetric, render: (metric) => formatTokenLabel(metric.metricKey) },
    { key: 'source', header: copy.columnSource, render: (metric) => formatTokenLabel(metric.source) },
    { key: 'quantity', header: copy.columnQuantity, className: 'text-right ui-mono', render: (metric) => metric.quantity },
    {
      key: 'day',
      header: copy.columnDay,
      render: (metric) => <span className="ui-mono">{formatDateForLocale(locale, metric.metricDate, '-', { timeZone: 'UTC' })}</span>
    },
    {
      key: 'updatedAt',
      header: copy.columnUpdatedAt,
      render: (metric) => <span className="ui-mono">{formatDateTimeForLocale(locale, metric.lastRecordedAt)}</span>
    }
  ];

  return (
    <div className="space-y-5 rounded-md border border-[color:var(--line)] p-4">
      <h2 className="text-sm font-semibold text-[var(--ink)]">{tenant ? copy.editTenant : copy.newTenant}</h2>

      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
        <FormSection title={copy.sectionIdentification}>
          <FormInput
            name="tenantName"
            label={copy.fieldName}
            value={form.name}
            onChange={(name) => updateForm({ name })}
            autoComplete="section-tenant organization"
            {...autofillIgnoreProps}
            required
          />
          <FormInput
            name="tenantCode"
            label={copy.fieldCode}
            value={form.code}
            onChange={(code) => updateForm({ code })}
            autoComplete="section-tenant off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            {...autofillIgnoreProps}
            required
          />
          <FormInput
            name="tenantLogoUrl"
            type="url"
            label={copy.fieldLogo}
            value={form.logoUrl ?? ''}
            onChange={(logoUrl) => updateForm({ logoUrl })}
            autoComplete="section-tenant off"
            {...autofillIgnoreProps}
          />
          <FormSelect
            label={copy.fieldStatus}
            value={form.status ?? 'ACTIVE'}
            options={[
              { value: 'ACTIVE', label: copy.statusActive },
              { value: 'TRIAL', label: copy.statusTrial },
              { value: 'SUSPENDED', label: copy.statusSuspended },
              { value: 'CANCELLED', label: copy.statusCancelled }
            ]}
            onChange={(status) => updateForm({ status })}
          />
        </FormSection>

        <FormSection title={copy.sectionPackage}>
          <div role="radiogroup" aria-label={copy.sectionPackage} className="grid gap-2 md:col-span-2 md:grid-cols-2">
            {PLAN_CODES.map((code) => {
              const selected = (form.planCode ?? 'PETSHOP') === code;
              return (
                <label
                  key={code}
                  className={`flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm ${
                    selected ? 'border-[color:var(--ink)] bg-[var(--selected)]' : 'border-[color:var(--line)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="tenantPlanCode"
                    value={code}
                    checked={selected}
                    onChange={() => updateForm({ planCode: code })}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="block font-medium text-[var(--ink)]">{planCopy[code].label}</span>
                    <span className="block text-xs text-[var(--ink-2)]">{planCopy[code].description}</span>
                    <span className="ui-mono mt-1 block text-xs text-[var(--muted)]">{code} · {resolvePlanDefaults(code).defaultEntitlements.join(', ')}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <FormInput
            name="tenantTrialEndDate"
            type="date"
            label={copy.fieldTrialEnd}
            value={form.trialEndDate}
            onChange={(trialEndDate) => updateForm({ trialEndDate })}
            required={!tenant}
          />
        </FormSection>

        <FormSection title={copy.sectionAccess}>
          <div className="space-y-2 md:col-span-2">
            {modulesError ? <div className="ui-notice-warning">{modulesError}</div> : null}
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="ui-mono inline-flex items-center gap-2 text-[var(--ink-2)]">CORE_PLATFORM</span>
              {modulesLoading ? null : moduleOptions.map((moduleItem) => {
                const includedByPlan = planDefaults.defaultModules.includes(moduleItem.code);
                return (
                  <label key={moduleItem.code} className="inline-flex items-center gap-2 text-[var(--ink)]">
                    <input
                      type="checkbox"
                      checked={effectiveModules.includes(moduleItem.code)}
                      disabled={includedByPlan}
                      onChange={() => toggleModule(moduleItem.code)}
                    />
                    <span className="ui-mono">{moduleItem.code}</span>
                    {includedByPlan ? <span className="text-xs text-[var(--ink-2)]">{copy.includedByPackage}</span> : null}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2 md:col-span-2">
            <div className="min-w-[14rem] flex-1">
              <FormInput
                name="tenantFeatureEntitlement"
                label={copy.fieldEntitlement}
                value={entitlementDraft}
                onChange={setEntitlementDraft}
                autoComplete="section-tenant off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="beta.dashboard"
                {...autofillIgnoreProps}
              />
            </div>
            <button type="button" onClick={addEntitlement} className="ui-secondary-button">{copy.addEntitlement}</button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm md:col-span-2">
            {(form.featureEntitlements ?? []).length > 0 ? form.featureEntitlements?.map((featureKey) => (
              <span key={featureKey} className="inline-flex items-center gap-2">
                <span className="ui-mono text-[var(--ink)]">{featureKey}</span>
                <button
                  type="button"
                  onClick={() => updateForm({ featureEntitlements: form.featureEntitlements?.filter((item) => item !== featureKey) })}
                  aria-label={`${copy.remove} ${featureKey}`}
                  className="ui-inline-button"
                >
                  {copy.remove}
                </button>
              </span>
            )) : <span className="text-[var(--ink-2)]">{copy.noEntitlements}</span>}
          </div>
          <p className="text-sm text-[var(--ink-2)] md:col-span-2">
            <span className="font-medium text-[var(--ink)]">{copy.effectiveAccess}: </span>
            <span className="ui-mono">{[...effectiveModules, ...effectiveEntitlements].join(', ')}</span>
          </p>
        </FormSection>

        <FormSection title={copy.sectionBranding}>
          <FormInput
            type="color"
            label={copy.fieldPrimaryColor}
            value={form.primaryColor ?? emptyTenantForm.primaryColor ?? ''}
            onChange={(primaryColor) => updateForm({ primaryColor })}
            className="h-10 cursor-pointer p-1"
          />
          <FormInput
            type="color"
            label={copy.fieldAccentColor}
            value={form.accentColor ?? emptyTenantForm.accentColor ?? ''}
            onChange={(accentColor) => updateForm({ accentColor })}
            className="h-10 cursor-pointer p-1"
          />
          <FormSelect
            label={copy.fieldTheme}
            value={form.defaultThemeMode}
            options={[
              { value: 'SYSTEM', label: copy.themeSystem },
              { value: 'LIGHT', label: copy.themeLight },
              { value: 'DARK', label: copy.themeDark }
            ]}
            onChange={(value) => updateForm({ defaultThemeMode: value as TenantThemeMode })}
          />
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-[var(--ink)]">
            <input
              type="checkbox"
              checked={form.allowUserThemeOverride}
              onChange={(event) => updateForm({ allowUserThemeOverride: event.target.checked })}
            />
            {copy.allowThemeOverride}
          </label>
        </FormSection>

        {tenant ? null : (
          <FormSection title={copy.sectionAdmin}>
            <FormInput
              name="initialAdminFullName"
              label={copy.fieldAdminName}
              value={form.initialAdminFullName}
              onChange={(initialAdminFullName) => updateForm({ initialAdminFullName })}
              autoComplete="section-workspace-admin off"
              {...autofillIgnoreProps}
              required
            />
            <FormInput
              name="initialAdminEmail"
              type="email"
              label={copy.fieldAdminEmail}
              value={form.initialAdminEmail}
              onChange={(initialAdminEmail) => updateForm({ initialAdminEmail })}
              autoComplete="section-workspace-admin email"
              {...autofillIgnoreProps}
              required
            />
            <FormInput
              name="temporaryPassword"
              type="password"
              label={copy.fieldTemporaryPassword}
              value={form.temporaryPassword}
              onChange={(temporaryPassword) => updateForm({ temporaryPassword })}
              autoComplete="section-workspace-admin new-password"
              {...autofillIgnoreProps}
              required
            />
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-[var(--ink)]">
              <input
                type="checkbox"
                checked={form.requirePasswordChangeOnFirstAccess}
                onChange={(event) => updateForm({ requirePasswordChangeOnFirstAccess: event.target.checked })}
              />
              {copy.requirePasswordChange}
            </label>
          </FormSection>
        )}

        {error ? <div className="ui-notice-error">{error}</div> : null}

        <div className="flex gap-2">
          <button type="submit" disabled={submitting} className="ui-primary-button">
            {submitting ? copy.saving : tenant ? copy.updateTenant : copy.createTenant}
          </button>
          <button type="button" onClick={onCancel} className="ui-secondary-button">{copy.cancel}</button>
        </div>
      </form>

      {tenant ? (
        <>
          {notice ? <div className="ui-notice-success">{notice}</div> : null}

          <section className="space-y-3 border-t border-[color:var(--line)] pt-4">
            <h3 className="text-sm font-semibold text-[var(--ink)]">{copy.sectionFlags}</h3>
            {flagsError ? <div className="ui-notice-warning">{flagsError}</div> : null}
            {flagsLoading ? <div className="ui-notice-neutral">{copy.flagsLoading}</div> : null}
            {!flagsLoading && !flagsError && flags.length === 0 ? <p className="text-sm text-[var(--ink-2)]">{copy.flagsEmpty}</p> : null}
            {flags.map((flag) => (
              <div key={flag.key} className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--line-soft)] pb-2 text-sm">
                <div>
                  <p className="ui-mono text-[var(--ink)]">{flag.key}</p>
                  <p className="text-xs text-[var(--ink-2)]">{flag.scope === 'TENANT' ? copy.flagOverride : copy.flagGlobal}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={flag.enabled ? 'active' : 'inactive'} />
                  <label className="inline-flex items-center gap-2 text-[var(--ink)]">
                    <input
                      type="checkbox"
                      checked={flag.enabled}
                      disabled={savingFlagKey === flag.key}
                      onChange={(event) => void runFlagChange(flag.key, (id) => featureFlagService.setTenantOverride(id, flag.key, event.target.checked))}
                    />
                    {copy.flagEnable}
                  </label>
                  {flag.scope === 'TENANT' ? (
                    <button
                      type="button"
                      disabled={savingFlagKey === flag.key}
                      onClick={() => void runFlagChange(flag.key, (id) => featureFlagService.clearTenantOverride(id, flag.key))}
                      className="ui-inline-button"
                    >
                      {copy.flagReset}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-3 border-t border-[color:var(--line)] pt-4">
            <h3 className="text-sm font-semibold text-[var(--ink)]">{copy.sectionUsage}</h3>
            {usageError ? <div className="ui-notice-warning">{usageError}</div> : null}
            {usageLoading ? <div className="ui-notice-neutral">{copy.usageLoading}</div> : null}
            {!usageLoading && !usageError && usage.length === 0 ? <p className="text-sm text-[var(--ink-2)]">{copy.usageEmpty}</p> : null}
            {usage.length > 0 ? (
              <DataTable
                columns={usageColumns}
                rows={usage}
                getRowKey={(metric) => `${metric.metricKey}-${metric.source}-${metric.metricDate}`}
              />
            ) : null}
          </section>

          <section className="space-y-3 border-t border-[color:var(--line)] pt-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--ink)]">{copy.sectionSupport}</h3>
              <p className="text-sm text-[var(--ink-2)]">{copy.supportDescription}</p>
            </div>
            {session?.user.impersonation ? (
              <div className="ui-notice-warning">{copy.supportActive}</div>
            ) : tenant.platformOwner ? (
              <div className="ui-notice-warning">{copy.supportOwnerOnly}</div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                  <FormTextarea
                    label={copy.fieldReason}
                    value={reason}
                    onChange={setReason}
                    description={copy.reasonHint}
                    placeholder={copy.reasonPlaceholder}
                    disabled={supportSubmitting}
                  />
                  <FormSelect
                    label={copy.fieldDuration}
                    value={duration}
                    options={durationOptions.map((minutes) => ({
                      value: String(minutes),
                      label: copy.durationOption.replace('{minutes}', String(minutes))
                    }))}
                    onChange={setDuration}
                    disabled={supportSubmitting}
                  />
                </div>
                {supportError ? <div className="ui-notice-error">{supportError}</div> : null}
                <button type="button" onClick={() => void handleStartSupport()} disabled={supportSubmitting} className="ui-primary-button">
                  {supportSubmitting ? copy.startingSupport : copy.startSupport}
                </button>
              </>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
