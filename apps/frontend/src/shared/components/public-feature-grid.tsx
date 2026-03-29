'use client';

import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import {
  publicSiteContainerClass,
} from '@/shared/components/public-visual-system';
import type { LucideIcon } from 'lucide-react';

// Icon color variants based on Figma design
const iconColorVariants = [
  { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
  { bg: 'bg-violet-100', icon: 'text-violet-600' },
  { bg: 'bg-teal-100', icon: 'text-teal-600' },
  { bg: 'bg-pink-100', icon: 'text-pink-600' },
  { bg: 'bg-orange-100', icon: 'text-orange-600' },
  { bg: 'bg-red-100', icon: 'text-red-600' },
];

export type PublicFeatureItem = {
  eyebrow?: string;
  title: string;
  description: string;
  bullets?: string[];
  footer?: string;
  icon?: LucideIcon;
  href?: string;
};

type PublicFeatureGridProps = {
  id?: string;
  eyebrowLabel?: string;
  title: string;
  description: string;
  items: PublicFeatureItem[];
};

export function PublicFeatureGrid({
  id,
  eyebrowLabel,
  title,
  description,
  items,
}: PublicFeatureGridProps) {
  return (
    <section id={id} className="bg-white py-20 lg:py-28">
      <div className={publicSiteContainerClass}>
        {/* Header */}
    <section id={id} className="border-t border-border bg-slate-50">
      <div className={`${publicSiteContainerClass} py-14 lg:py-18`}>
        <div className="mx-auto max-w-3xl text-center">
          {eyebrowLabel && (
            <span className="inline-flex items-center rounded-full border border-petflow/20 bg-petflow/5 px-4 py-1.5 text-sm font-medium text-petflow">
              {eyebrowLabel}
            </span>
          )}
          <h2 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {description}
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const colorVariant = iconColorVariants[index % iconColorVariants.length];
            const IconComponent = item.icon;

            return (
              <div
                key={`${item.title}-${index}`}
                className="group relative flex flex-col rounded-2xl border border-border bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-petflow/30 hover:shadow-lg"
              >
                {/* Icon Badge */}
                {IconComponent && (
                  <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${colorVariant.bg}`}>
                    <IconComponent className={`h-7 w-7 ${colorVariant.icon}`} />
                  </div>
                )}

                {/* Title */}
                <h3 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="mt-3 text-base leading-relaxed text-muted">
                  {item.description}
                </p>

                {/* Bullet Points with Checkmarks */}
                {item.bullets && item.bullets.length > 0 && (
                  <ul className="mt-6 flex-1 space-y-3">
                    {item.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-petflow/10">
                          <Check className="h-3 w-3 text-petflow" />
                        </span>
                        <span className="text-sm text-muted-foreground">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Learn More Link */}
                {item.href && (
                  <Link
                    href={item.href}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-petflow transition-colors hover:text-petflow-dark"
                  >
                    Saiba mais
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                )}

                {/* Footer */}
                {item.footer && (
                  <p className="mt-6 border-t border-border pt-4 text-xs text-muted">
                    {item.footer}
                  </p>
                )}
              </div>
            );
          })}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={`${item.eyebrow}-${item.title}`}
              className={`${publicInteractiveCardSurfaceClass} h-full rounded-[1.5rem] bg-white p-6`}
            >
              <p className={publicEyebrowClass}>{item.eyebrow}</p>
              <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-muted">{item.description}</p>
              {item.bullets?.length ? (
                <ul className="mt-5 space-y-3 text-sm text-muted">
                  {item.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {item.footer ? (
                <p className="mt-5 border-t border-border pt-4 text-xs text-muted">{item.footer}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
