import {
  publicEyebrowClass,
  publicInteractiveCardSurfaceClass,
  publicSectionSupportingTextClass,
  publicSectionTitleClass
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
      className="border-b border-[var(--border)] bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.05))]"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          {eyebrowLabel ? (
            <p className={publicEyebrowClass}>
              {eyebrowLabel}
            </p>
          ) : null}
          <h2 className={publicSectionTitleClass}>{title}</h2>
          <p className={publicSectionSupportingTextClass}>{description}</p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {items.map((item) => (
            <div
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
