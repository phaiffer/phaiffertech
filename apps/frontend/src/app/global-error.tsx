'use client';

import { logClientError } from '@/shared/observability/client-logger';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logClientError('global-error-boundary', error.message, {
      digest: error.digest
    });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center bg-canvas p-6 text-ink">
        <div className="w-full max-w-lg rounded-xl border border-rose-200 bg-white p-6 shadow-card">
          <h2 className="text-xl font-semibold text-rose-700">Ocorreu um erro inesperado</h2>
          <p className="mt-2 text-sm text-slate-600">
            O erro foi registrado. Tente novamente ou retorne para o dashboard.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
