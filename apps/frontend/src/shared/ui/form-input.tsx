import { useId, type InputHTMLAttributes } from 'react';
import {
  sharedFieldGroupClass,
  sharedFieldHintClass,
  sharedInputClass,
  sharedInputLabelClass
} from '@/shared/components/public-visual-system';

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'children' | 'size' | 'value' | 'onChange'
>;

type FormInputProps = NativeInputProps & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  wrapperClassName?: string;
};

export function FormInput({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  autoComplete,
  inputMode,
  autoCapitalize,
  autoCorrect,
  spellCheck,
  required = false,
  disabled = false,
  description,
  className,
  wrapperClassName,
  ...inputProps
}: FormInputProps) {
  const generatedInputId = useId();
  const inputId = id ?? generatedInputId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const resolvedInputMode = inputMode ?? (type === 'number' ? 'decimal' : undefined);
  const resolvedStep = type === 'number' && inputProps.step === undefined ? 'any' : inputProps.step;

  return (
    <div className={wrapperClassName ? `${sharedFieldGroupClass} ${wrapperClassName}` : sharedFieldGroupClass}>
      <label htmlFor={inputId} className={sharedInputLabelClass}>
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={resolvedInputMode}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        spellCheck={spellCheck}
        step={resolvedStep}
        required={required}
        disabled={disabled}
        aria-describedby={descriptionId}
        className={className ? `${sharedInputClass} min-w-0 ${className}` : `${sharedInputClass} min-w-0`}
        {...inputProps}
      />
      {description ? <span id={descriptionId} className={sharedFieldHintClass}>{description}</span> : null}
    </div>
  );
}
