'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthScreen } from '@/modules/account/auth-screen';
import { buildLoginVisualContext } from '@/shared/components/public-visual-system';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { ApiClientError } from '@/shared/lib/http';
import {
  clearImpersonationBackupSession,
  clearSession,
  setAuthNotice
} from '@/shared/lib/session';
import { getPublicSiteMessages } from '@/shared/public/public-site-messages';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { authService } from '@/shared/services/auth-service';
import { FormInput } from '@/shared/ui/form-input';

type ResetPasswordPageClientProps = {
  token: string | null;
};

export default function ResetPasswordPageClient({ token }: ResetPasswordPageClientProps) {
  const router = useRouter();
  const copy = useAppMessages().screens.accountAccess;
  const { locale } = usePublicSite();
  const t = getPublicSiteMessages(locale).resetPassword;
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidLink, setInvalidLink] = useState(token === null);
  const visualContext = useMemo(() => buildLoginVisualContext(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setInvalidLink(true);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError(t.passwordMismatchError);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await authService.confirmPasswordReset({ token, newPassword, confirmNewPassword });
      clearSession();
      clearImpersonationBackupSession();
      setAuthNotice('password-reset');
      router.replace('/login');
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 403) {
        setInvalidLink(true);
        setError(null);
      } else {
        setError(resolveApiErrorMessage(err, t.errorFallback));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen style={visualContext.containerStyle}>
      {invalidLink ? (
        <>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--ink)]">{t.invalidTitle}</h1>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{t.invalidDescription}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/forgot-password" className="ui-primary-button">{t.requestNewLinkLabel}</Link>
            <Link href="/login" className="ui-secondary-button">{t.backToLoginLabel}</Link>
          </div>
        </>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--ink)]">{t.title}</h1>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{t.description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              id="new-password"
              type="password"
              label={t.newPasswordLabel}
              value={newPassword}
              onChange={(value) => {
                setNewPassword(value);
                setError(null);
              }}
              description={copy.resetPasswordHint}
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              disabled={submitting}
              required
            />
            <FormInput
              id="confirm-new-password"
              type="password"
              label={t.confirmNewPasswordLabel}
              value={confirmNewPassword}
              onChange={(value) => {
                setConfirmNewPassword(value);
                setError(null);
              }}
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              disabled={submitting}
              required
            />

            {error ? <div role="alert" className="ui-notice-error">{error}</div> : null}

            <button type="submit" disabled={submitting} className="ui-primary-button w-full">
              {submitting ? t.loadingLabel : t.submitLabel}
            </button>
          </form>

          <p className="text-xs text-[var(--ink-2)]">{copy.resetSessionsNote}</p>
        </>
      )}
    </AuthScreen>
  );
}
