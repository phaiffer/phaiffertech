'use client';

import { PublicCtaSection } from '@/shared/components/public-cta-section';
import { PublicFeatureGrid } from '@/shared/components/public-feature-grid';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import {
  WebsiteCardGrid,
  WebsiteSplitSection,
  WebsiteStatStrip
} from './website-sections';

export function WebsiteHomePage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).home;
  const labels =
    locale === 'pt-BR'
      ? {
          framework: 'Visão de plataforma',
          signals: 'Sinais',
          authority: 'Autoridade',
          architecture: 'Arquitetura'
        }
      : {
          framework: 'Platform view',
          signals: 'Signals',
          authority: 'Authority',
          architecture: 'Architecture'
        };

  return (
    <>
      <WebsiteHero
        id="overview"
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
        description={content.hero.description}
        primaryCta={content.hero.primaryCta}
        secondaryCta={content.hero.secondaryCta}
      />

      <WebsiteSplitSection
        tone="muted"
        eyebrow={labels.signals}
        title={content.signalTitle}
        description={content.signalDescription}
      >
        <WebsiteStatStrip items={content.signals} />
      </WebsiteSplitSection>

      <PublicFeatureGrid
        id="products"
        eyebrowLabel={labels.framework}
        title={content.productsTitle}
        description={content.productsDescription}
        items={content.products}
      />

      <WebsiteSplitSection
        eyebrow={labels.authority}
        title={content.expertiseTitle}
        description={content.expertiseDescription}
      >
        <WebsiteCardGrid items={content.expertise} />
      </WebsiteSplitSection>

      <WebsiteSplitSection
        tone="muted"
        eyebrow={labels.architecture}
        title={content.architectureTitle}
        description={content.architectureDescription}
      >
        <WebsiteCardGrid items={content.architecture} />
      </WebsiteSplitSection>

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
