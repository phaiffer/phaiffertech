'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Check, Sparkles } from 'lucide-react';
import {
  publicSiteContainerClass,
} from '@/shared/components/public-visual-system';
import type { WebsiteHeroStat } from '@/modules/website/website-content';

type PublicHeroSectionProps = {
  id?: string;
  eyebrow: string;
  title: string;
  titleHighlight?: string;
  description: string;
  highlights?: string[];
  stats?: WebsiteHeroStat[];
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  heroImage?: string;
};

export function PublicHeroSection({
  id,
  eyebrow,
  title,
  titleHighlight,
  description,
  highlights = [],
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  heroImage = '/images/hero-vet-cat.jpg',
}: PublicHeroSectionProps) {
  // Split title to highlight part
  const titleParts = titleHighlight 
    ? title.split(titleHighlight)
    : [title];

  return (
    <section
      id={id}
      className="relative overflow-hidden bg-petflow-gradient min-h-[700px] lg:min-h-[800px]"
    >
      {/* Background Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.15),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(20,184,166,0.12),transparent_50%)]" />

      <div className={`${publicSiteContainerClass} relative py-20 lg:py-28`}>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Content Column */}
          <div className="max-w-xl">
            {/* Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-petflow/30 bg-petflow/10 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-petflow-light" />
              <span className="text-sm font-medium text-petflow-light">
                {eyebrow}
              </span>
            </div>

            {/* Title */}
            <h1 className="mt-8 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
              {titleParts[0]}
              {titleHighlight && (
                <span className="text-petflow-light">{titleHighlight}</span>
              )}
              {titleParts[1] || ''}
            </h1>
  const t = useAppMessages().publicHero;
  const heroHighlights = highlights.slice(0, 3);
  const heroStats = stats.slice(0, 3);

  return (
    <section id={id} className="relative overflow-hidden bg-[linear-gradient(135deg,#020617,#081224_52%,#0f172a)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_48%,rgba(37,99,235,0.16),transparent_46%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_28%,rgba(59,130,246,0.12),transparent_42%)]" />

      <div className={`${publicSiteContainerClass} relative py-24 lg:py-32`}>
        <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.04fr)]">
          <div className="max-w-2xl">
            <p
              className={`${publicEyebrowClass} inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-white`}
            >
              <span className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
              {eyebrow}
            </p>

            <h1 className={`mt-8 ${publicHeroTitleClass} text-white`}>{title}</h1>

            {/* Description */}
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              {description}
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href={primaryCtaHref}
                className="inline-flex items-center gap-2 rounded-xl bg-petflow px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-petflow/25 transition-all hover:-translate-y-0.5 hover:bg-petflow-dark hover:shadow-xl hover:shadow-petflow/30"
              >
                {primaryCtaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={secondaryCtaHref}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
              >
                {secondaryCtaLabel}
              </Link>
            </div>

            {/* Highlights */}
            {highlights.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-6">
                {highlights.slice(0, 2).map((highlight) => (
                  <div key={highlight} className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-petflow-light" />
                    <span className="text-sm text-slate-400">{highlight}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Image Column */}
          <div className="relative hidden lg:block">
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-4 rounded-3xl bg-petflow/20 blur-3xl" />
              
              {/* Image Container */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                <Image
                  src={heroImage}
                  alt="Veterinária cuidando de um gato"
                  width={600}
                  height={500}
                  className="h-auto w-full object-cover grayscale-[30%]"
                  priority
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#064E3B]/60 via-transparent to-transparent" />
            <div className="mt-10 flex flex-wrap gap-8 text-sm text-slate-300">
              {heroHighlights.map((highlight) => (
                <div key={highlight} className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                    <span className="h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                  </span>
                  <span>{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.24),transparent_72%)] blur-3xl" />
            <div className="relative aspect-[4/3] rounded-[2rem] border border-white/10 bg-slate-900/70 p-5 shadow-[0_32px_80px_-42px_rgba(15,23,42,0.85)] backdrop-blur-sm">
              <div className="flex h-full flex-col rounded-[1.6rem] border border-white/10 bg-white p-5 text-slate-900">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <BrandMark priority className="h-10 w-10 shrink-0 rounded-xl p-1.5" imageClassName="scale-[1.08]" />
                    <div>
                      <p className="text-sm font-semibold tracking-[-0.02em] text-slate-900">PetFlow</p>
                      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">by PhaifferTech</p>
                    </div>
                  </div>
                  <span className="inline-flex rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)]">
                    {t.panelBadge}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {heroStats.map((stat) => (
                    <div key={`${stat.value}-${stat.label}`} className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{stat.value}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(220px,0.9fr)]">
                  <div className="rounded-[1.4rem] border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                          {t.panelEyebrow}
                        </p>
                        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-900">{t.panelTitle}</h2>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Live</span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {heroHighlights.map((item) => (
                        <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
                          <span className="text-sm text-slate-700">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                      {t.storyEyebrow}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-700">{t.storyText}</p>

                    <div className="mt-5 space-y-3">
                      {heroStats.map((stat) => (
                        <div key={stat.value} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{stat.value}</p>
                          <p className="mt-1 text-sm text-slate-700">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
