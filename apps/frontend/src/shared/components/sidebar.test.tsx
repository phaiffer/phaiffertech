import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from '@/shared/components/sidebar';

const { signOutMock, hasAnyPermissionMock, currentUser } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  hasAnyPermissionMock: vi.fn(),
  currentUser: {
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
    permissions: []
  }
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/crm/tasks'
}));

vi.mock('@/shared/auth/use-auth', () => ({
  useAuth: () => ({
    session: {
      user: currentUser
    },
    signOut: signOutMock
  })
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: vi.fn().mockReturnValue(true),
    hasAnyPermission: hasAnyPermissionMock
  })
}));

vi.mock('@/shared/modules/use-module-catalog', () => ({
  useModuleCatalog: () => ({
    modules: [
      { code: 'CORE_PLATFORM', name: 'Core Platform', available: true },
      { code: 'IOT', name: 'IoT System', available: true },
      { code: 'CRM', name: 'CRM', available: true },
      { code: 'PET', name: 'PetFlow', available: true }
    ],
    loading: false,
    error: null
  })
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasAnyPermissionMock.mockReturnValue(true);
    currentUser.role = 'PLATFORM_ADMIN';
    currentUser.platformAdmin = true;
    currentUser.platformOwner = true;
  });

  it('renders contextual CRM and Pet navigation and keeps tenant admin visible only for platform admins', () => {
    const { container, getByText } = render(<Sidebar />);

    expect(getByText('PhaifferTech')).toBeTruthy();
    expect(getByText('Contracted products')).toBeTruthy();
    expect(container.querySelector('a[href="/crm"]')).not.toBeNull();
    expect(container.querySelector('a[href="/crm/tasks"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/appointments"]')).not.toBeNull();
    expect(container.querySelector('a[href="/tenants"]')).not.toBeNull();
  });

  it('hides platform-only tenant administration for regular tenant users', () => {
    currentUser.role = 'TENANT_ADMIN';
    currentUser.platformAdmin = false;
    currentUser.platformOwner = false;

    const { container } = render(<Sidebar />);

    expect(container.querySelector('a[href="/tenants"]')).toBeNull();
    expect(container.querySelector('a[href="/crm/tasks"]')).not.toBeNull();
  });
});
