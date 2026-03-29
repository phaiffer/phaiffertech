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
        <section className="flex flex-1 flex-col justify-center px-8 py-12 sm:px-16 lg:px-24 xl:px-32">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-10 flex items-center justify-between gap-4">
              <Link href="/" className="inline-flex items-center gap-3">
                <BrandMark
                  priority
                  className="h-12 w-12 shrink-0 rounded-2xl sm:h-14 sm:w-14"
                  imageClassName="scale-[1.08]"
                  style={visualContext.brandMarkStyle}
                />
                <div className="min-w-0">
                  <span className="block text-xl font-bold tracking-[-0.03em] text-slate-900">PetFlow</span>
                  <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                    by PhaifferTech
                  </span>
                </div>
              </Link>
              <Link href="/" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 lg:inline-flex">
                {supportCopy.backLabel}
              </Link>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
                {supportCopy.eyebrow}
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-slate-900">
                {supportCopy.title}
              </h1>
              <p className="mt-3 text-lg leading-8 text-slate-600">{supportCopy.description}</p>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" className="mt-10 space-y-5">
              <div>
                <label htmlFor="tenant-code" className={sharedInputLabelClass}>
                  {t.tenantCodeLabel}
                </label>
                <div className="relative">
                  <FieldIcon path="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
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
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
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
                    name="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
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
                <div className="rounded-xl border border-destructive/30 bg-destructive-muted px-4 py-3 text-sm text-destructive">{error}</div>
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

        <section className="relative hidden flex-1 overflow-hidden bg-[linear-gradient(135deg,#04111f,#0b1425_58%,#111827)] text-white lg:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_34%,rgba(59,130,246,0.14),transparent_52%)]" />
          <div className="relative z-10 flex w-full flex-col justify-center px-16 xl:px-24">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">{supportCopy.eyebrow}</p>
            <h2 className="mt-6 text-4xl font-bold tracking-[-0.05em] text-white xl:text-5xl">
              {supportCopy.heroTitle}
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-slate-300">{supportCopy.heroDescription}</p>

            <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <BrandMark
                    tone="dark"
                    className="h-12 w-12 rounded-2xl"
                    imageClassName="scale-[1.08]"
                    style={visualContext.brandMarkStyle}
                  />
                  <div>
                    <p className="text-base font-semibold text-white">PetFlow</p>
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">by PhaifferTech</p>
                  </div>
                </div>
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                  Workspace
                </span>
              </div>

              <div className="mt-5 grid gap-4">
                {[
                  [supportCopy.laneQueueTitle, supportCopy.laneQueueDescription],
                  [supportCopy.lanePlansTitle, supportCopy.lanePlansDescription],
                  [supportCopy.laneBillingTitle, supportCopy.laneBillingDescription]
                ].map(([title, body], index) => (
                  <div key={title} className="rounded-[1.35rem] border border-white/10 bg-slate-950/40 p-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-sm font-semibold ${
                          index === 0
                            ? 'bg-[color:var(--tenant-accent)] text-white'
                            : index === 1
                              ? 'bg-white/10 text-white'
                              : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">{title}</p>
                        <p className="mt-1 text-[15px] leading-7 text-slate-300">{body}</p>
                      </div>
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
