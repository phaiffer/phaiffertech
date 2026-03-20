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
  return (
    <label className={wrapperClassName ? `${sharedFieldGroupClass} ${wrapperClassName}` : sharedFieldGroupClass}>
      <span className={sharedInputLabelClass}>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        rows={rows}
        className={className ? `${sharedTextareaClass} ${className}` : sharedTextareaClass}
      />
      {description ? <span className={sharedFieldHintClass}>{description}</span> : null}
    </label>
  );
}
