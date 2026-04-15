use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use toml_edit::{value, DocumentMut, Item, Table};

pub const RIVA_SERVER_NAME: &str = "riva";

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum McpClient {
    ClaudeCode,
    Codex,
}

#[derive(Debug, Serialize)]
pub struct McpClientStatus {
    pub client: McpClient,
    pub config_path: String,
    pub config_exists: bool,
    pub riva_installed: bool,
    pub riva_url: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct McpSnippet {
    pub language: &'static str,
    pub content: String,
}

fn home_dir() -> Result<PathBuf, String> {
    std::env::var_os("HOME")
        .or_else(|| std::env::var_os("USERPROFILE"))
        .map(PathBuf::from)
        .ok_or_else(|| "Could not determine home directory".to_string())
}

fn claude_config_path() -> Result<PathBuf, String> {
    Ok(home_dir()?.join(".claude.json"))
}

fn codex_config_path() -> Result<PathBuf, String> {
    Ok(home_dir()?.join(".codex").join("config.toml"))
}

fn config_path_for(client: McpClient) -> Result<PathBuf, String> {
    match client {
        McpClient::ClaudeCode => claude_config_path(),
        McpClient::Codex => codex_config_path(),
    }
}

fn read_claude_config(path: &PathBuf) -> Result<serde_json::Value, String> {
    if !path.exists() {
        return Ok(serde_json::json!({}));
    }
    let content = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    if content.trim().is_empty() {
        return Ok(serde_json::json!({}));
    }
    serde_json::from_str::<serde_json::Value>(&content).map_err(|e| e.to_string())
}

fn write_claude_config(path: &PathBuf, value: &serde_json::Value) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let body = serde_json::to_string_pretty(value).map_err(|e| e.to_string())?;
    std::fs::write(path, body).map_err(|e| e.to_string())
}

fn read_codex_config(path: &PathBuf) -> Result<DocumentMut, String> {
    if !path.exists() {
        return Ok(DocumentMut::new());
    }
    let content = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
    content.parse::<DocumentMut>().map_err(|e| e.to_string())
}

fn write_codex_config(path: &PathBuf, doc: &DocumentMut) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(path, doc.to_string()).map_err(|e| e.to_string())
}

pub fn get_status(client: McpClient, server_url: &str) -> Result<McpClientStatus, String> {
    let path = config_path_for(client)?;
    let path_str = path.to_string_lossy().to_string();

    if !path.exists() {
        return Ok(McpClientStatus {
            client,
            config_path: path_str,
            config_exists: false,
            riva_installed: false,
            riva_url: None,
        });
    }

    let (riva_installed, riva_url) = match client {
        McpClient::ClaudeCode => {
            let json = read_claude_config(&path).unwrap_or(serde_json::json!({}));
            let entry = json
                .get("mcpServers")
                .and_then(|m| m.get(RIVA_SERVER_NAME))
                .cloned();
            let url = entry
                .as_ref()
                .and_then(|e| e.get("url"))
                .and_then(|u| u.as_str())
                .map(String::from);
            (entry.is_some(), url)
        }
        McpClient::Codex => {
            let doc = read_codex_config(&path).unwrap_or_default();
            let entry = doc
                .get("mcp_servers")
                .and_then(|m| m.as_table())
                .and_then(|t| t.get(RIVA_SERVER_NAME));
            let url = entry
                .and_then(|e| e.as_table_like())
                .and_then(|t| t.get("url"))
                .and_then(|u| u.as_str())
                .map(String::from);
            (entry.is_some(), url)
        }
    };

    let desired_url = server_url.to_string();
    let _ = desired_url;

    Ok(McpClientStatus {
        client,
        config_path: path_str,
        config_exists: true,
        riva_installed,
        riva_url,
    })
}

pub fn install(client: McpClient, server_url: &str) -> Result<McpClientStatus, String> {
    let path = config_path_for(client)?;

    match client {
        McpClient::ClaudeCode => {
            let mut json = read_claude_config(&path)?;
            let root = json
                .as_object_mut()
                .ok_or_else(|| "Claude config root is not an object".to_string())?;
            let servers = root
                .entry("mcpServers")
                .or_insert_with(|| serde_json::json!({}));
            let servers_obj = servers
                .as_object_mut()
                .ok_or_else(|| "mcpServers is not an object".to_string())?;
            servers_obj.insert(
                RIVA_SERVER_NAME.to_string(),
                serde_json::json!({
                    "type": "http",
                    "url": server_url,
                }),
            );
            write_claude_config(&path, &json)?;
        }
        McpClient::Codex => {
            let mut doc = read_codex_config(&path)?;
            if doc.get("mcp_servers").is_none() {
                doc.insert("mcp_servers", Item::Table(Table::new()));
            }
            let servers = doc["mcp_servers"]
                .as_table_mut()
                .ok_or_else(|| "mcp_servers is not a table".to_string())?;
            servers.set_implicit(true);
            let mut riva_table = Table::new();
            riva_table.insert("url", value(server_url));
            servers.insert(RIVA_SERVER_NAME, Item::Table(riva_table));
            write_codex_config(&path, &doc)?;
        }
    }

    get_status(client, server_url)
}

pub fn uninstall(client: McpClient, server_url: &str) -> Result<McpClientStatus, String> {
    let path = config_path_for(client)?;

    if path.exists() {
        match client {
            McpClient::ClaudeCode => {
                let mut json = read_claude_config(&path)?;
                if let Some(servers) = json
                    .get_mut("mcpServers")
                    .and_then(|v| v.as_object_mut())
                {
                    servers.remove(RIVA_SERVER_NAME);
                }
                write_claude_config(&path, &json)?;
            }
            McpClient::Codex => {
                let mut doc = read_codex_config(&path)?;
                if let Some(servers) = doc.get_mut("mcp_servers").and_then(|i| i.as_table_mut()) {
                    servers.remove(RIVA_SERVER_NAME);
                    if servers.is_empty() {
                        doc.remove("mcp_servers");
                    }
                }
                write_codex_config(&path, &doc)?;
            }
        }
    }

    get_status(client, server_url)
}

pub fn snippet(client: McpClient, server_url: &str) -> McpSnippet {
    match client {
        McpClient::ClaudeCode => McpSnippet {
            language: "json",
            content: format!(
                "{{\n  \"mcpServers\": {{\n    \"{name}\": {{\n      \"type\": \"http\",\n      \"url\": \"{url}\"\n    }}\n  }}\n}}",
                name = RIVA_SERVER_NAME,
                url = server_url,
            ),
        },
        McpClient::Codex => McpSnippet {
            language: "toml",
            content: format!(
                "[mcp_servers.{name}]\nurl = \"{url}\"\n",
                name = RIVA_SERVER_NAME,
                url = server_url,
            ),
        },
    }
}
