'use client';

import { PublicHeroSection } from '@/shared/components/public-hero-section';
import type { WebsiteAction, WebsiteHeroStat } from './website-content';

type WebsiteHeroProps = {
  id?: string;
  eyebrow: string;
  title: string;
  titleHighlight?: string;
  description: string;
  highlights?: string[];
  stats?: WebsiteHeroStat[];
  primaryCta: WebsiteAction;
  secondaryCta: WebsiteAction;
  heroImage?: string;
};

export function WebsiteHero({
  id,
  eyebrow,
  title,
  titleHighlight,
  description,
  highlights = [],
  stats = [],
  primaryCta,
  secondaryCta,
  heroImage
}: WebsiteHeroProps) {
  return (
    <PublicHeroSection
      id={id}
      eyebrow={eyebrow}
      title={title}
      titleHighlight={titleHighlight}
      description={description}
      highlights={highlights}
      stats={stats}
      primaryCtaLabel={primaryCta.label}
      primaryCtaHref={primaryCta.href}
      secondaryCtaLabel={secondaryCta.label}
      secondaryCtaHref={secondaryCta.href}
      heroImage={heroImage}
    />
  );
}
