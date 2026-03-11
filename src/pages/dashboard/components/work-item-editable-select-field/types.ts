export type SelectOption = {
  value: number;
  label: string;
  className?: string;
};

export interface EditableSelectFieldProps {
  icon: React.ElementType;
  label: string;
  value: string;
  fieldPath: string;
  options: SelectOption[];
  onSave: (fieldPath: string, value: number) => void;
  isUpdating: boolean;
  valueClassName?: string;
}
