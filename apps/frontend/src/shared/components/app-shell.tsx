'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/shared/components/sidebar';
import { useAuth } from '@/shared/components/auth-provider';

export function AppShell({ children }: { children: ReactNode }) {
  const { session } = useAuth();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="flex">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <h1 className="text-lg font-semibold">Plataforma Unificada</h1>
              <p className="text-xs uppercase tracking-wide text-slate-500">Tenant {session?.user.tenantId}</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              API: {process.env.NEXT_PUBLIC_API_URL}
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
