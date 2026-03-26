import Link from 'next/link';
import {
  publicHeadingColumnClass,
  publicEyebrowClass,
  publicPrimaryButtonClass,
  publicSecondaryButtonClass,
  publicSectionLayoutClass,
  publicSectionTitleClass,
  publicSiteContainerClass,
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
  secondaryCtaHref,
}: PublicCtaSectionProps) {
  return (
    <section className="relative overflow-hidden border-t border-border py-14 lg:py-20">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.98),rgba(15,23,42,0.94))]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_34%)]" />
      <div className={publicSiteContainerClass}>
        <div className={publicSectionLayoutClass}>
          <div className={publicHeadingColumnClass}>
            <p className={`${publicEyebrowClass} text-blue-200`}>{eyebrow}</p>
            <h2 className={`${publicSectionTitleClass} text-white`}>{title}</h2>
          </div>

          <div className="relative rounded-[1.9rem] border border-white/10 bg-white/5 p-7 backdrop-blur-xl lg:p-8">
            <p className="max-w-2xl text-base leading-7 text-slate-200">{description}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={primaryCtaHref} className={publicPrimaryButtonClass}>
                {primaryCtaLabel}
              </Link>

              <Link href={secondaryCtaHref} className={publicSecondaryButtonClass}>
                {secondaryCtaLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
