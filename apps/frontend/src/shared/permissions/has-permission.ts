import { AuthenticatedUser } from '@/shared/types/auth';

export function hasPermission(user: AuthenticatedUser | null | undefined, permission: string): boolean {
  if (!user || !permission) {
    return false;
  }

  if (user.role === 'PLATFORM_ADMIN' || user.roles?.includes('PLATFORM_ADMIN')) {
    return true;
  }

  return user.permissions.includes(permission);
}

export function hasAnyPermission(user: AuthenticatedUser | null | undefined, permissions: string[]): boolean {
  if (!permissions.length) {
    return true;
  }

  return permissions.some((permission) => hasPermission(user, permission));
}
