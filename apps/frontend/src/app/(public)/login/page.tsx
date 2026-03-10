'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/shared/services/auth-service';
import { ApiClientError } from '@/shared/lib/http';
import { useAuth } from '@/shared/hooks/use-auth';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getPublicSiteMessages } from '@/shared/public/public-site-messages';

export default function LoginPage() {
  const router = useRouter();
  const { locale } = usePublicSite();
  const t = getPublicSiteMessages(locale).login;
  const { isAuthenticated, isLoading, signIn } = useAuth();

  const [tenantCode, setTenantCode] = useState('default');
  const [email, setEmail] = useState('admin@local.test');
  const [password, setPassword] = useState('Admin@123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const tokenData = await authService.login({
        tenantCode,
        email,
        password
      });

      signIn({
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        user: tokenData.user
      });

      router.replace('/dashboard');
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
    <div className="border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(15,23,42,0.04),transparent_70%)]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
          <Link href="/" className="text-sm font-medium text-action">
            {t.returnToSite}
          </Link>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-action">
            {t.eyebrow}
          </p>

          <h1 className="mt-4 text-3xl font-semibold text-[var(--foreground)]">
            {t.title}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">{t.description}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-medium">{t.tenantCodeLabel}</label>
              <input
                value={tenantCode}
                onChange={(e) => setTenantCode(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-action"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t.emailLabel}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-action"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">{t.passwordLabel}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-action"
                required
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-action px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_30px_rgba(31,111,235,0.24)] transition hover:bg-blue-700 disabled:opacity-70"
            >
              {submitting ? t.loadingLabel : t.submitLabel}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {t.demoReadinessEyebrow}
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">{t.demoEmail}</p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  admin@local.test
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">{t.demoPassword}</p>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  Admin@123
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside className="grid gap-5">
          <section className="rounded-[2rem] border border-sky-500/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(238,242,255,0.92))] p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)] dark:bg-[linear-gradient(180deg,rgba(17,26,46,0.98),rgba(23,35,61,0.92))]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {t.platformContextEyebrow}
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {t.helperTitle}
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-600">{t.helperText}</p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {t.contractScopeEyebrow}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-[var(--foreground)]">
                {t.contractTitle}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t.contractText}</p>
            </section>

            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                {t.governanceEyebrow}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-[var(--foreground)]">
                {t.governanceTitle}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t.governanceText}</p>
            </section>
          </div>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {t.demoReadinessEyebrow}
            </p>
            <h3 className="mt-3 text-lg font-semibold text-[var(--foreground)]">
              {t.demoTitle}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{t.demoText}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
