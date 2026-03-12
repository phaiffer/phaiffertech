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
        password,
      });

      signIn({
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        user: tokenData.user,
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
    <div className="flex min-h-screen flex-col bg-background">
      {/* Subtle background gradient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-3 text-muted transition-colors hover:text-foreground"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">{t.returnToSite}</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {/* Logo & Brand */}
          <div className="mb-10 text-center">
            <Link href="/" className="group inline-block">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 blur-xl transition-all duration-300 group-hover:from-accent/40 group-hover:to-accent/20" />
                {/* Logo container */}
                <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-surface-inset p-2 ring-1 ring-border/50 transition-all duration-300 group-hover:ring-accent/30">
                  <Image
                    src="/logo.png"
                    alt="PhaifferTech"
                    width={56}
                    height={56}
                    priority
                    className="h-full w-full object-contain drop-shadow-sm"
                  />
                </div>
              </div>
            </Link>
            <h1 className="mt-8 text-2xl font-semibold tracking-tight text-foreground">
              {t.title}
            </h1>
            <p className="mt-2 text-sm text-muted">{t.description}</p>
          </div>

          {/* Login Form */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="tenant-code"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  {t.tenantCodeLabel}
                </label>
                <input
                  id="tenant-code"
                  type="text"
                  value={tenantCode}
                  onChange={(e) => setTenantCode(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-inset px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  {t.emailLabel}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-inset px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  {t.passwordLabel}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface-inset px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive-muted px-3 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50"
              >
                {submitting ? t.loadingLabel : t.submitLabel}
              </button>
            </form>

            {/* Demo credentials - subtle hint */}
            <div className="mt-6 border-t border-border pt-4">
              <p className="mb-2 text-2xs font-medium uppercase tracking-wider text-muted">
                {t.demoReadinessEyebrow}
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">{t.demoEmail}</p>
                  <p className="font-mono text-foreground">admin@local.test</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.demoPassword}</p>
                  <p className="font-mono text-foreground">Admin@123</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer text */}
          <p className="mt-6 text-center text-xs text-muted">
            {locale === 'pt-BR'
              ? 'Isolamento por tenant, permissões granulares e governança operacional.'
              : 'Tenant isolation, granular permissions and operational governance.'}
          </p>
        </div>
      </main>
    </div>
  );
}
