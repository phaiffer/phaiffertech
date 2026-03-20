import { useId } from 'react';
import {
  sharedFieldGroupClass,
  sharedFieldHintClass,
  sharedInputLabelClass,
  sharedTextareaClass
} from '@/shared/components/public-visual-system';

type FormTextareaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  description?: string;
  className?: string;
  wrapperClassName?: string;
};

export function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  rows = 4,
  description,
  className,
  wrapperClassName
}: FormTextareaProps) {
  const textareaId = useId();
  const descriptionId = description ? `${textareaId}-description` : undefined;

  return (
    <div className={wrapperClassName ? `${sharedFieldGroupClass} ${wrapperClassName}` : sharedFieldGroupClass}>
      <label htmlFor={textareaId} className={sharedInputLabelClass}>
        {label}
      </label>
      <textarea
        id={textareaId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        aria-describedby={descriptionId}
        className={className ? `${sharedTextareaClass} ${className}` : sharedTextareaClass}
      />
      {description ? <span id={descriptionId} className={sharedFieldHintClass}>{description}</span> : null}
    </div>
  );
}
