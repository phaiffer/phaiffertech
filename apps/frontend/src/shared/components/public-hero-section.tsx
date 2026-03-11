import Link from 'next/link';
import {
  publicCardSurfaceClass,
  publicEyebrowClass,
  publicHighlightSurfaceClass,
  publicPrimaryButtonClass,
  publicSecondaryButtonClass
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
  platformCardEyebrow: string;
  platformCardTitle: string;
  platformCardText: string;
  frontendCardEyebrow: string;
  frontendCardTitle: string;
  backendCardEyebrow: string;
  backendCardTitle: string;
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
  platformCardEyebrow,
  platformCardTitle,
  platformCardText,
  frontendCardEyebrow,
  frontendCardTitle,
  backendCardEyebrow,
  backendCardTitle
}: PublicHeroSectionProps) {
  return (
    <section
      id={id}
      className="relative overflow-hidden border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(15,23,42,0.07),transparent_68%)]"
    >
      <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.2),transparent_58%)]" />
      <div className="absolute right-0 top-16 h-64 w-64 bg-[radial-gradient(circle,rgba(56,189,248,0.12),transparent_68%)]" />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.96fr)] lg:px-8 lg:py-32">
        <div className="relative max-w-[42rem]">
          <p className={publicEyebrowClass}>
            {eyebrow}
          </p>

          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-[3.85rem]">
            {title}
          </h1>

          <p className="mt-7 max-w-xl text-[15px] leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
            {description}
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
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

        <div className="grid gap-5 lg:max-w-[34rem] lg:justify-self-end">
          <div className={`${publicHighlightSurfaceClass} p-7`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {platformCardEyebrow}
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
              {platformCardTitle}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{platformCardText}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className={`${publicCardSurfaceClass} rounded-3xl p-5`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {frontendCardEyebrow}
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {frontendCardTitle}
              </p>
            </div>

            <div className={`${publicCardSurfaceClass} rounded-3xl p-5`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {backendCardEyebrow}
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {backendCardTitle}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
