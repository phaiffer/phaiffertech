import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TenantsPage from '@/app/(app)/tenants/page';
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
    update: vi.fn()
  }
}));

describe('TenantsPage access model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermissionMock.mockImplementation((permission) => permission === 'TENANT_READ' || permission === 'TENANT_WRITE');
    currentUser.platformAdmin = true;
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
    expect(screen.getAllByText('CORE_PLATFORM').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PET').length).toBeGreaterThan(0);
    expect(screen.getByText('Customer tenant')).toBeInTheDocument();
  });
});
