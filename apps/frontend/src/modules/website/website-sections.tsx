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
        tone === 'muted' ? 'bg-surface-inset' : ''
      }`}
    >
      <div className={`${publicSiteContainerClass} py-16 lg:py-24`}>{children}</div>
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
      <h2 className={eyebrow ? publicSectionTitleClass : 'text-3xl font-semibold tracking-tight text-foreground sm:text-4xl'}>
        {title}
      </h2>
      <p className={publicSectionSupportingTextClass}>{description}</p>
    </div>
  );
}

export function WebsiteStatStrip({ items }: WebsiteStatStripProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={`${item.value}-${item.label}`} className={`${publicCardSurfaceClass} p-6`}>
          <div className="mb-4 h-1 w-8 rounded-full bg-accent" />
          <p className="text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wider text-muted">{item.label}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
        </div>
      ))}
    </div>
  );
}

export function WebsiteCardGrid({ items }: WebsiteCardGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={`${item.eyebrow}-${item.title}`}
          className={`${publicInteractiveCardSurfaceClass} group flex flex-col justify-between p-6`}
        >
          <div className="mb-4 h-1 w-8 rounded-full bg-border transition-colors group-hover:bg-accent" />
          <p className={publicEyebrowClass}>{item.eyebrow}</p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">{item.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>

          {item.bullets?.length ? (
            <ul className="mt-4 space-y-2 text-sm text-muted">
              {item.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {item.footer && (
            <p className="mt-4 border-t border-border pt-4 text-xs text-muted">{item.footer}</p>
          )}
        </article>
      ))}
    </div>
  );
}

export function WebsiteArticleGrid({ items, ctaLabel }: WebsiteArticleGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.slug}
          className={`${publicInteractiveCardSurfaceClass} group flex flex-col justify-between p-6`}
        >
          <div className="mb-4 h-1 w-8 rounded-full bg-border transition-colors group-hover:bg-accent" />
          <div className="flex items-center justify-between gap-4">
            <p className={publicEyebrowClass}>{item.category}</p>
            <p className="text-xs text-muted">{item.readTime}</p>
          </div>
          <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground">{item.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>
          <Link
            href={`/articles/${item.slug}`}
            className="mt-5 inline-flex text-sm font-medium text-accent transition-colors hover:text-foreground"
          >
            {ctaLabel}
          </Link>
        </article>
      ))}
    </div>
  );
}
