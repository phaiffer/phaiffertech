import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TenantsPage from '@/app/(app)/tenants/page';
import { featureFlagService } from '@/shared/services/feature-flag-service';
import { tenantService } from '@/shared/services/tenant-service';

const { hasPermissionMock, currentUser } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn<(permission: string) => boolean>(),
  currentUser: {
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
    role: 'PLATFORM_ADMIN',
    permissions: ['TENANT_READ', 'TENANT_WRITE']
  }
}));

vi.mock('@/shared/auth/use-auth', () => ({
  useAuth: () => ({
    session: {
      user: currentUser
    }
  })
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: hasPermissionMock,
    hasAnyPermission: vi.fn().mockReturnValue(false)
  })
}));

vi.mock('@/shared/modules/use-module-catalog', () => ({
  useModuleCatalog: () => ({
    modules: [
      { code: 'CORE_PLATFORM', name: 'Core Platform', available: true },
      { code: 'CRM', name: 'CRM', available: true },
      { code: 'PET', name: 'PetFlow', available: true }
    ],
    loading: false,
    error: null
  })
}));

vi.mock('@/shared/services/tenant-service', () => ({
  tenantService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    listUsageMetrics: vi.fn()
  }
}));

vi.mock('@/shared/services/feature-flag-service', () => ({
  featureFlagService: {
    listForTenant: vi.fn(),
    setTenantOverride: vi.fn(),
    clearTenantOverride: vi.fn()
  }
}));

describe('TenantsPage access model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermissionMock.mockImplementation((permission) => permission === 'TENANT_READ' || permission === 'TENANT_WRITE');
    currentUser.platformAdmin = true;
    vi.mocked(featureFlagService.listForTenant).mockResolvedValue([]);
    vi.mocked(tenantService.listUsageMetrics).mockResolvedValue([]);
  });

  it('does not call tenantService.list without TENANT_READ', async () => {
    hasPermissionMock.mockReturnValue(false);

    render(<TenantsPage />);

    await waitFor(() => {
      expect(screen.getByText('You do not have permission to view tenants.')).toBeInTheDocument();
    });

    expect(tenantService.list).not.toHaveBeenCalled();
  });

  it('blocks tenant administration UI for non-platform admins even with TENANT_READ', async () => {
    currentUser.platformAdmin = false;
    render(<TenantsPage />);

    await waitFor(() => {
      expect(screen.getByText('Tenant administration is restricted to platform owner administrators.')).toBeInTheDocument();
    });

    expect(tenantService.list).not.toHaveBeenCalled();
  });

  it('renders tenant branding and contracted modules for platform admins', async () => {
    vi.mocked(tenantService.list).mockResolvedValue({
      items: [
        {
          id: 'tenant-2',
          name: 'Clinic North',
          code: 'clinic-north',
          status: 'ACTIVE',
          planCode: 'PRO',
          featureEntitlements: ['beta.dashboard'],
          platformOwner: false,
          logoUrl: null,
          primaryColor: '#1e3a8a',
          accentColor: '#0ea5e9',
          defaultThemeMode: 'DARK',
          allowUserThemeOverride: false,
          contractedModules: ['CORE_PLATFORM', 'PET']
        }
      ],
      totalItems: 1,
      totalPages: 1,
      page: 0,
      size: 20
    });

    render(<TenantsPage />);

    await waitFor(() => {
      expect(tenantService.list).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('Clinic North')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getAllByText('PRO').length).toBeGreaterThan(0);
    expect(screen.getByText('beta.dashboard')).toBeInTheDocument();
    expect(screen.getAllByText('CORE_PLATFORM').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PET').length).toBeGreaterThan(0);
    expect(screen.getByText('Customer Tenant')).toBeInTheDocument();
  });

  it('loads feature flags and usage telemetry when editing an existing tenant', async () => {
    vi.mocked(tenantService.list).mockResolvedValue({
      items: [
        {
          id: 'tenant-2',
          name: 'Clinic North',
          code: 'clinic-north',
          status: 'ACTIVE',
          planCode: 'PRO',
          featureEntitlements: ['beta.dashboard'],
          platformOwner: false,
          logoUrl: null,
          primaryColor: '#1e3a8a',
          accentColor: '#0ea5e9',
          defaultThemeMode: 'DARK',
          allowUserThemeOverride: false,
          contractedModules: ['CORE_PLATFORM', 'CRM']
        }
      ],
      totalItems: 1,
      totalPages: 1,
      page: 0,
      size: 20
    });
    vi.mocked(featureFlagService.listForTenant).mockResolvedValue([
      { key: 'crm.enabled', enabled: true, scope: 'GLOBAL' }
    ]);
    vi.mocked(tenantService.listUsageMetrics).mockResolvedValue([
      {
        metricKey: 'api.request',
        source: 'crm',
        quantity: 4,
        unit: 'COUNT',
        metricDate: '2026-03-19',
        lastRecordedAt: '2026-03-19T12:00:00Z'
      }
    ]);

    render(<TenantsPage />);

    expect(await screen.findByText('Clinic North')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    await waitFor(() => {
      expect(featureFlagService.listForTenant).toHaveBeenCalledWith('tenant-2');
      expect(tenantService.listUsageMetrics).toHaveBeenCalledWith('tenant-2');
    });

    expect(await screen.findByText('crm.enabled')).toBeInTheDocument();
    expect(screen.getByText('Api Request')).toBeInTheDocument();
  });

  it('submits normalized feature entitlements when updating a tenant', async () => {
    vi.mocked(tenantService.list).mockResolvedValue({
      items: [
        {
          id: 'tenant-2',
          name: 'Clinic North',
          code: 'clinic-north',
          status: 'ACTIVE',
          planCode: 'PRO',
          featureEntitlements: ['beta.dashboard'],
          platformOwner: false,
          logoUrl: null,
          primaryColor: '#1e3a8a',
          accentColor: '#0ea5e9',
          defaultThemeMode: 'DARK',
          allowUserThemeOverride: false,
          contractedModules: ['CORE_PLATFORM', 'CRM']
        }
      ],
      totalItems: 1,
      totalPages: 1,
      page: 0,
      size: 20
    });
    vi.mocked(tenantService.update).mockResolvedValue({
      id: 'tenant-2',
      name: 'Clinic North',
      code: 'clinic-north',
      status: 'ACTIVE',
      planCode: 'PRO',
      featureEntitlements: ['beta.dashboard', 'usage.billing.preview'],
      platformOwner: false,
      logoUrl: null,
      primaryColor: '#1e3a8a',
      accentColor: '#0ea5e9',
      defaultThemeMode: 'DARK',
      allowUserThemeOverride: false,
      contractedModules: ['CORE_PLATFORM', 'CRM']
    });

    render(<TenantsPage />);

    expect(await screen.findByText('Clinic North')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByPlaceholderText('beta.dashboard'), {
      target: { value: ' Usage.Billing.Preview ' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add entitlement' }));
    fireEvent.click(screen.getByRole('button', { name: 'Update tenant' }));

    await waitFor(() => {
      expect(tenantService.update).toHaveBeenCalledWith('tenant-2', expect.objectContaining({
        featureEntitlements: ['beta.dashboard', 'usage.billing.preview']
      }));
    });
  });
});
