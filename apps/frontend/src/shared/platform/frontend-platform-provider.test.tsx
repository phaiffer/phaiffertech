import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FrontendPlatformProvider } from '@/shared/platform/frontend-platform-provider';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { AuthenticatedUser, TenantThemeMode } from '@/shared/types/auth';

const { currentUser, moduleCatalog } = vi.hoisted(() => ({
  currentUser: {
    userId: 'user-1',
    email: 'operator@tenant.test',
    fullName: 'Tenant Operator',
    tenantId: 'tenant-1',
    tenantName: 'Tenant One',
    tenantCode: 'tenant-one',
    tenantLogoUrl: '/logos/tenant-one.png',
    tenantPrimaryColor: '#0f172a',
    tenantAccentColor: '#2563eb',
    tenantDefaultThemeMode: 'LIGHT' as TenantThemeMode,
    tenantAllowUserThemeOverride: true,
    platformOwner: false,
    platformAdmin: false,
    role: 'TENANT_ADMIN',
    roles: ['TENANT_ADMIN'],
    permissions: ['crm.dashboard.read']
  } as AuthenticatedUser,
  moduleCatalog: {
    modules: [
      {
        code: 'CORE_PLATFORM',
        name: 'Core Platform',
        description: 'Core workspace',
        enabled: true,
        moduleEnabled: true,
        featureFlagEnabled: true,
        available: true
      },
      {
        code: 'CRM',
        name: 'CRM',
        description: 'CRM module',
        enabled: true,
        moduleEnabled: true,
        featureFlagEnabled: true,
        available: true
      },
      {
        code: 'IOT',
        name: 'IoT System',
        description: 'IoT module',
        enabled: true,
        moduleEnabled: true,
        featureFlagEnabled: true,
        available: false
      }
    ],
    loading: false,
    error: null
  }
}));

vi.mock('@/shared/auth/use-auth', () => ({
  useAuth: () => ({
    session: {
      user: currentUser
    }
  })
}));

vi.mock('@/shared/modules/use-module-catalog', () => ({
  useModuleCatalog: () => moduleCatalog
}));

function PlatformConsumer() {
  const { branding, modules, theme, workspace } = useFrontendPlatform();

  return (
    <div>
      <span data-testid="theme-mode">{theme.mode}</span>
      <span data-testid="tenant-default">{theme.tenantDefaultMode}</span>
      <span data-testid="workspace-label">{workspace.workspaceLabel}</span>
      <span data-testid="full-visibility">{workspace.hasFullPlatformVisibility ? 'yes' : 'no'}</span>
      <span data-testid="contracted-products">{modules.contractedProducts.map((moduleItem) => moduleItem.code).join(',')}</span>
      <span data-testid="branding-scope">{branding.scopeName}</span>
      <button type="button" onClick={() => theme.setMode('dark')}>
        set-dark
      </button>
    </div>
  );
}

describe('FrontendPlatformProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = '';
    currentUser.tenantDefaultThemeMode = 'LIGHT';
    currentUser.tenantAllowUserThemeOverride = true;
    currentUser.platformOwner = false;
    currentUser.platformAdmin = false;
    currentUser.role = 'TENANT_ADMIN';
    currentUser.roles = ['TENANT_ADMIN'];
  });

  it('applies stored theme overrides and exposes contracted platform metadata', async () => {
    window.localStorage.setItem('app-shell-theme', 'dark');

    render(
      <FrontendPlatformProvider>
        <PlatformConsumer />
      </FrontendPlatformProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
    expect(screen.getByTestId('tenant-default').textContent).toBe('light');
    expect(screen.getByTestId('workspace-label').textContent).toBe('Tenant workspace');
    expect(screen.getByTestId('full-visibility').textContent).toBe('no');
    expect(screen.getByTestId('contracted-products').textContent).toBe('CRM');
    expect(screen.getByTestId('branding-scope').textContent).toBe('Tenant One');
  });

  it('falls back to tenant theme defaults when overrides are disabled', async () => {
    currentUser.tenantAllowUserThemeOverride = false;
    currentUser.tenantDefaultThemeMode = 'DARK';
    window.localStorage.setItem('app-shell-theme', 'light');

    render(
      <FrontendPlatformProvider>
        <PlatformConsumer />
      </FrontendPlatformProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
    expect(window.localStorage.getItem('app-shell-theme')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'set-dark' }));
    expect(screen.getByTestId('theme-mode').textContent).toBe('dark');
  });
});
