import Image from 'next/image';
import Link from 'next/link';
import {
  publicEyebrowClass,
  publicPrimaryButtonClass,
  publicSecondaryButtonClass,
  publicSiteContainerClass
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
  secondaryCtaHref
}: PublicHeroSectionProps) {
  return (
    <section
      id={id}
      className="relative flex min-h-[88vh] items-center overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(14,165,233,0.14),transparent_36%),radial-gradient(circle_at_82%_50%,rgba(14,165,233,0.14),transparent_28%)]" />
      </div>

      <div
        className={`${publicSiteContainerClass} relative grid items-center gap-10 py-24 lg:grid-cols-[1.25fr_0.75fr] lg:py-32`}
      >
        <div className="relative z-10 max-w-[52rem]">
          <p className={`${publicEyebrowClass} inline-flex border-l-4 border-sky-400 pl-6`}>
            {eyebrow}
          </p>

          <h1 className="mt-8 max-w-[14ch] text-5xl font-black leading-[0.88] tracking-[-0.04em] text-white sm:text-6xl lg:text-[5.75rem]">
            {title}
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-[#b6bec5] lg:max-w-2xl">
            {description}
          </p>

          <div className="mt-12 flex flex-wrap gap-4">
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

        <div className="relative hidden justify-end lg:flex">
          <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/18 blur-[110px]" />

          <div className="relative h-[30rem] w-[30rem] drop-shadow-[0_0_30px_rgba(14,165,233,0.3)]">
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
