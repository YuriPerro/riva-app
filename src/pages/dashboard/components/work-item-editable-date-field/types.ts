export interface EditableDateFieldProps {
  icon: React.ElementType;
  label: string;
  value: string | null;
  fieldPath: string;
  onSave: (fieldPath: string, value: string | null) => void;
  isUpdating: boolean;
}
