'use client';

import { PublicCtaSection } from '@/shared/components/public-cta-section';
import {
  publicEyebrowClass,
  publicInteractiveCardSurfaceClass,
  publicSiteContainerClass,
} from '@/shared/components/public-visual-system';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import { WebsiteCardGrid, WebsiteSplitSection } from './website-sections';
import type { WebsiteCard } from './website-content';

type ProductCardProps = {
  item: WebsiteCard;
  highlighted?: boolean;
};

function ProductCard({ item, highlighted = false }: ProductCardProps) {
  return (
    <article
      className={`${publicInteractiveCardSurfaceClass} flex flex-col p-6 ${highlighted ? 'border-accent' : ''}`}
    >
      <div className={`mb-3 h-0.5 w-8 rounded-full ${highlighted ? 'bg-accent' : 'bg-border'} transition-colors group-hover:bg-accent`} />
      <p className={`${publicEyebrowClass} text-[10px]`}>{item.eyebrow}</p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
    </article>
  );
}

type ProductsGridSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  items: WebsiteCard[];
};

function ProductsGridSection({ eyebrow, title, description, items }: ProductsGridSectionProps) {
  return (
    <section className="border-t border-border bg-surface-inset">
      <div className={`${publicSiteContainerClass} py-14 lg:py-20`}>
        <div className="mb-10 max-w-2xl">
          {eyebrow && <p className={publicEyebrowClass}>{eyebrow}</p>}
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-muted sm:text-base sm:leading-8">{description}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <ProductCard key={`${item.eyebrow}-${item.title}`} item={item} highlighted={index === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function WebsiteProductsPage() {
  const { locale } = usePublicSite();
  const content = getWebsiteContent(locale).products;
  const labels =
    locale === 'pt-BR'
      ? {
          platform: 'Solicitar demo',
          contact: 'Contato',
          portfolio: 'PetFlow',
          nextStep: 'Próximo passo',
          ctaTitle: 'Pronto para ver o PetFlow em ação?',
          ctaDescription:
            'O PetFlow está operacional e aceitando os primeiros clientes. Entre em contato para agendar uma demonstração ou solicitar acesso para o seu negócio.',
          ctaPrimary: 'Entrar em contato',
          ctaSecondary: 'Acessar o PetFlow',
        }
      : {
          platform: 'Request a demo',
          contact: 'Contact',
          portfolio: 'PetFlow',
          nextStep: 'Next step',
          ctaTitle: 'Ready to see PetFlow in action?',
          ctaDescription:
            'PetFlow is operational and accepting early customers. Reach out to schedule a demo or request access for your pet business.',
          ctaPrimary: 'Get in touch',
          ctaSecondary: 'PetFlow access',
        };

  return (
    <>
      <WebsiteHero
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
        primaryCta={{ label: labels.platform, href: '/contact' }}
        secondaryCta={{ label: labels.contact, href: '/contact' }}
      />

      <ProductsGridSection
        eyebrow={labels.portfolio}
        title={content.title}
        description={content.description}
        items={content.products}
      />

      <PublicCtaSection
        eyebrow={labels.nextStep}
        title={labels.ctaTitle}
        description={labels.ctaDescription}
        primaryCtaLabel={labels.ctaPrimary}
        primaryCtaHref="/contact"
        secondaryCtaLabel={labels.ctaSecondary}
        secondaryCtaHref="/login"
      />
    </>
  );
}
