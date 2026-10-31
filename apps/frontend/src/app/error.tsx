'use client';

import { logClientError } from '@/shared/observability/client-logger';
import { useEffect } from 'react';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const copy = useAppMessages().screens.shell;
  useEffect(() => {
    logClientError('route-error-boundary', error.message, { digest: error.digest });
  }, [error]);

  return (
    <div className="ui-surface-panel mx-auto mt-10 w-full max-w-xl p-6">
      <h2 className="text-xl font-semibold text-destructive">{copy.pageErrorTitle}</h2>
      <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">{copy.pageErrorDescription}</p>
      <button
        type="button"
        onClick={reset}
        className="ui-primary-button mt-5"
      >
        {copy.reload}
      </button>
    </div>
  );
}
