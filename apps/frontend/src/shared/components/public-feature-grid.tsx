import {
  publicHeadingColumnClass,
  publicEyebrowClass,
  publicInteractiveCardSurfaceClass,
  publicSectionLayoutClass,
  publicSectionSupportingTextClass,
  publicSectionTitleClass,
  publicSiteContainerClass
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
  items
}: PublicFeatureGridProps) {
  return (
    <section
      id={id}
      className="border-t border-white/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]"
    >
      <div className={`${publicSiteContainerClass} py-20 lg:py-28`}>
        <div className={publicSectionLayoutClass}>
          <div className={publicHeadingColumnClass}>
            {eyebrowLabel ? (
              <p className={publicEyebrowClass}>
                {eyebrowLabel}
              </p>
            ) : null}
            <h2 className={publicSectionTitleClass}>{title}</h2>
            <p className={publicSectionSupportingTextClass}>{description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div
                key={`${item.eyebrow}-${item.title}`}
                className={`${publicInteractiveCardSurfaceClass} group p-6`}
              >
                <div className="mb-5 h-1 w-8 rounded-full bg-white/10 transition-all group-hover:bg-sky-400" />
                <p className={publicEyebrowClass}>
                  {item.eyebrow}
                </p>
                <h3 className="mt-3 text-2xl font-bold tracking-tight text-white">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-[#b6bec5]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
