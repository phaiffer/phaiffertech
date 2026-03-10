export function PageTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-semibold text-[color:var(--app-shell-heading)]">{title}</h1>
      <p className="text-sm text-[color:var(--app-shell-muted)]">{description}</p>
    </div>
  );
}
