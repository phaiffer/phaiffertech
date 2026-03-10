'use client';

import type { ReactNode } from 'react';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { buildWorkspaceConfigurationOverview, type WorkspaceConfigurationField } from '@/shared/settings/workspace-configuration';
import { PageTitle } from '@/shared/ui/page-title';

function FieldCard({ field }: { field: WorkspaceConfigurationField }) {
  return (
    <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-4">
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

function SectionCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5 shadow-card">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-[color:var(--app-shell-heading)]">{title}</h2>
        <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">{description}</p>
      </div>
      {children}
    </section>
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
    <div className="space-y-6">
      <PageTitle title="Workspace Configuration" description={overview.pageDescription} />

      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <section
          className="rounded-3xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-5 shadow-card"
          style={platform.branding.style}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--tenant-accent)]">
            {overview.identityEyebrow}
          </p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[color:var(--app-shell-heading)]">{overview.identityTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm text-[color:var(--app-shell-muted)]">{overview.identityDescription}</p>
            </div>
            <div className="rounded-full border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
              {overview.planFields[2].value}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {overview.identityFields.map((field) => (
              <FieldCard key={field.label} field={field} />
            ))}
          </div>
        </section>

        <SectionCard
          title="Plan and Status"
          description="Keep the current workspace contract, readiness, and visibility model explicit before exposing future editing flows."
        >
          <div className="space-y-3">
            {overview.planFields.map((field) => (
              <FieldCard key={field.label} field={field} />
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <SectionCard title="Branding Preview" description={overview.brandingDescription}>
          <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]" style={platform.branding.style}>
            <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-5">
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
                  className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white"
                  style={{ backgroundColor: 'var(--tenant-accent)' }}
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
        </SectionCard>

        <SectionCard title="Theme Policy" description={overview.themeDescription}>
          <div className="grid gap-3">
            {overview.themeFields.map((field) => (
              <FieldCard key={field.label} field={field} />
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Contracted Modules" description={overview.modulesDescription}>
        {platform.modules.error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {platform.modules.error}
          </div>
        ) : platform.modules.loading ? (
          <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-4 py-3 text-sm text-[color:var(--app-shell-muted)]">
            Loading workspace contract data...
          </div>
        ) : overview.contractedModules.length === 0 ? (
          <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-4 py-5 text-sm text-[color:var(--app-shell-muted)]">
            {overview.modulesEmptyDescription}
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {overview.contractedModules.map((moduleItem) => (
              <article
                key={moduleItem.code}
                className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] p-5"
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
                  <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">{moduleItem.availabilityLabel}</p>
                      <StatusBadge status={moduleItem.availabilityStatus} />
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">{moduleItem.availabilityDescription}</p>
                  </div>

                  <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-4">
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
      </SectionCard>
    </div>
  );
}
