import { useId } from 'react';
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
  const selectId = useId();
  const descriptionId = description ? `${selectId}-description` : undefined;

  return (
    <div className={wrapperClassName ? `${sharedFieldGroupClass} ${wrapperClassName}` : sharedFieldGroupClass}>
      <label htmlFor={selectId} className={sharedInputLabelClass}>
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={descriptionId}
        className={className ? `${sharedInputClass} ${className}` : sharedInputClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {description ? <span id={descriptionId} className={sharedFieldHintClass}>{description}</span> : null}
    </div>
  );
}
