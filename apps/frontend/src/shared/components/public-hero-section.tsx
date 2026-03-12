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
    <section id={id} className="relative flex min-h-[75vh] items-center overflow-hidden bg-[#050a15]">
      {/* Background Banner with magic mask to protect left content */}
      <div className="absolute inset-0 z-0 opacity-40">
        <Image
          src="/PhaifferTech.png"
          alt="PhaifferTech Background Banner"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050a15] via-[#050a15]/90 to-transparent z-10" />
      </div>

      <div
        className={`${publicSiteContainerClass} relative z-20 grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24`}
      >
        {/* Content with high contrast protected on the dark left side (Content Shield) */}
        <div className="relative z-20 max-w-xl text-[#e0e1dd] backdrop-blur-xl bg-[#050a15]/40 p-8 rounded-2xl border border-white/5 shadow-2xl">
          <p className={`${publicEyebrowClass} inline-flex border-l-2 border-[#00b4d8] pl-4 text-[#00b4d8] drop-shadow-[0_0_8px_rgba(0,180,216,0.8)]`}>
            {eyebrow}
          </p>

          <h1 className="mt-6 max-w-4xl">
            <span className={`${publicHeroTitleClass} text-white drop-shadow-sm leading-tight`}>{title}</span>
          </h1>

          <p className={`${publicHeroSupportingTextClass} text-gray-300 font-medium tracking-wide drop-shadow-sm`}>
            {description}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href={primaryCtaHref} className={`${publicPrimaryButtonClass} border border-[#00b4d8] bg-[#00b4d8]/10 hover:bg-[#00b4d8] hover:text-white shadow-[0_0_15px_rgba(0,180,216,0.4)] hover:shadow-[0_0_25px_rgba(0,180,216,0.8)] transition-all duration-300 backdrop-blur-md`}>
              {primaryCtaLabel}
            </Link>

            <Link href={secondaryCtaHref} className={`${publicSecondaryButtonClass} border-white/20 text-[#e0e1dd] bg-white/5 hover:bg-white/10 hover:text-white transition-all backdrop-blur-md hover:border-white/40`}>
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
