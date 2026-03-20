'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/auth/use-auth';
import { clearImpersonationBackupSession, getImpersonationBackupSession } from '@/shared/lib/session';
import { ApiClientError } from '@/shared/lib/http';
import { supportImpersonationService } from '@/shared/services/support-impersonation-service';

type ImpersonationBannerProps = {
  tenantName: string;
  tenantCode: string | null;
};

export function ImpersonationBanner({ tenantName, tenantCode }: ImpersonationBannerProps) {
  const { session, signIn } = useAuth();
  const router = useRouter();
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const impersonation = session?.user.impersonation;
  if (!impersonation) {
    return null;
  }

  async function handleExitImpersonation() {
    setError(null);
    setStopping(true);

    try {
      const tokenData = await supportImpersonationService.stop();
      signIn({
        accessToken: tokenData.accessToken,
        user: tokenData.user
      });
      router.push('/tenants');
    } catch (err) {
      const backupSession = getImpersonationBackupSession();
      if (backupSession) {
        clearImpersonationBackupSession();
        signIn(backupSession);
        router.push('/tenants');
        return;
      }

      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Could not exit support impersonation safely.');
      }
    } finally {
      setStopping(false);
    }
  }

  return (
    <section className="border-b border-amber-400/70 bg-[linear-gradient(90deg,rgba(245,158,11,0.18),rgba(251,191,36,0.12))]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-900">Support impersonation active</p>
          <p className="mt-1 text-sm font-medium text-[color:var(--app-shell-heading)]">
            Operating inside {tenantName}{tenantCode ? ` (${tenantCode})` : ''}.
          </p>
          <p className="mt-1 text-sm text-[color:var(--app-shell-text)]">
            Original workspace: {impersonation.sourceTenantName} ({impersonation.sourceTenantCode}). Access expires{' '}
            {new Date(impersonation.expiresAt).toLocaleString()}.
          </p>
          <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
            Exit support impersonation to restore the original platform workspace and operator context.
          </p>
          {error ? (
            <p className="mt-2 text-sm text-red-700">{error}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void handleExitImpersonation()}
          disabled={stopping}
          className="inline-flex items-center justify-center rounded-full border border-amber-700/60 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {stopping ? 'Exiting...' : 'Exit impersonation'}
        </button>
      </div>
    </section>
  );
}
