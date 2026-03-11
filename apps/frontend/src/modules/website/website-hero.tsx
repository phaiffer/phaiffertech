'use client';

import { PublicHeroSection } from '@/shared/components/public-hero-section';
import type { WebsiteAction } from './website-content';

type WebsiteHeroProps = {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: WebsiteAction;
  secondaryCta: WebsiteAction;
};

export function WebsiteHero({
  id,
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta
}: WebsiteHeroProps) {
  return (
    <PublicHeroSection
      id={id}
      eyebrow={eyebrow}
      title={title}
      description={description}
      primaryCtaLabel={primaryCta.label}
      primaryCtaHref={primaryCta.href}
      secondaryCtaLabel={secondaryCta.label}
      secondaryCtaHref={secondaryCta.href}
    />
  );
}
