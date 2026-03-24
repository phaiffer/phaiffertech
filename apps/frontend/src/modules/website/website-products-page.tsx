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
            'Pronto para ver o PetFlow em ação?',
          ctaDescription:
            'O PetFlow está operacional e aceitando os primeiros clientes. Entre em contato para agendar uma demonstração ou solicitar acesso direto para o seu negócio.',
          ctaPrimary: 'Solicitar acesso',
          ctaSecondary: 'Fale conosco'
        }
      : {
          platform: 'Platform',
          contact: 'Contact',
          portfolio: 'Portfolio',
          fit: 'Fit',
          nextStep: 'Next step',
          ctaTitle:
            'Ready to see PetFlow in action?',
          ctaDescription:
            'PetFlow is operational and accepting early customers. Reach out to schedule a walkthrough or request direct access for your pet business.',
          ctaPrimary: 'Request access',
          ctaSecondary: 'Contact us'
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
        secondaryCtaHref="/contact"
      />
    </>
  );
}
