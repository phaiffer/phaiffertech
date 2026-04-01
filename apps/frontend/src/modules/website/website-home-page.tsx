'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Car,
  CheckCircle2,
  CreditCard,
  Package,
  Scissors,
  ShoppingBag,
  Stethoscope,
  TrendingUp,
  Users
} from 'lucide-react';
import { publicSiteContainerClass } from '@/shared/components/public-visual-system';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';

export function WebsiteHomePage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).home;
  const featureIcons = [ShoppingBag, Scissors, Stethoscope, Package];
  const operationalIcons = [Car, Package, CreditCard, Users, TrendingUp, CheckCircle2];

  return (
    <main>
      <section className="relative overflow-hidden bg-gradient-to-b from-[color:var(--accent)]/7 via-white to-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_36%)]" />
        <div className={`${publicSiteContainerClass} relative py-24 md:py-28`}>
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--accent)]/10 px-4 py-2 text-sm font-medium text-[color:var(--accent)]">
              <span>{content.hero.eyebrow}</span>
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-[-0.045em] text-slate-900 md:text-5xl lg:text-6xl">
              {content.hero.title}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-700">
              {content.hero.description}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={content.hero.primaryCta.href}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[linear-gradient(135deg,var(--accent),var(--petflow-teal))] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_-26px_rgba(16,185,129,0.52)] sm:w-auto"
              >
                {content.hero.primaryCta.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href={content.hero.secondaryCta.href}
                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900 sm:w-auto"
              >
                {content.hero.secondaryCta.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className={publicSiteContainerClass}>
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--accent)]">Solutions</p>
            <h2 className="text-3xl font-bold tracking-[-0.035em] text-slate-900 md:text-4xl">{content.productsTitle}</h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-700">{content.productsDescription}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {content.products.map((item, index) => {
              const Icon = featureIcons[index] ?? TrendingUp;
              return (
                <article key={item.title} className="rounded-2xl border border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.04),rgba(255,255,255,0.99)_140px)] p-6 shadow-[0_18px_38px_-30px_rgba(15,23,42,0.16)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">{item.eyebrow}</p>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-slate-900">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-slate-700">{item.description}</p>
                  {item.bullets?.length ? (
                    <ul className="mt-5 space-y-3">
                      {item.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--accent)]" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(180deg,rgba(16,185,129,0.04),rgba(248,250,252,0.84))] py-20 md:py-24">
        <div className={`${publicSiteContainerClass} grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-center`}>
          <div>
            <h2 className="text-3xl font-bold tracking-[-0.035em] text-slate-900 md:text-4xl">{content.expertiseTitle}</h2>
            <p className="mt-5 text-lg leading-8 text-slate-700">{content.expertiseDescription}</p>
            <ul className="mt-8 space-y-4">
              {content.expertise.slice(0, 6).map((item, index) => {
                const Icon = operationalIcons[index] ?? CheckCircle2;
                return (
                  <li key={item.title} className="flex items-start gap-3">
                    <Icon className="mt-1 h-5 w-5 shrink-0 text-[color:var(--accent)]" />
                    <div>
                      <p className="font-medium text-slate-900">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">{item.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(255,255,255,0.94))] p-8">
            <div className="rounded-2xl bg-white p-6 shadow-[0_28px_54px_-34px_rgba(15,23,42,0.22)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--accent)]/12 text-[color:var(--accent)]">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">PetFlow</p>
                  <p className="text-sm text-slate-700">{content.signalTitle}</p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {content.signals.map((item) => (
                  <div key={item.value} className="rounded-xl bg-[linear-gradient(180deg,rgba(16,185,129,0.04),rgba(248,250,252,0.94))] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">{item.value}</p>
                    <p className="mt-2 font-medium text-slate-900">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--accent)] py-20 text-white md:py-24">
        <div className={`${publicSiteContainerClass} text-center`}>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/75">{content.cta.eyebrow}</p>
          <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-bold tracking-[-0.035em] md:text-4xl">{content.cta.title}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/80">{content.cta.description}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={content.cta.primaryCta.href}
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900"
            >
              {content.cta.primaryCta.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href={content.cta.secondaryCta.href}
              className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {content.cta.secondaryCta.label}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
