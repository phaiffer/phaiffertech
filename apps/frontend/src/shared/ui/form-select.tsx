type FormSelectOption = {
  value: string;
  label: string;
};

type FormSelectProps = {
  label: string;
  value: string;
  options: FormSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function FormSelect({ label, value, options, onChange, disabled = false }: FormSelectProps) {
  return (
    <label className="block text-[length:var(--font-size-sm)]">
      <span className="mb-[var(--space-2)] block font-semibold tracking-[0.01em] text-[color:var(--app-shell-muted)]">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[var(--radius-lg)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] px-[var(--space-3)] py-[var(--space-3)] text-[length:var(--font-size-sm)] text-[color:var(--app-shell-text)] outline-none transition duration-200 focus:border-[color:var(--tenant-accent)] focus:ring-2 focus:ring-[color:var(--tenant-accent-soft)] disabled:cursor-not-allowed disabled:bg-[color:var(--surface-2)] disabled:text-[color:var(--app-shell-muted)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
