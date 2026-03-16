import { sharedInputClass, sharedInputLabelClass } from '@/shared/components/public-visual-system';

type FormInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
};

export function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  disabled = false
}: FormInputProps) {
  return (
    <label className="block">
      <span className={sharedInputLabelClass}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={sharedInputClass}
      />
    </label>
  );
}
