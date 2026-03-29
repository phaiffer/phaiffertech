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
  sharedPanelSurfaceClass,
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

function FieldIcon({ path }: { path: string }) {
  return (
    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d={path} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

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
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-10">
        <div className="grid w-full items-center gap-6 lg:grid-cols-[minmax(0,450px)_minmax(0,1fr)] lg:gap-8">
          <section className={`${sharedPanelSurfaceClass} p-7 sm:p-8`} style={visualContext.cardStyle}>
            <div className="mb-8 flex items-center justify-between gap-4">
              <Link href="/" className="inline-flex items-center gap-3 text-foreground">
                <BrandMark
                  priority
                  className="h-14 w-14 shrink-0"
                  imageClassName="scale-[1.08]"
                  style={visualContext.brandMarkStyle}
                />
                <div>
                  <span className="block text-lg font-semibold tracking-tight text-slate-900">PetFlow</span>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-muted">by PhaifferTech</span>
                </div>
              </Link>
              <Link href="/" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-foreground lg:inline-flex">
                {supportCopy.backLabel}
              </Link>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
                {supportCopy.eyebrow}
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-foreground">{supportCopy.title}</h1>
              <p className={`mt-3 ${sharedCompactTextClass}`}>{supportCopy.description}</p>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off" className="mt-8 space-y-4">
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
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className={sharedInputLabelClass}>
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <FieldIcon path="M4 6h16v12H4M4 7l8 6 8-6" />
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
                    className={`${sharedInputClass} pl-12`}
                    placeholder="name@company.com"
                    disabled={submitting}
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
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError(null);
                    }}
                    autoComplete="current-password"
                    className={`${sharedInputClass} pl-12`}
                    placeholder="••••••••"
                    disabled={submitting}
                    required
                  />
                </div>
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
                <Link href="/" className="font-medium text-slate-500 transition-colors hover:text-foreground lg:hidden">
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

            <div className="mt-6 border-t border-slate-200 pt-5">
              <p className={sharedCompactTextClass}>{supportCopy.accessCardDescription}</p>
              <Link href="/contact" className="mt-3 inline-flex text-sm font-medium" style={{ color: 'var(--tenant-accent)' }}>
                {supportCopy.contactLabel}
              </Link>
            </div>
          </section>

          <section className="relative hidden min-h-[620px] overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff,#eff8f2)] shadow-[0_28px_64px_-46px_rgba(15,23,42,0.22)] lg:flex">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(16,185,129,0.12),transparent_38%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_22%,rgba(20,184,166,0.1),transparent_36%)]" />
            <div className="relative z-10 flex w-full flex-col">
              <div className="relative h-[270px] overflow-hidden border-b border-slate-200/80">
                <Image src="/images/login-dog.jpg" alt="PetFlow login visual" fill priority className="object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02),rgba(15,23,42,0.34))]" />
                <div className="absolute left-6 top-6 inline-flex rounded-full bg-white/86 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)] backdrop-blur-sm">
                  {supportCopy.eyebrow}
                </div>
                <div className="absolute inset-x-6 bottom-6 rounded-[1.5rem] border border-white/20 bg-slate-950/48 px-4 py-4 text-white backdrop-blur-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">PetFlow</p>
                  <p className="mt-2 text-sm leading-6 text-slate-100">
                    Banho e tosa, pet shop e recorrência no mesmo fluxo operacional.
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-center px-8 py-8 xl:px-10">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">{supportCopy.eyebrow}</p>
                <h2 className="mt-5 text-[2rem] font-semibold tracking-[-0.05em] text-slate-900 xl:text-[2.45rem]">
                  {supportCopy.heroTitle}
                </h2>
                <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">{supportCopy.heroDescription}</p>

                <div className="mt-8 rounded-[1.8rem] border border-slate-200/80 bg-white/88 p-5 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.18)]">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                    <div className="flex items-center gap-3">
                      <BrandMark
                        className="h-12 w-12 rounded-2xl"
                        imageClassName="scale-[1.08]"
                        style={visualContext.brandMarkStyle}
                      />
                      <div>
                        <p className="text-base font-semibold text-slate-900">PetFlow</p>
                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">{supportCopy.accessCardTitle}</p>
                      </div>
                    </div>
                    <span className="inline-flex rounded-full bg-[color:var(--tenant-accent)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
                      Workspace
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {[
                      [supportCopy.laneQueueTitle, supportCopy.laneQueueDescription],
                      [supportCopy.lanePlansTitle, supportCopy.lanePlansDescription],
                      [supportCopy.laneBillingTitle, supportCopy.laneBillingDescription]
                    ].map(([title, body], index) => (
                      <div key={title} className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/90 p-4">
                        <div className="flex items-start gap-3">
                          <span
                            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                              index === 0
                                ? 'bg-[linear-gradient(135deg,var(--tenant-accent),var(--petflow-teal))] text-white'
                                : 'bg-[color:var(--tenant-accent)]/10 text-[color:var(--tenant-accent)]'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">{title}</p>
                            <p className="mt-1 text-[15px] leading-7 text-slate-600">{body}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
