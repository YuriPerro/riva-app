import { useTranslation } from 'react-i18next';
import { Copy, Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { McpClientCard } from '../mcp-client-card';
import { McpToolsDialog } from '../mcp-tools-dialog';
import type { McpClientCardConfig } from './types';
import { useMcpSettings } from './use-mcp-settings';

const CLIENTS: McpClientCardConfig[] = [
  {
    id: 'claude_code',
    name: 'Claude Code',
    configHint: '~/.claude.json',
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    configHint: '~/.codex/config.toml',
  },
];

export function McpSettings() {
  const { t } = useTranslation(['settings', 'common']);
  const {
    serverUrl,
    status,
    snippets,
    busy,
    isLoading,
    handleInstall,
    handleUninstall,
    handleCopySnippet,
    handleCopyUrl,
  } = useMcpSettings();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Plug className="size-4 text-accent" />
          <span className="text-sm font-medium text-fg">{t('settings:mcp.title')}</span>
        </div>
        <McpToolsDialog />
      </div>
      <span className="text-xs text-fg-muted">{t('settings:mcp.description')}</span>

      <div className="flex items-center gap-2">
        <div className="flex h-9 flex-1 items-center rounded-md border border-border bg-base px-3 font-mono text-xs text-fg-muted">
          {serverUrl || '...'}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyUrl}
          disabled={!serverUrl}
          className="cursor-pointer"
        >
          <Copy className="size-3.5" />
          {t('common:actions.copy')}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {CLIENTS.map((client) => {
          const clientStatus = status[client.id];
          const snippet = snippets[client.id];
          return (
            <McpClientCard
              key={client.id}
              client={client}
              installed={clientStatus?.riva_installed ?? false}
              configPath={clientStatus?.config_path ?? client.configHint}
              isBusy={busy[client.id]}
              isLoading={isLoading}
              snippetContent={snippet?.content ?? ''}
              onInstall={() => handleInstall(client.id)}
              onUninstall={() => handleUninstall(client.id)}
              onCopySnippet={() => handleCopySnippet(client.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
