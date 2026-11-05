'use client';

import { FormEvent, ReactNode, useState } from 'react';
import { AccountTabs } from '@/modules/account/account-tabs';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { useAppI18n } from '@/shared/i18n/app-i18n-provider';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { DARK_THEME_SUPPORTED } from '@/shared/lib/tenant-branding';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { tenantService } from '@/shared/services/tenant-service';
import { AccountSecurityPanel } from '@/shared/settings/account-security-panel';
import { buildWorkspaceConfigurationOverview, type WorkspaceConfigurationField } from '@/shared/settings/workspace-configuration';
import { FormInput } from '@/shared/ui/form-input';
import { FormSection } from '@/shared/ui/form-section';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';

type ThemeModeOption = 'LIGHT' | 'DARK' | 'SYSTEM';

// The field value already says the state in words, so only the dot is added.
const statusDotTones: Record<string, string> = {
  active: 'done',
  pending: 'waiting',
  warn: 'warn',
  info: 'in-progress',
  alert: 'danger'
};

function SettingsSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-t border-[color:var(--line)] pt-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--ink)]">{title}</h2>
        {description ? <p className="text-sm text-[var(--ink-2)]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function FieldList({ fields }: { fields: WorkspaceConfigurationField[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 md:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label}>
          <dt className="text-xs text-[var(--ink-2)]">{field.label}</dt>
          <dd className="flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--ink)]">
            <span className="break-all">{field.value}</span>
            {field.badgeStatus && field.badgeStatus !== 'neutral' ? (
              <span className="ui-status-dot" data-status={statusDotTones[field.badgeStatus]} aria-hidden="true" />
            ) : null}
          </dd>
          <dd className="text-xs text-[var(--ink-2)]">{field.description}</dd>
        </div>
      ))}
    </dl>
  );
}

function monogram(scopeName: string) {
  const segments = scopeName.trim().split(/\s+/).slice(0, 2);
  return segments.map((segment) => segment.charAt(0).toUpperCase()).join('') || 'PT';
}

