import { CalendarDays } from 'lucide-react';
import {
  sharedFieldGroupClass,
  sharedInputClass,
  sharedInputLeadingAccessoryClass,
  sharedInputLabelClass,
  sharedInputWithLeadingAccessoryClass,
  sharedInputWithTrailingAccessoryClass
} from '@/shared/components/public-visual-system';

type DateInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

export function DateInput({ label, value, onChange, required = false }: DateInputProps) {
  const hasValue = value.length > 0;

  return (
    <label className={sharedFieldGroupClass}>
      <span className={sharedInputLabelClass}>{label}</span>
      <div className="relative">
        <span className={sharedInputLeadingAccessoryClass}>
          <CalendarDays className="h-4 w-4" />
        </span>
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="off"
          data-filled={hasValue ? 'true' : 'false'}
          required={required}
          className={[
            sharedInputClass,
            'min-w-0',
            hasValue ? 'font-medium text-slate-900' : 'font-normal text-slate-700',
            sharedInputWithLeadingAccessoryClass,
            sharedInputWithTrailingAccessoryClass
          ].join(' ')}
        />
      </div>
    </label>
  );
}
