import { useTranslation } from 'react-i18next';
import { Download, X } from 'lucide-react';
import { useAppUpdater } from './use-app-updater';

export function AppUpdater() {
  const { t } = useTranslation('common');
  const { status, version, showBanner, install, dismiss } = useAppUpdater();

  if (!showBanner) return null;

  const isDownloading = status === 'downloading';

  return (
    <div className="flex items-center gap-3 border-b border-accent/20 bg-accent/5 px-4 py-2">
      <Download className="size-3.5 shrink-0 text-accent" />
      <span className="flex-1 text-xs text-fg">
        {t('updater.available', { version })}
      </span>
      <button
        type="button"
        onClick={install}
        disabled={isDownloading}
        className="cursor-pointer rounded-md bg-accent px-2.5 py-1 text-[11px] font-medium text-accent-fg transition-colors hover:bg-accent/90 disabled:opacity-50"
      >
        {isDownloading ? t('updater.installing') : t('updater.install')}
      </button>
      <button
        type="button"
        onClick={dismiss}
        className="cursor-pointer rounded-md p-0.5 text-fg-muted transition-colors hover:text-fg"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
