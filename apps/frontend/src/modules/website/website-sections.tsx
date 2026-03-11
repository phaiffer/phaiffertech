import Link from 'next/link';
import {
  publicEyebrowClass,
  publicInteractiveCardSurfaceClass,
  publicSectionSupportingTextClass,
  publicSectionTitleClass,
  publicCardSurfaceClass
} from '@/shared/components/public-visual-system';
import { WebsiteArticle, WebsiteCard, WebsiteStat } from './website-content';

type WebsiteSectionProps = {
  id?: string;
  tone?: 'default' | 'muted';
  children: React.ReactNode;
};

type WebsiteSectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

type WebsiteStatStripProps = {
  items: WebsiteStat[];
};

type WebsiteCardGridProps = {
  items: WebsiteCard[];
};

type WebsiteArticleGridProps = {
  items: WebsiteArticle[];
  ctaLabel: string;
};

export function WebsiteSection({
  id,
  tone = 'default',
  children
}: WebsiteSectionProps) {
  return (
    <section
      id={id}
      className={[
        'border-b border-[var(--border)]',
        tone === 'muted'
          ? 'bg-[linear-gradient(180deg,rgba(15,23,42,0.055),transparent)]'
          : ''
      ].join(' ')}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        {children}
      </div>
    </section>
  );
}

export function WebsiteSectionHeading({
  eyebrow,
  title,
  description
}: WebsiteSectionHeadingProps) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className={publicEyebrowClass}>
          {eyebrow}
        </p>
      ) : null}
      <h2 className={eyebrow ? publicSectionTitleClass : 'text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-[2.15rem]'}>
        {title}
      </h2>
      <p className={publicSectionSupportingTextClass}>{description}</p>
    </div>
  );
}

export function WebsiteStatStrip({ items }: WebsiteStatStripProps) {
  return (
    <div className="mt-10 grid gap-5 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={`${item.value}-${item.label}`}
          className={`${publicCardSurfaceClass} p-6`}
        >
          <p className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">{item.value}</p>
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            {item.label}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
        </div>
      ))}
    </div>
  );
}

export function WebsiteCardGrid({ items }: WebsiteCardGridProps) {
  return (
    <div className="mt-10 grid gap-5 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={`${item.eyebrow}-${item.title}`}
          className={`${publicInteractiveCardSurfaceClass} p-6`}
        >
          <p className={publicEyebrowClass}>
            {item.eyebrow}
          </p>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-[var(--foreground)]">
            {item.title}
          </h3>
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>

          {item.bullets?.length ? (
            <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {item.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-action" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {item.footer ? (
            <p className="mt-5 border-t border-sky-500/12 pt-4 text-sm text-slate-500 dark:text-slate-400">
              {item.footer}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export function WebsiteArticleGrid({ items, ctaLabel }: WebsiteArticleGridProps) {
  return (
    <div className="mt-10 grid gap-5 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.slug}
          className={`${publicInteractiveCardSurfaceClass} p-6`}
        >
          <div className="flex items-center justify-between gap-4">
            <p className={publicEyebrowClass}>
              {item.category}
            </p>
            <p className="text-xs text-slate-500">{item.readTime}</p>
          </div>
          <h3 className="mt-4 text-xl font-semibold tracking-tight text-[var(--foreground)]">
            {item.title}
          </h3>
          <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
          <Link
            href={`/articles/${item.slug}`}
            className="mt-6 inline-flex text-sm font-medium text-action transition hover:text-sky-500"
          >
            {ctaLabel}
          </Link>
        </article>
      ))}
    </div>
  );
}
