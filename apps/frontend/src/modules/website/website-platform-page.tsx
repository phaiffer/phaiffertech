'use client';

import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import {
  WebsiteCardGrid,
  WebsiteFullSection,
} from './website-sections';

export function WebsitePlatformPage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).platform;
  const labels =
    locale === 'pt-BR'
      ? {
          products: 'Produtos',
          contact: 'Contato',
          foundation: 'Fundação',
          modules: 'Módulos'
        }
      : {
          products: 'Products',
          contact: 'Contact',
          foundation: 'Foundation',
          modules: 'Modules'
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

      <WebsiteFullSection
        tone="muted"
        eyebrow={labels.foundation}
        title={content.foundationTitle}
        description={content.foundationDescription}
      >
        <WebsiteCardGrid items={content.foundation} />
      </WebsiteFullSection>

      <WebsiteFullSection
        tone="muted"
        eyebrow={labels.modules}
        title={content.modulesTitle}
        description={content.modulesDescription}
      >
        <WebsiteCardGrid items={content.modules} />
      </WebsiteFullSection>
    </>
  );
}
