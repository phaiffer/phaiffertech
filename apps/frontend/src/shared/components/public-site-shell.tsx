'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type PublicLocale = 'pt-BR' | 'en-US';
type PublicTheme = 'light' | 'dark';

type PublicSiteShellProps = {
  children: ReactNode;
};

const copy = {
  'pt-BR': {
    brandEyebrow: 'Phaiffer Platform',
    brandTitle: 'SaaS Control Plane',
    navPlatform: 'Plataforma',
    navModules: 'Módulos',
    navArchitecture: 'Arquitetura',
    navLogin: 'Entrar',
    themeLight: 'Light',
    themeDark: 'Dark',
    localeLabel: 'Idioma',
    heroEyebrow: 'Plataforma modular para operações reais',
    heroTitle: 'Software institucional e produto SaaS na mesma base.',
    heroDescription:
      'Uma experiência pública mais limpa para apresentação comercial, conectada a uma plataforma multi-tenant com CRM, IoT e PetFlow.',
    heroPrimaryCta: 'Acessar plataforma',
    heroSecondaryCta: 'Ver arquitetura',
    modulesTitle: 'Capacidades da plataforma',
    modulesDescription:
      'Apresente apenas o que faz sentido para cada cliente, sem poluição visual e com separação clara entre produto, operação e contexto comercial.',
    moduleCoreTitle: 'Core Platform',
    moduleCoreText: 'Auth, tenants, IAM, settings, attachments, audit, subscription e governança central.',
    moduleCrmTitle: 'CRM',
    moduleCrmText: 'Leads, deals, contacts, pipeline, tasks, notes e visão comercial operacional.',
    moduleIotTitle: 'IoT',
    moduleIotText: 'Devices, telemetry, alarms, maintenance, reports e narrativa executiva para demo.',
    modulePetTitle: 'PetFlow',
    modulePetText: 'Clientes, pets, agenda, medical workflow, inventory, invoices e operação clínica.',
    architectureTitle: 'Base preparada para evolução',
    architectureText:
      'Esta camada pública já fica pronta para evoluir com internacionalização completa, dark/light mode e integração visual com a plataforma autenticada.',
    footerText: 'PhaifferTech Platform · Institutional shell prepared for bilingual public experience.'
  },
  'en-US': {
    brandEyebrow: 'Phaiffer Platform',
    brandTitle: 'SaaS Control Plane',
    navPlatform: 'Platform',
    navModules: 'Modules',
    navArchitecture: 'Architecture',
    navLogin: 'Login',
    themeLight: 'Light',
    themeDark: 'Dark',
    localeLabel: 'Language',
    heroEyebrow: 'Modular platform for real operations',
    heroTitle: 'Institutional software and SaaS product in the same foundation.',
    heroDescription:
      'A cleaner public-facing experience for commercial presentations, connected to a multi-tenant platform with CRM, IoT and PetFlow.',
    heroPrimaryCta: 'Open platform',
    heroSecondaryCta: 'View architecture',
    modulesTitle: 'Platform capabilities',
    modulesDescription:
      'Present only what matters to each customer, without visual noise and with clear separation between product, operations and commercial context.',
    moduleCoreTitle: 'Core Platform',
    moduleCoreText: 'Auth, tenants, IAM, settings, attachments, audit, subscription and central governance.',
    moduleCrmTitle: 'CRM',
    moduleCrmText: 'Leads, deals, contacts, pipeline, tasks, notes and operational commercial visibility.',
    moduleIotTitle: 'IoT',
    moduleIotText: 'Devices, telemetry, alarms, maintenance, reports and executive demo storytelling.',
    modulePetTitle: 'PetFlow',
    modulePetText: 'Clients, pets, scheduling, medical workflow, inventory, invoices and clinic operations.',
    architectureTitle: 'Foundation ready for evolution',
    architectureText:
      'This public layer is ready to evolve with full internationalization, dark/light mode and visual integration with the authenticated platform.',
    footerText: 'PhaifferTech Platform · Institutional shell prepared for a bilingual public experience.'
  }
} as const;

