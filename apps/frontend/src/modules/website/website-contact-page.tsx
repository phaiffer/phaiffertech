'use client';

import { PublicCtaSection } from '@/shared/components/public-cta-section';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import {
  WebsiteCardGrid,
  WebsiteFullSection,
} from './website-sections';

export function WebsiteContactPage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).contact;
  const labels =
    locale === 'pt-BR'
      ? {
          lanes: 'Solicitacoes',
          readiness: 'Canais diretos'
        }
      : {
          lanes: 'Request types',
          readiness: 'Direct channels'
        };

  return (
    <>
      <WebsiteHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        primaryCta={content.cta.primaryCta}
        secondaryCta={content.cta.secondaryCta}
      />

      <WebsiteFullSection
        tone="muted"
        eyebrow={labels.lanes}
        title={content.lanesTitle}
        description={content.lanesDescription}
      >
        <WebsiteCardGrid items={content.lanes} />
      </WebsiteFullSection>

      <WebsiteFullSection
        tone="muted"
        eyebrow={labels.readiness}
        title={content.readinessTitle}
        description={content.readinessDescription}
      >
        <WebsiteCardGrid items={content.readiness} />
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
