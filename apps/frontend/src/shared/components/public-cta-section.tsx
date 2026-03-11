import Link from 'next/link';
import {
  publicEyebrowClass,
  publicHighlightSurfaceClass,
  publicPrimaryButtonClass,
  publicSecondaryButtonClass,
  publicSectionSupportingTextClass,
  publicSectionTitleClass
} from '@/shared/components/public-visual-system';

type PublicCtaSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

export function PublicCtaSection({
  eyebrow,
  title,
  description,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref
}: PublicCtaSectionProps) {
  return (
    <section className="py-[4.5rem] sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`${publicHighlightSurfaceClass} p-8 lg:p-10`}>
          <p className={publicEyebrowClass}>
            {eyebrow}
          </p>

          <h2 className={`${publicSectionTitleClass} max-w-3xl lg:text-4xl`}>
            {title}
          </h2>

          <p className={`${publicSectionSupportingTextClass} max-w-2xl`}>
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={primaryCtaHref}
              className={publicPrimaryButtonClass}
            >
              {primaryCtaLabel}
            </Link>

            <Link
              href={secondaryCtaHref}
              className={publicSecondaryButtonClass}
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
