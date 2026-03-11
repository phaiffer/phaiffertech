'use client';

import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import {
  WebsiteCardGrid,
  WebsiteSplitSection,
  WebsiteStatStrip
} from './website-sections';

export function WebsiteResearchPage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).research;
  const labels =
    locale === 'pt-BR'
      ? {
          insights: 'Insights',
          engineering: 'Engineering',
          tracks: 'Trilhas de pesquisa',
          outputs: 'Outputs',
          bridge: 'Ponte'
        }
      : {
          insights: 'Insights',
          engineering: 'Engineering',
          tracks: 'Research tracks',
          outputs: 'Outputs',
          bridge: 'Bridge'
        };

  return (
    <>
      <WebsiteHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        primaryCta={{ label: labels.insights, href: '/articles' }}
        secondaryCta={{ label: labels.engineering, href: '/engineering' }}
      />

      <WebsiteSplitSection
        tone="muted"
        eyebrow={labels.tracks}
        title={content.tracksTitle}
        description={content.tracksDescription}
      >
        <WebsiteCardGrid items={content.tracks} />
      </WebsiteSplitSection>

      <WebsiteSplitSection
        eyebrow={labels.outputs}
        title={content.outputsTitle}
        description={content.outputsDescription}
      >
        <WebsiteCardGrid items={content.outputs} />
      </WebsiteSplitSection>

      <WebsiteSplitSection
        tone="muted"
        eyebrow={labels.bridge}
        title={content.bridgeTitle}
        description={content.bridgeDescription}
      >
        <WebsiteStatStrip items={content.bridge} />
      </WebsiteSplitSection>
    </>
  );
}
