import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from '@/app/(app)/dashboard/page';
import { moduleService } from '@/shared/services/module-service';
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
      permissions: ['TENANT_READ', 'USER_READ']
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
    visualProfile: {
      key: 'core-institutional',
      label: 'Core Institutional',
      accentFallback: '#2563eb',
      primaryFallback: '#0f172a',
      accentColor: '#2563eb',
      primaryColor: '#0f172a',
      accentTone: { emphasis: 'institutional', softAlpha: 0.18, highlightAlpha: 0.14 },
      backgroundMood: { softness: 'soft', accentOpacity: 0.12, supportOpacity: 0.1, accentAnchor: 'top left', supportAnchor: 'bottom right' },
      surfaceNuance: { tintOpacity: 0.16, borderOpacity: 0.18, elevation: 'quiet' },
      iconTone: { emphasisOpacity: 0.18, mutedOpacity: 0.1 },
      chartHighlightTone: { accentOpacity: 0.22, supportOpacity: 0.14 },
      dashboardHighlightTone: { accentOpacity: 0.14, supportOpacity: 0.1 },
      loginVisualContext: { accentOpacity: 0.12, supportOpacity: 0.12, cardTintOpacity: 0.05, cardBorderOpacity: 0.18, brandMarkOpacity: 0.16 },
      illustrationPreset: 'institutional-grid'
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
          code: 'PET',
          name: 'PetFlow',
          description: 'Clinical workspace',
          enabled: true,
          moduleEnabled: true,
          featureFlagEnabled: true,
          available: true
        }
      ],
      loading: false,
      error: null,
      availableCodes: ['CORE_PLATFORM', 'CRM', 'PET'],
      contractedProducts: [
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
          code: 'PET',
          name: 'PetFlow',
          description: 'Clinical workspace',
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

vi.mock('@/shared/services/module-service', () => ({
  moduleService: {
    getDashboardSummary: vi.fn()
  }
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
    permissions: ['TENANT_READ', 'USER_READ'],
    ...overrides
  };
}

describe('DashboardPage workspace context', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    currentPlatformState.branding.scopeName = 'PhaifferTech';
    currentPlatformState.branding.tenantCode = 'default';
    currentPlatformState.user = buildUser();
    currentPlatformState.workspace = {
      ...currentPlatformState.workspace,
      workspaceLabel: 'Platform control plane',
      accessLabel: 'Platform owner tenant',
      isPlatformOwnerTenant: true,
      hasSystemAdminRole: true,
      hasFullPlatformVisibility: true,
      canManagePlatformAdministration: true
    };
    currentPlatformState.modules = {
      ...currentPlatformState.modules,
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
          code: 'PET',
          name: 'PetFlow',
          description: 'Clinical workspace',
          enabled: true,
          moduleEnabled: true,
          featureFlagEnabled: true,
          available: true
        }
      ],
      loading: false,
      error: null,
      availableCodes: ['CORE_PLATFORM', 'CRM', 'PET'],
      contractedProducts: [
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
          code: 'PET',
          name: 'PetFlow',
          description: 'Clinical workspace',
          enabled: true,
          moduleEnabled: true,
          featureFlagEnabled: true,
          available: true
        }
      ]
    };
  });

  it('renders a platform-oriented dashboard for the platform tenant admin workspace', async () => {
    vi.mocked(moduleService.getDashboardSummary).mockResolvedValue({
      coreSummary: {
        key: 'core',
        title: 'Platform Overview',
        description: 'Shared platform summary',
        cards: [],
        metrics: [],
        items: [],
        timeSeries: []
      },
      modules: [
        {
          moduleCode: 'CRM',
          title: 'CRM Snapshot',
          description: 'Commercial overview',
          href: '/crm',
          summaryCards: []
        }
      ]
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(moduleService.getDashboardSummary).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText(/Platform control plane overview/)).toBeInTheDocument();
    expect(screen.getByText('Platform Operations')).toBeInTheDocument();
    expect(screen.getByText('Manage tenants')).toBeInTheDocument();
    expect(screen.getByText('Module Access Matrix')).toBeInTheDocument();
    expect(screen.queryByText('Contracted Modules')).not.toBeInTheDocument();
  });

  it('renders a customer workspace dashboard without platform-only sections', async () => {
    currentPlatformState.branding.scopeName = 'Clinic North';
    currentPlatformState.branding.tenantCode = 'clinic-north';
    currentPlatformState.user = buildUser({
      tenantName: 'Clinic North',
      tenantCode: 'clinic-north',
      platformOwner: false,
      platformAdmin: false,
      role: 'TENANT_ADMIN',
      roles: ['TENANT_ADMIN'],
      permissions: ['USER_READ']
    });
    currentPlatformState.workspace = {
      ...currentPlatformState.workspace,
      workspaceLabel: 'Tenant workspace',
      accessLabel: 'Contracted SaaS workspace',
      isPlatformOwnerTenant: false,
      hasSystemAdminRole: false,
      hasFullPlatformVisibility: false,
      canManagePlatformAdministration: false
    };
    currentPlatformState.modules = {
      ...currentPlatformState.modules,
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
          code: 'PET',
          name: 'PetFlow',
          description: 'Clinical workspace',
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

    vi.mocked(moduleService.getDashboardSummary).mockResolvedValue({
      coreSummary: {
        key: 'core',
        title: 'Workspace Overview',
        description: 'Workspace summary',
        cards: [],
        metrics: [],
        items: [],
        timeSeries: []
      },
      modules: [
        {
          moduleCode: 'CRM',
          title: 'CRM Snapshot',
          description: 'Commercial overview',
          href: '/crm',
          summaryCards: []
        },
        {
          moduleCode: 'PET',
          title: 'Pet Snapshot',
          description: 'Clinical overview',
          href: '/pet',
          summaryCards: []
        }
      ]
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(moduleService.getDashboardSummary).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText(/Workspace overview for Clinic North/)).toBeInTheDocument();
    expect(screen.getByText('Workspace Actions')).toBeInTheDocument();
    expect(screen.getByText('Contracted Modules')).toBeInTheDocument();
    expect(screen.getByText('Open CRM workspace')).toBeInTheDocument();
    expect(screen.queryByText('Manage tenants')).not.toBeInTheDocument();
    expect(screen.queryByText('Module Access Matrix')).not.toBeInTheDocument();
    expect(screen.queryByText('Pet Snapshot')).not.toBeInTheDocument();
  });

  it('shows customer workspace onboarding when no module snapshot is available yet', async () => {
    currentPlatformState.branding.scopeName = 'Clinic North';
    currentPlatformState.branding.tenantCode = 'clinic-north';
    currentPlatformState.user = buildUser({
      tenantName: 'Clinic North',
      tenantCode: 'clinic-north',
      platformOwner: false,
      platformAdmin: false,
      role: 'TENANT_ADMIN',
      roles: ['TENANT_ADMIN'],
      permissions: ['USER_READ']
    });
    currentPlatformState.workspace = {
      ...currentPlatformState.workspace,
      workspaceLabel: 'Tenant workspace',
      accessLabel: 'Contracted SaaS workspace',
      isPlatformOwnerTenant: false,
      hasSystemAdminRole: false,
      hasFullPlatformVisibility: false,
      canManagePlatformAdministration: false
    };
    currentPlatformState.modules = {
      ...currentPlatformState.modules,
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

    vi.mocked(moduleService.getDashboardSummary).mockResolvedValue({
      coreSummary: {
        key: 'core',
        title: 'Workspace Overview',
        description: 'Workspace summary',
        cards: [],
        metrics: [],
        items: [],
        timeSeries: []
      },
      modules: []
    });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(moduleService.getDashboardSummary).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Workspace Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Get Clinic North ready')).toBeInTheDocument();
    expect(screen.getByText('Confirm workspace settings')).toBeInTheDocument();
    expect(screen.getAllByText('Open CRM workspace').length).toBeGreaterThan(0);
  });
});
