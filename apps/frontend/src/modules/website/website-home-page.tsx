'use client';

import { PublicCtaSection } from '@/shared/components/public-cta-section';
import { PublicFeatureGrid } from '@/shared/components/public-feature-grid';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { WebsiteCardGrid, WebsiteFullSection, WebsiteStatStrip } from './website-sections';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';

export function WebsiteHomePage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).home;
  const labels =
    locale === 'pt-BR'
      ? {
          framework: 'Soluções',
          productLanes: 'Frentes operacionais'
        }
      : {
          framework: 'Solutions',
          productLanes: 'Operational lanes'
        };

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

      <WebsiteFullSection
        id="signals"
        eyebrow={labels.framework}
        title={content.signalTitle}
        description={content.signalDescription}
      >
        <WebsiteStatStrip items={content.signals} />
      </WebsiteFullSection>

      <PublicFeatureGrid
        id="products"
        eyebrowLabel={labels.productLanes}
        title={content.productsTitle}
        description={content.productsDescription}
        items={content.products.slice(0, 3)}
      />

      <WebsiteFullSection
        id="operations"
        tone="muted"
        eyebrow={locale === 'pt-BR' ? 'Porque a demo convence' : 'Why the demo lands'}
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
