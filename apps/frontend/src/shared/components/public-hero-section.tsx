import Image from 'next/image';
import Link from 'next/link';
import {
  publicEyebrowClass,
  publicHeroSupportingTextClass,
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
    <section id={id} className="relative overflow-hidden bg-[#050a15]">
      <div className="absolute inset-0 z-0 opacity-45">
        <Image
          src="/PhaifferTech.png"
          alt="PhaifferTech Background Banner"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#050a15] via-[#050a15]/88 to-[#050a15]/30" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,180,216,0.18),transparent_28%)]" />

      <div className={`${publicSiteContainerClass} relative z-20 flex min-h-[70vh] items-center py-20 lg:py-28`}>
        <div className="max-w-[44rem] rounded-[2rem] border border-white/10 bg-[#050a15]/72 p-8 text-[#e0e1dd] shadow-[0_20px_60px_rgba(5,10,21,0.45)] backdrop-blur-xl lg:p-10">
          <p className={`${publicEyebrowClass} inline-flex rounded-full border border-[#00b4d8]/25 bg-[#00b4d8]/10 px-4 py-1.5 text-[#00b4d8]`}>
            {eyebrow}
          </p>

          <h1 className={`mt-6 max-w-3xl ${publicHeroTitleClass} text-white`}>{title}</h1>

          <p className={`${publicHeroSupportingTextClass} max-w-2xl text-slate-300`}>
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={primaryCtaHref}
              className={`${publicPrimaryButtonClass} border border-[#00b4d8]/30 bg-[#00b4d8] text-white shadow-[0_12px_30px_rgba(0,180,216,0.18)] hover:bg-[#009dc0]`}
            >
              {primaryCtaLabel}
            </Link>

            <Link
              href={secondaryCtaHref}
              className={`${publicSecondaryButtonClass} border-white/15 bg-white/5 text-[#e0e1dd] hover:border-white/30 hover:bg-white/10 hover:text-white`}
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
