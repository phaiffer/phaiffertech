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
    <section id={id} className="relative flex min-h-[70vh] items-center overflow-hidden">
      {/* Background Cover */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/PhaifferTech.png"
          alt="PhaifferTech Background"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      <div
        className={`${publicSiteContainerClass} relative z-10 grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24`}
      >
        {/* Content */}
        <div className="relative max-w-xl text-white">
          <p className={`${publicEyebrowClass} inline-flex border-l-2 border-accent pl-4 text-accent drop-shadow-[0_0_8px_#00b4d8]`}>
            {eyebrow}
          </p>

          <h1 className="mt-6 max-w-4xl">
            <span className={`${publicHeroTitleClass} text-white`}>{title}</span>
          </h1>

          <p className={`${publicHeroSupportingTextClass} text-gray-300`}>{description}</p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href={primaryCtaHref} className={`${publicPrimaryButtonClass} border border-accent bg-accent/10 hover:bg-accent hover:text-white shadow-[0_0_15px_rgba(0,180,216,0.3)] hover:shadow-[0_0_20px_rgba(0,180,216,0.6)] backdrop-blur-md`}>
              {primaryCtaLabel}
            </Link>

            <Link href={secondaryCtaHref} className={`${publicSecondaryButtonClass} border-white/20 text-white bg-white/5 hover:bg-white/10 backdrop-blur-md`}>
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
