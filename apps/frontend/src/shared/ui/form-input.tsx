import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import {
  sharedFieldGroupClass,
  sharedFieldHintClass,
  sharedInputClass,
  sharedInputLabelClass,
  sharedInputLeadingAccessoryClass,
  sharedInputTrailingAccessoryClass,
  sharedInputWithLeadingAccessoryClass,
  sharedInputWithTrailingAccessoryClass
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
  leadingIcon?: ReactNode;
  trailingAccessory?: ReactNode;
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
  leadingIcon,
  trailingAccessory,
  className,
  wrapperClassName,
  onFocus: onFocusProp,
  ...inputProps
}: FormInputProps) {
  const generatedInputId = useId();
  const inputId = id ?? generatedInputId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const isEmailField = type === 'email';
  const isPhoneField = type === 'tel';
  const resolvedInputMode = inputMode ?? (
    isEmailField
      ? 'email'
      : type === 'number'
        ? 'decimal'
        : type === 'tel'
          ? 'tel'
          : undefined
  );
  const resolvedAutoComplete = autoComplete ?? (
    isEmailField
      ? 'email'
      : type === 'tel'
        ? 'tel'
        : undefined
  );
  const resolvedAutoCapitalize = autoCapitalize ?? (isEmailField || isPhoneField ? 'none' : undefined);
  const resolvedAutoCorrect = autoCorrect ?? (isEmailField || isPhoneField ? 'off' : undefined);
  const resolvedSpellCheck = spellCheck ?? (isEmailField || isPhoneField ? false : undefined);
  const resolvedStep = type === 'number' && inputProps.step === undefined ? 'any' : inputProps.step;
  const reserveEmailAccessorySpace = isEmailField && !trailingAccessory;
  const hasValue = value.length > 0;
  const inputClassName = [
    sharedInputClass,
    'min-w-0',
    leadingIcon ? sharedInputWithLeadingAccessoryClass : '',
    trailingAccessory || reserveEmailAccessorySpace ? sharedInputWithTrailingAccessoryClass : '',
    className ?? ''
  ].filter(Boolean).join(' ');
  const canMoveCaretToEnd = type === 'text'
    || type === 'search'
    || type === 'url'
    || type === 'tel'
    || type === 'password'
    || type === 'email';

  return (
    <div className={wrapperClassName ? `${sharedFieldGroupClass} ${wrapperClassName}` : sharedFieldGroupClass}>
      <label htmlFor={inputId} className={sharedInputLabelClass}>
        {label}
      </label>
      <div className="relative">
        {leadingIcon ? <span className={sharedInputLeadingAccessoryClass}>{leadingIcon}</span> : null}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={(e) => {
            if (canMoveCaretToEnd && typeof e.target.setSelectionRange === 'function') {
              const len = e.target.value.length;
              try {
                e.target.setSelectionRange(len, len);
              } catch {
                // Ignore input types that do not support manual caret control.
              }
            }
            onFocusProp?.(e);
          }}
          placeholder={placeholder}
          autoComplete={resolvedAutoComplete}
          inputMode={resolvedInputMode}
          autoCapitalize={resolvedAutoCapitalize}
          autoCorrect={resolvedAutoCorrect}
          spellCheck={resolvedSpellCheck}
          step={resolvedStep}
          data-filled={hasValue ? 'true' : 'false'}
          required={required}
          disabled={disabled}
          aria-describedby={descriptionId}
          className={inputClassName}
          {...inputProps}
        />
        {trailingAccessory ? <span className={sharedInputTrailingAccessoryClass}>{trailingAccessory}</span> : null}
      </div>
      {description ? <span id={descriptionId} className={sharedFieldHintClass}>{description}</span> : null}
    </div>
  );
}
