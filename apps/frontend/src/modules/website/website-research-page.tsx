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
        locale={locale}
        variant="research"
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        primaryCta={{ label: labels.insights, href: '/articles' }}
        secondaryCta={{ label: labels.engineering, href: '/engineering' }}
      />

      <WebsiteSection tone="muted">
        <WebsiteSectionHeading
          eyebrow={labels.tracks}
          title={content.tracksTitle}
          description={content.tracksDescription}
        />
        <WebsiteCardGrid items={content.tracks} />
      </WebsiteSection>

      <WebsiteSection>
        <WebsiteSectionHeading
          eyebrow={labels.outputs}
          title={content.outputsTitle}
          description={content.outputsDescription}
        />
        <WebsiteCardGrid items={content.outputs} />
      </WebsiteSection>

      <WebsiteSection tone="muted">
        <WebsiteSectionHeading
          eyebrow={labels.bridge}
          title={content.bridgeTitle}
          description={content.bridgeDescription}
        />
        <WebsiteStatStrip items={content.bridge} />
      </WebsiteSection>
    </>
  );
}
