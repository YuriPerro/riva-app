import { invoke } from '@tauri-apps/api/core';
import { TauriCommand } from '@/types/commands';
import type { McpClient, McpClientStatus, McpSnippet } from '@/types/mcp';

export const mcp = {
  getServerUrl: () => invoke<string>(TauriCommand.GetMcpServerUrl),
  setContext: (project: string | null, team: string | null) =>
    invoke<void>(TauriCommand.SetMcpContext, { project, team }),
  getClientStatus: (client: McpClient) =>
    invoke<McpClientStatus>(TauriCommand.GetMcpClientStatus, { client }),
  install: (client: McpClient) =>
    invoke<McpClientStatus>(TauriCommand.InstallMcpClient, { client }),
  uninstall: (client: McpClient) =>
    invoke<McpClientStatus>(TauriCommand.UninstallMcpClient, { client }),
  getSnippet: (client: McpClient) =>
    invoke<McpSnippet>(TauriCommand.GetMcpClientSnippet, { client }),
};
