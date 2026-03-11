export interface EditableToggleFieldProps {
  icon: React.ElementType;
  label: string;
  value: string;
  fieldPath: string;
  onSave: (fieldPath: string, value: string) => void;
  isUpdating: boolean;
}
