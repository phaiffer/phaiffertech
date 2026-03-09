import Link from 'next/link';

type PublicHeroSectionProps = {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  platformCardEyebrow: string;
  platformCardTitle: string;
  platformCardText: string;
  frontendCardEyebrow: string;
  frontendCardTitle: string;
  backendCardEyebrow: string;
  backendCardTitle: string;
};

export function PublicHeroSection({
  id,
  eyebrow,
  title,
  description,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  platformCardEyebrow,
  platformCardTitle,
  platformCardText,
  frontendCardEyebrow,
  frontendCardTitle,
  backendCardEyebrow,
  backendCardTitle
}: PublicHeroSectionProps) {
  return (
    <section id={id} className="border-b border-[var(--border)]">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-action">
            {eyebrow}
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={primaryCtaHref}
              className="rounded-xl bg-action px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              {primaryCtaLabel}
            </Link>

            <a
              href={secondaryCtaHref}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
            >
              {secondaryCtaLabel}
            </a>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {platformCardEyebrow}
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {platformCardTitle}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{platformCardText}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {frontendCardEyebrow}
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {frontendCardTitle}
              </p>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {backendCardEyebrow}
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {backendCardTitle}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}