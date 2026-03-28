'use client';

import { CSSProperties, FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/shared/components/brand-assets';
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
  sharedInputLabelClass
} from '@/shared/components/public-visual-system';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { usePublicSite } from '@/shared/public/public-site-provider';

type LoginPageClientProps = {
  nextPath: string;
};

function FieldIcon({ path }: { path: string }) {
  return (
    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d={path} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function LoginPageClient({ nextPath }: LoginPageClientProps) {
  const router = useRouter();
  usePublicSite();
  const t = useAppMessages().login;
  const supportCopy = t.support;
  const { isAuthenticated, isLoading, signIn } = useAuth();
  const demoAssistedEnabled = process.env.NEXT_PUBLIC_DEMO_ASSISTED_ENABLED === 'true';

  const [tenantCode, setTenantCode] = useState('');
  const [committedTenantCode, setCommittedTenantCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noticeReason, setNoticeReason] = useState<AuthNoticeReason | null>(null);
  const visualContext = useMemo(() => buildLoginVisualContext(committedTenantCode), [committedTenantCode]);
  const visualVars = visualContext.containerStyle as Record<string, string | number | undefined>;
  const loginSurfaceStyle = useMemo(
    () => ({
      '--tenant-accent': visualVars['--tenant-accent'],
      '--tenant-accent-soft': visualVars['--tenant-accent-soft'],
      '--tenant-primary-soft': visualVars['--tenant-primary-soft'],
      '--accent': 'var(--tenant-accent)',
      '--accent-muted': 'var(--tenant-accent-soft)',
      '--ring': 'var(--tenant-accent)'
    }) as CSSProperties,
    [visualVars]
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

  function handleTenantCodeChange(value: string) {
    setTenantCode(value);
  }

  function commitTenantCodeVisual(value: string) {
    setCommittedTenantCode(value.trim());
  }

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
    <div className="min-h-screen bg-white" style={loginSurfaceStyle}>
      <main className="min-h-screen lg:flex">
        <section className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-14 lg:px-20 xl:px-28">
          <div className="mx-auto w-full max-w-md">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="inline-flex items-center gap-3">
                <BrandMark
                  priority
                  className="h-12 w-12 shrink-0 sm:h-14 sm:w-14"
                  imageClassName="scale-[1.08]"
                  style={visualContext.brandMarkStyle}
                />
                <div className="min-w-0">
                  <span className="block text-base font-semibold tracking-[-0.03em] text-slate-900">PetFlow</span>
                  <span className="mt-0.5 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600">
                    by PhaifferTech
                  </span>
                </div>
              </Link>
              <Link href="/" className={`hidden lg:inline-flex ${publicSecondaryButtonClass}`}>
                {supportCopy.backLabel}
              </Link>
            </div>

            <div className="mt-10">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
                {supportCopy.eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-900">
                {supportCopy.title}
              </h1>
              <p className="mt-3 text-lg text-slate-600">{supportCopy.description}</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-10 space-y-5">
              <div>
                <label htmlFor="tenant-code" className={sharedInputLabelClass}>
                  {t.tenantCodeLabel}
                </label>
                <div className="relative">
                  <FieldIcon path="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
                  <input
                    id="tenant-code"
                    type="text"
                    value={tenantCode}
                    onChange={(event) => handleTenantCodeChange(event.target.value)}
                    onBlur={(event) => commitTenantCodeVisual(event.target.value)}
                    className={`${sharedInputClass} pl-12`}
                    placeholder="tenant-code"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className={sharedInputLabelClass}>
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <FieldIcon path="M4 6h16v12H4z M4 7l8 6 8-6" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={`${sharedInputClass} pl-12`}
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className={sharedInputLabelClass}>
                  {t.passwordLabel}
                </label>
                <div className="relative">
                  <FieldIcon path="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v10H6z" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`${sharedInputClass} pl-12`}
                    placeholder="••••••••"
                    required
                  />
                </div>
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
                    className="text-sm text-slate-600 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {t.demoActionLabel}
                  </button>
                ) : null}
              </div>

              {notice ? <div className="ui-notice-info">{notice}</div> : null}

              {error ? (
                <div className="rounded-[1.1rem] border border-destructive/30 bg-destructive-muted px-3 py-2.5 text-sm text-destructive">
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

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-200 pt-5 text-sm">
              <Link href="/" className="font-medium text-slate-600 transition-colors hover:text-foreground lg:hidden">
                {supportCopy.backLabel}
              </Link>
              <p className={sharedCompactTextClass}>{supportCopy.accessCardDescription}</p>
              <Link href="/contact" className="font-medium" style={{ color: 'var(--tenant-accent)' }}>
                {supportCopy.contactLabel}
              </Link>
            </div>
          </div>
        </section>

        <section className="relative hidden flex-1 overflow-hidden bg-[linear-gradient(135deg,#041224,#081a30_54%,#0a2342)] text-white lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.18),transparent_58%)]" />
          <div className="relative z-10 flex w-full flex-col justify-center px-16 xl:px-24">
            <BrandMark
              tone="dark"
              className="h-20 w-20"
              imageClassName="scale-[1.08]"
              style={visualContext.brandMarkStyle}
            />

            <h2 className="mt-10 text-5xl font-semibold tracking-[-0.05em] text-white">
              {supportCopy.heroTitle}
            </h2>
            <p className="mt-6 max-w-lg text-xl leading-8 text-slate-300">{supportCopy.heroDescription}</p>

            <div className="mt-10 space-y-4">
              {[
                [supportCopy.laneQueueTitle, supportCopy.laneQueueDescription],
                [supportCopy.lanePlansTitle, supportCopy.lanePlansDescription],
                [supportCopy.laneBillingTitle, supportCopy.laneBillingDescription]
              ].map(([title, body]) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-[color:var(--tenant-accent)]" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">{title}</p>
                    <p className="mt-1 text-base leading-7 text-slate-300">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
