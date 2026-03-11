'use client';

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authService } from '@/shared/services/auth-service';
import { ApiClientError } from '@/shared/lib/http';
import { useAuth } from '@/shared/hooks/use-auth';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getPublicSiteMessages } from '@/shared/public/public-site-messages';

const fieldLabelClass =
  'mb-[var(--space-2)] block text-[length:var(--font-size-sm)] font-semibold tracking-[0.01em] text-[color:var(--app-shell-muted)]';

const fieldInputClass =
  'mt-[var(--space-2)] w-full rounded-[var(--radius-lg)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-sm)] text-[color:var(--app-shell-text)] outline-none transition duration-200 placeholder:text-[color:var(--app-shell-muted)] focus:border-[color:var(--tenant-accent)] focus:ring-2 focus:ring-[color:var(--tenant-accent-soft)]';

const eyebrowClass =
  'text-[length:var(--font-size-xs)] font-semibold uppercase tracking-[0.22em] text-[color:var(--app-shell-muted)]';

const helperSectionClass =
  'rounded-[var(--radius-xl)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] p-[var(--space-6)] shadow-card';

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
    <div
      className="border-b border-[color:var(--border)]"
      style={{ backgroundImage: 'linear-gradient(180deg, var(--tenant-primary-soft), transparent 70%)' }}
    >
      <div className="mx-auto grid w-full max-w-7xl gap-[var(--space-10)] px-[var(--space-4)] py-[var(--space-16)] sm:px-[var(--space-6)] lg:grid-cols-[0.95fr_1.05fr] lg:px-[var(--space-8)] lg:py-[var(--space-16)]">
        <section className="rounded-[var(--radius-xl)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] p-[var(--space-8)] shadow-card">
          <Link
            href="/"
            className="text-[length:var(--font-size-sm)] font-medium text-[color:var(--tenant-accent)]"
          >
            {t.returnToSite}
          </Link>

          <p className="mt-[var(--space-6)] text-[length:var(--font-size-xs)] font-semibold uppercase tracking-[0.25em] text-[color:var(--tenant-accent)]">
            {t.eyebrow}
          </p>

          <h1 className="mt-[var(--space-4)] text-3xl font-semibold text-[color:var(--foreground)]">
            {t.title}
          </h1>

          <p className="mt-[var(--space-3)] max-w-2xl text-[length:var(--font-size-sm)] leading-6 text-[color:var(--app-shell-muted)]">
            {t.description}
          </p>

          <form onSubmit={handleSubmit} className="mt-[var(--space-8)] space-y-[var(--space-5)]">
            <div>
              <label htmlFor="tenant-code" className={fieldLabelClass}>
                {t.tenantCodeLabel}
              </label>
              <input
                id="tenant-code"
                value={tenantCode}
                onChange={(e) => setTenantCode(e.target.value)}
                className={fieldInputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className={fieldLabelClass}>
                {t.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldInputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className={fieldLabelClass}>
                {t.passwordLabel}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={fieldInputClass}
                required
              />
            </div>

            {error ? (
              <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-danger)] bg-[color:var(--color-danger-soft)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-sm)] text-[color:var(--color-danger)]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-[var(--radius-lg)] border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent)] px-[var(--space-5)] py-[var(--space-3)] text-[length:var(--font-size-sm)] font-semibold text-[color:var(--foreground)] shadow-card transition duration-200 hover:shadow-[0_18px_40px_var(--tenant-accent-soft)] focus:outline-none focus:ring-2 focus:ring-[color:var(--tenant-accent-soft)] active:scale-[0.98] disabled:opacity-70"
            >
              {submitting ? t.loadingLabel : t.submitLabel}
            </button>
          </form>

          <div className="mt-[var(--space-8)] rounded-[var(--radius-xl)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-2)] px-[var(--space-5)] py-[var(--space-4)]">
            <p className={eyebrowClass}>
              {t.demoReadinessEyebrow}
            </p>

            <div className="mt-[var(--space-4)] grid gap-[var(--space-3)] sm:grid-cols-2">
              <div>
                <p className="text-[length:var(--font-size-xs)] text-[color:var(--app-shell-muted)]">
                  {t.demoEmail}
                </p>
                <p className="text-[length:var(--font-size-sm)] font-medium text-[color:var(--foreground)]">
                  admin@local.test
                </p>
              </div>

              <div>
                <p className="text-[length:var(--font-size-xs)] text-[color:var(--app-shell-muted)]">
                  {t.demoPassword}
                </p>
                <p className="text-[length:var(--font-size-sm)] font-medium text-[color:var(--foreground)]">
                  Admin@123
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside className="grid gap-[var(--space-5)]">
          <section className={`${helperSectionClass} bg-[color:var(--surface-2)]`}>
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[var(--radius-xl)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] shadow-card">
              <Image
                src="/logo.png"
                alt="PhaifferTech logo"
                width={96}
                height={96}
                priority
                className="h-full w-full object-cover"
              />
            </div>

            <p className={`mt-[var(--space-5)] ${eyebrowClass}`}>
              {t.platformContextEyebrow}
            </p>

            <h2 className="mt-[var(--space-5)] text-2xl font-semibold text-[color:var(--foreground)]">
              {t.helperTitle}
            </h2>

            <p className="mt-[var(--space-4)] text-[length:var(--font-size-sm)] leading-7 text-[color:var(--app-shell-muted)]">
              {t.helperText}
            </p>
          </section>

          <div className="grid gap-[var(--space-4)] sm:grid-cols-2">
            <section className={helperSectionClass}>
              <p className={eyebrowClass}>
                {t.contractScopeEyebrow}
              </p>
              <h3 className="mt-[var(--space-3)] text-[length:var(--font-size-lg)] font-semibold text-[color:var(--foreground)]">
                {t.contractTitle}
              </h3>
              <p className="mt-[var(--space-3)] text-[length:var(--font-size-sm)] leading-6 text-[color:var(--app-shell-muted)]">
                {t.contractText}
              </p>
            </section>

            <section className={helperSectionClass}>
              <p className={eyebrowClass}>
                {t.governanceEyebrow}
              </p>
              <h3 className="mt-[var(--space-3)] text-[length:var(--font-size-lg)] font-semibold text-[color:var(--foreground)]">
                {t.governanceTitle}
              </h3>
              <p className="mt-[var(--space-3)] text-[length:var(--font-size-sm)] leading-6 text-[color:var(--app-shell-muted)]">
                {t.governanceText}
              </p>
            </section>
          </div>

          <section className={helperSectionClass}>
            <p className={eyebrowClass}>
              {t.demoReadinessEyebrow}
            </p>
            <h3 className="mt-[var(--space-3)] text-[length:var(--font-size-lg)] font-semibold text-[color:var(--foreground)]">
              {t.demoTitle}
            </h3>
            <p className="mt-[var(--space-3)] text-[length:var(--font-size-sm)] leading-6 text-[color:var(--app-shell-muted)]">
              {t.demoText}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