export function WorkspaceConfigurationOverview() {
  const platform = useFrontendPlatform();
  const { messages } = useAppI18n();
  const copy = messages.workspaceSettings;
  const overview = buildWorkspaceConfigurationOverview(platform, copy.overview);
  const canEdit = platform.workspace.isPlatformOwnerTenant || platform.workspace.hasFullPlatformVisibility;

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formName, setFormName] = useState(platform.branding.scopeName);
  const [formLogoUrl, setFormLogoUrl] = useState(platform.branding.logoUrl || '');
  const [formPrimary, setFormPrimary] = useState(platform.user?.tenantPrimaryColor || '#000000');
  const [formAccent, setFormAccent] = useState(platform.user?.tenantAccentColor || '#2563eb');
  const [formThemeMode, setFormThemeMode] = useState<ThemeModeOption>(platform.user?.tenantDefaultThemeMode || 'SYSTEM');

  function openEditor() {
    setFormName(platform.branding.scopeName);
    setFormLogoUrl(platform.branding.logoUrl || '');
    setFormPrimary(platform.user?.tenantPrimaryColor || '#000000');
    setFormAccent(platform.user?.tenantAccentColor || '#2563eb');
    setFormThemeMode(platform.user?.tenantDefaultThemeMode || 'SYSTEM');
    setError(null);
    setIsEditorOpen(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!platform.user?.tenantId) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // featureEntitlements stays out: the session holds the effective list, and saving it
      // here would turn package defaults into manual grants.
      await tenantService.update(platform.user.tenantId, {
        name: formName,
        code: platform.branding.tenantCode || '',
        logoUrl: formLogoUrl || null,
        primaryColor: formPrimary,
        accentColor: formAccent,
        defaultThemeMode: formThemeMode,
        allowUserThemeOverride: platform.user?.tenantAllowUserThemeOverride ?? true,
        contractedModules: platform.modules.contractedProducts.map((moduleItem) => moduleItem.code)
      });
      setIsEditorOpen(false);
      window.location.reload();
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.editor.saveError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={sharedPageStackClass}>
      <AccountTabs />

      <PageTitle
        title={copy.title}
        description={overview.pageDescription}
        actions={canEdit ? (
          <button type="button" onClick={openEditor} className="ui-primary-button">{copy.editAction}</button>
        ) : undefined}
      />

      {isEditorOpen ? (
        <form onSubmit={handleSave} className="max-w-3xl space-y-4 rounded-md border border-[color:var(--line)] p-4">
          <FormSection title={copy.editor.title}>
            <FormInput
              label={copy.editor.nameLabel}
              value={formName}
              onChange={setFormName}
              placeholder={copy.editor.namePlaceholder}
              disabled={submitting}
              required
            />
            <FormInput
              label={copy.editor.logoLabel}
              value={formLogoUrl}
              onChange={setFormLogoUrl}
              placeholder={copy.editor.logoPlaceholder}
              disabled={submitting}
            />
            <FormInput
              label={copy.editor.primaryLabel}
              value={formPrimary}
              onChange={setFormPrimary}
              type="color"
              disabled={submitting}
              className="h-10 cursor-pointer p-1"
            />
            <FormInput
              label={copy.editor.accentLabel}
              value={formAccent}
              onChange={setFormAccent}
              type="color"
              disabled={submitting}
              className="h-10 cursor-pointer p-1"
            />
            {DARK_THEME_SUPPORTED ? (
              <FormSelect
                label={copy.editor.themeLabel}
                value={formThemeMode}
                options={[
                  { value: 'SYSTEM', label: copy.editor.themeSystem },
                  { value: 'LIGHT', label: copy.editor.themeLight },
                  { value: 'DARK', label: copy.editor.themeDark }
                ]}
                onChange={(value) => setFormThemeMode(value as ThemeModeOption)}
                disabled={submitting}
              />
            ) : null}
          </FormSection>

          {error ? <div className="ui-notice-error">{error}</div> : null}

          <div className="flex gap-2">
            <button type="submit" disabled={submitting || !formName} className="ui-primary-button">
              {submitting ? copy.editor.saving : copy.editor.save}
            </button>
            <button type="button" onClick={() => setIsEditorOpen(false)} className="ui-secondary-button">
              {copy.editor.cancel}
            </button>
          </div>
        </form>
      ) : null}

      <SettingsSection title={overview.identityTitle} description={overview.identityDescription}>
        <p className="text-xs font-medium text-[var(--ink-2)]">{overview.identityEyebrow}</p>
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[color:var(--line)] bg-[var(--bg-subtle)] text-lg font-semibold text-[var(--ink)]">
            {platform.branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={platform.branding.logoUrl}
                alt={copy.logoAlt.replace('{name}', platform.branding.scopeName)}
                className="h-full w-full object-contain"
              />
            ) : (
              monogram(platform.branding.scopeName)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <FieldList fields={overview.identityFields} />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title={copy.planSectionTitle} description={copy.planSectionDescription}>
        <FieldList fields={overview.planFields} />
      </SettingsSection>

      <SettingsSection title={copy.modulesSectionTitle} description={overview.modulesDescription}>
        {platform.modules.error ? (
          <div className="ui-notice-error">{platform.modules.error}</div>
        ) : platform.modules.loading ? (
          <div className="ui-notice-neutral">{copy.modulesLoading}</div>
        ) : overview.contractedModules.length === 0 ? (
          <div className="ui-notice-neutral">{overview.modulesEmptyDescription}</div>
        ) : (
          <ul className="divide-y divide-[color:var(--line-soft)]">
            {overview.contractedModules.filter((moduleItem) => moduleItem.code === 'PET').map((moduleItem) => (
              <li key={moduleItem.code} className="flex flex-wrap items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--ink)]">{moduleItem.name}</p>
                  <p className="text-xs text-[var(--ink-2)]">{moduleItem.description}</p>
                </div>
                <div className="text-right text-xs text-[var(--ink-2)]">
                  <p>{moduleItem.availabilityLabel}</p>
                  <p>{moduleItem.exposureLabel}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-[var(--ink-2)]">{overview.coreAccessNote}</p>
      </SettingsSection>

      <SettingsSection title={copy.brandingSectionTitle} description={overview.brandingDescription}>
        <FieldList fields={overview.brandingFields} />
        <p className="text-xs text-[var(--ink-2)]">{overview.brandingPolicy}</p>
      </SettingsSection>

      {DARK_THEME_SUPPORTED ? (
        <SettingsSection title={copy.themeSectionTitle} description={overview.themeDescription}>
          <FieldList fields={overview.themeFields} />
        </SettingsSection>
      ) : null}

      <AccountSecurityPanel user={platform.user} />
    </div>
  );
}
