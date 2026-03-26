'use client';

import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import {
  WebsiteCardGrid,
  WebsiteFullSection,
  WebsiteStatStrip
} from './website-sections';

export function WebsiteAboutPage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).about;
  const labels =
    locale === 'pt-BR'
      ? {
          products: 'Produtos',
          contact: 'Contato',
          identity: 'Base real',
          direction: 'Direção'
        }
      : {
          products: 'Products',
          contact: 'Contact',
          identity: 'Built foundation',
          direction: 'Direction'
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
        eyebrow={labels.identity}
        title={content.identityTitle}
        description={content.identityDescription}
      >
        <WebsiteStatStrip items={content.identity} />
      </WebsiteFullSection>

      <WebsiteFullSection
        tone="muted"
        eyebrow={labels.direction}
        title={content.directionTitle}
        description={content.directionDescription}
      >
        <WebsiteCardGrid items={content.direction} />
      </WebsiteFullSection>
    </>
  );
}
