import { useId, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
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
  leadingIcon?: ReactNode;
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
  leadingIcon,
  className,
  wrapperClassName
}: FormSelectProps) {
  const selectId = useId();
  const descriptionId = description ? `${selectId}-description` : undefined;
  const hasValue = value.length > 0;

  return (
    <div className={wrapperClassName ? `${sharedFieldGroupClass} ${wrapperClassName}` : sharedFieldGroupClass}>
      <label htmlFor={selectId} className={sharedInputLabelClass}>
        {label}
      </label>
      <div className="relative">
        {leadingIcon ? <span className={sharedInputLeadingAccessoryClass}>{leadingIcon}</span> : null}
        <select
          id={selectId}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          data-filled={hasValue ? 'true' : 'false'}
          aria-describedby={descriptionId}
          className={[
            sharedInputClass,
            'min-w-0 appearance-none',
            hasValue ? 'font-medium text-slate-900' : 'font-normal text-slate-600',
            leadingIcon ? sharedInputWithLeadingAccessoryClass : '',
            sharedInputWithTrailingAccessoryClass,
            className ?? ''
          ].filter(Boolean).join(' ')}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-white text-slate-900">
              {option.label}
            </option>
          ))}
        </select>
        <span className={sharedInputTrailingAccessoryClass}>
          <ChevronDown className="h-4 w-4" />
        </span>
      </div>
      {description ? <span id={descriptionId} className={sharedFieldHintClass}>{description}</span> : null}
    </div>
  );
}
