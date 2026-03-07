export interface EditableTitleProps {
  title: string;
  onSave: (newTitle: string) => void;
  isUpdating: boolean;
}
