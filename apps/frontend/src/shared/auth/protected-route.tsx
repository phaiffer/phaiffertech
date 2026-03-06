'use client';

import { ReactNode } from 'react';
import { AuthGuard } from '@/shared/components/auth-guard';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
