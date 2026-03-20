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
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={className ? `${sharedInputClass} ${className}` : sharedInputClass}
      />
      {description ? <span className={sharedFieldHintClass}>{description}</span> : null}
    </label>
  );
}
