'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/shared/auth/usePermissions';

type PermissionGuardProps = {
  permission?: string;
  anyOf?: string[];
  fallback?: ReactNode;
  children: ReactNode;
};

export function PermissionGuard({ permission, anyOf, fallback = null, children }: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission } = usePermissions();

  const allowed = permission
    ? hasPermission(permission)
    : anyOf
      ? hasAnyPermission(anyOf)
      : true;

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
