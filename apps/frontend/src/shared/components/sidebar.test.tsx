import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from '@/shared/components/sidebar';
import { AuthenticatedUser } from '@/shared/types/auth';

const { navigationState, signOutMock, currentUser } = vi.hoisted(() => ({
  navigationState: { pathname: '/crm/tasks' },
  signOutMock: vi.fn(),
  currentUser: {
    userId: 'user-1',
    fullName: 'Jane Operator',
    email: 'jane@phaiffer.test',
    role: 'PLATFORM_ADMIN',
    tenantId: '11111111-1111-1111-1111-111111111111',
    tenantName: 'PhaifferTech',
    tenantCode: 'default',
    tenantLogoUrl: null,
    tenantPrimaryColor: '#0f172a',
    tenantAccentColor: '#2563eb',
    tenantDefaultThemeMode: 'SYSTEM',
    tenantAllowUserThemeOverride: true,
    platformOwner: true,
    platformAdmin: true,
    permissions: [],
    featureEntitlements: ['crm.full', 'pet.full', 'iot.basic']
  } as AuthenticatedUser
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigationState.pathname
}));

vi.mock('@/shared/auth/use-auth', () => ({
  useAuth: () => ({
    signOut: signOutMock
  })
}));

vi.mock('@/shared/platform/use-frontend-platform', () => ({
  useFrontendPlatform: () => ({
    user: currentUser,
    theme: {
      mode: 'system',
      setMode: vi.fn(),
      tenantDefaultMode: 'system',
      canOverride: true
    },
    branding: {
      logoUrl: null,
      scopeName: currentUser.tenantName,
      tenantCode: currentUser.tenantCode,
      style: {}
    },
    workspace: {
      workspaceLabel: currentUser.platformAdmin ? 'Platform control plane' : 'Tenant workspace',
      accessLabel: currentUser.platformAdmin ? 'Platform owner tenant' : 'Contracted SaaS workspace',
      isPlatformOwnerTenant: currentUser.platformOwner,
      hasSystemAdminRole: false,
      hasFullPlatformVisibility: currentUser.platformAdmin || currentUser.platformOwner,
      canManagePlatformAdministration: currentUser.platformAdmin
    },
    modules: {
      items: [
        { code: 'CORE_PLATFORM', name: 'Core Platform', description: 'Core', enabled: true, moduleEnabled: true, featureFlagEnabled: true, available: true },
        { code: 'IOT', name: 'IoT System', description: 'IoT', enabled: true, moduleEnabled: true, featureFlagEnabled: true, available: true },
        { code: 'CRM', name: 'CRM', description: 'CRM', enabled: true, moduleEnabled: true, featureFlagEnabled: true, available: true },
        { code: 'PET', name: 'PetFlow', description: 'Pet', enabled: true, moduleEnabled: true, featureFlagEnabled: true, available: true }
      ],
      loading: false,
      error: null,
      availableCodes: ['CORE_PLATFORM', 'IOT', 'CRM', 'PET'],
      contractedProducts: [
        { code: 'IOT', name: 'IoT System', description: 'IoT', enabled: true, moduleEnabled: true, featureFlagEnabled: true, available: true },
        { code: 'CRM', name: 'CRM', description: 'CRM', enabled: true, moduleEnabled: true, featureFlagEnabled: true, available: true },
        { code: 'PET', name: 'PetFlow', description: 'Pet', enabled: true, moduleEnabled: true, featureFlagEnabled: true, available: true }
      ]
    }
  })
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationState.pathname = '/crm/tasks';
    currentUser.role = 'PLATFORM_ADMIN';
    currentUser.platformAdmin = true;
    currentUser.platformOwner = true;
    currentUser.permissions = ['TENANT_READ', 'USER_READ', 'crm.task.read', 'pet.appointment.read', 'crm.dashboard.read', 'pet.dashboard.read'];
    currentUser.featureEntitlements = ['crm.full', 'pet.full', 'iot.basic'];
  });

  it('renders contextual CRM and Pet navigation and keeps tenant admin visible only for platform admins', () => {
    const { container, getByText } = render(<Sidebar />);

    // Group labels are now buttons — all are always in the DOM
    expect(getByText('PhaifferTech')).toBeTruthy();
    expect(getByText('Platform')).toBeTruthy();
    expect(getByText('CRM')).toBeTruthy();
    expect(getByText('PetFlow')).toBeTruthy();

    // Active route is /crm/tasks, so CRM group auto-expands — its links should be present
    expect(container.querySelector('a[href="/crm"]')).not.toBeNull();
    expect(container.querySelector('a[href="/crm/tasks"]')).not.toBeNull();

    // Pet group starts collapsed (not the active group) — its links are not rendered
    expect(container.querySelector('a[href="/pet"]')).toBeNull();
    expect(container.querySelector('a[href="/pet/appointments"]')).toBeNull();

    // Platform group is collapsed — tenants link is not rendered
    expect(container.querySelector('a[href="/tenants"]')).toBeNull();
  });

  it('hides platform-only tenant administration for regular tenant users', () => {
    currentUser.role = 'TENANT_ADMIN';
    currentUser.platformAdmin = false;
    currentUser.platformOwner = false;

    const { container } = render(<Sidebar />);

    expect(container.querySelector('a[href="/tenants"]')).toBeNull();
    expect(container.querySelector('a[href="/crm/tasks"]')).not.toBeNull();
  });

  it('hides IoT navigation when the tenant does not contract the IoT monitor entitlement', () => {
    currentUser.permissions = ['iot.dashboard.read'];
    currentUser.featureEntitlements = ['pet.full'];
    navigationState.pathname = '/iot/dashboard';

    const { container } = render(<Sidebar />);

    expect(container.querySelector('a[href="/iot/dashboard"]')).toBeNull();
  });

  it('filters veterinary-only PetFlow navigation when the tenant only contracts aesthetics and retail', () => {
    currentUser.role = 'TENANT_ADMIN';
    currentUser.platformAdmin = false;
    currentUser.platformOwner = false;
    currentUser.permissions = ['pet.client.read', 'pet.appointment.read', 'pet.medical-record.read'];
    currentUser.featureEntitlements = ['pet.aesthetics', 'pet.retail'];
    navigationState.pathname = '/pet/dashboard';

    const { container } = render(<Sidebar />);

    expect(container.querySelector('a[href="/pet/clients"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/appointments"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/medical-records"]')).toBeNull();
  });
});
