import { sharedInputClass, sharedInputLabelClass } from '@/shared/components/public-visual-system';

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
    <label className="block">
      <span className={sharedInputLabelClass}>{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={sharedInputClass}
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
