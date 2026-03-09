'use client';

import { usePublicSite } from '@/shared/public/public-site-provider';
import { getPublicSiteMessages } from '@/shared/public/public-site-messages';
import { PublicHeroSection } from '@/shared/components/public-hero-section';
import { PublicFeatureGrid } from '@/shared/components/public-feature-grid';
import { PublicCtaSection } from '@/shared/components/public-cta-section';

export default function PublicHomePage() {
  const { locale } = usePublicSite();
  const t = getPublicSiteMessages(locale).home;

  return (
    <>
      <PublicHeroSection
        id="platform"
        eyebrow={t.heroEyebrow}
        title={t.heroTitle}
        description={t.heroDescription}
        primaryCtaLabel={t.heroPrimaryCta}
        primaryCtaHref="/login"
        secondaryCtaLabel={t.heroSecondaryCta}
        secondaryCtaHref="#architecture"
        platformCardEyebrow={t.platformCardEyebrow}
        platformCardTitle={t.platformCardTitle}
        platformCardText={t.platformCardText}
        frontendCardEyebrow={t.frontendCardEyebrow}
        frontendCardTitle={t.frontendCardTitle}
        backendCardEyebrow={t.backendCardEyebrow}
        backendCardTitle={t.backendCardTitle}
      />

      <PublicFeatureGrid
        id="modules"
        title={t.modulesTitle}
        description={t.modulesDescription}
        items={[
          {
            eyebrow: 'Core',
            title: t.moduleCoreTitle,
            description: t.moduleCoreText
          },
          {
            eyebrow: 'CRM',
            title: t.moduleCrmTitle,
            description: t.moduleCrmText
          },
          {
            eyebrow: 'IoT',
            title: t.moduleIotTitle,
            description: t.moduleIotText
          },
          {
            eyebrow: 'Pet',
            title: t.modulePetTitle,
            description: t.modulePetText
          }
        ]}
      />

      <PublicFeatureGrid
        id="architecture"
        title={t.architectureTitle}
        description={t.architectureText}
        items={[
          {
            eyebrow: t.architectureEyebrow,
            title: t.architectureTitle,
            description: t.architectureText
          }
        ]}
      />

      <PublicCtaSection
        eyebrow={t.ctaEyebrow}
        title={t.ctaTitle}
        description={t.ctaText}
        primaryCtaLabel={t.ctaPrimary}
        primaryCtaHref="/dashboard"
        secondaryCtaLabel={t.ctaSecondary}
        secondaryCtaHref="/login"
      />
    </>
  );
}