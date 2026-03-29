'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/shared/components/brand-assets';
import {
  buildLoginVisualContext,
  publicPrimaryButtonClass,
  sharedCompactTextClass,
  sharedInputClass,
  sharedInputLabelClass,
  sharedSecondaryButtonClass
} from '@/shared/components/public-visual-system';
import { useAuth } from '@/shared/hooks/use-auth';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { ApiClientError } from '@/shared/lib/http';
import { AuthNoticeReason, consumeAuthNotice } from '@/shared/lib/session';
import { authService } from '@/shared/services/auth-service';

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
  const router = useRouter();
  const t = useAppMessages().login;
  const supportCopy = t.support;
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

  function handleTenantCodeChange(value: string) {
    setTenantCode(value);
    setError(null);
  }

  function commitTenantCodeVisual(value: string) {
    setCommittedTenantCode(value.trim());
  }

  async function handleLoginSuccess() {
    router.replace(nextPath);
  }

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

      await handleLoginSuccess();
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

    await signIntoSession(() => authService.login({
      tenantCode,
      email,
      password
    }));
  }

  async function handleDemoLogin() {
    await signIntoSession(() => authService.demoLogin());
  }

  return (
    <div className="min-h-screen bg-background" style={visualContext.containerStyle}>
      <main className="min-h-screen lg:grid lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className="flex bg-white px-6 py-10 sm:px-10 lg:min-h-screen lg:items-center lg:px-16 xl:px-20">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 flex items-center justify-between gap-4">
              <Link href="/" className="inline-flex items-center gap-2.5 text-foreground">
                <BrandMark
                  priority
                  className="h-11 w-11 shrink-0 rounded-[1.15rem]"
                  imageClassName="scale-[1.08]"
                  style={visualContext.brandMarkStyle}
                />
                <div>
                  <span className="block text-lg font-semibold tracking-tight text-slate-900">PetFlow</span>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-slate-700">by PhaifferTech</span>
                </div>
              </Link>
              <Link href="/" className="hidden text-sm font-medium text-slate-700 transition-colors hover:text-foreground lg:inline-flex">
                {supportCopy.backLabel}
              </Link>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
                {supportCopy.eyebrow}
              </p>
              <h1 className="mt-4 text-2xl font-bold tracking-[-0.04em] text-slate-900 sm:text-3xl">{supportCopy.title}</h1>
              <p className={`mt-3 ${sharedCompactTextClass}`}>{supportCopy.description}</p>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" className="mt-8 space-y-4">
              <div>
                <label htmlFor="tenant-code" className={sharedInputLabelClass}>
                  {t.tenantCodeLabel}
                </label>
                <input
                  id="tenant-code"
                  name="tenantCode"
                  type="text"
                  value={tenantCode}
                  onChange={(event) => handleTenantCodeChange(event.target.value)}
                  onBlur={(event) => commitTenantCodeVisual(event.target.value)}
                  autoComplete="section-petflow organization"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  className={sharedInputClass}
                  placeholder="tenant-code"
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className={sharedInputLabelClass}>
                  {t.emailLabel}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                  autoComplete="username"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className={sharedInputClass}
                  placeholder="name@company.com"
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className={sharedInputLabelClass}>
                  {t.passwordLabel}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError(null);
                  }}
                  autoComplete="current-password"
                  className={sharedInputClass}
                  placeholder="••••••••"
                  disabled={submitting}
                  required
                />
              </div>

              {notice ? <div className="ui-notice-info">{notice}</div> : null}

              {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive-muted px-3 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-4 text-sm">
                <Link href="/forgot-password" className="font-medium" style={{ color: 'var(--tenant-accent)' }}>
                  {t.forgotPasswordLabel}
                </Link>
                <Link href="/" className="font-medium text-slate-700 transition-colors hover:text-foreground lg:hidden">
                  {supportCopy.backLabel}
                </Link>
              </div>

              <div className="space-y-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`${publicPrimaryButtonClass} w-full disabled:cursor-not-allowed disabled:opacity-50`}
                  style={{ backgroundImage: 'linear-gradient(135deg, var(--tenant-accent), var(--petflow-teal))' }}
                >
                  {submitting ? t.loadingLabel : t.submitLabel}
                </button>

                {demoLoginEnabled ? (
                  <button
                    type="button"
                    onClick={() => void handleDemoLogin()}
                    disabled={submitting}
                    className={`${sharedSecondaryButtonClass} w-full disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {t.demoActionLabel}
                  </button>
                ) : null}
              </div>
            </form>

            <div className="mt-6 rounded-[1.35rem] border border-slate-200 bg-slate-50/90 p-4 shadow-[0_16px_30px_-28px_rgba(15,23,42,0.16)]" style={visualContext.cardStyle}>
              <p className="text-sm font-semibold text-slate-900">{supportCopy.accessCardTitle}</p>
              <p className={`mt-2 ${sharedCompactTextClass}`}>{supportCopy.accessCardDescription}</p>
              <Link href="/contact" className="mt-3 inline-flex text-sm font-medium" style={{ color: 'var(--tenant-accent)' }}>
                {supportCopy.contactLabel}
              </Link>
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-slate-950 lg:flex">
          <Image
            src="/images/login-dog.jpg"
            alt="PetFlow login visual"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(7,13,28,0.88),rgba(8,47,73,0.76))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(16,185,129,0.16),transparent_28%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_20%,rgba(255,255,255,0.08),transparent_24%)]" />

          <div className="relative z-10 flex min-h-screen w-full flex-col justify-between px-10 py-10 xl:px-14 xl:py-12">
            <div className="inline-flex w-fit rounded-full border border-white/14 bg-white/8 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
              {supportCopy.eyebrow}
            </div>

            <div className="max-w-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-100">PetFlow</p>
              <h2 className="mt-4 text-[2.5rem] font-bold leading-[1.02] tracking-[-0.05em] text-white xl:text-[2.85rem]">
                {supportCopy.heroTitle}
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-200">
                {supportCopy.heroDescription}
              </p>

              <div className="mt-10 space-y-6">
                {[
                  [supportCopy.laneQueueTitle, supportCopy.laneQueueDescription],
                  [supportCopy.lanePlansTitle, supportCopy.lanePlansDescription],
                  [supportCopy.laneBillingTitle, supportCopy.laneBillingDescription]
                ].map(([title, body], index) => (
                  <div key={title} className="flex items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white backdrop-blur-sm">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-white">{title}</p>
                      <p className="mt-1 text-sm leading-7 text-slate-300">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
