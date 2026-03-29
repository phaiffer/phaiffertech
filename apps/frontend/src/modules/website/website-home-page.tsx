'use client';

import { PublicCtaSection } from '@/shared/components/public-cta-section';
import {
  publicEyebrowClass,
  publicSectionSupportingTextClass,
  publicSectionTitleClass,
  publicSiteContainerClass
} from '@/shared/components/public-visual-system';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import {
  WebsiteCardGrid,
  WebsiteFullSection,
  WebsiteStatStrip
} from './website-sections';

export function WebsiteHomePage() {
  const { locale } = usePublicSite();
  const messages = useAppMessages().publicHome;
  const content = getWebsiteContent(locale).home;

  return (
    <>
      <WebsiteHero
        id="overview"
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
        titleHighlight={content.hero.titleHighlight}
        description={content.hero.description}
        highlights={content.hero.highlights}
        stats={content.hero.stats}
        primaryCta={content.hero.primaryCta}
        secondaryCta={content.hero.secondaryCta}
      />

      <section className="relative -mt-6 pb-4 lg:-mt-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[linear-gradient(180deg,rgba(16,185,129,0.08),transparent)]" />
        <div className={`${publicSiteContainerClass} relative`}>
          <div className="rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_30px_72px_-44px_rgba(15,23,42,0.2)] backdrop-blur-sm sm:p-8">
            <div className="max-w-3xl">
              <p className={`${publicEyebrowClass} text-[color:var(--accent)]`}>{messages.framework}</p>
              <h2 className={`mt-3 ${publicSectionTitleClass}`}>{content.signalTitle}</h2>
              <p className={`mt-3 ${publicSectionSupportingTextClass}`}>{content.signalDescription}</p>
            </div>
            <div className="mt-8">
              <WebsiteStatStrip items={content.signals} />
            </div>
          </div>
        </div>
      </section>

      <WebsiteFullSection
        eyebrow={messages.productLanes}
        title={content.productsTitle}
        description={content.productsDescription}
      >
        <WebsiteCardGrid items={content.products} />
      </WebsiteFullSection>

      <WebsiteFullSection
        tone="muted"
        eyebrow={messages.expertiseEyebrow}
        title={content.expertiseTitle}
        description={content.expertiseDescription}
      >
        <WebsiteCardGrid items={content.expertise} />
      </WebsiteFullSection>

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
