'use client';

import { ReactNode } from 'react';
import { findModule, useModuleCatalog } from '@/shared/modules/use-module-catalog';

type ModuleGuardProps = {
  moduleCode: string;
  children: ReactNode;
};

function ModuleGuardNotice({
  title,
  description,
  tone
}: {
  title: string;
  description: string;
  tone: 'neutral' | 'warn' | 'error';
}) {
  const classes = tone === 'error'
    ? 'border-rose-200 bg-rose-50 text-rose-700'
    : tone === 'warn'
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] text-[color:var(--app-shell-text)]';

  return (
    <div className={`rounded-3xl border px-5 py-5 shadow-card ${classes}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm">{description}</p>
    </div>
  );
}

export function ModuleGuard({ moduleCode, children }: ModuleGuardProps) {
  const { modules, loading, error } = useModuleCatalog();
  const moduleItem = findModule(modules, moduleCode);

  if (loading) {
    return (
      <ModuleGuardNotice
        title={`Checking ${moduleCode} workspace access`}
        description="The authenticated shell is validating the tenant contract and current module exposure before opening this workspace."
        tone="neutral"
      />
    );
  }

  if (error) {
    return (
      <ModuleGuardNotice
        title={`${moduleCode} availability could not be verified`}
        description="The current workspace could not confirm module contract status. Try again after the module catalog finishes syncing."
        tone="error"
      />
    );
  }

  if (!moduleItem || !moduleItem.moduleEnabled) {
    return (
      <ModuleGuardNotice
        title={`${moduleCode} is not contracted for this workspace`}
        description={`This tenant does not currently expose the ${moduleCode} module. Ask your tenant administrator to add it to the workspace contract before trying again.`}
        tone="warn"
      />
    );
  }

  if (!moduleItem.featureFlagEnabled) {
    return (
      <ModuleGuardNotice
        title={`${moduleCode} is unavailable in the current context`}
        description="The module is contracted, but feature exposure is still disabled for this workspace. Navigation stays blocked until the feature is re-enabled."
        tone="warn"
      />
    );
  }

  return <>{children}</>;
}
