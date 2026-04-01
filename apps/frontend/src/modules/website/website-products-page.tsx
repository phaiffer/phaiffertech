'use client';

import { PublicCtaSection } from '@/shared/components/public-cta-section';
import {
  publicEyebrowClass,
  publicInteractiveCardSurfaceClass,
  publicSiteContainerClass
} from '@/shared/components/public-visual-system';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import type { WebsiteCard } from './website-content';

type ProductCardProps = {
  item: WebsiteCard;
  highlighted?: boolean;
};

function ProductCard({ item, highlighted = false }: ProductCardProps) {
  return (
    <article
      className={`${publicInteractiveCardSurfaceClass} flex flex-col bg-[linear-gradient(180deg,rgba(16,185,129,0.035),rgba(255,255,255,0.99)_140px)] p-6 ${highlighted ? 'border-[color:var(--accent)]/20' : ''}`}
    >
      <div className={`mb-3 h-0.5 w-8 rounded-full ${highlighted ? 'bg-[color:var(--accent)]' : 'bg-slate-200'} transition-colors group-hover:bg-[color:var(--accent)]`} />
      <p className={`${publicEyebrowClass} text-[10px]`}>{item.eyebrow}</p>
      <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-700">{item.description}</p>
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
    <section className="border-t border-border bg-[linear-gradient(180deg,rgba(16,185,129,0.03),rgba(248,250,252,0.85))]">
      <div className={`${publicSiteContainerClass} py-14 lg:py-20`}>
        <div className="mb-10 max-w-2xl">
          {eyebrow && <p className={publicEyebrowClass}>{eyebrow}</p>}
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base sm:leading-8">{description}</p>
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
          platform: 'Solicitar cotacao',
          contact: 'Agendar demo',
          portfolio: 'Oferta PetFlow',
          nextStep: 'Próximo passo',
          ctaTitle: 'Pronto para montar sua oferta PetFlow?',
          ctaDescription:
            'Fale com a PhaifferTech sobre PetShop, Banho e Tosa, Clínica Veterinária e pacotes combinados no mesmo sistema.',
          ctaPrimary: 'Pedir proposta',
          ctaSecondary: 'Agendar demonstracao',
        }
      : {
          platform: 'Request a quote',
          contact: 'Book a demo',
          portfolio: 'PetFlow offer',
          nextStep: 'Next step',
          ctaTitle: 'Ready to shape your PetFlow offer?',
          ctaDescription:
            'Talk to PhaifferTech about PetShop, grooming, veterinary clinic, and combined packages in the same system.',
          ctaPrimary: 'Request proposal',
          ctaSecondary: 'Book demo',
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
        secondaryCtaHref="/contact"
      />
    </>
  );
}
