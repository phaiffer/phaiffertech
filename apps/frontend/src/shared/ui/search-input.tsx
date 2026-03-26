import {
  sharedFieldGroupClass,
  sharedFieldHintClass,
  sharedInputClass,
  sharedInputLabelClass
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
  return (
    <label className={wrapperClassName ? `${sharedFieldGroupClass} ${wrapperClassName}` : sharedFieldGroupClass}>
      <span className={sharedInputLabelClass}>{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={className ? `${sharedInputClass} pl-11 ${className}` : `${sharedInputClass} pl-11`}
        />
      </div>
      {description ? <span className={sharedFieldHintClass}>{description}</span> : null}
    </label>
  );
}
