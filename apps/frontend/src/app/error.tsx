'use client';

import { logClientError } from '@/shared/observability/client-logger';
import { useEffect } from 'react';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientError('route-error-boundary', error.message, { digest: error.digest });
  }, [error]);

  return (
    <div className="ui-surface-panel mx-auto mt-10 w-full max-w-xl p-6">
      <h2 className="text-xl font-semibold text-destructive">Falha ao carregar esta página</h2>
      <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">Tente novamente em alguns instantes.</p>
      <button
        type="button"
        onClick={reset}
        className="ui-primary-button mt-5"
      >
        Recarregar
      </button>
    </div>
  );
}
