'use client';

import { useState } from 'react';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { AccountSecurityPanel } from '@/shared/settings/account-security-panel';
import { buildWorkspaceConfigurationOverview, type WorkspaceConfigurationField } from '@/shared/settings/workspace-configuration';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { tenantService } from '@/shared/services/tenant-service';

function FieldCard({ field }: { field: WorkspaceConfigurationField }) {
  return (
    <div className="ui-surface-muted p-4 lg:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">
        {field.label}
      </p>
      <div className="mt-3 flex items-start justify-between gap-3">
        <p className="text-base font-semibold text-[color:var(--app-shell-heading)] break-all">{field.value}</p>
        {field.badgeStatus && field.badgeStatus !== 'neutral' ? <StatusBadge status={field.badgeStatus} /> : null}
      </div>
      <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">{field.description}</p>
    </div>
  );
}

function monogram(scopeName: string) {
  const segments = scopeName.trim().split(/\s+/).slice(0, 2);
  return segments.map((segment) => segment.charAt(0).toUpperCase()).join('') || 'PT';
}

export function WorkspaceConfigurationOverview() {
  const platform = useFrontendPlatform();
  const overview = buildWorkspaceConfigurationOverview(platform);
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formName, setFormName] = useState(platform.branding.scopeName);
  const [formLogoUrl, setFormLogoUrl] = useState(platform.branding.logoUrl || '');
  const [formPrimary, setFormPrimary] = useState(platform.user?.tenantPrimaryColor || '#000000');
  const [formAccent, setFormAccent] = useState(platform.user?.tenantAccentColor || '#2563eb');
  const [formThemeMode, setFormThemeMode] = useState(platform.user?.tenantDefaultThemeMode || 'SYSTEM');

  function openEditor() {
    setFormName(platform.branding.scopeName);
    setFormLogoUrl(platform.branding.logoUrl || '');
    setFormPrimary(platform.user?.tenantPrimaryColor || '#000000');
    setFormAccent(platform.user?.tenantAccentColor || '#2563eb');
    setFormThemeMode(platform.user?.tenantDefaultThemeMode || 'SYSTEM');
    setError(null);
    setIsEditorOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!platform.user?.tenantId) return;
    
    setSubmitting(true);
    setError(null);

    try {
      await tenantService.update(platform.user.tenantId, {
        name: formName,
        code: platform.branding.tenantCode || '',
        logoUrl: formLogoUrl || null,
        primaryColor: formPrimary,
        accentColor: formAccent,
        defaultThemeMode: formThemeMode as any,
        allowUserThemeOverride: platform.user?.tenantAllowUserThemeOverride ?? true,
        contractedModules: platform.modules.contractedProducts.map(m => m.code),
        featureEntitlements: platform.user?.featureEntitlements ?? []
      });
      setIsEditorOpen(false);
      window.location.reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={sharedPageStackClass}>
      <PageTitle 
        eyebrow="Settings" 
        title="Workspace Configuration" 
        description={overview.pageDescription}
        actions={
          platform.workspace.isPlatformOwnerTenant || platform.workspace.hasFullPlatformVisibility ? (
            <button onClick={openEditor} className="ui-primary-button">
              Edit Workspace
            </button>
          ) : undefined
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <PageSection
          title={overview.identityTitle}
          description={overview.identityDescription}
          className="p-5 lg:p-6"
          style={platform.branding.style}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--tenant-accent)]">
            {overview.identityEyebrow}
          </p>
          <div className="mt-4 flex justify-end">
            <div className="rounded-full border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
              {overview.planFields[2].value}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {overview.identityFields.map((field) => (
              <FieldCard key={field.label} field={field} />
            ))}
          </div>
        </PageSection>

        <PageSection
          title="Plan and Status"
          description="Keep the current workspace contract, readiness, and visibility model explicit before exposing future editing flows."
        >
          <div className="space-y-3">
            {overview.planFields.map((field) => (
              <FieldCard key={field.label} field={field} />
            ))}
          </div>
        </PageSection>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <PageSection title="Branding Preview" description={overview.brandingDescription}>
          <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]" style={platform.branding.style}>
            <div className="ui-surface-muted p-5 overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] text-lg font-semibold text-[color:var(--tenant-accent)]">
                  {platform.branding.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={platform.branding.logoUrl} alt={`${platform.branding.scopeName} logo`} className="h-full w-full object-contain" />
                  ) : (
                    monogram(platform.branding.scopeName)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--tenant-accent)] truncate">
                    Controlled Accent Preview
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)] truncate">
                    {platform.branding.scopeName}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--app-shell-muted)] break-words">
                    {overview.brandingPolicy}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <span className="rounded-full border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
                  Accent chip
                </span>
                <span className="rounded-full border border-[color:var(--app-shell-border)] bg-[color:var(--tenant-primary-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-heading)]">
                  Primary support
                </span>
                <button
                  type="button"
                  className="ui-primary-button"
                >
                  Sample action
                </button>
              </div>
            </div>

            <div className="grid gap-3">
              {overview.brandingFields.map((field) => (
                <FieldCard key={field.label} field={field} />
              ))}
            </div>
          </div>
        </PageSection>

        <PageSection title="Theme Policy" description={overview.themeDescription}>
          <div className="grid gap-3">
            {overview.themeFields.map((field) => (
              <FieldCard key={field.label} field={field} />
            ))}
          </div>
        </PageSection>
      </div>

      <PageSection title="Contracted Modules" description={overview.modulesDescription}>
        {platform.modules.error ? (
          <div className="ui-notice-error">{platform.modules.error}</div>
        ) : platform.modules.loading ? (
          <div className="ui-notice-neutral">
            Loading workspace contract data...
          </div>
        ) : overview.contractedModules.length === 0 ? (
          <div className="ui-notice-neutral px-4 py-5">
            {overview.modulesEmptyDescription}
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {overview.contractedModules.map((moduleItem) => (
              <article
                key={moduleItem.code}
                className="ui-surface-muted p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">
                      {moduleItem.code}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">{moduleItem.name}</h3>
                    <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">{moduleItem.description}</p>
                  </div>
                  <StatusBadge status={moduleItem.availabilityStatus} />
                </div>

                <div className="mt-5 grid gap-3">
                  <div className="ui-surface-panel p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">{moduleItem.availabilityLabel}</p>
                      <StatusBadge status={moduleItem.availabilityStatus} />
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">{moduleItem.availabilityDescription}</p>
                  </div>

                  <div className="ui-surface-panel p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">{moduleItem.exposureLabel}</p>
                      <StatusBadge status={moduleItem.exposureStatus} />
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">{moduleItem.exposureDescription}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="mt-5 text-sm text-[color:var(--app-shell-muted)]">{overview.coreAccessNote}</p>
      </PageSection>

      <AccountSecurityPanel user={platform.user} />

      {/* EDIT DRAWER */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md h-full overflow-y-auto bg-[color:var(--app-shell-surface)] p-[var(--space-6)] shadow-2xl animate-in slide-in-from-right duration-300 border-l border-[color:var(--app-shell-border)]">
            <div className="mb-8 flex items-center justify-between">
               <div>
                 <h2 className="text-xl font-bold tracking-tight text-[color:var(--app-shell-heading)]">
                   Edit Workspace
                 </h2>
                 <p className="text-sm mt-1 text-[color:var(--app-shell-muted)]">
                   Update branding, colors, and workspace name.
                 </p>
               </div>
               <button 
                 onClick={() => setIsEditorOpen(false)} 
                 className="rounded-full p-2 text-[color:var(--app-shell-muted)] hover:bg-[color:var(--app-shell-panel-muted)] hover:text-[color:var(--app-shell-heading)]"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>

            <div className="space-y-6">
               <form onSubmit={handleSave} className="space-y-5 flex flex-col h-full">
                  <FormInput
                    label="Workspace Name"
                    value={formName}
                    onChange={setFormName}
                    placeholder="E.g. Acme Corp"
                    disabled={submitting}
                    required
                  />
                  <FormInput
                    label="Logo URL"
                    value={formLogoUrl}
                    onChange={setFormLogoUrl}
                    placeholder="https://example.com/logo.png"
                    disabled={submitting}
                  />

                  <div className="grid gap-3 grid-cols-2">
                    <FormInput
                      label="Primary Color"
                      value={formPrimary}
                      onChange={setFormPrimary}
                      type="color"
                      disabled={submitting}
                      className="h-10 cursor-pointer p-1"
                    />
                    <FormInput
                      label="Accent Color"
                      value={formAccent}
                      onChange={setFormAccent}
                      type="color"
                      disabled={submitting}
                      className="h-10 cursor-pointer p-1"
                    />
                  </div>
                  
                  <FormSelect
                    label="Default Theme"
                    value={formThemeMode}
                    options={[
                      {value: 'SYSTEM', label: 'System Default'},
                      {value: 'LIGHT', label: 'Force Light Mode'},
                      {value: 'DARK', label: 'Force Dark Mode'}
                    ]}
                    onChange={(val) => setFormThemeMode(val as 'LIGHT' | 'DARK' | 'SYSTEM')}
                    disabled={submitting}
                  />

                  {error && (
                    <div className="ui-notice-error mt-4">{error}</div>
                  )}

                  <div className="mt-8 pt-6 border-t border-[color:var(--app-shell-border)] flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting || !formName}
                      className="ui-primary-button"
                    >
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={() => setIsEditorOpen(false)} className="ui-secondary-button">
                      Cancel
                    </button>
                  </div>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
