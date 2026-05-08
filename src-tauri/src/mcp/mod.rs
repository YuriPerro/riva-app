use std::sync::Arc;

use rmcp::{
    ErrorData as McpError, ServerHandler,
    handler::server::router::tool::ToolRouter,
    model::{CallToolResult, Content, Implementation, ProtocolVersion, ServerCapabilities, ServerInfo},
    tool_handler, tool_router,
    transport::streamable_http_server::{
        StreamableHttpServerConfig, StreamableHttpService,
        session::local::LocalSessionManager,
    },
};
use tokio::sync::RwLock;

mod work_items;

#[derive(Clone)]
pub struct McpCredentials {
    pub org_url: String,
    pub pat: String,
}

#[derive(Clone, Default)]
pub struct McpSelection {
    pub project: Option<String>,
    pub team: Option<String>,
}

#[derive(Clone, Default)]
pub struct McpCredentialStore {
    credentials: Arc<RwLock<Option<McpCredentials>>>,
    selection: Arc<RwLock<McpSelection>>,
}

impl McpCredentialStore {
    pub fn new() -> Self {
        Self {
            credentials: Arc::new(RwLock::new(None)),
            selection: Arc::new(RwLock::new(McpSelection::default())),
        }
    }

    pub async fn set(&self, creds: McpCredentials) {
        *self.credentials.write().await = Some(creds);
    }

    pub async fn clear(&self) {
        *self.credentials.write().await = None;
        *self.selection.write().await = McpSelection::default();
    }

    pub async fn set_selection(&self, project: Option<String>, team: Option<String>) {
        *self.selection.write().await = McpSelection { project, team };
    }

    pub async fn get(&self) -> Result<McpCredentials, McpError> {
        self.credentials
            .read()
            .await
            .clone()
            .ok_or_else(|| McpError::invalid_request(
                "No Azure DevOps credentials configured in Riva. Sign in through the Riva app first.",
                None,
            ))
    }

    pub async fn selection(&self) -> McpSelection {
        self.selection.read().await.clone()
    }
}

#[derive(Clone)]
pub struct RivaMcpServer {
    pub(super) creds: McpCredentialStore,
    tool_router: ToolRouter<RivaMcpServer>,
}

pub(super) fn json_result<T: serde::Serialize>(value: &T) -> Result<CallToolResult, McpError> {
    let text = serde_json::to_string_pretty(value)
        .map_err(|e| McpError::internal_error(e.to_string(), None))?;
    Ok(CallToolResult::success(vec![Content::text(text)]))
}

pub(super) fn azure_error(e: String) -> McpError {
    McpError::internal_error(format!("Azure DevOps request failed: {}", e), None)
}

pub(super) async fn resolve_project(
    store: &McpCredentialStore,
    explicit: Option<String>,
) -> Result<String, McpError> {
    if let Some(p) = explicit.filter(|s| !s.trim().is_empty()) {
        return Ok(p);
    }
    store
        .selection()
        .await
        .project
        .ok_or_else(|| McpError::invalid_request(
            "No project provided and no project is currently selected in the Riva app. \
             Either pass `project` explicitly or select one in Riva.",
            None,
        ))
}

pub(super) async fn resolve_team(
    store: &McpCredentialStore,
    explicit: Option<String>,
) -> Option<String> {
    if let Some(t) = explicit.filter(|s| !s.trim().is_empty()) {
        return Some(t);
    }
    store.selection().await.team
}

#[tool_router(router = core_router, vis = "pub")]
impl RivaMcpServer {
    pub fn new(creds: McpCredentialStore) -> Self {
        Self {
            creds,
            tool_router: Self::core_router() + Self::work_items_router(),
        }
    }
}

#[tool_handler(router = self.tool_router)]
impl ServerHandler for RivaMcpServer {
    fn get_info(&self) -> ServerInfo {
        let mut info = ServerInfo::default();
        info.protocol_version = ProtocolVersion::V_2024_11_05;
        info.capabilities = ServerCapabilities::builder().enable_tools().build();
        info.server_info = Implementation::new("riva-mcp", env!("CARGO_PKG_VERSION"));
        info.instructions = Some(
            "Riva MCP — exposes Azure DevOps project, board, and work item operations \
             using credentials configured inside the Riva desktop app. \
             Available tools: list_projects, list_teams, list_boards, list_work_items, get_work_item, create_work_item, update_work_item, delete_work_item."
                .to_string(),
        );
        info
    }
}

#[derive(Debug, serde::Serialize)]
pub struct McpToolInfo {
    pub name: String,
    pub description: Option<String>,
    pub input_schema: serde_json::Value,
}

pub fn list_tools() -> Vec<McpToolInfo> {
    let server = RivaMcpServer::new(McpCredentialStore::new());
    server
        .tool_router
        .list_all()
        .into_iter()
        .map(|tool| McpToolInfo {
            name: tool.name.into_owned(),
            description: tool.description.map(|d| d.into_owned()),
            input_schema: serde_json::Value::Object((*tool.input_schema).clone()),
        })
        .collect()
}

pub async fn run_server(creds: McpCredentialStore, addr: &str) -> anyhow::Result<()> {
    let server = RivaMcpServer::new(creds);
    let service = StreamableHttpService::new(
        move || Ok(server.clone()),
        LocalSessionManager::default().into(),
        StreamableHttpServerConfig::default(),
    );

    let router = axum::Router::new().nest_service("/mcp", service);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, router).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn list_tools_returns_expected_names() {
        let names: Vec<String> = list_tools().into_iter().map(|t| t.name).collect();
        let expected = [
            "list_projects",
            "list_teams",
            "list_boards",
            "list_work_items",
            "get_work_item",
            "create_work_item",
            "update_work_item",
            "delete_work_item",
        ];
        for name in expected {
            assert!(names.contains(&name.to_string()), "missing tool: {}", name);
        }
        assert_eq!(names.len(), expected.len(), "unexpected tool count: {:?}", names);
    }
}
