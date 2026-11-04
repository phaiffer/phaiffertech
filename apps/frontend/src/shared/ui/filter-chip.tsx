type FilterChipOption = {
  value: string;
  label: string;
};

type FilterChipProps = {
  label: string;
  value: string;
  options: FilterChipOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
};

// Comanda v2: a filter shown as a dashed chip with its current value; solid border when a value is set.
export function FilterChip({ label, value, options, onChange, disabled }: FilterChipProps) {
  return (
    <label className="ui-filter-chip max-w-full" data-active={value ? 'true' : 'false'}>
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="max-w-[12rem] truncate bg-transparent font-medium text-[var(--ink)] outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
