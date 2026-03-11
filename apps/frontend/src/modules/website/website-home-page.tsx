'use client';

import { PublicCtaSection } from '@/shared/components/public-cta-section';
import { PublicFeatureGrid } from '@/shared/components/public-feature-grid';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
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
      <WebsiteHero
        id="overview"
        locale={locale}
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
        description={content.hero.description}
        primaryCta={content.hero.primaryCta}
        secondaryCta={content.hero.secondaryCta}
        cards={{
          platformCardEyebrow: content.hero.platformCardEyebrow,
          platformCardTitle: content.hero.platformCardTitle,
          platformCardText: content.hero.platformCardText,
          frontendCardEyebrow: content.hero.frontendCardEyebrow,
          frontendCardTitle: content.hero.frontendCardTitle,
          backendCardEyebrow: content.hero.backendCardEyebrow,
          backendCardTitle: content.hero.backendCardTitle
        }}
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
