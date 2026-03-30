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
  eyebrow,
  title,
  description,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
}: PublicCtaSectionProps) {
  return (
    <section className="relative overflow-hidden border-t border-slate-200 bg-[linear-gradient(180deg,rgba(16,185,129,0.04),rgba(248,250,252,0.88))] py-20 lg:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_28%,rgba(16,185,129,0.12),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_26%,rgba(20,184,166,0.1),transparent_30%)]" />

      <div className={publicSiteContainerClass}>
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.045),rgba(255,255,255,0.99)_150px)] px-6 py-12 text-center shadow-[0_24px_56px_-36px_rgba(15,23,42,0.16)] sm:px-10 lg:px-14">
          {eyebrow ? (
            <p className="inline-flex w-fit items-center rounded-full bg-[color:var(--accent)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-4xl lg:text-[2.9rem]">
            {title}
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-700">
            {description}
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:justify-center">
            <Link
              href={primaryCtaHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--accent),var(--petflow-teal))] px-8 py-4 text-base font-semibold text-white shadow-[0_18px_40px_-26px_rgba(16,185,129,0.48)] transition-all hover:-translate-y-0.5"
            >
              {primaryCtaLabel}
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href={secondaryCtaHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-8 py-4 text-base font-semibold text-slate-700 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.12)] transition-all hover:border-[color:var(--accent)]/20 hover:text-slate-900"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
