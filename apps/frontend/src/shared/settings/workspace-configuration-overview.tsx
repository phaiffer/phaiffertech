'use client';

import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { AccountSecurityPanel } from '@/shared/settings/account-security-panel';
import { buildWorkspaceConfigurationOverview, type WorkspaceConfigurationField } from '@/shared/settings/workspace-configuration';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';

function FieldCard({ field }: { field: WorkspaceConfigurationField }) {
  return (
    <div className="ui-surface-muted p-4 lg:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">
        {field.label}
      </p>
      <div className="mt-3 flex items-start justify-between gap-3">
        <p className="text-base font-semibold text-[color:var(--app-shell-heading)]">{field.value}</p>
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

  return (
    <div className={sharedPageStackClass}>
      <PageTitle eyebrow="Settings" title="Workspace Configuration" description={overview.pageDescription} />

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
            <div className="ui-surface-muted p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] text-lg font-semibold text-[color:var(--tenant-accent)]">
                  {platform.branding.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={platform.branding.logoUrl} alt={`${platform.branding.scopeName} logo`} className="h-full w-full object-contain" />
                  ) : (
                    monogram(platform.branding.scopeName)
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--tenant-accent)]">
                    Controlled Accent Preview
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-[color:var(--app-shell-heading)]">
                    {platform.branding.scopeName}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">
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
    </div>
  );
}
