import { sharedInputClass, sharedInputLabelClass } from '@/shared/components/public-visual-system';

type SearchInputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({
  label = 'Busca',
  value,
  onChange,
  placeholder = 'Digite para buscar'
}: SearchInputProps) {
  return (
    <label className="block">
      <span className={sharedInputLabelClass}>{label}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={sharedInputClass}
      />
    </label>
  );
}
