'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { publicSiteContainerClass } from '@/shared/components/public-visual-system';

type PublicCtaSectionProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

export function PublicCtaSection({
  title,
  description,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
}: PublicCtaSectionProps) {
  return (
    <section className="relative overflow-hidden bg-petflow-gradient py-20 lg:py-28">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(16,185,129,0.15),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(20,184,166,0.12),transparent_50%)]" />
      
      <div className={publicSiteContainerClass}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
            {description}
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={primaryCtaHref}
              className="inline-flex items-center gap-2 rounded-xl bg-petflow px-8 py-4 text-base font-semibold text-white shadow-lg shadow-petflow/25 transition-all hover:-translate-y-0.5 hover:bg-petflow-dark hover:shadow-xl"
            >
              {primaryCtaLabel}
              <ArrowRight className="h-5 w-5" />
            </Link>
            
            <Link
              href={secondaryCtaHref}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
