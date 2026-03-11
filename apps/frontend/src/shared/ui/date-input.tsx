type DateInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function DateInput({ label, value, onChange, required = false }: DateInputProps) {
  return (
    <label className="block text-[length:var(--font-size-sm)]">
      <span className="mb-[var(--space-2)] block font-semibold tracking-[0.01em] text-[color:var(--app-shell-muted)]">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-[var(--radius-lg)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] px-[var(--space-3)] py-[var(--space-3)] text-[length:var(--font-size-sm)] text-[color:var(--app-shell-text)] outline-none transition duration-200 focus:border-[color:var(--tenant-accent)] focus:ring-2 focus:ring-[color:var(--tenant-accent-soft)]"
      />
    </label>
  );
}
