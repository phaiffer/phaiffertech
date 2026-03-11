export function PageTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-[var(--space-5)] border-b border-[color:var(--app-shell-border)] pb-[var(--space-4)]">
      <h1 className="text-[length:var(--font-size-2xl)] font-semibold leading-tight tracking-[-0.02em] text-[color:var(--app-shell-heading)]">
        {title}
      </h1>
      <p className="text-[length:var(--font-size-sm)] text-[color:var(--app-shell-muted)]">{description}</p>
    </div>
  );
}
