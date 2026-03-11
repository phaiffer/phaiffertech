'use client';

import { PublicCtaSection } from '@/shared/components/public-cta-section';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import {
  WebsiteCardGrid,
  WebsiteSplitSection
} from './website-sections';

export function WebsiteProductsPage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).products;
  const labels =
    locale === 'pt-BR'
      ? {
          platform: 'Plataforma',
          contact: 'Contato',
          portfolio: 'Portfólio',
          fit: 'Fit',
          nextStep: 'Próximo passo',
          ctaTitle:
            'Saia do posicionamento público para a validação protegida de produto.',
          ctaDescription:
            'Use o site institucional para entender empresa e plataforma. Use o ambiente autenticado quando o próximo passo for demo, acesso ou validação operacional.',
          ctaPrimary: 'Abrir acesso à plataforma',
          ctaSecondary: 'Ler direção de pesquisa'
        }
      : {
          platform: 'Platform',
          contact: 'Contact',
          portfolio: 'Portfolio',
          fit: 'Fit',
          nextStep: 'Next step',
          ctaTitle:
            'Move from public positioning to protected product validation.',
          ctaDescription:
            'Use the institutional site to understand the company and the platform. Use the authenticated environment when the next step is demo, access or operational validation.',
          ctaPrimary: 'Open platform access',
          ctaSecondary: 'Read research direction'
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

      <WebsiteSplitSection
        tone="muted"
        id="iot-system"
        eyebrow={labels.portfolio}
        title={content.title}
        description={content.description}
      >
        <WebsiteCardGrid items={content.products} />
      </WebsiteSplitSection>

      <WebsiteSplitSection
        eyebrow={labels.fit}
        title={content.fitTitle}
        description={content.fitDescription}
      >
        <WebsiteCardGrid items={content.fit} />
      </WebsiteSplitSection>

      <PublicCtaSection
        eyebrow={labels.nextStep}
        title={labels.ctaTitle}
        description={labels.ctaDescription}
        primaryCtaLabel={labels.ctaPrimary}
        primaryCtaHref="/login"
        secondaryCtaLabel={labels.ctaSecondary}
        secondaryCtaHref="/research"
      />
    </>
  );
}
