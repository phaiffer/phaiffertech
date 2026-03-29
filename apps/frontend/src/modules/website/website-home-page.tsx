'use client';

import { 
  FileText, 
  Calendar, 
  Syringe, 
  Users, 
  DollarSign, 
  PawPrint 
} from 'lucide-react';
import { PublicCtaSection } from '@/shared/components/public-cta-section';
import { PublicFeatureGrid, type PublicFeatureItem } from '@/shared/components/public-feature-grid';
import Link from 'next/link';
import { PublicCtaSection } from '@/shared/components/public-cta-section';
import { PublicHeroSection } from '@/shared/components/public-hero-section';
import { publicSiteContainerClass } from '@/shared/components/public-visual-system';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import { PublicBenefitsSection } from '@/shared/components/public-benefits-section';

// Map icon names to Lucide icons
const featureIcons = [FileText, Calendar, Syringe, Users, DollarSign, PawPrint];

export function WebsiteHomePage() {
  const { locale } = usePublicSite();
  const messages = useAppMessages().publicHome;
  const content = getWebsiteContent(locale).home;

  // Map products to include icons
  const productsWithIcons: PublicFeatureItem[] = content.products.slice(0, 6).map((product, index) => ({
    ...product,
    icon: featureIcons[index % featureIcons.length],
  }));

  return (
    <>
      <PublicHeroSection
        id="overview"
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
        titleHighlight={content.hero.titleHighlight}
        description={content.hero.description}
        highlights={content.hero.highlights}
        stats={content.hero.stats}
        primaryCtaLabel={content.hero.primaryCta.label}
        primaryCtaHref={content.hero.primaryCta.href}
        secondaryCtaLabel={content.hero.secondaryCta.label}
        secondaryCtaHref={content.hero.secondaryCta.href}
      />

      <PublicFeatureGrid
        id="products"
        eyebrowLabel="Recursos completos"
        title={content.productsTitle}
        description={content.productsDescription}
        items={productsWithIcons}
      />

      <PublicBenefitsSection />
      <section id="products" className="border-t border-slate-200 bg-slate-50 py-24">
        <div className={publicSiteContainerClass}>
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-[color:var(--accent)]">
              {messages.productLanes}
            </p>
            <h2 className="mt-5 text-4xl font-bold tracking-[-0.04em] text-slate-900 sm:text-5xl">
              {content.productsTitle}
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {content.productsDescription}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {content.products.slice(0, 3).map((item, index) => (
              <article
                key={`${item.eyebrow}-${item.title}`}
                className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-8"
              >
                <div
                  className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${
                    index === 0
                      ? 'bg-[color:var(--accent)] text-white'
                      : index === 1
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="text-lg font-semibold">{String(index + 1).padStart(2, '0')}</span>
                </div>

                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{item.eyebrow}</p>
                <h3 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-slate-900">{item.title}</h3>
                <p className="mt-4 text-base leading-8 text-slate-600">{item.description}</p>

                {item.bullets?.length ? (
                  <ul className="mt-8 space-y-3">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 text-sm text-slate-600">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <div className="mt-8 border-t border-slate-200 pt-5">
                  <Link href={content.hero.primaryCta.href} className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent)] transition-colors hover:text-slate-900">
                    {content.hero.primaryCta.label}
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="signals" className="border-t border-slate-200 bg-white py-24">
        <div className={`${publicSiteContainerClass} grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start`}>
          <div className="max-w-xl">
            <p className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              {messages.framework}
            </p>
            <h2 className="mt-5 text-4xl font-bold tracking-[-0.04em] text-slate-900 sm:text-5xl">
              {content.signalTitle}
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {content.signalDescription}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {content.signals.map((item) => (
              <article key={`${item.value}-${item.label}`} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                  {item.label}
                </p>
                <h3 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-slate-900">{item.value}</h3>
                <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="operations" className="border-t border-slate-200 bg-slate-50 py-24">
        <div className={publicSiteContainerClass}>
          <div className="mb-14 max-w-3xl">
            <p className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-[color:var(--accent)]">
              {messages.expertiseEyebrow}
            </p>
            <h2 className="mt-5 text-4xl font-bold tracking-[-0.04em] text-slate-900 sm:text-5xl">
              {content.expertiseTitle}
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {content.expertiseDescription}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {content.expertise.map((item) => (
              <article key={`${item.eyebrow}-${item.title}`} className="rounded-[2rem] border border-slate-200 bg-white p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{item.eyebrow}</p>
                <h3 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-slate-900">{item.title}</h3>
                <p className="mt-5 text-base leading-8 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PublicCtaSection
        eyebrow={content.cta.eyebrow}
        title={content.cta.title}
        description={content.cta.description}
        primaryCtaLabel={content.cta.primaryCta.label}
        primaryCtaHref={content.cta.primaryCta.href}
        secondaryCtaLabel={content.cta.secondaryCta.label}
        secondaryCtaHref={content.cta.secondaryCta.href}
      />
    </>
  );
}
