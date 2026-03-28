'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/shared/components/brand-assets';
import {
  clearImpersonationBackupSession,
  clearSession,
  setAuthNotice
} from '@/shared/lib/session';
import { ApiClientError } from '@/shared/lib/http';
import { authService } from '@/shared/services/auth-service';
import {
  buildLoginVisualContext,
  publicPrimaryButtonClass,
  sharedCompactTextClass,
  sharedInputClass,
  sharedInputLabelClass,
  sharedPanelSurfaceClass,
  sharedSecondaryButtonClass
} from '@/shared/components/public-visual-system';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getPublicSiteMessages } from '@/shared/public/public-site-messages';

type ResetPasswordPageClientProps = {
  token: string | null;
};

export default function ResetPasswordPageClient({ token }: ResetPasswordPageClientProps) {
  const router = useRouter();
  const { locale } = usePublicSite();
  const t = getPublicSiteMessages(locale).resetPassword;
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidLink, setInvalidLink] = useState(token === null);
  const visualContext = useMemo(() => buildLoginVisualContext(), []);

  function handleNewPasswordChange(value: string) {
    setNewPassword(value);
    setError(null);
  }

  function handleConfirmNewPasswordChange(value: string) {
    setConfirmNewPassword(value);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setInvalidLink(true);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError(t.passwordMismatchError);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await authService.confirmPasswordReset({
        token,
        newPassword,
        confirmNewPassword
      });
      clearSession();
      clearImpersonationBackupSession();
      setAuthNotice('password-reset');
      router.replace('/login');
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 403) {
        setInvalidLink(true);
        setError(null);
      } else if (err instanceof ApiClientError) {
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
            <BrandMark
              priority
              className="h-14 w-14"
              imageClassName="scale-[1.08]"
              style={visualContext.brandMarkStyle}
            />
            <div>
              <span className="block text-lg font-semibold tracking-tight">PhaifferTech</span>
              <span className="block text-[11px] uppercase tracking-[0.18em] text-muted">{t.title}</span>
            </div>
          </Link>

          <section className={`${sharedPanelSurfaceClass} p-7 sm:p-8`} style={visualContext.cardStyle}>
            {invalidLink ? (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t.invalidTitle}</h1>
                  <p className={`mt-2 ${sharedCompactTextClass}`}>{t.invalidDescription}</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link href="/forgot-password" className={publicPrimaryButtonClass} style={{ backgroundColor: 'var(--tenant-accent)' }}>
                    {t.requestNewLinkLabel}
                  </Link>
                  <Link href="/login" className={sharedSecondaryButtonClass}>
                    {t.backToLoginLabel}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t.title}</h1>
                  <p className={`mt-2 ${sharedCompactTextClass}`}>{t.description}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="new-password" className={sharedInputLabelClass}>
                      {t.newPasswordLabel}
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(event) => handleNewPasswordChange(event.target.value)}
                      className={sharedInputClass}
                      minLength={8}
                      maxLength={72}
                      autoComplete="new-password"
                      disabled={submitting}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="confirm-new-password" className={sharedInputLabelClass}>
                      {t.confirmNewPasswordLabel}
                    </label>
                    <input
                      id="confirm-new-password"
                      type="password"
                      value={confirmNewPassword}
                      onChange={(event) => handleConfirmNewPasswordChange(event.target.value)}
                      className={sharedInputClass}
                      minLength={8}
                      maxLength={72}
                      autoComplete="new-password"
                      disabled={submitting}
                      required
                    />
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
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
