import { Search } from 'lucide-react';
import {
  sharedFieldGroupClass,
  sharedFieldHintClass,
  sharedInputClass,
  sharedInputLeadingAccessoryClass,
  sharedInputLabelClass,
  sharedInputWithLeadingAccessoryClass
} from '@/shared/components/public-visual-system';

type SearchInputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  description?: string;
  className?: string;
  wrapperClassName?: string;
};

export function SearchInput({
  label = 'Busca',
  value,
  onChange,
  placeholder = 'Digite para buscar',
  description,
  className,
  wrapperClassName
}: SearchInputProps) {
  const hasValue = value.length > 0;
  const searchInputClass = [
    sharedInputClass,
    sharedInputWithLeadingAccessoryClass,
    '[--ui-input-padding-right:3.5rem] sm:[--ui-input-padding-right:3.75rem]',
    className ?? ''
  ].filter(Boolean).join(' ');

  return (
    <label className={wrapperClassName ? `${sharedFieldGroupClass} ${wrapperClassName}` : sharedFieldGroupClass}>
      <span className={sharedInputLabelClass}>{label}</span>
      <div className="relative">
        <span className={sharedInputLeadingAccessoryClass}>
          <Search className="h-4 w-4" />
        </span>
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          spellCheck={false}
          data-filled={hasValue ? 'true' : 'false'}
          className={searchInputClass}
        />
      </div>
      {description ? <span className={sharedFieldHintClass}>{description}</span> : null}
    </label>
  );
}
