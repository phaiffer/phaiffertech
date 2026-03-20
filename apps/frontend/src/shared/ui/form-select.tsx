import {
  sharedFieldGroupClass,
  sharedFieldHintClass,
  sharedInputClass,
  sharedInputLabelClass
} from '@/shared/components/public-visual-system';

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
  description?: string;
  className?: string;
  wrapperClassName?: string;
};

export function FormSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  description,
  className,
  wrapperClassName
}: FormSelectProps) {
  return (
    <label className={wrapperClassName ? `${sharedFieldGroupClass} ${wrapperClassName}` : sharedFieldGroupClass}>
      <span className={sharedInputLabelClass}>{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={className ? `${sharedInputClass} ${className}` : sharedInputClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {description ? <span className={sharedFieldHintClass}>{description}</span> : null}
    </label>
  );
}
