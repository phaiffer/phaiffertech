'use client';

import { PublicHeroSection } from '@/shared/components/public-hero-section';
import type { WebsiteAction, WebsiteHeroStat } from './website-content';

type WebsiteHeroProps = {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  highlights?: string[];
  stats?: WebsiteHeroStat[];
  primaryCta: WebsiteAction;
  secondaryCta: WebsiteAction;
};

export function WebsiteHero({
  id,
  eyebrow,
  title,
  description,
  highlights = [],
  stats = [],
  primaryCta,
  secondaryCta
}: WebsiteHeroProps) {
  return (
    <PublicHeroSection
      id={id}
      eyebrow={eyebrow}
      title={title}
      description={description}
      highlights={highlights}
      stats={stats}
      primaryCtaLabel={primaryCta.label}
      primaryCtaHref={primaryCta.href}
      secondaryCtaLabel={secondaryCta.label}
      secondaryCtaHref={secondaryCta.href}
    />
  );
}
