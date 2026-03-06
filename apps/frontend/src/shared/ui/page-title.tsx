export function PageTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}
