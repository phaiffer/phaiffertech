'use client';

import { ReactNode } from 'react';
import { findModule, useModuleCatalog } from '@/shared/modules/use-module-catalog';

type ModuleGuardProps = {
  moduleCode: string;
  children: ReactNode;
};

export function ModuleGuard({ moduleCode, children }: ModuleGuardProps) {
  const { modules, loading, error } = useModuleCatalog();
  const moduleItem = findModule(modules, moduleCode);

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
        Validando acesso ao módulo...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        Não foi possível validar o status do módulo.
      </div>
    );
  }

  if (!moduleItem || !moduleItem.moduleEnabled) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Este módulo não está habilitado para o tenant atual.
      </div>
    );
  }

  if (!moduleItem.featureFlagEnabled) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Este módulo está temporariamente indisponível por feature flag.
      </div>
    );
  }

  return <>{children}</>;
}
