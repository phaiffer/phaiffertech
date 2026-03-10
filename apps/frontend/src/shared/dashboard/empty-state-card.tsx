type EmptyStateCardProps = {
  title: string;
  description: string;
};

export function EmptyStateCard({ title, description }: EmptyStateCardProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-5 py-6">
      <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">{title}</p>
      <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">{description}</p>
    </div>
  );
}
