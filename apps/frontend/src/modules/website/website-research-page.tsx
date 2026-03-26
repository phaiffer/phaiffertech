'use client';

import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import {
  WebsiteCardGrid,
  WebsiteFullSection,
  WebsiteStatStrip
} from './website-sections';

export function WebsiteResearchPage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).research;
  const labels =
    locale === 'pt-BR'
      ? {
          insights: 'Insights',
          contact: 'Contato',
          tracks: 'Trilhas de pesquisa',
          bridge: 'Ponte'
        }
      : {
          insights: 'Insights',
          contact: 'Contact',
          tracks: 'Research tracks',
          bridge: 'Bridge'
        };

  return (
    <>
      <WebsiteHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        primaryCta={{ label: labels.insights, href: '/articles' }}
        secondaryCta={{ label: labels.contact, href: '/contact' }}
      />

      <WebsiteFullSection
        tone="muted"
        eyebrow={labels.tracks}
        title={content.tracksTitle}
        description={content.tracksDescription}
      >
        <WebsiteCardGrid items={content.tracks.slice(0, 3)} />
      </WebsiteFullSection>

      <WebsiteFullSection
        eyebrow={labels.bridge}
        title={content.bridgeTitle}
        description={content.bridgeDescription}
      >
        <WebsiteStatStrip items={content.bridge} />
      </WebsiteFullSection>
    </>
  );
}
