import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from '@/shared/components/app-shell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard'
}));

vi.mock('@/shared/components/sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar" />
}));

vi.mock('@/shared/platform/frontend-platform-provider', () => ({
  useFrontendPlatform: () => ({
    user: {
      userId: 'user-1',
      email: 'tenant@example.test',
      fullName: 'Tenant Admin',
      tenantId: 'tenant-1',
      tenantName: 'Tenant One',
      tenantCode: 'tenant-one',
      tenantLogoUrl: null,
      tenantPrimaryColor: '#0f172a',
      tenantAccentColor: '#2563eb',
      tenantDefaultThemeMode: 'LIGHT',
      tenantAllowUserThemeOverride: false,
      platformOwner: false,
      platformAdmin: false,
      role: 'TENANT_ADMIN',
      permissions: []
    },
    branding: {
      logoUrl: null,
      scopeName: 'Tenant One',
      tenantCode: 'tenant-one',
      style: { '--tenant-accent': '#2563eb' }
    },
    theme: {
      mode: 'light',
      setMode: vi.fn(),
      tenantDefaultMode: 'light',
      canOverride: false
    },
    workspace: {
      workspaceLabel: 'Tenant workspace',
      accessLabel: 'Contracted SaaS workspace',
      isPlatformOwnerTenant: false,
      hasSystemAdminRole: false,
      hasFullPlatformVisibility: false,
      canManagePlatformAdministration: false
    },
    modules: {
      items: [],
      loading: false,
      error: null,
      availableCodes: ['CORE_PLATFORM'],
      contractedProducts: []
    }
  })
}));

describe('AppShell', () => {
  it('renders tenant-managed theme messaging from the platform context', () => {
    render(
      <AppShell>
        <div>Dashboard content</div>
      </AppShell>
    );

    expect(screen.getByText(/Theme managed by tenant:/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dark' })).not.toBeInTheDocument();
    expect(screen.getByText('Workspace Overview')).toBeInTheDocument();
  });
});
