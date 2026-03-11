'use client';

import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import {
  WebsiteCardGrid,
  WebsiteSection,
  WebsiteSectionHeading,
  WebsiteStatStrip
} from './website-sections';

export function WebsiteEngineeringPage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).engineering;
  const labels =
    locale === 'pt-BR'
      ? {
          research: 'Pesquisa',
          insights: 'Insights',
          expertise: 'Especialidade',
          delivery: 'Entrega',
          principles: 'Princípios'
        }
      : {
          research: 'Research',
          insights: 'Insights',
          expertise: 'Expertise',
          delivery: 'Delivery',
          principles: 'Principles'
        };

  return (
    <>
      <WebsiteHero
        locale={locale}
        variant="engineering"
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        primaryCta={{ label: labels.research, href: '/research' }}
        secondaryCta={{ label: labels.insights, href: '/articles' }}
      />

      <WebsiteSection tone="muted">
        <WebsiteSectionHeading
          eyebrow={labels.expertise}
          title={content.expertiseTitle}
          description={content.expertiseDescription}
        />
        <WebsiteCardGrid items={content.expertise} />
      </WebsiteSection>

      <WebsiteSection>
        <WebsiteSectionHeading
          eyebrow={labels.delivery}
          title={content.deliveryTitle}
          description={content.deliveryDescription}
        />
        <WebsiteCardGrid items={content.delivery} />
      </WebsiteSection>

      <WebsiteSection tone="muted">
        <WebsiteSectionHeading
          eyebrow={labels.principles}
          title={content.principlesTitle}
          description={content.principlesDescription}
        />
        <WebsiteStatStrip items={content.principles} />
      </WebsiteSection>
    </>
  );
}
