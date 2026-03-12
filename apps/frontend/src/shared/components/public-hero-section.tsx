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
    <section id={id} className="relative flex min-h-[60vh] items-center overflow-hidden">
      {/* Subtle background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div
        className={`${publicSiteContainerClass} relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24`}
      >
        {/* Content */}
        <div className="relative z-10 max-w-xl">
          <p className={`${publicEyebrowClass} inline-flex border-l-2 border-accent pl-4`}>
            {eyebrow}
          </p>

          <h1 className="mt-6 max-w-4xl">
            <span className={publicHeroTitleClass}>{title}</span>
          </h1>

          <p className={publicHeroSupportingTextClass}>{description}</p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href={primaryCtaHref} className={publicPrimaryButtonClass}>
              {primaryCtaLabel}
            </Link>

            <Link href={secondaryCtaHref} className={publicSecondaryButtonClass}>
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>

        {/* Logo */}
        <div className="relative hidden justify-center lg:flex">
          <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />

          <div className="relative h-72 w-72 drop-shadow-lg xl:h-80 xl:w-80">
            <Image
              src="/logo.png"
              alt="PhaifferTech logo"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
