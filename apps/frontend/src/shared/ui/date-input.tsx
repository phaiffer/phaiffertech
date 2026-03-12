import { sharedInputClass, sharedInputLabelClass } from '@/shared/components/public-visual-system';

type DateInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function DateInput({ label, value, onChange, required = false }: DateInputProps) {
  return (
    <label className="block">
      <span className={sharedInputLabelClass}>{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className={sharedInputClass}
      />
    </label>
  );
}
