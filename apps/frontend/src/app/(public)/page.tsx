'use client';

import Link from 'next/link';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getPublicSiteMessages } from '@/shared/public/public-site-messages';

export default function PublicHomePage() {
  const { locale } = usePublicSite();
  const t = getPublicSiteMessages(locale).home;

  return (
    <>
      <section id="platform" className="border-b border-[var(--border)]">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-action">
              {t.heroEyebrow}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              {t.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600">
              {t.heroDescription}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-xl bg-action px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                {t.heroPrimaryCta}
              </Link>
              <a
                href="#architecture"
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
              >
                {t.heroSecondaryCta}
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {t.platformCardEyebrow}
              </p>
              <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
                {t.platformCardTitle}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t.platformCardText}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {t.frontendCardEyebrow}
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                  {t.frontendCardTitle}
                </p>
              </div>

              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {t.backendCardEyebrow}
                </p>
                <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                  {t.backendCardTitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="modules" className="border-b border-[var(--border)]">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-[var(--foreground)]">{t.modulesTitle}</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">{t.modulesDescription}</p>
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Core
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                {t.moduleCoreTitle}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t.moduleCoreText}</p>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                CRM
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                {t.moduleCrmTitle}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t.moduleCrmText}</p>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                IoT
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                {t.moduleIotTitle}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t.moduleIotText}</p>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Pet
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                {t.modulePetTitle}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t.modulePetText}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="architecture" className="border-b border-[var(--border)]">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {t.architectureEyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
              {t.architectureTitle}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              {t.architectureText}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-card lg:p-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-action">
              {t.ctaEyebrow}
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-[var(--foreground)] lg:text-4xl">
              {t.ctaTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{t.ctaText}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-xl bg-action px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                {t.ctaPrimary}
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
              >
                {t.ctaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}