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
      <body className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="ui-surface-panel w-full max-w-lg p-6">
          <h2 className="text-xl font-semibold text-destructive">Ocorreu um erro inesperado</h2>
          <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">
            O erro foi registrado. Tente novamente ou retorne para o dashboard.
          </p>
          <button
            type="button"
            onClick={reset}
            className="ui-primary-button mt-5"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
