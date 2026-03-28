import {
  publicEyebrowClass,
  publicInteractiveCardSurfaceClass,
  publicSectionSupportingTextClass,
  publicSectionTitleClass,
  publicSiteContainerClass,
} from '@/shared/components/public-visual-system';

type PublicFeatureItem = {
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
  footer?: string;
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
    <section id={id} className="border-t border-border bg-slate-50">
      <div className={`${publicSiteContainerClass} py-14 lg:py-20`}>
        <div className="mx-auto max-w-3xl text-center">
          {eyebrowLabel && <p className={publicEyebrowClass}>{eyebrowLabel}</p>}
          <h2 className={publicSectionTitleClass}>{title}</h2>
          <p className={`mx-auto ${publicSectionSupportingTextClass}`}>{description}</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={`${item.eyebrow}-${item.title}`}
              className={`${publicInteractiveCardSurfaceClass} h-full rounded-[1.75rem] bg-white p-7`}
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
