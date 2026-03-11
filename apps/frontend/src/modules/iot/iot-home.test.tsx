import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IotHome } from '@/modules/iot/iot-home';
import type { FrontendPlatformState } from '@/shared/platform/frontend-platform.types';

const { currentPlatformState, currentPermissions } = vi.hoisted(() => ({
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
  } as FrontendPlatformState,
  currentPermissions: ['iot.device.read', 'iot.alarm.read']
}));

vi.mock('@/shared/platform/use-frontend-platform', () => ({
  useFrontendPlatform: () => currentPlatformState
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) => currentPermissions.includes(permission),
    hasAnyPermission: (permissions: string[]) => permissions.some((permission) => currentPermissions.includes(permission))
  })
}));

vi.mock('@/shared/services/iot-service', () => ({
  iotService: {
    getDashboardSummary: vi.fn()
  }
}));

import { iotService } from '@/shared/services/iot-service';

describe('IotHome', () => {
  beforeEach(() => {
    currentPermissions.splice(0, currentPermissions.length, 'iot.device.read', 'iot.alarm.read');
    vi.clearAllMocks();
  });

  it('keeps the IoT workspace accessible without dashboard permission and filters actions', () => {
    render(<IotHome />);

    expect(iotService.getDashboardSummary).not.toHaveBeenCalled();
    expect(screen.getAllByText('Inspect devices').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Review alarms').length).toBeGreaterThan(0);
    expect(screen.getByText('Open dashboard')).toBeInTheDocument();
    expect(screen.getByText('Dashboard access required')).toBeInTheDocument();
    expect(screen.getAllByText('Dashboard visibility required').length).toBeGreaterThan(0);
    expect(screen.getAllByText('No permission').length).toBeGreaterThan(0);
    expect(screen.getByText(/operational pulse requires `iot.dashboard.read`/i)).toBeInTheDocument();
  });

  it('loads the IoT operational pulse when dashboard permission is available', async () => {
    currentPermissions.splice(0, currentPermissions.length, 'iot.dashboard.read', 'iot.device.read', 'iot.alarm.read');
    vi.mocked(iotService.getDashboardSummary).mockResolvedValue({
      totalDevices: 12,
      activeDevices: 10,
      offlineDevices: 2,
      totalAlarmsOpen: 1,
      alarmsBySeverity: {
        HIGH: 1
      },
      telemetryPointsLast24h: 1440,
      pendingMaintenance: 3,
      devicesLastSeenSummary: {
        last_5m: 8,
        last_60m: 2,
        stale: 2
      },
      summaryCards: [],
      sections: [
        {
          key: 'recent-incidents',
          title: 'Recent Incidents',
          description: 'Newest alerts',
          cards: [],
          metrics: [],
          items: [
            {
              id: 'alarm-1',
              label: 'Boiler Line 4',
              sublabel: 'Pressure exceeded threshold',
              status: 'open',
              timestamp: '2026-03-10T12:00:00Z'
            }
          ],
          timeSeries: []
        }
      ]
    });

    render(<IotHome />);

    await waitFor(() => {
      expect(iotService.getDashboardSummary).toHaveBeenCalledTimes(1);
    });

    expect(screen.getAllByText('Open dashboard')).toHaveLength(2);
    expect(screen.getByText('Telemetry in 24h')).toBeInTheDocument();
    expect(screen.getByText('Recent Incidents')).toBeInTheDocument();
    expect(screen.getByText('Boiler Line 4')).toBeInTheDocument();
  });

  it('shows guided first-use messaging when the IoT workspace has no connected assets yet', async () => {
    currentPermissions.splice(0, currentPermissions.length, 'iot.dashboard.read', 'iot.device.create', 'iot.device.read', 'iot.telemetry.read');
    vi.mocked(iotService.getDashboardSummary).mockResolvedValue({
      totalDevices: 0,
      activeDevices: 0,
      offlineDevices: 0,
      totalAlarmsOpen: 0,
      alarmsBySeverity: {},
      telemetryPointsLast24h: 0,
      pendingMaintenance: 0,
      devicesLastSeenSummary: {},
      summaryCards: [],
      sections: []
    });

    render(<IotHome />);

    await waitFor(() => {
      expect(iotService.getDashboardSummary).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('IoT Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Set up the IoT workspace')).toBeInTheDocument();
    expect(screen.getByText('Telemetry is not configured yet')).toBeInTheDocument();
    expect(screen.getAllByText('Register device').length).toBeGreaterThan(0);
  });
});
