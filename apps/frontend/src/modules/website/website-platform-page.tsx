'use client';

import Link from 'next/link';
import { ArrowRight, Cloud, Globe, Lock, Monitor, RefreshCw, Server, Shield, Smartphone, Zap } from 'lucide-react';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { publicSiteContainerClass } from '@/shared/components/public-visual-system';
import { getWebsiteContent } from './website-content';

export function WebsitePlatformPage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).platform;
  const foundationIcons = [Cloud, Shield, Zap];
  const platformIcons = [Monitor, Smartphone, Server];
  const labels =
    locale === 'pt-BR'
      ? {
          action: 'Ver em ação',
          platformLabel: 'Infraestrutura confiável',
          devicesTitle: 'Acesse de qualquer dispositivo',
          devicesDescription: 'A plataforma preserva a base técnica enquanto o PetFlow segue como produto visível.'
        }
      : {
          action: 'See it in action',
          platformLabel: 'Reliable foundation',
          devicesTitle: 'Access from any device',
          devicesDescription: 'The platform preserves the technical base while PetFlow remains the visible product.'
        };

  return (
    <main>
      <section className="bg-gradient-to-b from-[color:var(--accent)]/7 via-white to-white py-20 md:py-24">
        <div className={`${publicSiteContainerClass} text-center`}>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--accent)]">{content.eyebrow}</p>
          <h1 className="mx-auto mt-5 max-w-4xl text-4xl font-bold tracking-[-0.045em] text-slate-900 md:text-5xl">
            {content.title}
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-700">{content.description}</p>
          <Link
            href="/contact"
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--petflow-teal))] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_-26px_rgba(16,185,129,0.52)]"
          >
            {labels.action}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-slate-700">
            <Link href="/products" className="transition-colors hover:text-slate-900">Products</Link>
            <Link href="/contact" className="transition-colors hover:text-slate-900">Contact</Link>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className={publicSiteContainerClass}>
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--accent)]">{labels.platformLabel}</p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.035em] text-slate-900 md:text-4xl">{content.foundationTitle}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-700">{content.foundationDescription}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {content.foundation.map((item, index) => {
              const Icon = foundationIcons[index] ?? RefreshCw;
              return (
                <article key={item.title} className="rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.04),rgba(255,255,255,0.99)_140px)] p-6 text-center shadow-[0_18px_38px_-30px_rgba(15,23,42,0.16)]">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
                    <Icon className="h-7 w-7" />
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">{item.eyebrow}</p>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-slate-900">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-700">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,rgba(16,185,129,0.04),rgba(248,250,252,0.84))] py-20 md:py-24">
        <div className={publicSiteContainerClass}>
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--accent)]">Modules</p>
            <h2 className="text-3xl font-bold tracking-[-0.035em] text-slate-900 md:text-4xl">{labels.devicesTitle}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-700">{labels.devicesDescription}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {content.modules.map((item, index) => {
              const Icon = platformIcons[index] ?? Globe;
              return (
                <article key={item.title} className="rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.04),rgba(255,255,255,0.99)_140px)] p-6 text-center shadow-[0_18px_38px_-30px_rgba(15,23,42,0.16)]">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
                    <Icon className="h-8 w-8" />
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">{item.eyebrow}</p>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-slate-900">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-700">{item.description}</p>
                </article>
              );
            })}
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              { value: '99.9%', label: 'Uptime' },
              { value: '< 50ms', label: 'Tempo de resposta' },
              { value: 'LGPD', label: locale === 'pt-BR' ? 'Governança' : 'Governance' },
              { value: '24/7', label: locale === 'pt-BR' ? 'Monitoramento' : 'Monitoring' }
            ].map((item) => (
              <div key={item.label}>
                <p className="text-4xl font-bold text-[color:var(--accent)]">{item.value}</p>
                <p className="mt-2 text-sm text-slate-700">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
