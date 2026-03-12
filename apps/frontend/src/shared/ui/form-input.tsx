import { sharedInputClass, sharedInputLabelClass } from '@/shared/components/public-visual-system';

type FormInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
};

export function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false
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
        className={sharedInputClass}
      />
    </label>
  );
}
