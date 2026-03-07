import { Search, X } from 'lucide-react';
import { useSearchInput } from './use-search-input';
import type { SearchInputProps } from './types';

export function SearchInput(props: SearchInputProps) {
  const { value, onChange, placeholder = 'Search...' } = props;
  const { inputRef, handleChange, handleClear, hasValue } = useSearchInput(value, onChange);

  return (
    <div className="relative flex items-center">
      <Search size={13} className="absolute left-2.5 text-fg-disabled" />
      <input
        ref={inputRef}
        defaultValue={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="h-[30px] w-[220px] rounded-md border border-border bg-surface pl-8 pr-7 text-[12px] text-fg placeholder:text-fg-disabled focus:border-accent focus:outline-none"
      />
      {hasValue && (
        <button
          onClick={handleClear}
          className="absolute right-2 cursor-pointer text-fg-disabled hover:text-fg-muted"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
