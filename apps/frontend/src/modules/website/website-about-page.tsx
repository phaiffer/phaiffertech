'use client';

import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import {
  WebsiteCardGrid,
  WebsiteSplitSection,
  WebsiteStatStrip
} from './website-sections';

export function WebsiteAboutPage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).about;
  const labels =
    locale === 'pt-BR'
      ? {
          platform: 'Plataforma',
          research: 'Pesquisa',
          identity: 'Identidade',
          principles: 'Princípios',
          direction: 'Direção'
        }
      : {
          platform: 'Platform',
          research: 'Research',
          identity: 'Identity',
          principles: 'Principles',
          direction: 'Direction'
        };

  return (
    <>
      <WebsiteHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        primaryCta={{ label: labels.platform, href: '/platform' }}
        secondaryCta={{ label: labels.research, href: '/research' }}
      />

      <WebsiteSplitSection
        eyebrow={labels.identity}
        title={content.identityTitle}
        description={content.identityDescription}
      >
        <WebsiteStatStrip items={content.identity} />
      </WebsiteSplitSection>

      <WebsiteSplitSection
        tone="muted"
        eyebrow={labels.principles}
        title={content.principlesTitle}
        description={content.principlesDescription}
      >
        <WebsiteCardGrid items={content.principles} />
      </WebsiteSplitSection>

      <WebsiteSplitSection
        eyebrow={labels.direction}
        title={content.directionTitle}
        description={content.directionDescription}
      >
        <WebsiteCardGrid items={content.direction} />
      </WebsiteSplitSection>
    </>
  );
}
