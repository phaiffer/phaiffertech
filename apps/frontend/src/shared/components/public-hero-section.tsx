import Link from 'next/link';
import {
  publicEyebrowClass,
  publicHeroTitleClass,
  publicPrimaryButtonClass,
  publicSecondaryButtonClass,
  publicSiteContainerClass,
} from '@/shared/components/public-visual-system';
import type { WebsiteHeroStat } from '@/modules/website/website-content';

type PublicHeroSectionProps = {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  highlights?: string[];
  stats?: WebsiteHeroStat[];
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
  highlights = [],
  stats = [],
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
}: PublicHeroSectionProps) {
  return (
    <section id={id} className="relative overflow-hidden border-b border-border bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.24),transparent_36%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(96,165,250,0.18),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(2,6,23,0.86),rgba(15,23,42,0.9)_55%,rgba(2,6,23,0.96))]" />
      </div>
      <div className={`${publicSiteContainerClass} relative z-10 py-20 lg:py-28`}>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-center">
          <div className="max-w-3xl">
            <p className={`${publicEyebrowClass} inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-1.5 text-blue-200`}>
              {eyebrow}
            </p>
            <h1 className={`mt-6 ${publicHeroTitleClass} text-white`}>{title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              {description}
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {highlights.map((highlight) => (
                <span
                  key={highlight}
                  className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur-sm"
                >
                  {highlight}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href={primaryCtaHref} className={publicPrimaryButtonClass}>
                {primaryCtaLabel}
              </Link>
              <Link href={secondaryCtaHref} className={publicSecondaryButtonClass}>
                {secondaryCtaLabel}
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_28px_80px_-42px_rgba(59,130,246,0.45)] backdrop-blur-xl">
            <div className="rounded-[1.7rem] border border-white/10 bg-slate-950/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">PetFlow demo</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Operational focus</h2>
                </div>
                <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Live-ready
                </span>
              </div>

              <div className="mt-6 grid gap-3">
                {stats.map((stat) => (
                  <div
                    key={`${stat.value}-${stat.label}`}
                    className="rounded-[1.35rem] border border-white/8 bg-white/5 px-4 py-4"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">{stat.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[1.35rem] border border-blue-400/20 bg-blue-500/10 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Demo story</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Show the full cycle with PetFlow at the center: appointment, recurring plan, stock pressure, billing, and automated follow-through.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
