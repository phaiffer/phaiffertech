'use client';

import { PublicCtaSection } from '@/shared/components/public-cta-section';
import { PublicFeatureGrid } from '@/shared/components/public-feature-grid';
import { PublicHeroSection } from '@/shared/components/public-hero-section';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import {
  WebsiteCardGrid,
  WebsiteSection,
  WebsiteSectionHeading,
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
      <PublicHeroSection
        id="overview"
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
        description={content.hero.description}
        primaryCtaLabel={content.hero.primaryCta.label}
        primaryCtaHref={content.hero.primaryCta.href}
        secondaryCtaLabel={content.hero.secondaryCta.label}
        secondaryCtaHref={content.hero.secondaryCta.href}
        platformCardEyebrow={content.hero.platformCardEyebrow}
        platformCardTitle={content.hero.platformCardTitle}
        platformCardText={content.hero.platformCardText}
        frontendCardEyebrow={content.hero.frontendCardEyebrow}
        frontendCardTitle={content.hero.frontendCardTitle}
        backendCardEyebrow={content.hero.backendCardEyebrow}
        backendCardTitle={content.hero.backendCardTitle}
      />

      <WebsiteSection tone="muted">
        <WebsiteSectionHeading
          eyebrow={labels.signals}
          title={content.signalTitle}
          description={content.signalDescription}
        />
        <WebsiteStatStrip items={content.signals} />
      </WebsiteSection>

      <PublicFeatureGrid
        id="products"
        eyebrowLabel={labels.framework}
        title={content.productsTitle}
        description={content.productsDescription}
        items={content.products}
      />

      <WebsiteSection>
        <WebsiteSectionHeading
          eyebrow={labels.authority}
          title={content.expertiseTitle}
          description={content.expertiseDescription}
        />
        <WebsiteCardGrid items={content.expertise} />
      </WebsiteSection>

      <WebsiteSection tone="muted">
        <WebsiteSectionHeading
          eyebrow={labels.architecture}
          title={content.architectureTitle}
          description={content.architectureDescription}
        />
        <WebsiteCardGrid items={content.architecture} />
      </WebsiteSection>

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
