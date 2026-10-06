'use client';

import { ReactNode } from 'react';
import { useAppI18n } from '@/shared/i18n/app-i18n-provider';
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
  const { locale, messages } = useAppI18n();
  const copy = messages.moduleGuard;
  const { modules, loading, error } = useModuleCatalog();
  const moduleItem = findModule(modules, moduleCode);
  const boundary = resolveModuleBoundaryCapability(moduleCode, moduleItem, locale);

  if (loading) {
    return (
      <ModuleGuardNotice
        title={copy.checkingTitle.replace('{moduleCode}', moduleCode)}
        description={copy.checkingDescription}
        tone="neutral"
      />
    );
  }

  if (error) {
    return (
      <ModuleGuardNotice
        title={copy.errorTitle.replace('{moduleCode}', moduleCode)}
        description={copy.errorDescription}
        tone="error"
      />
    );
  }

  if (!boundary.interactive) {
    return (
      <ModuleGuardNotice
        title={boundary.title ?? copy.unavailableTitle.replace('{moduleCode}', moduleCode)}
        description={boundary.description ?? copy.unavailableDescription}
        tone="warn"
      />
    );
  }

  return <>{children}</>;
}
