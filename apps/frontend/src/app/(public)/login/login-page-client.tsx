'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthNoticeReason, consumeAuthNotice } from '@/shared/lib/session';
import { authService } from '@/shared/services/auth-service';
import { ApiClientError } from '@/shared/lib/http';
import { useAuth } from '@/shared/hooks/use-auth';
import {
  buildLoginVisualContext,
  publicPrimaryButtonClass,
  sharedCompactTextClass,
  sharedInputClass,
  sharedInputLabelClass,
  sharedPanelSurfaceClass
} from '@/shared/components/public-visual-system';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getPublicSiteMessages } from '@/shared/public/public-site-messages';

type LoginPageClientProps = {
  nextPath: string;
};

export default function LoginPageClient({ nextPath }: LoginPageClientProps) {
  const router = useRouter();
  const { locale } = usePublicSite();
  const t = getPublicSiteMessages(locale).login;
  const supportCopy = locale === 'pt-BR'
    ? {
        eyebrow: 'Acesso ao produto',
        title: 'Entre no seu workspace.',
        description:
          'Use o código do workspace e suas credenciais para abrir a operação sem sair da linguagem visual do produto.',
        backLabel: 'Voltar ao site',
        contactLabel: 'Solicitar demo'
      }
    : {
        eyebrow: 'Product access',
        title: 'Sign in to your workspace.',
        description:
          'Use the workspace code and your credentials to open the product without leaving the platform visual language.',
        backLabel: 'Back to site',
        contactLabel: 'Request a demo'
      };
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const demoAssistedEnabled = process.env.NEXT_PUBLIC_DEMO_ASSISTED_ENABLED === 'true';

  const [tenantCode, setTenantCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noticeReason, setNoticeReason] = useState<AuthNoticeReason | null>(null);
  const visualContext = useMemo(() => buildLoginVisualContext(tenantCode), [tenantCode]);
  const notice = useMemo(() => {
    if (!noticeReason) {
      return null;
    }

    if (noticeReason === 'signed-out') {
      return t.signedOutNotice;
    }

    if (noticeReason === 'session-expired') {
      return t.sessionExpiredNotice;
    }

    if (noticeReason === 'tenant-mismatch') {
      return t.tenantMismatchNotice;
    }

    if (noticeReason === 'password-reset') {
      return t.passwordResetNotice;
    }

    return t.passwordChangedNotice;
  }, [noticeReason, t]);

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

  async function handleUseDemo() {
    setError(null);
    setSubmitting(true);

    try {
      const tokenData = await authService.demoLogin();

      signIn({
        accessToken: tokenData.accessToken,
        user: tokenData.user,
      });

      router.replace(nextPath);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError(t.errorFallback);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const tokenData = await authService.login({
        tenantCode,
        email,
        password,
      });

      signIn({
        accessToken: tokenData.accessToken,
        user: tokenData.user,
      });

      router.replace(nextPath);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError(t.errorFallback);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background" style={visualContext.containerStyle}>
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
        <div
          className={`${sharedPanelSurfaceClass} w-full`}
          style={visualContext.cardStyle}
        >
          <section className="px-7 py-8 sm:px-8 sm:py-9">
            <Link href="/" className="inline-flex items-center gap-3 text-foreground">
              <span
                className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border bg-surface shadow-sm"
                style={visualContext.brandMarkStyle}
              >
                <Image
                  src="/PhaifferTech_logo.png"
                  alt="PhaifferTech"
                  width={44}
                  height={44}
                  priority
                  className="h-11 w-11 object-contain"
                />
              </span>
              <span className="text-lg font-semibold tracking-tight">PhaifferTech</span>
            </Link>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
                {supportCopy.eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {supportCopy.title}
              </h1>
              <p className={`mt-4 ${sharedCompactTextClass}`}>{supportCopy.description}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="tenant-code" className={sharedInputLabelClass}>
                  {t.tenantCodeLabel}
                </label>
                <input
                  id="tenant-code"
                  type="text"
                  value={tenantCode}
                  onChange={(event) => setTenantCode(event.target.value)}
                  className={sharedInputClass}
                  placeholder="tenant-code"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className={sharedInputLabelClass}>
                  {t.emailLabel}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={sharedInputClass}
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className={sharedInputLabelClass}>
                  {t.passwordLabel}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={sharedInputClass}
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-4 text-sm">
                <Link
                  href="/forgot-password"
                  className="transition-colors hover:text-foreground"
                  style={{ color: 'var(--tenant-accent)' }}
                >
                  {t.forgotPasswordLabel}
                </Link>
                {demoAssistedEnabled ? (
                  <button
                    type="button"
                    onClick={handleUseDemo}
                    disabled={submitting}
                    className="text-sm text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t.demoActionLabel}
                  </button>
                ) : null}
              </div>

              {notice ? <div className="ui-notice-info">{notice}</div> : null}

              {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive-muted px-3 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className={`${publicPrimaryButtonClass} w-full disabled:cursor-not-allowed disabled:opacity-50`}
                style={{ backgroundColor: 'var(--tenant-accent)' }}
              >
                {submitting ? t.loadingLabel : t.submitLabel}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-4 text-sm">
              <Link href="/" className="font-medium text-muted transition-colors hover:text-foreground">
                {supportCopy.backLabel}
              </Link>
              <Link href="/contact" className="font-medium" style={{ color: 'var(--tenant-accent)' }}>
                {supportCopy.contactLabel}
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
