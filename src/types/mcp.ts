export type McpClient = 'claude_code' | 'codex';

export type McpClientStatus = {
  client: McpClient;
  config_path: string;
  config_exists: boolean;
  riva_installed: boolean;
  riva_url: string | null;
};

export type McpSnippet = {
  language: 'json' | 'toml';
  content: string;
};
