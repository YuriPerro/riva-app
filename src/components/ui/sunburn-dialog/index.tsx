import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('settings');
  const { open, onConfirm, onCancel } = props;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">{t('sunburnDialog.title')}</DialogTitle>
          <DialogDescription className="text-center text-sm">{t('sunburnDialog.description')}</DialogDescription>
        </DialogHeader>

        <p className="text-center text-sm text-fg-secondary">{t('sunburnDialog.warning')}</p>

        <DialogFooter className="flex-row justify-center gap-3 sm:justify-center">
          <button
            onClick={onCancel}
            className="cursor-pointer rounded-md border border-border px-4 py-2 text-sm text-fg-muted transition-colors hover:bg-elevated hover:text-fg"
          >
            {t('sunburnDialog.cancel')}
          </button>
          <button
            onClick={onConfirm}
            className="cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-80"
          >
            {t('sunburnDialog.confirm')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
