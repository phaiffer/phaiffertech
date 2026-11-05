'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { AuthScreen } from '@/modules/account/auth-screen';
import { buildLoginVisualContext } from '@/shared/components/public-visual-system';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { getPublicSiteMessages } from '@/shared/public/public-site-messages';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { authService } from '@/shared/services/auth-service';
import { FormInput } from '@/shared/ui/form-input';

export default function ForgotPasswordPageClient() {
  const screens = useAppMessages().screens;
  const copy = screens.accountAccess;
  const { locale } = usePublicSite();
  const t = getPublicSiteMessages(locale).forgotPassword;
  const [tenantCode, setTenantCode] = useState('');
  const [committedTenantCode, setCommittedTenantCode] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const visualContext = useMemo(() => buildLoginVisualContext(committedTenantCode), [committedTenantCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await authService.requestPasswordReset({ tenantCode, email });
      setSentTo(email);
    } catch (err) {
      setError(resolveApiErrorMessage(err, t.errorFallback));
    } finally {
      setSubmitting(false);
    }
  }

  const backToLogin = (
    <Link href="/login" className="text-sm font-medium text-[var(--ink)] underline-offset-2 hover:underline">
      {t.backToLoginLabel}
    </Link>
  );

  return (
    <AuthScreen style={visualContext.containerStyle}>
      {sentTo ? (
        <>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--ink)]">{copy.forgotSuccessTitle}</h1>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.forgotSuccessDescription.replace('{email}', sentTo)}</p>
          </div>
          <button type="button" onClick={() => setSentTo(null)} className="ui-secondary-button">
            {copy.forgotSendAgain}
          </button>
          <div>{backToLogin}</div>
        </>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--ink)]">{t.title}</h1>
            <p className="mt-1 text-sm text-[var(--ink-2)]">{t.description}</p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            <FormInput
              id="tenant-code"
              name="tenantCode"
              label={t.tenantCodeLabel}
              value={tenantCode}
              onChange={(value) => {
                setTenantCode(value);
                setError(null);
              }}
              onBlur={(event) => setCommittedTenantCode(event.target.value.trim())}
              autoComplete="section-pet organization"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              data-lpignore="true"
              data-1p-ignore="true"
              placeholder="tenant-code"
              disabled={submitting}
              required
            />
            <FormInput
              id="email"
              name="email"
              type="email"
              label={t.emailLabel}
              value={email}
              onChange={(value) => {
                setEmail(value);
                setError(null);
              }}
              placeholder={screens.shell.emailPlaceholder}
              disabled={submitting}
              required
            />

            {error ? <div role="alert" className="ui-notice-error">{error}</div> : null}

            <button type="submit" disabled={submitting} className="ui-primary-button w-full">
              {submitting ? t.loadingLabel : t.submitLabel}
            </button>
          </form>

          {backToLogin}
        </>
      )}
    </AuthScreen>
  );
}
