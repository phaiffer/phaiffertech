import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IotReportsPage } from '@/modules/iot/reports-page';
import type { FrontendPlatformState } from '@/shared/platform/frontend-platform.types';

const { hasPermissionMock, hasAnyPermissionMock, iotServiceMock, currentPlatformState } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn(),
  hasAnyPermissionMock: vi.fn(),
  iotServiceMock: {
    getReportSummary: vi.fn()
  },
  currentPlatformState: {
    user: {
      userId: 'user-1',
      email: 'iot@tenant.test',
      fullName: 'IoT Operator',
      tenantId: 'tenant-1',
      tenantName: 'Plant South',
      tenantCode: 'plant-south',
      tenantLogoUrl: null,
      tenantPrimaryColor: '#0f172a',
      tenantAccentColor: '#2563eb',
      tenantDefaultThemeMode: 'DARK',
      tenantAllowUserThemeOverride: false,
      platformOwner: false,
      platformAdmin: false,
      role: 'TENANT_OPERATOR',
      permissions: []
    },
    theme: {
      mode: 'dark',
      setMode: vi.fn(),
      tenantDefaultMode: 'dark',
      canOverride: false
    },
    branding: {
      logoUrl: null,
      scopeName: 'Plant South',
      tenantCode: 'plant-south',
      style: {}
    },
    visualProfile: {
      key: 'iot-industrial',
      label: 'IoT Industrial',
      accentFallback: '#0891b2',
      primaryFallback: '#0f172a',
      accentColor: '#2563eb',
      primaryColor: '#0f172a',
      accentTone: { emphasis: 'industrial', softAlpha: 0.14, highlightAlpha: 0.18 },
      backgroundMood: { softness: 'balanced', accentOpacity: 0.1, supportOpacity: 0.12, accentAnchor: 'top right', supportAnchor: 'bottom left' },
      surfaceNuance: { tintOpacity: 0.12, borderOpacity: 0.16, elevation: 'soft' },
      iconTone: { emphasisOpacity: 0.18, mutedOpacity: 0.1 },
      chartHighlightTone: { accentOpacity: 0.28, supportOpacity: 0.16 },
      dashboardHighlightTone: { accentOpacity: 0.14, supportOpacity: 0.12 },
      loginVisualContext: { accentOpacity: 0.1, supportOpacity: 0.12, cardTintOpacity: 0.04, cardBorderOpacity: 0.18, brandMarkOpacity: 0.14 },
      illustrationPreset: 'industrial-signals'
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
      availableCodes: ['IOT'],
      contractedProducts: []
    }
  } as FrontendPlatformState
}));

vi.mock('@/shared/platform/use-frontend-platform', () => ({
  useFrontendPlatform: () => currentPlatformState
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: hasPermissionMock,
    hasAnyPermission: hasAnyPermissionMock
  })
}));

vi.mock('@/shared/services/iot-service', () => ({
  iotService: iotServiceMock
}));

describe('IotReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermissionMock.mockReturnValue(true);
    hasAnyPermissionMock.mockReturnValue(true);
    iotServiceMock.getReportSummary.mockResolvedValue({
      totalDevices: 0,
      totalRegisters: 0,
      telemetryPointsLast24h: 0,
      openAlarms: 0,
      pendingMaintenance: 0,
      devicesByStatus: {},
      telemetryByMetric: {},
      alarmsByStatus: {},
      alarmsBySeverity: {},
      maintenanceByStatus: {},
      generatedAt: '2026-03-20T10:00:00Z'
    });
  });

  it('keeps reports demo-ready when no live devices are connected yet', async () => {
    render(<IotReportsPage />);

    await waitFor(() => {
      expect(iotServiceMock.getReportSummary).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Assisted demo mode is active')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Add first device' })).toHaveAttribute('href', '/iot/add-device');
    expect(screen.getByText('Recommended next step')).toBeInTheDocument();
    expect(screen.getByText('Register a first device')).toBeInTheDocument();
  });
});
