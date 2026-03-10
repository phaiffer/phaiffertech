import Link from 'next/link';
import { WebsiteAction, WebsiteArticle, WebsiteCard, WebsiteStat } from './website-content';

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

type WebsitePageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta?: WebsiteAction;
  secondaryCta?: WebsiteAction;
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
          ? 'bg-[linear-gradient(180deg,rgba(15,23,42,0.02),transparent)]'
          : ''
      ].join(' ')}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        {children}
      </div>
    </section>
  );
}

export function WebsitePageIntro({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta
}: WebsitePageIntroProps) {
  return (
    <section className="border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(15,23,42,0.04),transparent_70%)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-4xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-action">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-[var(--foreground)] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
            {description}
          </p>

          {primaryCta || secondaryCta ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {primaryCta ? (
                <Link
                  href={primaryCta.href}
                  className="rounded-xl bg-action px-5 py-3 text-sm font-medium text-white shadow-[0_16px_30px_rgba(31,111,235,0.24)] transition hover:bg-blue-700"
                >
                  {primaryCta.label}
                </Link>
              ) : null}

              {secondaryCta ? (
                <Link
                  href={secondaryCta.href}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
                >
                  {secondaryCta.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
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
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-action">
          {eyebrow}
        </p>
      ) : null}
      <h2 className={eyebrow ? 'mt-3 text-3xl font-semibold text-[var(--foreground)]' : 'text-3xl font-semibold text-[var(--foreground)]'}>
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
    </div>
  );
}

export function WebsiteStatStrip({ items }: WebsiteStatStripProps) {
  return (
    <div className="mt-10 grid gap-4 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={`${item.value}-${item.label}`}
          className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card"
        >
          <p className="text-2xl font-semibold text-[var(--foreground)]">{item.value}</p>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            {item.label}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
        </div>
      ))}
    </div>
  );
}

export function WebsiteCardGrid({ items }: WebsiteCardGridProps) {
  return (
    <div className="mt-10 grid gap-4 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={`${item.eyebrow}-${item.title}`}
          className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card transition hover:-translate-y-0.5 hover:border-sky-500/25"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {item.eyebrow}
          </p>
          <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">
            {item.title}
          </h3>
          <p className="mt-4 text-sm leading-6 text-slate-600">{item.description}</p>

          {item.bullets?.length ? (
            <ul className="mt-5 space-y-2 text-sm text-slate-600">
              {item.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-action" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {item.footer ? (
            <p className="mt-5 border-t border-[var(--border)] pt-4 text-sm text-slate-500">
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
    <div className="mt-10 grid gap-4 lg:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.slug}
          className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card transition hover:-translate-y-0.5 hover:border-sky-500/25"
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              {item.category}
            </p>
            <p className="text-xs text-slate-500">{item.readTime}</p>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-[var(--foreground)]">
            {item.title}
          </h3>
          <p className="mt-4 text-sm leading-6 text-slate-600">{item.description}</p>
          <Link
            href={`/articles/${item.slug}`}
            className="mt-6 inline-flex text-sm font-medium text-action"
          >
            {ctaLabel}
          </Link>
        </article>
      ))}
    </div>
  );
}
