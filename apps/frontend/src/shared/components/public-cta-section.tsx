import Link from 'next/link';
import {
  publicHeadingColumnClass,
  publicEyebrowClass,
  publicHighlightSurfaceClass,
  publicPrimaryButtonClass,
  publicSecondaryButtonClass,
  publicSectionLayoutClass,
  publicSectionTitleClass,
  publicSiteContainerClass
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
    <section className="border-t border-white/5 py-20 lg:py-28">
      <div className={publicSiteContainerClass}>
        <div className={publicSectionLayoutClass}>
          <div className={publicHeadingColumnClass}>
            <p className={publicEyebrowClass}>
              {eyebrow}
            </p>

            <h2 className={publicSectionTitleClass}>
              {title}
            </h2>
          </div>

          <div className={`${publicHighlightSurfaceClass} p-8 lg:p-10`}>
            <p className="text-base leading-relaxed text-white/85">{description}</p>

            <div className="mt-8 flex flex-wrap gap-4">
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
      </div>
    </section>
  );
}
