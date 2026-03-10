import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '@/shared/components/app-shell';

const { currentUser } = vi.hoisted(() => ({
  currentUser: {
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
  }
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard'
}));

vi.mock('@/shared/auth/use-auth', () => ({
  useAuth: () => ({
    session: {
      user: currentUser
    }
  })
}));

vi.mock('@/shared/components/sidebar', () => ({
  Sidebar: () => <aside data-testid="sidebar" />
}));

describe('AppShell', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = '';
  });

  it('applies tenant-controlled theme defaults and hides local override controls when overrides are disabled', async () => {
    render(
      <AppShell>
        <div>Dashboard content</div>
      </AppShell>
    );

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('light');
    });

    expect(screen.getByText('Theme managed by tenant:')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dark' })).not.toBeInTheDocument();
    expect(screen.getByText('Workspace Overview')).toBeInTheDocument();
  });
});
