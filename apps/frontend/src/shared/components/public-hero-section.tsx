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
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
