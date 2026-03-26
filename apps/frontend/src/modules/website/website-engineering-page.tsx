'use client';

import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import {
  WebsiteCardGrid,
  WebsiteFullSection,
  WebsiteStatStrip
} from './website-sections';

export function WebsiteEngineeringPage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).engineering;
  const labels =
    locale === 'pt-BR'
      ? {
          platform: 'Plataforma',
          contact: 'Contato',
          expertise: 'Especialidade',
          principles: 'Princípios'
        }
      : {
          platform: 'Platform',
          contact: 'Contact',
          expertise: 'Expertise',
          principles: 'Principles'
        };

  return (
    <>
      <WebsiteHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        primaryCta={{ label: labels.platform, href: '/platform' }}
        secondaryCta={{ label: labels.contact, href: '/contact' }}
      />

      <WebsiteFullSection
        tone="muted"
        eyebrow={labels.expertise}
        title={content.expertiseTitle}
        description={content.expertiseDescription}
      >
        <WebsiteCardGrid items={content.expertise.slice(0, 3)} />
      </WebsiteFullSection>

      <WebsiteFullSection
        eyebrow={labels.principles}
        title={content.principlesTitle}
        description={content.principlesDescription}
      >
        <WebsiteStatStrip items={content.principles} />
      </WebsiteFullSection>
    </>
  );
}
