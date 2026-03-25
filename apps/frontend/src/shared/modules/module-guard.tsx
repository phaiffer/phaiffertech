'use client';

import { ReactNode } from 'react';
import { resolveModuleBoundaryCapability } from '@/shared/modules/module-capability';
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
    ? 'ui-notice-error'
    : tone === 'warn'
      ? 'ui-notice-warning'
      : 'ui-surface-panel text-[color:var(--app-shell-text)]';

  return (
    <div className={`${classes} px-5 py-5`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-sm">{description}</p>
    </div>
  );
}

export function ModuleGuard({ moduleCode, children }: ModuleGuardProps) {
  const { modules, loading, error } = useModuleCatalog();
  const moduleItem = findModule(modules, moduleCode);
  const boundary = resolveModuleBoundaryCapability(moduleCode, moduleItem);

  if (loading) {
    return (
      <ModuleGuardNotice
        title={`Checking ${moduleCode} workspace access`}
        description="The authenticated shell is validating the workspace contract and current module exposure before opening this workspace."
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

  if (!boundary.interactive) {
    return (
      <ModuleGuardNotice
        title={boundary.title ?? `${moduleCode} is unavailable in the current workspace`}
        description={boundary.description ?? 'The module cannot be opened from the current workspace context.'}
        tone="warn"
      />
    );
  }

  return <>{children}</>;
}
