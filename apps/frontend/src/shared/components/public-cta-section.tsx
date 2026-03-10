import Link from 'next/link';

type PublicCtaSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
};

export function PublicCtaSection({
  eyebrow,
  title,
  description,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref
}: PublicCtaSectionProps) {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-sky-500/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(238,242,255,0.92))] p-8 shadow-[0_24px_60px_rgba(15,23,42,0.12)] dark:bg-[linear-gradient(135deg,rgba(17,26,46,0.98),rgba(23,35,61,0.92))] lg:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-action">
            {eyebrow}
          </p>

          <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-[var(--foreground)] lg:text-4xl">
            {title}
          </h2>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={primaryCtaHref}
              className="rounded-xl bg-action px-5 py-3 text-sm font-medium text-white shadow-[0_16px_30px_rgba(31,111,235,0.24)] transition hover:bg-blue-700"
            >
              {primaryCtaLabel}
            </Link>

            <Link
              href={secondaryCtaHref}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
