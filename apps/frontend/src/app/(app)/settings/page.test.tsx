import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SettingsPage from '@/app/(app)/settings/page';
import type { FrontendPlatformState } from '@/shared/platform/frontend-platform.types';
import type { AuthenticatedUser } from '@/shared/types/auth';

const { currentPlatformState } = vi.hoisted(() => ({
  currentPlatformState: {
    user: {
      userId: 'user-1',
      email: 'admin@phaiffer.test',
      fullName: 'Platform Admin',
      tenantId: 'tenant-1',
      tenantName: 'PhaifferTech',
      tenantCode: 'default',
      tenantLogoUrl: null,
      tenantPrimaryColor: '#0f172a',
      tenantAccentColor: '#2563eb',
      tenantDefaultThemeMode: 'SYSTEM',
      tenantAllowUserThemeOverride: true,
      platformOwner: true,
      platformAdmin: true,
      role: 'SYS_ADMIN',
      roles: ['SYS_ADMIN'],
      permissions: ['TENANT_READ']
    },
    theme: {
      mode: 'system',
      setMode: vi.fn(),
      tenantDefaultMode: 'system',
      canOverride: true
    },
    branding: {
      logoUrl: null,
      scopeName: 'PhaifferTech',
      tenantCode: 'default',
      style: {}
    },
    workspace: {
      workspaceLabel: 'Platform control plane',
      accessLabel: 'Platform owner tenant',
      isPlatformOwnerTenant: true,
      hasSystemAdminRole: true,
      hasFullPlatformVisibility: true,
      canManagePlatformAdministration: true
    },
    modules: {
      items: [
        {
          code: 'CORE_PLATFORM',
          name: 'Core Platform',
          description: 'Core workspace services',
          enabled: true,
          moduleEnabled: true,
          featureFlagEnabled: true,
          available: true
        },
        {
          code: 'CRM',
          name: 'CRM',
          description: 'Commercial workspace',
          enabled: true,
          moduleEnabled: true,
          featureFlagEnabled: true,
          available: true
        },
        {
          code: 'IOT',
          name: 'IoT System',
          description: 'Industrial workspace',
          enabled: true,
          moduleEnabled: true,
          featureFlagEnabled: false,
          available: false
        }
      ],
      loading: false,
      error: null,
      availableCodes: ['CORE_PLATFORM', 'CRM'],
      contractedProducts: [
        {
          code: 'CRM',
          name: 'CRM',
          description: 'Commercial workspace',
          enabled: true,
          moduleEnabled: true,
          featureFlagEnabled: true,
          available: true
        }
      ]
    }
  } as FrontendPlatformState
}));

vi.mock('@/shared/platform/use-frontend-platform', () => ({
  useFrontendPlatform: () => currentPlatformState
}));

function buildUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    userId: 'user-1',
    email: 'admin@phaiffer.test',
    fullName: 'Platform Admin',
    tenantId: 'tenant-1',
    tenantName: 'PhaifferTech',
    tenantCode: 'default',
    tenantLogoUrl: null,
    tenantPrimaryColor: '#0f172a',
    tenantAccentColor: '#2563eb',
    tenantDefaultThemeMode: 'SYSTEM',
    tenantAllowUserThemeOverride: true,
    platformOwner: true,
    platformAdmin: true,
    role: 'SYS_ADMIN',
    roles: ['SYS_ADMIN'],
    permissions: ['TENANT_READ'],
    ...overrides
  };
}

describe('SettingsPage', () => {
  beforeEach(() => {
    currentPlatformState.user = buildUser();
    currentPlatformState.branding = {
      logoUrl: null,
      scopeName: 'PhaifferTech',
      tenantCode: 'default',
      style: {}
    };
    currentPlatformState.workspace = {
      workspaceLabel: 'Platform control plane',
      accessLabel: 'Platform owner tenant',
      isPlatformOwnerTenant: true,
      hasSystemAdminRole: true,
      hasFullPlatformVisibility: true,
      canManagePlatformAdministration: true
    };
    currentPlatformState.modules = {
      items: [
        {
          code: 'CORE_PLATFORM',
          name: 'Core Platform',
          description: 'Core workspace services',
          enabled: true,
          moduleEnabled: true,
          featureFlagEnabled: true,
          available: true
        },
        {
          code: 'CRM',
          name: 'CRM',
          description: 'Commercial workspace',
          enabled: true,
          moduleEnabled: true,
          featureFlagEnabled: true,
          available: true
        },
        {
          code: 'IOT',
          name: 'IoT System',
          description: 'Industrial workspace',
          enabled: true,
          moduleEnabled: true,
          featureFlagEnabled: false,
          available: false
        }
      ],
      loading: false,
      error: null,
      availableCodes: ['CORE_PLATFORM', 'CRM'],
      contractedProducts: [
        {
          code: 'CRM',
          name: 'CRM',
          description: 'Commercial workspace',
          enabled: true,
          moduleEnabled: true,
          featureFlagEnabled: true,
          available: true
        }
      ]
    };
  });

  it('renders a platform-owner workspace configuration overview', () => {
    render(<SettingsPage />);

    expect(screen.getByRole('heading', { name: 'Workspace Configuration' })).toBeInTheDocument();
    expect(screen.getByText('Platform Owner Workspace')).toBeInTheDocument();
    expect(screen.getAllByText('Full platform visibility')).toHaveLength(2);
    expect(screen.getByText('Branding Preview')).toBeInTheDocument();
    expect(screen.getByText('Theme Policy')).toBeInTheDocument();
    expect(screen.getByText('Contracted Modules')).toBeInTheDocument();
    expect(screen.getByText('Pending workspace exposure')).toBeInTheDocument();
    expect(screen.getByText('Feature exposure pending')).toBeInTheDocument();
  });

  it('keeps internal support sessions tenant-scoped for customer workspaces', () => {
    currentPlatformState.user = buildUser({
      tenantName: 'Clinic North',
      tenantCode: 'clinic-north',
      platformOwner: false,
      platformAdmin: false,
      role: 'SYS_ADMIN',
      roles: ['SYS_ADMIN']
    });
    currentPlatformState.branding = {
      logoUrl: null,
      scopeName: 'Clinic North',
      tenantCode: 'clinic-north',
      style: {}
    };
    currentPlatformState.workspace = {
      workspaceLabel: 'Tenant workspace',
      accessLabel: 'Contracted SaaS workspace',
      isPlatformOwnerTenant: false,
      hasSystemAdminRole: true,
      hasFullPlatformVisibility: false,
      canManagePlatformAdministration: false
    };

    render(<SettingsPage />);

    expect(screen.getByText('Internal Support Context')).toBeInTheDocument();
    expect(screen.getAllByText('Tenant boundary active')).toHaveLength(2);
    expect(screen.getByText('Internal support on customer contract')).toBeInTheDocument();
    expect(screen.queryByText('Platform Owner Workspace')).not.toBeInTheDocument();
  });
});
