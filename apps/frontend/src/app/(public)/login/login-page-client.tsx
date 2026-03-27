'use client';

import { CSSProperties, FormEvent, useEffect, useMemo, useState } from 'react';
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
  publicSecondaryButtonClass,
  sharedCompactTextClass,
  sharedInputClass,
  sharedInputLabelClass,
  sharedPanelSurfaceClass
} from '@/shared/components/public-visual-system';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { usePublicSite } from '@/shared/public/public-site-provider';

type LoginPageClientProps = {
  nextPath: string;
};

export default function LoginPageClient({ nextPath }: LoginPageClientProps) {
  const router = useRouter();
  usePublicSite();
  const t = useAppMessages().login;
  const supportCopy = t.support;
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const demoAssistedEnabled = process.env.NEXT_PUBLIC_DEMO_ASSISTED_ENABLED === 'true';

  const [tenantCode, setTenantCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noticeReason, setNoticeReason] = useState<AuthNoticeReason | null>(null);
  const visualContext = useMemo(() => buildLoginVisualContext(tenantCode), [tenantCode]);
  const loginSurfaceStyle = useMemo(
    () => ({
      ...visualContext.containerStyle,
      '--accent': 'var(--tenant-accent)',
      '--accent-muted': 'var(--tenant-accent-soft)',
      '--ring': 'var(--tenant-accent)'
    }) as CSSProperties,
    [visualContext.containerStyle]
  );
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
    <div className="min-h-screen bg-background" style={loginSurfaceStyle}>
      <main className="mx-auto flex min-h-screen w-full max-w-[1380px] items-center px-6 py-8 lg:py-10">
        <div
          className={`${sharedPanelSurfaceClass} grid w-full overflow-hidden`}
          style={visualContext.cardStyle}
        >
          <div className="lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.85fr)]">
            <section className="relative hidden min-h-[640px] overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.28),transparent_32%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_35%,rgba(96,165,250,0.14),transparent_28%)]" />
              <div className="relative">
                <Link href="/" className="inline-flex items-center gap-3 text-white">
                  <span
                    className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/10 shadow-sm backdrop-blur"
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

                <div className="mt-14 max-w-xl">
                  <p className="inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                    {supportCopy.eyebrow}
                  </p>
                  <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-white">
                    {supportCopy.heroTitle}
                  </h1>
                  <p className="mt-5 text-base leading-7 text-slate-300">
                    {supportCopy.heroDescription}
                  </p>
                </div>
              </div>

              <div className="relative grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{supportCopy.laneQueueTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{supportCopy.laneQueueDescription}</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{supportCopy.lanePlansTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{supportCopy.lanePlansDescription}</p>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{supportCopy.laneBillingTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{supportCopy.laneBillingDescription}</p>
                </div>
              </div>
            </section>

            <section className="px-7 py-8 sm:px-10 lg:px-12 lg:py-12">
              <div className="flex items-center justify-between gap-4">
                <Link href="/" className="inline-flex items-center gap-3 text-foreground lg:hidden">
                  <span
                    className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1.15rem] border bg-surface shadow-sm"
                    style={visualContext.brandMarkStyle}
                  >
                    <Image
                      src="/PhaifferTech_logo.png"
                      alt="PhaifferTech"
                      width={40}
                      height={40}
                      priority
                      className="h-10 w-10 object-contain"
                    />
                  </span>
                  <span className="text-base font-semibold tracking-tight">PhaifferTech</span>
                </Link>

                <Link href="/" className={`hidden lg:inline-flex ${publicSecondaryButtonClass}`}>
                  {supportCopy.backLabel}
                </Link>
              </div>

              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
                  {supportCopy.eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                  {supportCopy.title}
                </h2>
                <p className={`mt-4 max-w-lg ${sharedCompactTextClass}`}>{supportCopy.description}</p>
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
                    className="font-medium transition-colors hover:text-foreground"
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
                  <div className="rounded-[1.2rem] border border-destructive/30 bg-destructive-muted px-3 py-2.5 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className={`${publicPrimaryButtonClass} w-full disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {submitting ? t.loadingLabel : t.submitLabel}
                </button>
              </form>

              <div className="mt-6 rounded-[1.4rem] border border-border bg-surface-inset px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{supportCopy.accessCardTitle}</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {supportCopy.accessCardDescription}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-4 text-sm">
                <Link href="/" className="font-medium text-muted transition-colors hover:text-foreground lg:hidden">
                  {supportCopy.backLabel}
                </Link>
                <Link href="/contact" className="font-medium" style={{ color: 'var(--tenant-accent)' }}>
                  {supportCopy.contactLabel}
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
