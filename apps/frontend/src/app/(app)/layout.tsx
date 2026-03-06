'use client';

import { ProtectedRoute } from '@/shared/auth/protected-route';
import { AppShell } from '@/shared/components/app-shell';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
