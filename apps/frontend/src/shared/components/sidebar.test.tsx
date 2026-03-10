import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from '@/shared/components/sidebar';

const { signOutMock, hasPermissionMock, hasAnyPermissionMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  hasPermissionMock: vi.fn(),
  hasAnyPermissionMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/crm/tasks'
}));

vi.mock('@/shared/auth/use-auth', () => ({
  useAuth: () => ({
    session: {
      user: {
        fullName: 'Jane Operator',
        email: 'jane@phaiffer.test',
        role: 'PLATFORM_ADMIN',
        tenantId: '11111111-1111-1111-1111-111111111111'
      }
    },
    signOut: signOutMock
  })
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: hasPermissionMock,
    hasAnyPermission: hasAnyPermissionMock
  })
}));

vi.mock('@/shared/modules/use-module-catalog', () => ({
  useModuleCatalog: () => ({
    modules: [
      { code: 'IOT', available: true },
      { code: 'CRM', available: true },
      { code: 'PET', available: true }
    ],
    loading: false,
    error: null
  })
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermissionMock.mockReturnValue(true);
    hasAnyPermissionMock.mockReturnValue(true);
  });

  it('restores CRM and Pet navigation groups without re-expanding the sidebar catalog excessively', () => {
    const { container } = render(<Sidebar />);

    expect(container.querySelector('a[href="/crm"]')).not.toBeNull();
    expect(container.querySelector('a[href="/crm/tasks"]')).not.toBeNull();
    expect(container.querySelector('a[href="/crm/activity"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/appointments"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/medical-records"]')).not.toBeNull();
    expect(container.querySelector('a[href="/crm/companies"]')).toBeNull();
    expect(container.querySelector('a[href="/pet/products"]')).toBeNull();
  });
});
