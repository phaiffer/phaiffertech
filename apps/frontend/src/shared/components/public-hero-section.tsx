'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { BrandMark, PetFlowMark } from '@/shared/components/brand-assets';
import {
  publicEyebrowClass,
  publicHeroTitleClass,
  publicSiteContainerClass,
  sharedBodyTextClass,
  sharedCompactTextClass
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

function splitTitle(title: string, titleHighlight?: string) {
  if (!titleHighlight || !title.includes(titleHighlight)) {
    return [title, '', ''] as const;
  }

  const [before, after = ''] = title.split(titleHighlight);
  return [before, titleHighlight, after] as const;
}

export function PublicHeroSection({
  id,
  eyebrow,
  title,
  titleHighlight,
  description,
  highlights = [],
  stats = [],
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  heroImage = '/images/dog-raincoat.jpg'
}: PublicHeroSectionProps) {
  const [titleBefore, highlightedTitle, titleAfter] = splitTitle(title, titleHighlight);
  const heroHighlights = highlights.slice(0, 3);
  const heroStats = stats.slice(0, 3);

  return (
    <section
      id={id}
      className="relative overflow-hidden bg-[linear-gradient(180deg,#f6fbf8,#ffffff_42%,#f8fafc)] text-slate-900"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.11),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_18%,rgba(20,184,166,0.1),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),transparent)]" />

      <div className={`${publicSiteContainerClass} relative py-18 lg:py-24`}>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-14">
          <div className="max-w-2xl">
            <p className={`${publicEyebrowClass} text-[color:var(--accent)]`}>{eyebrow}</p>

            <h1 className={`mt-5 ${publicHeroTitleClass} text-slate-900`}>
              {titleBefore}
              {highlightedTitle ? <span className="text-[color:var(--accent)]">{highlightedTitle}</span> : null}
              {titleAfter}
            </h1>

            <p className={`mt-6 max-w-2xl ${sharedBodyTextClass}`}>{description}</p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href={primaryCtaHref}
                className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--petflow-teal))] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_-26px_rgba(16,185,129,0.55)] transition-transform hover:-translate-y-0.5"
              >
                <span>{primaryCtaLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={secondaryCtaHref}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.12)] transition-colors hover:border-[color:var(--accent)]/20 hover:text-slate-900"
              >
                {secondaryCtaLabel}
              </Link>
            </div>

            {heroHighlights.length > 0 ? (
              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {heroHighlights.map((highlight) => (
                  <div key={highlight} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/78 px-4 py-3 text-sm text-slate-700 shadow-[0_10px_24px_-24px_rgba(15,23,42,0.16)]">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--accent)]/10">
                      <Check className="h-4 w-4 text-[color:var(--accent)]" />
                    </span>
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2.2rem] bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12),transparent_72%)] blur-2xl" />
            <div className="relative overflow-hidden rounded-[2.2rem] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(16,185,129,0.04),rgba(255,255,255,0.985)_140px)] p-5 shadow-[0_30px_72px_-42px_rgba(15,23,42,0.22)]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
                <div className="flex items-center gap-3">
                  <PetFlowMark className="h-11 w-11 shrink-0 rounded-2xl" iconClassName="scale-95" />
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.02em] text-slate-900">PetFlow</p>
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-700">banho, tosa e recorrência</p>
                    <p className="mt-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
                      by
                      <BrandMark className="h-3.5 w-3.5 rounded-[0.65rem]" imageClassName="scale-[1.08]" />
                      PhaifferTech
                    </p>
                  </div>
                </div>
                <span className="inline-flex rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                  PetFlow
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {heroStats.length > 0 ? heroStats.map((stat) => (
                  <div key={`${stat.value}-${stat.label}`} className="rounded-[1.35rem] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.05),rgba(248,250,252,0.96)_120px)] px-4 py-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">{stat.value}</p>
                    <p className={`mt-2 ${sharedCompactTextClass}`}>{stat.label}</p>
                  </div>
                )) : (
                  <div className="rounded-[1.35rem] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.05),rgba(248,250,252,0.96)_120px)] px-4 py-3.5 sm:col-span-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">PetFlow</p>
                    <p className={`mt-2 ${sharedCompactTextClass}`}>
                      Daily queue, recurring plans, billing, and inventory in one product surface.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className="rounded-[1.5rem] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.05),rgba(248,250,252,0.95)_120px)] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">Operação visível</p>
                  <div className="mt-4 space-y-3">
                    {heroHighlights.slice(0, 3).map((item, index) => (
                      <div key={item} className="flex items-start gap-3 rounded-2xl bg-white px-3 py-3 shadow-[0_10px_24px_-24px_rgba(15,23,42,0.16)]">
                        <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                          index === 0
                            ? 'bg-[color:var(--accent)] text-white'
                            : 'bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
                        }`}>
                          {index + 1}
                        </span>
                        <span className="text-sm leading-6 text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative min-h-[320px] overflow-hidden rounded-[1.5rem] border border-slate-200">
                  <Image
                    src={heroImage}
                    alt="PetFlow workspace preview"
                    fill
                    priority
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.02),rgba(15,23,42,0.18))]" />
                  <div className="absolute inset-x-4 bottom-4 rounded-[1.35rem] border border-white/70 bg-white/88 px-4 py-4 text-slate-900 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.28)] backdrop-blur-[2px]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">PetFlow no centro</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Fila de banho e tosa, pet taxi, estoque, cobrança e comissão seguem visíveis sem sair da mesma superfície.
                    </p>
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
