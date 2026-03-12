'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/shared/auth/use-auth';
import {
  sharedCompactTextClass,
  sharedPanelSurfaceClass
} from '@/shared/components/public-visual-system';
import { usePathname, useRouter } from 'next/navigation';

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className={`${sharedPanelSurfaceClass} px-6 py-5`}>
          <p className={`font-medium text-foreground`}>Carregando sessão...</p>
          <p className={`mt-2 ${sharedCompactTextClass}`}>Sincronizando o workspace autenticado.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
