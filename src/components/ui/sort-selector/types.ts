export type SortDirection = 'asc' | 'desc';

export interface SortOption<T extends string = string> {
  value: T;
  label: string;
}

export interface SortSelectorProps<T extends string = string> {
  options: SortOption<T>[];
  value: T;
  direction: SortDirection;
  onChange: (value: T, direction: SortDirection) => void;
}
