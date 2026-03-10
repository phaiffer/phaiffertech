import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModuleGuard } from '@/shared/modules/module-guard';

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

    expect(screen.getByText('CRM is unavailable in the current context')).toBeInTheDocument();
    expect(screen.getByText(/feature exposure is still disabled/i)).toBeInTheDocument();
  });
});
