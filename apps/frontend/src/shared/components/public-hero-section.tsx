import Link from 'next/link';
import {
  publicEyebrowClass,
  publicHeroTitleClass,
  publicPrimaryButtonClass,
  publicSecondaryButtonClass,
  publicSiteContainerClass,
} from '@/shared/components/public-visual-system';

type PublicHeroSectionProps = {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

export function PublicHeroSection({
  id,
  eyebrow,
  title,
  description,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
}: PublicHeroSectionProps) {
  return (
    <section id={id} className="relative overflow-hidden border-b border-border bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-foreground/5 blur-3xl" />
      </div>
      <div className={`${publicSiteContainerClass} relative z-10 py-16 lg:py-20`}>
        <div className="max-w-3xl">
          <p className={`${publicEyebrowClass} inline-flex rounded-full border border-accent/20 bg-accent-muted px-4 py-1.5`}>
            {eyebrow}
          </p>
          <h1 className={`mt-5 ${publicHeroTitleClass}`}>{title}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            {description}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={primaryCtaHref} className={publicPrimaryButtonClass}>
              {primaryCtaLabel}
            </Link>
            <Link href={secondaryCtaHref} className={publicSecondaryButtonClass}>
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
