'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

const demoCredentials = {
  tenantCode: 'default',
  email: 'admin@local.test',
  password: 'Admin@123'
};

export default function LoginPage() {
  const router = useRouter();
  const { locale } = usePublicSite();
  const t = getPublicSiteMessages(locale).login;
  const { isAuthenticated, isLoading, signIn } = useAuth();

  const [tenantCode, setTenantCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const visualContext = useMemo(() => buildLoginVisualContext(tenantCode), [tenantCode]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  function handleUseDemo() {
    setTenantCode(demoCredentials.tenantCode);
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    setError(null);
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
    <div className="min-h-screen bg-background" style={visualContext.containerStyle}>
      <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">
          <Link href="/" className="mb-8 inline-flex items-center gap-3 text-foreground">
            <span
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border bg-surface shadow-xs"
              style={visualContext.brandMarkStyle}
            >
              <Image
                src="/logo.png"
                alt="PhaifferTech"
                width={34}
                height={34}
                priority
                className="h-[34px] w-[34px] object-contain"
              />
            </span>
            <span className="text-lg font-semibold tracking-tight">PhaifferTech</span>
          </Link>

          <section
            className={`${sharedPanelSurfaceClass} p-7 sm:p-8`}
            style={visualContext.cardStyle}
          >
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t.title}</h1>
              <p className={`mt-2 ${sharedCompactTextClass}`}>{t.description}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  href="/contact"
                  className="transition-colors hover:text-foreground"
                  style={{ color: 'var(--tenant-accent)' }}
                >
                  {t.forgotPasswordLabel}
                </Link>
                <button
                  type="button"
                  onClick={handleUseDemo}
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  {t.demoActionLabel}
                </button>
              </div>

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
          </section>
        </div>
      </main>
    </div>
  );
}
