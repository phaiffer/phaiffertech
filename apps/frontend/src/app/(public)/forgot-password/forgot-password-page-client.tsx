'use client';

import { FormEvent, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ApiClientError } from '@/shared/lib/http';
import { authService } from '@/shared/services/auth-service';
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

export default function ForgotPasswordPageClient() {
  const { locale } = usePublicSite();
  const t = getPublicSiteMessages(locale).forgotPassword;
  const [tenantCode, setTenantCode] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const visualContext = useMemo(() => buildLoginVisualContext(tenantCode), [tenantCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await authService.requestPasswordReset({
        tenantCode,
        email
      });
      setSuccess(true);
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
                src="/PhaifferTech_logo.png"
                alt="PhaifferTech"
                width={34}
                height={34}
                priority
                className="h-[34px] w-[34px] object-contain"
              />
            </span>
            <span className="text-lg font-semibold tracking-tight">PhaifferTech</span>
          </Link>

          <section className={`${sharedPanelSurfaceClass} p-7 sm:p-8`} style={visualContext.cardStyle}>
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

              {success ? <div className="ui-notice-info">{t.successNotice}</div> : null}

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

            <div className="mt-5 text-sm text-muted">
              <Link href="/login" className="transition-colors hover:text-foreground" style={{ color: 'var(--tenant-accent)' }}>
                {t.backToLoginLabel}
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
