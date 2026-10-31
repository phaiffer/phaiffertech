'use client';

import { logClientError } from '@/shared/observability/client-logger';
import { useEffect } from 'react';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const copy = useAppMessages().screens.shell;
  useEffect(() => {
    logClientError('global-error-boundary', error.message, {
      digest: error.digest
    });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <div className="ui-surface-panel w-full max-w-lg p-6">
          <h2 className="text-xl font-semibold text-destructive">{copy.globalErrorTitle}</h2>
          <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">
            {copy.globalErrorDescription}
          </p>
          <button
            type="button"
            onClick={reset}
            className="ui-primary-button mt-5"
          >
            {copy.tryAgain}
          </button>
        </div>
      </body>
    </html>
  );
}
