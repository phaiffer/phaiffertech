'use client';

import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import {
  WebsiteCardGrid,
  WebsiteSplitSection
} from './website-sections';

export function WebsitePlatformPage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).platform;
  const labels =
    locale === 'pt-BR'
      ? {
          products: 'Produtos',
          engineering: 'Engineering',
          foundation: 'Fundação',
          layers: 'Camadas',
          modules: 'Módulos'
        }
      : {
          products: 'Products',
          engineering: 'Engineering',
          foundation: 'Foundation',
          layers: 'Layers',
          modules: 'Modules'
        };

  return (
    <>
      <WebsiteHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        primaryCta={{ label: labels.products, href: '/products' }}
        secondaryCta={{ label: labels.engineering, href: '/engineering' }}
      />

      <WebsiteSplitSection
        tone="muted"
        eyebrow={labels.foundation}
        title={content.foundationTitle}
        description={content.foundationDescription}
      >
        <WebsiteCardGrid items={content.foundation} />
      </WebsiteSplitSection>

      <WebsiteSplitSection
        eyebrow={labels.layers}
        title={content.layersTitle}
        description={content.layersDescription}
      >
        <WebsiteCardGrid items={content.layers} />
      </WebsiteSplitSection>

      <WebsiteSplitSection
        tone="muted"
        eyebrow={labels.modules}
        title={content.modulesTitle}
        description={content.modulesDescription}
      >
        <WebsiteCardGrid items={content.modules} />
      </WebsiteSplitSection>
    </>
  );
}
