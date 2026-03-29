'use client';

import { 
  FileText, 
  Calendar, 
  Syringe, 
  Users, 
  DollarSign, 
  PawPrint 
} from 'lucide-react';
import { PublicCtaSection } from '@/shared/components/public-cta-section';
import { PublicFeatureGrid, type PublicFeatureItem } from '@/shared/components/public-feature-grid';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { WebsiteCardGrid, WebsiteFullSection, WebsiteStatStrip } from './website-sections';
import { getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import { PublicBenefitsSection } from '@/shared/components/public-benefits-section';

// Map icon names to Lucide icons
const featureIcons = [FileText, Calendar, Syringe, Users, DollarSign, PawPrint];

export function WebsiteHomePage() {
  const { locale } = usePublicSite();
  const messages = useAppMessages().publicHome;
  const content = getWebsiteContent(locale).home;

  // Map products to include icons
  const productsWithIcons: PublicFeatureItem[] = content.products.slice(0, 6).map((product, index) => ({
    ...product,
    icon: featureIcons[index % featureIcons.length],
  }));

  return (
    <>
      <WebsiteHero
        id="overview"
        eyebrow={content.hero.eyebrow}
        title={content.hero.title}
        titleHighlight={content.hero.titleHighlight}
        description={content.hero.description}
        highlights={content.hero.highlights}
        stats={content.hero.stats}
        primaryCta={content.hero.primaryCta}
        secondaryCta={content.hero.secondaryCta}
      />

      <PublicFeatureGrid
        id="products"
        eyebrowLabel="Recursos completos"
        title={content.productsTitle}
        description={content.productsDescription}
        items={productsWithIcons}
      />

      <PublicBenefitsSection />

      <PublicCtaSection
        eyebrow={content.cta.eyebrow}
        title={content.cta.title}
        description={content.cta.description}
        primaryCtaLabel={content.cta.primaryCta.label}
        primaryCtaHref={content.cta.primaryCta.href}
        secondaryCtaLabel={content.cta.secondaryCta.label}
        secondaryCtaHref={content.cta.secondaryCta.href}
      />
    </>
  );
}
