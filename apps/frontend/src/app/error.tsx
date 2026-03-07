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
    <div className="mx-auto mt-10 w-full max-w-xl rounded-xl border border-rose-200 bg-white p-6 shadow-card">
      <h2 className="text-xl font-semibold text-rose-700">Falha ao carregar esta página</h2>
      <p className="mt-2 text-sm text-slate-600">Tente novamente em alguns instantes.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Recarregar
      </button>
    </div>
  );
}
