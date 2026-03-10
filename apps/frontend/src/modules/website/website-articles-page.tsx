'use client';

import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import {
  WebsiteArticleGrid,
  WebsitePageIntro,
  WebsiteSection,
  WebsiteSectionHeading
} from './website-sections';

export function WebsiteArticlesPage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).articles;
  const labels =
    locale === 'pt-BR'
      ? {
          research: 'Pesquisa',
          platform: 'Plataforma',
          publishing: 'Publicação',
          readInsight: 'Ler insight'
        }
      : {
          research: 'Research',
          platform: 'Platform',
          publishing: 'Publishing',
          readInsight: 'Read insight'
        };

  return (
    <>
      <WebsitePageIntro
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        primaryCta={{ label: labels.research, href: '/research' }}
        secondaryCta={{ label: labels.platform, href: '/platform' }}
      />

      <WebsiteSection tone="muted">
        <WebsiteSectionHeading
          eyebrow={labels.publishing}
          title={content.featuredTitle}
          description={content.featuredDescription}
        />
        <WebsiteArticleGrid items={content.items} ctaLabel={labels.readInsight} />
      </WebsiteSection>
    </>
  );
}
