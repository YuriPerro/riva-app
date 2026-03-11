export interface EditableNumberFieldProps {
  icon: React.ElementType;
  label: string;
  value: string | null;
  fieldPath: string;
  onSave: (fieldPath: string, value: number | null) => void;
  isUpdating: boolean;
}
