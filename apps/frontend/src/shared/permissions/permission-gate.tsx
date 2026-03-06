'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/shared/permissions/use-permissions';

type PermissionGateProps = {
  permission?: string;
  anyOf?: string[];
  fallback?: ReactNode;
  children: ReactNode;
};

export function PermissionGate({ permission, anyOf, fallback = null, children }: PermissionGateProps) {
  const { can, canAny } = usePermissions();

  const allowed = permission
    ? can(permission)
    : anyOf
      ? canAny(anyOf)
      : true;

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