function getStoredTheme(): PublicTheme {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem('phaiffertech-public-theme');
  return stored === 'dark' ? 'dark' : 'light';
}

function getStoredLocale(): PublicLocale {
  if (typeof window === 'undefined') {
    return 'pt-BR';
  }

  const stored = window.localStorage.getItem('phaiffertech-public-locale');
  return stored === 'en-US' ? 'en-US' : 'pt-BR';
}

export function PublicSiteShell({ children }: PublicSiteShellProps) {
  const [theme, setTheme] = useState<PublicTheme>('light');
  const [locale, setLocale] = useState<PublicLocale>('pt-BR');

  useEffect(() => {
    setTheme(getStoredTheme());
    setLocale(getStoredLocale());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('phaiffertech-public-theme', theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem('phaiffertech-public-locale', locale);
  }, [locale]);

  const t = useMemo(() => copy[locale], [locale]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {t.brandEyebrow}
            </p>
            <p className="truncate text-lg font-semibold text-[var(--foreground)]">
              {t.brandTitle}
            </p>
          </div>

          <div className="hidden items-center gap-6 lg:flex">
            <a className="text-sm text-slate-600 transition hover:text-[var(--foreground)]" href="#platform">
              {t.navPlatform}
            </a>
            <a className="text-sm text-slate-600 transition hover:text-[var(--foreground)]" href="#modules">
              {t.navModules}
            </a>
            <a className="text-sm text-slate-600 transition hover:text-[var(--foreground)]" href="#architecture">
              {t.navArchitecture}
            </a>
            <Link
              href="/login"
              className="rounded-xl bg-action px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              {t.navLogin}
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1 sm:flex">
              <span className="px-2 text-[11px] font-medium text-slate-500">{t.localeLabel}</span>
              <button
                type="button"
                onClick={() => setLocale('pt-BR')}
                className={[
                  'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                  locale === 'pt-BR'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                    : 'text-slate-500 hover:text-[var(--foreground)]'
                ].join(' ')}
              >
                PT
              </button>
              <button
                type="button"
                onClick={() => setLocale('en-US')}
                className={[
                  'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                  locale === 'en-US'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                    : 'text-slate-500 hover:text-[var(--foreground)]'
                ].join(' ')}
              >
                EN
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-1">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={[
                  'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                  theme === 'light'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                    : 'text-slate-500 hover:text-[var(--foreground)]'
                ].join(' ')}
              >
                {t.themeLight}
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={[
                  'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                  theme === 'dark'
                    ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
                    : 'text-slate-500 hover:text-[var(--foreground)]'
                ].join(' ')}
              >
                {t.themeDark}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
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
                  Multi-tenant
                </p>
                <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">JWT + RBAC + Modules</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Public presentation layer connected to an operational platform with tenant isolation,
                  permissions and modular enablement.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Frontend
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">Next.js App Router</p>
                </div>

                <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Backend
                  </p>
                  <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">Spring Boot + Multi-tenant</p>
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
                <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">{t.moduleCoreTitle}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{t.moduleCoreText}</p>
              </div>

              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  CRM
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">{t.moduleCrmTitle}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{t.moduleCrmText}</p>
              </div>

              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  IoT
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">{t.moduleIotTitle}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{t.moduleIotText}</p>
              </div>

              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Pet
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">{t.modulePetTitle}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{t.modulePetText}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="architecture" className="border-b border-[var(--border)]">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Architecture
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">{t.architectureTitle}</h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{t.architectureText}</p>
            </div>
          </div>
        </section>

        {children}
      </main>

      <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <span>{t.footerText}</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="transition hover:text-[var(--foreground)]">
              {t.navLogin}
            </Link>
            <a href="#platform" className="transition hover:text-[var(--foreground)]">
              {t.navPlatform}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}