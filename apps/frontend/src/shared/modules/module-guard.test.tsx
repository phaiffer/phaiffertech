import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModuleGuard } from '@/shared/modules/module-guard';
import { AppI18nProvider } from '@/shared/i18n/app-i18n-provider';

const { moduleCatalog } = vi.hoisted(() => ({
  moduleCatalog: {
    modules: [
      {
        code: 'CRM',
        name: 'CRM',
        description: 'Commercial workspace',
        enabled: true,
        moduleEnabled: true,
        featureFlagEnabled: true,
        available: true
      }
    ],
    loading: false,
    error: null
  }
}));

vi.mock('@/shared/modules/use-module-catalog', () => ({
  useModuleCatalog: () => moduleCatalog,
  findModule: (modules: Array<{ code: string }>, moduleCode: string) => modules.find((moduleItem) => moduleItem.code === moduleCode)
}));

describe('ModuleGuard', () => {
  beforeEach(() => {
    window.localStorage.clear();
    moduleCatalog.modules = [
      {
        code: 'CRM',
        name: 'CRM',
        description: 'Commercial workspace',
        enabled: true,
        moduleEnabled: true,
        featureFlagEnabled: true,
        available: true
      }
    ];
    moduleCatalog.loading = false;
    moduleCatalog.error = null;
  });

  it('renders children when the module is contracted and exposed', () => {
    render(
      <ModuleGuard moduleCode="CRM">
        <div>CRM workspace</div>
      </ModuleGuard>
    );

    expect(screen.getByText('CRM workspace')).toBeInTheDocument();
  });

  it('explains when the module is not contracted for the workspace', () => {
    moduleCatalog.modules = [];

    render(
      <ModuleGuard moduleCode="CRM">
        <div>CRM workspace</div>
      </ModuleGuard>
    );

    expect(screen.getByText('CRM is not contracted for this workspace')).toBeInTheDocument();
    expect(screen.getByText(/Ask your tenant administrator to add it to the workspace contract/i)).toBeInTheDocument();
  });

  it('explains when the module is contracted but unavailable in the current context', () => {
    moduleCatalog.modules = [
      {
        code: 'CRM',
        name: 'CRM',
        description: 'Commercial workspace',
        enabled: true,
        moduleEnabled: true,
        featureFlagEnabled: false,
        available: false
      }
    ];

    render(
      <ModuleGuard moduleCode="CRM">
        <div>CRM workspace</div>
      </ModuleGuard>
    );

    expect(screen.getByText('CRM is disabled in the current workspace')).toBeInTheDocument();
    expect(screen.getByText(/feature exposure is currently disabled/i)).toBeInTheDocument();
  });

  it('keeps route access blocked when the module is contracted but not available in the workspace', () => {
    moduleCatalog.modules = [
      {
        code: 'CRM',
        name: 'CRM',
        description: 'Commercial workspace',
        enabled: true,
        moduleEnabled: true,
        featureFlagEnabled: true,
        available: false
      }
    ];

    render(
      <ModuleGuard moduleCode="CRM">
        <div>CRM workspace</div>
      </ModuleGuard>
    );

    expect(screen.getByText('CRM is unavailable in the current workspace')).toBeInTheDocument();
    expect(screen.getByText(/workspace context is not ready to open it yet/i)).toBeInTheDocument();
  });

  it('explains blocked access in Portuguese when pt-BR is active', () => {
    window.localStorage.setItem('phaiffertech-locale', 'pt-BR');
    moduleCatalog.modules = [];

    render(
      <AppI18nProvider>
        <ModuleGuard moduleCode="CRM">
          <div>CRM workspace</div>
        </ModuleGuard>
      </AppI18nProvider>
    );

    expect(screen.queryByText('CRM workspace')).not.toBeInTheDocument();
    expect(screen.getByText('CRM nao esta contratado neste ambiente')).toBeInTheDocument();
    expect(screen.getByText(/Peca ao administrador para incluir o modulo no contrato do ambiente/)).toBeInTheDocument();
  });
});
