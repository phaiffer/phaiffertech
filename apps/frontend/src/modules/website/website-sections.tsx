import Link from 'next/link';
import {
  publicCardSurfaceClass,
  publicEyebrowClass,
  publicHeadingColumnClass,
  publicInteractiveCardSurfaceClass,
  publicSectionLayoutClass,
  publicSectionSupportingTextClass,
  publicSectionTitleClass,
  publicSiteContainerClass,
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

export function WebsiteSection({ id, tone = 'default', children }: WebsiteSectionProps) {
  return (
    <section
      id={id}
      className={`border-t border-border ${
        tone === 'muted' ? 'bg-[linear-gradient(180deg,rgba(16,185,129,0.035),rgba(248,250,252,0.86))]' : 'bg-white'
      }`}
    >
      <div className={`${publicSiteContainerClass} py-14 lg:py-18`}>{children}</div>
    </section>
  );
}

export function WebsiteSplitSection({
  id,
  tone = 'default',
  eyebrow,
  title,
  description,
  children,
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

export function WebsiteSectionHeading({ eyebrow, title, description }: WebsiteSectionHeadingProps) {
  return (
    <div className="max-w-xl">
      {eyebrow && <p className={publicEyebrowClass}>{eyebrow}</p>}
      <h2 className={eyebrow ? publicSectionTitleClass : 'text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl'}>
        {title}
      </h2>
      <p className={publicSectionSupportingTextClass}>{description}</p>
    </div>
  );
}

export function WebsiteStatStrip({ items }: WebsiteStatStripProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={`${item.value}-${item.label}`} className={`${publicCardSurfaceClass} rounded-[1.5rem] p-6`}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">{item.label}</p>
          <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-900">{item.value}</p>
          <p className="mt-3 text-sm leading-7 text-slate-700">{item.description}</p>
        </div>
      ))}
    </div>
  );
}

export function WebsiteCardGrid({ items }: WebsiteCardGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={`${item.eyebrow}-${item.title}`}
          className={`${publicInteractiveCardSurfaceClass} group flex h-full flex-col justify-between rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(16,185,129,0.035),rgba(255,255,255,0.99)_140px)] p-6`}
        >
          <p className={publicEyebrowClass}>{item.eyebrow}</p>
          <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-900">{item.title}</h3>
          <p className="mt-4 text-sm leading-7 text-slate-700">{item.description}</p>

          {item.bullets?.length ? (
            <ul className="mt-5 space-y-3 text-sm text-slate-700">
              {item.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {item.footer && (
            <p className="mt-4 border-t border-border pt-4 text-xs text-slate-700">{item.footer}</p>
          )}
        </article>
      ))}
    </div>
  );
}

type WebsiteFullSectionProps = {
  id?: string;
  tone?: 'default' | 'muted';
  eyebrow?: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function WebsiteFullSection({
  id,
  tone = 'default',
  eyebrow,
  title,
  description,
  children,
}: WebsiteFullSectionProps) {
  return (
    <section
      id={id}
      className={`border-t border-border ${tone === 'muted' ? 'bg-[linear-gradient(180deg,rgba(16,185,129,0.035),rgba(248,250,252,0.86))]' : 'bg-white'}`}
    >
      <div className={`${publicSiteContainerClass} py-14 lg:py-18`}>
        <div className="mb-10 max-w-3xl">
          {eyebrow && <p className={publicEyebrowClass}>{eyebrow}</p>}
          <h2 className={eyebrow ? `mt-3 ${publicSectionTitleClass}` : publicSectionTitleClass}>
            {title}
          </h2>
          <p className={`mt-3 ${publicSectionSupportingTextClass}`}>{description}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

export function WebsiteArticleGrid({ items, ctaLabel }: WebsiteArticleGridProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.slug}
          className={`${publicInteractiveCardSurfaceClass} group flex h-full flex-col justify-between rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(16,185,129,0.03),rgba(255,255,255,0.99)_140px)] p-6`}
        >
          <div className="mb-4 h-1 w-8 rounded-full bg-border transition-colors group-hover:bg-accent" />
          <div className="flex items-center justify-between gap-4">
            <p className={publicEyebrowClass}>{item.category}</p>
            <p className="text-xs text-slate-700">{item.readTime}</p>
          </div>
          <h3 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">{item.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{item.description}</p>
          <Link
            href={`/articles/${item.slug}`}
            className="mt-5 inline-flex text-sm font-medium text-accent transition-colors hover:text-slate-900"
          >
            {ctaLabel}
          </Link>
        </article>
      ))}
    </div>
  );
}
