import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { SunburnDialogProps } from './types';

export function SunburnDialog(props: SunburnDialogProps) {
  const { open, onConfirm, onCancel } = props;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">WAIT!</DialogTitle>
          <DialogDescription className="text-center text-sm">You really wanna do this?</DialogDescription>
        </DialogHeader>

        <p className="text-center text-sm text-fg-secondary">If yes, prepare your sunglasses</p>

        <DialogFooter className="flex-row justify-center gap-3 sm:justify-center">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm text-fg-muted transition-colors hover:bg-elevated hover:text-fg"
          >
            Nah, I'm good
          </button>
          <button
            onClick={onConfirm}
            className="cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-80"
          >
            Bring the light!
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
