'use client';

import { PublicCtaSection } from '@/shared/components/public-cta-section';
import { PublicFeatureGrid } from '@/shared/components/public-feature-grid';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { WebsiteCardGrid, WebsiteFullSection, WebsiteStatStrip } from './website-sections';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';

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
        description={content.hero.description}
        highlights={content.hero.highlights}
        stats={content.hero.stats}
        primaryCta={content.hero.primaryCta}
        secondaryCta={content.hero.secondaryCta}
      />

      <PublicFeatureGrid
        id="products"
        eyebrowLabel={messages.productLanes}
        title={content.productsTitle}
        description={content.productsDescription}
        items={content.products.slice(0, 3)}
      />

      <WebsiteFullSection
        id="signals"
        eyebrow={messages.framework}
        title={content.signalTitle}
        description={content.signalDescription}
      >
        <WebsiteStatStrip items={content.signals} />
      </WebsiteFullSection>

      <WebsiteFullSection
        id="operations"
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
