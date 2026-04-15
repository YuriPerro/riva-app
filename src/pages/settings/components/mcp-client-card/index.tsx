import { useTranslation } from 'react-i18next';
import { Check, Copy, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { McpClientCardProps } from './types';

export function McpClientCard(props: McpClientCardProps) {
  const {
    client,
    installed,
    configPath,
    isBusy,
    isLoading,
    snippetContent,
    onInstall,
    onUninstall,
    onCopySnippet,
  } = props;
  const { t } = useTranslation(['settings', 'common']);

  return (
    <div className="flex flex-col gap-3 rounded-md border border-border-subtle bg-base p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-fg">{client.name}</span>
        {isLoading && (
          <Badge variant="outline" className="text-xs">
            {t('common:actions.loading')}
          </Badge>
        )}
        {!isLoading && installed && (
          <Badge className="gap-1 border-success/30 bg-success/15 text-success">
            <Check className="size-3" />
            {t('settings:mcp.installed')}
          </Badge>
        )}
        {!isLoading && !installed && (
          <Badge variant="outline" className="text-xs">
            {t('settings:mcp.notInstalled')}
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wide text-fg-muted">
          {t('settings:mcp.configPath')}
        </span>
        <code className="truncate rounded-sm bg-surface px-2 py-1 text-[11px] text-fg-secondary">
          {configPath}
        </code>
      </div>

      <div className="flex items-center gap-2">
        {installed ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onUninstall}
            disabled={isBusy}
            className="flex-1 cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            {isBusy ? t('common:actions.removing') : t('settings:mcp.uninstall')}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={onInstall}
            disabled={isBusy}
            className="flex-1 cursor-pointer"
          >
            <Download className="size-3.5" />
            {isBusy ? t('common:actions.saving') : t('settings:mcp.install')}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onCopySnippet}
          disabled={!snippetContent}
          className="cursor-pointer"
        >
          <Copy className="size-3.5" />
          {t('settings:mcp.copySnippet')}
        </Button>
      </div>
    </div>
  );
}
