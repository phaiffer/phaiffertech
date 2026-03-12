import { sharedInputClass, sharedInputLabelClass } from '@/shared/components/public-visual-system';

type DateTimeInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function DateTimeInput({ label, value, onChange, required = false }: DateTimeInputProps) {
  return (
    <label className="block">
      <span className={sharedInputLabelClass}>{label}</span>
      <input
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className={sharedInputClass}
      />
    </label>
  );
}
