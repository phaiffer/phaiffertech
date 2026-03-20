import { useId } from 'react';
import {
  sharedFieldGroupClass,
  sharedFieldHintClass,
  sharedInputClass,
  sharedInputLabelClass
} from '@/shared/components/public-visual-system';

type FormInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  description?: string;
  className?: string;
  wrapperClassName?: string;
};

export function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  disabled = false,
  description,
  className,
  wrapperClassName
}: FormInputProps) {
  const inputId = useId();
  const descriptionId = description ? `${inputId}-description` : undefined;

  return (
    <div className={wrapperClassName ? `${sharedFieldGroupClass} ${wrapperClassName}` : sharedFieldGroupClass}>
      <label htmlFor={inputId} className={sharedInputLabelClass}>
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-describedby={descriptionId}
        className={className ? `${sharedInputClass} ${className}` : sharedInputClass}
      />
      {description ? <span id={descriptionId} className={sharedFieldHintClass}>{description}</span> : null}
    </div>
  );
}
