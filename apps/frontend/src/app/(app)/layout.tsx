'use client';

import { AuthGuard } from '@/shared/components/auth-guard';
import { AppShell } from '@/shared/components/app-shell';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
