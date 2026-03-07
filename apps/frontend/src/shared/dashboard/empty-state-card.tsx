type EmptyStateCardProps = {
  title: string;
  description: string;
};

export function EmptyStateCard({ title, description }: EmptyStateCardProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6">
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}
