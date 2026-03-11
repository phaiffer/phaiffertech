'use client';

import { PublicCtaSection } from '@/shared/components/public-cta-section';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import {
  WebsiteCardGrid,
  WebsiteSection,
  WebsiteSectionHeading
} from './website-sections';

export function WebsiteContactPage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).contact;
  const labels =
    locale === 'pt-BR'
      ? {
          openPlatform: 'Abrir acesso à plataforma',
          reviewPlatform: 'Ler visão da plataforma',
          lanes: 'Trilhas de conversa',
          readiness: 'Preparação'
        }
      : {
          openPlatform: 'Open platform access',
          reviewPlatform: 'Review the platform overview',
          lanes: 'Conversation lanes',
          readiness: 'Readiness'
        };

  return (
    <>
      <WebsiteHero
        locale={locale}
        variant="contact"
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        primaryCta={{ label: labels.openPlatform, href: '/login' }}
        secondaryCta={{ label: labels.reviewPlatform, href: '/platform' }}
      />

      <WebsiteSection tone="muted">
        <WebsiteSectionHeading
          eyebrow={labels.lanes}
          title={content.lanesTitle}
          description={content.lanesDescription}
        />
        <WebsiteCardGrid items={content.lanes} />
      </WebsiteSection>

      <WebsiteSection>
        <WebsiteSectionHeading
          eyebrow={labels.readiness}
          title={content.readinessTitle}
          description={content.readinessDescription}
        />
        <WebsiteCardGrid items={content.readiness} />
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
