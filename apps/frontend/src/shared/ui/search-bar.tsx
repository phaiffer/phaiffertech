import { SearchInput } from '@/shared/ui/search-input';

type SearchBarProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchBar(props: SearchBarProps) {
  return <SearchInput {...props} />;
}
