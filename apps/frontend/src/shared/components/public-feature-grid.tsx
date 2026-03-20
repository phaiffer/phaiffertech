import {
  publicHeadingColumnClass,
  publicEyebrowClass,
  publicInteractiveCardSurfaceClass,
  publicSectionLayoutClass,
  publicSectionSupportingTextClass,
  publicSectionTitleClass,
  publicSiteContainerClass,
} from '@/shared/components/public-visual-system';

type PublicFeatureItem = {
  eyebrow: string;
  title: string;
  description: string;
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
    <section id={id} className="border-t border-border bg-surface-inset">
      <div className={`${publicSiteContainerClass} py-14 lg:py-20`}>
        <div className={publicSectionLayoutClass}>
          <div className={publicHeadingColumnClass}>
            {eyebrowLabel && <p className={publicEyebrowClass}>{eyebrowLabel}</p>}
            <h2 className={publicSectionTitleClass}>{title}</h2>
            <p className={publicSectionSupportingTextClass}>{description}</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div
                key={`${item.eyebrow}-${item.title}`}
                className={`${publicInteractiveCardSurfaceClass} group h-full p-7`}
              >
                <div className="mb-4 h-1 w-8 rounded-full bg-border transition-colors group-hover:bg-accent" />
                <p className={publicEyebrowClass}>{item.eyebrow}</p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
