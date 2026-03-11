import Link from 'next/link';
import {
  publicCardSurfaceClass,
  publicEyebrowClass,
  publicHeadingColumnClass,
  publicInteractiveCardSurfaceClass,
  publicSectionLayoutClass,
  publicSectionSupportingTextClass,
  publicSectionTitleClass,
  publicSiteContainerClass
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

type WebsiteSplitSectionProps = WebsiteSectionProps & WebsiteSectionHeadingProps;

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
        'border-t border-white/5',
        tone === 'muted'
          ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]'
          : ''
      ].join(' ')}
    >
      <div className={`${publicSiteContainerClass} py-20 lg:py-28`}>
        {children}
      </div>
    </section>
  );
}

export function WebsiteSplitSection({
  id,
  tone = 'default',
  eyebrow,
  title,
  description,
  children
}: WebsiteSplitSectionProps) {
  return (
    <WebsiteSection id={id} tone={tone}>
      <div className={publicSectionLayoutClass}>
        <div className={publicHeadingColumnClass}>
          <WebsiteSectionHeading eyebrow={eyebrow} title={title} description={description} />
        </div>
        <div>{children}</div>
      </div>
    </WebsiteSection>
  );
}

export function WebsiteSectionHeading({
  eyebrow,
  title,
  description
}: WebsiteSectionHeadingProps) {
  return (
    <div className="max-w-xl">
      {eyebrow ? (
        <p className={publicEyebrowClass}>
          {eyebrow}
        </p>
      ) : null}
      <h2 className={eyebrow ? publicSectionTitleClass : 'text-4xl font-extrabold tracking-tight text-white md:text-5xl'}>
        {title}
      </h2>
      <p className={publicSectionSupportingTextClass}>{description}</p>
    </div>
  );
}

export function WebsiteStatStrip({ items }: WebsiteStatStripProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <div
          key={`${item.value}-${item.label}`}
          className={`${publicCardSurfaceClass} p-6`}
        >
          <div className="mb-5 h-1 w-8 rounded-full bg-sky-400/70" />
          <p className="text-3xl font-black tracking-tight text-white">{item.value}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#b6bec5]">
            {item.label}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[#b6bec5]">{item.description}</p>
        </div>
      ))}
    </div>
  );
}

export function WebsiteCardGrid({ items }: WebsiteCardGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article
          key={`${item.eyebrow}-${item.title}`}
          className={`${publicInteractiveCardSurfaceClass} group flex flex-col justify-between p-6`}
        >
          <div className="mb-5 h-1 w-8 rounded-full bg-white/10 transition-all group-hover:bg-sky-400" />
          <p className={publicEyebrowClass}>
            {item.eyebrow}
          </p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-white">
            {item.title}
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-[#b6bec5]">{item.description}</p>

          {item.bullets?.length ? (
            <ul className="mt-5 space-y-2 text-sm text-[#b6bec5]">
              {item.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {item.footer ? (
            <p className="mt-5 border-t border-white/10 pt-4 text-sm text-[#7e8a9a]">
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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.slug}
          className={`${publicInteractiveCardSurfaceClass} group flex flex-col justify-between p-6`}
        >
          <div className="mb-5 h-1 w-8 rounded-full bg-white/10 transition-all group-hover:bg-sky-400" />
          <div className="flex items-center justify-between gap-4">
            <p className={publicEyebrowClass}>
              {item.category}
            </p>
            <p className="text-xs text-[#7e8a9a]">{item.readTime}</p>
          </div>
          <h3 className="mt-4 text-2xl font-bold tracking-tight text-white">
            {item.title}
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-[#b6bec5]">{item.description}</p>
          <Link
            href={`/articles/${item.slug}`}
            className="mt-6 inline-flex text-sm font-semibold uppercase tracking-[0.16em] text-sky-400 transition hover:text-white"
          >
            {ctaLabel}
          </Link>
        </article>
      ))}
    </div>
  );
}
