'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthScreen } from '@/modules/account/auth-screen';
import { buildLoginVisualContext } from '@/shared/components/public-visual-system';
import { useAuth } from '@/shared/hooks/use-auth';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { AuthNoticeReason, consumeAuthNotice } from '@/shared/lib/session';
import { authService } from '@/shared/services/auth-service';
import { FormInput } from '@/shared/ui/form-input';

type LoginPageClientProps = {
  nextPath: string;
};

function resolveNoticeMessage(reason: AuthNoticeReason | null, t: ReturnType<typeof useAppMessages>['login']) {
  if (!reason) {
    return null;
  }

  if (reason === 'signed-out') {
    return t.signedOutNotice;
  }

  if (reason === 'session-expired') {
    return t.sessionExpiredNotice;
  }

  if (reason === 'tenant-mismatch') {
    return t.tenantMismatchNotice;
  }

  if (reason === 'password-reset') {
    return t.passwordResetNotice;
  }

  return t.passwordChangedNotice;
}

export default function LoginPageClient({ nextPath }: LoginPageClientProps) {
  const messages = useAppMessages();
  const shellCopy = messages.screens.shell;
  const copy = messages.screens.accountAccess;
  const t = messages.login;
  const router = useRouter();
  const { isAuthenticated, isLoading, signIn } = useAuth();

  const [tenantCode, setTenantCode] = useState('');
  const [committedTenantCode, setCommittedTenantCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noticeReason, setNoticeReason] = useState<AuthNoticeReason | null>(null);

  const visualContext = useMemo(() => buildLoginVisualContext(committedTenantCode), [committedTenantCode]);
  const notice = useMemo(() => resolveNoticeMessage(noticeReason, t), [noticeReason, t]);
  const demoLoginEnabled = process.env.NEXT_PUBLIC_DEMO_ASSISTED_ENABLED === 'true';

  useEffect(() => {
    const authNotice = consumeAuthNotice();
    if (authNotice) {
      setNoticeReason(authNotice);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, isLoading, nextPath, router]);

  async function signIntoSession(
    loginAction: () => ReturnType<typeof authService.login> | ReturnType<typeof authService.demoLogin>
  ) {
    setError(null);
    setSubmitting(true);

    try {
      const tokenData = await loginAction();

      signIn({
        accessToken: tokenData.accessToken,
        user: tokenData.user
      });

      router.replace(nextPath);
    } catch (err) {
      setError(resolveApiErrorMessage(err, t.errorFallback));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await signIntoSession(() => authService.login({ tenantCode, email, password }));
  }

  return (
    <AuthScreen style={visualContext.containerStyle}>
      <div>
        <h1 className="text-2xl font-semibold text-[var(--ink)]">{copy.loginTitle}</h1>
        <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.loginDescription}</p>
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
          autoComplete="username"
          placeholder={shellCopy.emailPlaceholder}
          disabled={submitting}
          required
        />
        <FormInput
          id="password"
          name="password"
          type="password"
          label={t.passwordLabel}
          value={password}
          onChange={(value) => {
            setPassword(value);
            setError(null);
          }}
          autoComplete="current-password"
          disabled={submitting}
          required
        />

        {notice ? <div className="ui-notice-info">{notice}</div> : null}
        {error ? <div role="alert" className="ui-notice-error">{error}</div> : null}

        <div className="space-y-2">
          <button type="submit" disabled={submitting} className="ui-primary-button w-full">
            {submitting ? t.loadingLabel : t.submitLabel}
          </button>
          {demoLoginEnabled ? (
            <button
              type="button"
              onClick={() => void signIntoSession(() => authService.demoLogin())}
              disabled={submitting}
              className="ui-secondary-button w-full"
            >
              {t.demoActionLabel}
            </button>
          ) : null}
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link href="/forgot-password" className="font-medium text-[var(--ink)] underline-offset-2 hover:underline">
          {t.forgotPasswordLabel}
        </Link>
        <Link href="/" className="text-[var(--ink-2)] underline-offset-2 hover:underline">{copy.backToSite}</Link>
      </div>

      <p className="text-sm text-[var(--ink-2)]">
        {copy.noAccount}{' '}
        <Link href="/contact" className="font-medium text-[var(--ink)] underline-offset-2 hover:underline">{copy.contact}</Link>
      </p>
    </AuthScreen>
  );
}
