type PublicFeatureItem = {
  eyebrow: string;
  title: string;
  description: string;
};

type PublicFeatureGridProps = {
  id?: string;
  title: string;
  description: string;
  items: PublicFeatureItem[];
};

export function PublicFeatureGrid({
  id,
  title,
  description,
  items
}: PublicFeatureGridProps) {
  return (
    <section id={id} className="border-b border-[var(--border)]">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold text-[var(--foreground)]">{title}</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <div
              key={`${item.eyebrow}-${item.title}`}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {item.eyebrow}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}