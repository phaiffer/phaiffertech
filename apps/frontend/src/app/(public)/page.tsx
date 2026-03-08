'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type PublicLocale = 'pt-BR' | 'en-US';

const copy = {
  'pt-BR': {
    heroEyebrow: 'Plataforma modular para operações reais',
    heroTitle: 'Software institucional e produto SaaS na mesma base.',
    heroDescription:
      'Uma experiência pública mais limpa para apresentação comercial, conectada a uma plataforma multi-tenant com CRM, IoT e PetFlow.',
    heroPrimaryCta: 'Acessar plataforma',
    heroSecondaryCta: 'Ver arquitetura',
    platformCardEyebrow: 'Multi-tenant',
    platformCardTitle: 'JWT + RBAC + Modules',
    platformCardText:
      'Camada pública conectada a uma plataforma operacional com isolamento por tenant, permissões e habilitação modular.',
    frontendCardEyebrow: 'Frontend',
    frontendCardTitle: 'Next.js App Router',
    backendCardEyebrow: 'Backend',
    backendCardTitle: 'Spring Boot + Multi-tenant',
    modulesTitle: 'Capacidades da plataforma',
    modulesDescription:
      'Apresente apenas o que faz sentido para cada cliente, sem poluição visual e com separação clara entre produto, operação e contexto comercial.',
    moduleCoreTitle: 'Core Platform',
    moduleCoreText:
      'Auth, tenants, IAM, settings, attachments, audit, subscription e governança central.',
    moduleCrmTitle: 'CRM',
    moduleCrmText:
      'Leads, deals, contacts, pipeline, tasks, notes e visão comercial operacional.',
    moduleIotTitle: 'IoT',
    moduleIotText:
      'Devices, telemetry, alarms, maintenance, reports e narrativa executiva para demo.',
    modulePetTitle: 'PetFlow',
    modulePetText:
      'Clientes, pets, agenda, medical workflow, inventory, invoices e operação clínica.',
    architectureEyebrow: 'Architecture',
    architectureTitle: 'Base preparada para evolução',
    architectureText:
      'Esta camada pública já fica pronta para evoluir com internacionalização completa, dark/light mode e integração visual com a plataforma autenticada.',
    ctaEyebrow: 'Pronto para apresentar',
    ctaTitle: 'Uma entrada institucional mais forte para vender melhor o produto.',
    ctaText:
      'Ajuste a narrativa pública da PhaifferTech antes de seguir com o refinamento dos módulos internos.',
    ctaPrimary: 'Entrar na plataforma',
    ctaSecondary: 'Ir para login'
  },
  'en-US': {
    heroEyebrow: 'Modular platform for real operations',
    heroTitle: 'Institutional software and SaaS product in the same foundation.',
    heroDescription:
      'A cleaner public-facing experience for commercial presentations, connected to a multi-tenant platform with CRM, IoT and PetFlow.',
    heroPrimaryCta: 'Open platform',
    heroSecondaryCta: 'View architecture',
    platformCardEyebrow: 'Multi-tenant',
    platformCardTitle: 'JWT + RBAC + Modules',
    platformCardText:
      'Public layer connected to an operational platform with tenant isolation, permissions and modular enablement.',
    frontendCardEyebrow: 'Frontend',
    frontendCardTitle: 'Next.js App Router',
    backendCardEyebrow: 'Backend',
    backendCardTitle: 'Spring Boot + Multi-tenant',
    modulesTitle: 'Platform capabilities',
    modulesDescription:
      'Present only what matters to each customer, without visual noise and with clear separation between product, operations and commercial context.',
    moduleCoreTitle: 'Core Platform',
    moduleCoreText:
      'Auth, tenants, IAM, settings, attachments, audit, subscription and central governance.',
    moduleCrmTitle: 'CRM',
    moduleCrmText:
      'Leads, deals, contacts, pipeline, tasks, notes and operational commercial visibility.',
    moduleIotTitle: 'IoT',
    moduleIotText:
      'Devices, telemetry, alarms, maintenance, reports and executive demo storytelling.',
    modulePetTitle: 'PetFlow',
    modulePetText:
      'Clients, pets, scheduling, medical workflow, inventory, invoices and clinic operations.',
    architectureEyebrow: 'Architecture',
    architectureTitle: 'Foundation ready for evolution',
    architectureText:
      'This public layer is ready to evolve with full internationalization, dark/light mode and visual integration with the authenticated platform.',
    ctaEyebrow: 'Presentation ready',
    ctaTitle: 'A stronger institutional entry point to sell the product better.',
    ctaText:
      'Adjust the public narrative of PhaifferTech before continuing with the refinement of the internal modules.',
    ctaPrimary: 'Open platform',
    ctaSecondary: 'Go to login'
  }
} as const;

function getStoredLocale(): PublicLocale {
  if (typeof window === 'undefined') {
    return 'pt-BR';
  }

  const stored = window.localStorage.getItem('phaiffertech-public-locale');
  return stored === 'en-US' ? 'en-US' : 'pt-BR';
}

export default function PublicHomePage() {
  const [locale, setLocale] = useState<PublicLocale>('pt-BR');

  useEffect(() => {
    setLocale(getStoredLocale());

    function handleStorage() {
      setLocale(getStoredLocale());
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const t = useMemo(() => copy[locale], [locale]);

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