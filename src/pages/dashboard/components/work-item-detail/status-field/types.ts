export interface StatusFieldProps {
  currentState: string;
  states: { name: string; color: string; category: string }[];
  isUpdating: boolean;
  onSelect: (state: string) => void;
}
