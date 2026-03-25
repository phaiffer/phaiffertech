import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppShell } from '@/shared/components/app-shell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard'
}));

vi.mock('@/shared/components/sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar" />
}));

vi.mock('@/shared/components/impersonation-banner', () => ({
  ImpersonationBanner: () => null
}));

vi.mock('@/shared/platform/use-frontend-platform', () => ({
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
  it('renders the workspace header and propagates tenant branding from the platform context', () => {
    render(
      <AppShell>
        <div>Dashboard content</div>
      </AppShell>
    );

    expect(screen.getAllByText('Tenant workspace').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('Visão geral do workspace e módulos contratados.')).toBeInTheDocument();
    expect(screen.getByText('Active workspace')).toBeInTheDocument();
    expect(screen.getByText('Contracted SaaS workspace')).toBeInTheDocument();
    expect(screen.getByText('0 contracted modules')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar').parentElement).toHaveStyle({ '--tenant-accent': '#2563eb' });
  });
});
