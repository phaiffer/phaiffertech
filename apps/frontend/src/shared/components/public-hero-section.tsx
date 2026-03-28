'use client';

import Link from 'next/link';
import { BrandMark } from '@/shared/components/brand-assets';
import {
  publicEyebrowClass,
  publicHeroTitleClass,
  publicPrimaryButtonClass,
  publicSecondaryButtonClass,
  publicSiteContainerClass,
} from '@/shared/components/public-visual-system';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
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
  const t = useAppMessages().publicHero;
  const heroHighlights = highlights.slice(0, 2);
  const heroStats = stats.slice(0, 3);

  return (
    <section
      id={id}
      className="relative overflow-hidden bg-[linear-gradient(135deg,#020617,#081a30_52%,#0a2342)] text-white"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_24%,rgba(59,130,246,0.18),transparent_36%)]" />

      <div className={`${publicSiteContainerClass} relative py-24 lg:py-32`}>
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.94fr)]">
          <div className="max-w-3xl">
            <p
              className={`${publicEyebrowClass} inline-flex rounded-full border border-white/12 bg-white/6 px-4 py-2 text-white`}
            >
              {eyebrow}
            </p>

            <h1 className={`mt-7 ${publicHeroTitleClass} text-white`}>{title}</h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">{description}</p>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link href={primaryCtaHref} className={publicPrimaryButtonClass}>
                {primaryCtaLabel}
              </Link>
              <Link href={secondaryCtaHref} className={publicSecondaryButtonClass}>
                {secondaryCtaLabel}
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-300">
              {heroHighlights.map((highlight) => (
                <div key={highlight} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.24),transparent_70%)] blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-white/5 p-4 shadow-[0_36px_80px_-42px_rgba(2,6,23,0.78)] backdrop-blur">
              <div className="rounded-[1.65rem] bg-white p-6 text-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <BrandMark priority className="h-12 w-12 shrink-0" imageClassName="scale-[1.08]" />
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold tracking-[-0.03em] text-slate-900">PetFlow</p>
                        <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600">
                          by PhaifferTech
                        </p>
                      </div>
                    </div>
                    <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                      {t.panelEyebrow}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-900">
                      {t.panelTitle}
                    </h2>
                  </div>

                  <span className="inline-flex rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--accent)]">
                    {t.panelBadge}
                  </span>
                </div>

                <div className="mt-6 grid gap-3">
                  {heroStats.map((stat) => (
                    <div
                      key={`${stat.value}-${stat.label}`}
                      className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3.5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">{stat.label}</p>
                      <p className="mt-2 text-xl font-semibold tracking-[-0.02em] text-slate-900">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-[1.25rem] bg-[color:var(--accent)]/8 px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                    {t.storyEyebrow}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{t.storyText}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
