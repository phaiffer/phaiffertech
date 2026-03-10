'use client';

import { ProtectedRoute } from '@/shared/auth/protected-route';
import { AppShell } from '@/shared/components/app-shell';
import { FrontendPlatformProvider } from '@/shared/platform/frontend-platform-provider';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <FrontendPlatformProvider>
        <AppShell>{children}</AppShell>
      </FrontendPlatformProvider>
    </ProtectedRoute>
  );
}
