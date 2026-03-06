'use client';

import { useMemo } from 'react';
import { useAuth } from '@/shared/auth/use-auth';
import { hasAnyPermission, hasPermission } from '@/shared/permissions/has-permission';

export function usePermissions() {
  const { session } = useAuth();
  const user = session?.user;

  return useMemo(() => ({
    user,
    can: (permission: string) => hasPermission(user, permission),
    canAny: (permissions: string[]) => hasAnyPermission(user, permissions)
  }), [user]);
}
