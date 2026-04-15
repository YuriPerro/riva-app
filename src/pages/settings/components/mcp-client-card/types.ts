import type { McpClientCardConfig } from '../mcp-settings/types';

export interface McpClientCardProps {
  client: McpClientCardConfig;
  installed: boolean;
  configPath: string;
  isBusy: boolean;
  isLoading: boolean;
  snippetContent: string;
  onInstall: () => void;
  onUninstall: () => void;
  onCopySnippet: () => void;
}
