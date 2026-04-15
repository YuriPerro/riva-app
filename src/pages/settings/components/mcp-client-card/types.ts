import type { ReactNode } from 'react';
import type { McpClientCardConfig } from '../mcp-settings/types';

export interface McpClientCardProps {
  client: McpClientCardConfig;
  icon: ReactNode;
  installed: boolean;
  configPath: string;
  isBusy: boolean;
  isLoading: boolean;
  snippetContent: string;
  onInstall: () => void;
  onUninstall: () => void;
  onCopySnippet: () => void;
}
