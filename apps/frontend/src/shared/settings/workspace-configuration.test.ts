import { describe, expect, it } from 'vitest';
import { ptBRMessages } from '@/shared/i18n/messages/pt-br';
import type { FrontendPlatformState } from '@/shared/platform/frontend-platform.types';
import { buildWorkspaceConfigurationOverview } from '@/shared/settings/workspace-configuration';

const copy = ptBRMessages.workspaceSettings.overview;

function buildCustomerPlatform(overrides: Partial<FrontendPlatformState> = {}): FrontendPlatformState {
  return {
    user: {
      userId: 'user-1',
      email: 'dono@petshop.test',
      fullName: 'Ana Souza',
      tenantId: 'tenant-1',
      tenantName: 'Pet Shop Patas',
      tenantCode: 'patas',
      tenantLogoUrl: null,
      tenantPrimaryColor: '#0f172a',
      tenantAccentColor: '#2563eb',
      tenantDefaultThemeMode: 'LIGHT',
      tenantAllowUserThemeOverride: false,
      platformOwner: false,
      platformAdmin: false,
      role: 'TENANT_OWNER',
      roles: ['TENANT_OWNER'],
      permissions: []
    },
    theme: { mode: 'light', setMode: () => undefined, tenantDefaultMode: 'light', canOverride: false },
    branding: { logoUrl: null, scopeName: 'Pet Shop Patas', tenantCode: 'patas', style: {} },
    workspace: {
      workspaceLabel: 'Workspace',
      accessLabel: 'Contracted SaaS workspace',
      isPlatformOwnerTenant: false,
      hasSystemAdminRole: false,
      hasFullPlatformVisibility: false,
      canManagePlatformAdministration: false
    },
    modules: {
      items: [
        {
          code: 'PET',
          name: 'Gestão Pet',
          description: 'Banho e tosa',
          enabled: true,
          moduleEnabled: true,
          featureFlagEnabled: true,
          available: true
        }
      ],
      loading: false,
      error: null,
      availableCodes: ['PET'],
      contractedProducts: []
    },
    ...overrides
  } as FrontendPlatformState;
}

describe('buildWorkspaceConfigurationOverview', () => {
  it('renders a customer workspace with pt-BR copy and translated role', () => {
    const overview = buildWorkspaceConfigurationOverview(buildCustomerPlatform(), copy);

    expect(overview.variant).toBe('customer');
    expect(overview.pageDescription).toContain('Pet Shop Patas');
    expect(overview.identityEyebrow).toBe('Seu ambiente');
    expect(overview.identityFields.map((field) => field.value)).toEqual([
      'Ambiente do cliente',
      'Ambiente contratado',
      'patas',
      'Dono do ambiente'
    ]);
    expect(overview.identityFields[3].description).toBe('Usuário conectado: Ana Souza.');
    expect(overview.planFields.map((field) => field.value)).toEqual([
      'Um produto',
      'Ativo',
      'Limitado ao seu ambiente'
    ]);
    expect(overview.themeFields.map((field) => field.value)).toEqual([
      'Claro',
      'Claro',
      'Definida pelo ambiente'
    ]);
    expect(overview.contractedModules[0]).toMatchObject({
      name: 'Gestão Pet',
      availabilityLabel: 'Disponível no ambiente'
    });
  });

  it('interpolates the product count and flags modules still pending release', () => {
    const platform = buildCustomerPlatform();
    const pendingModule = {
      code: 'CRM',
      name: 'CRM',
      description: 'Relacionamento',
      enabled: true,
      moduleEnabled: true,
      featureFlagEnabled: false,
      available: false
    };
    const overview = buildWorkspaceConfigurationOverview(
      { ...platform, modules: { ...platform.modules, items: [...platform.modules.items, pendingModule] } },
      copy
    );

    expect(overview.planFields[0].description).toBe('2 produtos contratados estão ativos neste ambiente.');
    expect(overview.planFields[1]).toMatchObject({ value: 'Em liberação', badgeStatus: 'pending' });
    expect(overview.contractedModules[1]).toMatchObject({
      name: 'CRM',
      description: 'Relacionamento',
      availabilityLabel: 'Aguardando liberação',
      exposureLabel: 'Recursos pendentes',
      exposureStatus: 'warn'
    });
  });

  it('falls back to a humanized role when the code is unknown', () => {
    const platform = buildCustomerPlatform();
    const overview = buildWorkspaceConfigurationOverview(
      { ...platform, user: platform.user ? { ...platform.user, role: 'FRONT_DESK' } : null },
      copy
    );

    expect(overview.identityFields[3].value).toBe('Front Desk');
  });
});
