import { ApiClientError } from '@/shared/lib/http';

// The API answers with English messages. The i18n provider mirrors the active locale on
// <html lang>, so handlers can pick the right text at call time without another hook.
function isEnglishInterface(): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  return !document.documentElement.lang.toLowerCase().startsWith('pt');
}

/**
 * Message to show for a failed API call.
 *
 * In English the backend message is the most specific text available, so it is shown as is.
 * In Portuguese the screen's own (translated) fallback is shown instead of the English
 * backend text, keeping the interface in a single language.
 */
export function resolveApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError && error.message && isEnglishInterface()) {
    return error.message;
  }
  return fallback;
}
