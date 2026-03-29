'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import {
  publicEyebrowClass,
  publicInteractiveCardSurfaceClass,
  publicSiteContainerClass
} from '@/shared/components/public-visual-system';

const iconColorVariants = [
  { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
  { bg: 'bg-blue-100', icon: 'text-blue-600' },
  { bg: 'bg-amber-100', icon: 'text-amber-600' },
  { bg: 'bg-rose-100', icon: 'text-rose-600' },
  { bg: 'bg-violet-100', icon: 'text-violet-600' },
  { bg: 'bg-slate-100', icon: 'text-slate-700' }
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
  items
}: PublicFeatureGridProps) {
  return (
    <section id={id} className="border-t border-border bg-surface-inset">
      <div className={`${publicSiteContainerClass} py-14 lg:py-18`}>
        <div className="mx-auto max-w-3xl text-center">
          {eyebrowLabel ? <p className={publicEyebrowClass}>{eyebrowLabel}</p> : null}
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted sm:text-lg">{description}</p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const Icon = item.icon;
            const colorVariant = iconColorVariants[index % iconColorVariants.length];

            return (
              <article
                key={`${item.eyebrow ?? item.title}-${item.title}`}
                className={`${publicInteractiveCardSurfaceClass} flex h-full flex-col rounded-[1.5rem] bg-white p-6`}
              >
                {Icon ? (
                  <span className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${colorVariant.bg}`}>
                    <Icon className={`h-7 w-7 ${colorVariant.icon}`} />
                  </span>
                ) : null}

                {item.eyebrow ? <p className={`mt-5 ${publicEyebrowClass}`}>{item.eyebrow}</p> : null}
                <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-muted">{item.description}</p>

                {item.bullets?.length ? (
                  <ul className="mt-5 space-y-3">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 text-sm text-muted">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent-muted">
                          <Check className="h-3 w-3 text-accent" />
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {item.href ? (
                  <Link
                    href={item.href}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-foreground"
                  >
                    <span>Learn more</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}

                {item.footer ? <p className="mt-6 border-t border-border pt-4 text-xs text-muted">{item.footer}</p> : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
