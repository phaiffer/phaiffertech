type SearchInputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({
  label = 'Busca',
  value,
  onChange,
  placeholder = 'Digite para buscar'
}: SearchInputProps) {
  return (
    <label className="block text-[length:var(--font-size-sm)]">
      <span className="mb-[var(--space-2)] block font-semibold tracking-[0.01em] text-[color:var(--app-shell-muted)]">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[var(--radius-lg)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] px-[var(--space-3)] py-[var(--space-3)] text-[length:var(--font-size-sm)] text-[color:var(--app-shell-text)] outline-none transition duration-200 focus:border-[color:var(--tenant-accent)] focus:ring-2 focus:ring-[color:var(--tenant-accent-soft)]"
      />
    </label>
  );
}
