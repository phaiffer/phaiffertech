'use client';

import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import {
  WebsiteArticleGrid,
  WebsiteSplitSection
} from './website-sections';

export function WebsiteArticlesPage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).articles;
  const labels =
    locale === 'pt-BR'
      ? {
          products: 'Produtos',
          contact: 'Contato',
          publishing: 'Material de apoio',
          readInsight: 'Ler insight'
        }
      : {
          products: 'Products',
          contact: 'Contact',
          publishing: 'Supporting material',
          readInsight: 'Read insight'
        };

  return (
    <>
      <WebsiteHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        primaryCta={{ label: labels.products, href: '/products' }}
        secondaryCta={{ label: labels.contact, href: '/contact' }}
      />

      <WebsiteSplitSection
        tone="muted"
        eyebrow={labels.publishing}
        title={content.featuredTitle}
        description={
          locale === 'pt-BR'
            ? 'Estas notas apoiam a narrativa técnica da plataforma, mas o produto visível oficial hoje continua sendo o PetFlow.'
            : 'These notes support the technical platform story, but PetFlow remains the official visible product surface today.'
        }
      >
        <WebsiteArticleGrid items={content.items.slice(0, 2)} ctaLabel={labels.readInsight} />
      </WebsiteSplitSection>
    </>
  );
}
