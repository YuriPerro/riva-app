use std::sync::Arc;

use rmcp::{
    ErrorData as McpError, ServerHandler,
    handler::server::{router::tool::ToolRouter, wrapper::Parameters},
    model::{CallToolResult, Content, Implementation, ProtocolVersion, ServerCapabilities, ServerInfo},
    schemars, tool, tool_handler, tool_router,
    transport::streamable_http_server::{
        StreamableHttpServerConfig, StreamableHttpService,
        session::local::LocalSessionManager,
    },
};
use serde::Deserialize;
use tokio::sync::RwLock;

use crate::azure;

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

#[derive(Debug, Deserialize, schemars::JsonSchema, Default)]
pub struct ListTeamsArgs {
    #[schemars(description = "Azure DevOps project id or name. Omit to use the project currently selected in the Riva app")]
    pub project: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema, Default)]
pub struct ListBoardsArgs {
    #[schemars(description = "Azure DevOps project id or name. Omit to use the project currently selected in the Riva app")]
    pub project: Option<String>,
    #[schemars(description = "Team name. Omit to use the team currently selected in the Riva app, or the project's default team")]
    pub team: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema, Default)]
pub struct ListWorkItemsArgs {
    #[schemars(description = "Azure DevOps project id or name. Omit to use the project currently selected in the Riva app")]
    pub project: Option<String>,
    #[schemars(description = "Team name scoping area path. Omit to use the team currently selected in the Riva app")]
    pub team: Option<String>,
    #[schemars(description = "When true only returns items assigned to the authenticated user. Defaults to false")]
    pub only_mine: Option<bool>,
    #[schemars(description = "Full iteration path to filter (e.g. 'MyProject\\Sprint 12'). Optional")]
    pub iteration_path: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetWorkItemArgs {
    #[schemars(description = "Work item id (integer) to fetch")]
    pub id: u64,
    #[schemars(description = "Azure DevOps project id or name. Omit to use the project currently selected in the Riva app")]
    pub project: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct UpdateWorkItemArgs {
    #[schemars(description = "Work item id to update")]
    pub id: u64,
    #[schemars(description = "Azure DevOps project id or name. Omit to use the project currently selected in the Riva app")]
    pub project: Option<String>,
    #[schemars(description = "New title. Optional")]
    pub title: Option<String>,
    #[schemars(description = "New HTML or plain text description. Optional")]
    pub description: Option<String>,
    #[schemars(description = "New state (e.g. 'New', 'Active', 'Done'). Optional")]
    pub state: Option<String>,
    #[schemars(description = "New assignee unique name or email. Optional")]
    pub assigned_to: Option<String>,
    #[schemars(description = "New iteration path. Optional")]
    pub iteration_path: Option<String>,
    #[schemars(description = "New area path. Optional")]
    pub area_path: Option<String>,
    #[schemars(description = "Parent work item id to link as child. Optional — note: this adds a parent link, it does not replace an existing one")]
    pub parent_id: Option<u64>,
    #[schemars(description = "Replace tags. Accepts comma or semicolon-separated list. Optional")]
    pub tags: Option<String>,
    #[schemars(description = "Custom field values to update, keyed by field reference name. Example: {\"Custom.ProductAssignedto\": \"luiza.rosa@levesaude.com.br\", \"Microsoft.VSTS.Scheduling.OriginalEstimate\": 2}. Optional")]
    pub custom_fields: Option<std::collections::HashMap<String, serde_json::Value>>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct DeleteWorkItemArgs {
    #[schemars(description = "Work item id to delete (moves to recycle bin)")]
    pub id: u64,
    #[schemars(description = "Azure DevOps project id or name. Omit to use the project currently selected in the Riva app")]
    pub project: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct CreateWorkItemArgs {
    #[schemars(description = "Work item type. Common values: 'Task', 'Product Backlog Item', 'Bug', 'User Story', 'Feature'")]
    pub work_item_type: String,
    #[schemars(description = "Work item title")]
    pub title: String,
    #[schemars(description = "Azure DevOps project id or name. Omit to use the project currently selected in the Riva app")]
    pub project: Option<String>,
    #[schemars(description = "HTML or plain text description. Optional")]
    pub description: Option<String>,
    #[schemars(description = "Assignee unique name or email. Optional")]
    pub assigned_to: Option<String>,
    #[schemars(description = "Full iteration path (e.g. 'MyProject\\Sprint 12'). Optional")]
    pub iteration_path: Option<String>,
    #[schemars(description = "Full area path. Optional")]
    pub area_path: Option<String>,
    #[schemars(description = "Parent work item id to link as child. Optional")]
    pub parent_id: Option<u64>,
    #[schemars(description = "Tags to apply. Accepts comma or semicolon-separated list (e.g. 'LAB, Urgent'). Optional")]
    pub tags: Option<String>,
    #[schemars(description = "Custom field values keyed by field reference name. Example: {\"Custom.ProjectName\": \"Levinho IA\", \"Custom.DevArea\": \"AI\"}. Values can be strings, numbers, booleans, or null. Optional")]
    pub custom_fields: Option<std::collections::HashMap<String, serde_json::Value>>,
}

#[derive(Clone)]
pub struct RivaMcpServer {
    creds: McpCredentialStore,
    tool_router: ToolRouter<RivaMcpServer>,
}

fn json_result<T: serde::Serialize>(value: &T) -> Result<CallToolResult, McpError> {
    let text = serde_json::to_string_pretty(value)
        .map_err(|e| McpError::internal_error(e.to_string(), None))?;
    Ok(CallToolResult::success(vec![Content::text(text)]))
}

fn azure_error(e: String) -> McpError {
    McpError::internal_error(format!("Azure DevOps request failed: {}", e), None)
}

async fn resolve_project(
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

async fn resolve_team(
    store: &McpCredentialStore,
    explicit: Option<String>,
) -> Option<String> {
    if let Some(t) = explicit.filter(|s| !s.trim().is_empty()) {
        return Some(t);
    }
    store.selection().await.team
}

#[tool_router]
impl RivaMcpServer {
    pub fn new(creds: McpCredentialStore) -> Self {
        Self { creds, tool_router: Self::tool_router() }
    }

    #[tool(description = "List all Azure DevOps projects visible to the authenticated user")]
    async fn list_projects(&self) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let projects = azure::get_projects(&c.org_url, &c.pat).await.map_err(azure_error)?;
        json_result(&projects)
    }

    #[tool(description = "List all teams for a given Azure DevOps project. If 'project' is omitted, uses the one selected in the Riva app")]
    async fn list_teams(
        &self,
        Parameters(args): Parameters<ListTeamsArgs>,
    ) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let project = resolve_project(&self.creds, args.project).await?;
        let teams = azure::get_teams(&c.org_url, &c.pat, &project)
            .await
            .map_err(azure_error)?;
        json_result(&teams)
    }

    #[tool(description = "List sprints/iterations (the 'boards') for a project or specific team. Falls back to the project/team selected in the Riva app")]
    async fn list_boards(
        &self,
        Parameters(args): Parameters<ListBoardsArgs>,
    ) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let project = resolve_project(&self.creds, args.project).await?;
        let team = resolve_team(&self.creds, args.team).await;
        let sprints = azure::get_sprints(&c.org_url, &c.pat, &project, team.as_deref())
            .await
            .map_err(azure_error)?;
        json_result(&sprints)
    }

    #[tool(description = "List work items (PBIs, Tasks, Bugs) for a project. Filter by team, iteration, or assignment. Falls back to the project/team selected in the Riva app")]
    async fn list_work_items(
        &self,
        Parameters(args): Parameters<ListWorkItemsArgs>,
    ) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let project = resolve_project(&self.creds, args.project).await?;
        let team = resolve_team(&self.creds, args.team).await;
        let items = azure::get_my_work_items(
            &c.org_url,
            &c.pat,
            &project,
            team.as_deref(),
            args.only_mine.unwrap_or(false),
            args.iteration_path.as_deref(),
        )
        .await
        .map_err(azure_error)?;
        json_result(&items)
    }

    #[tool(description = "Fetch a single work item by its numeric id, including full fields and relations. Falls back to the project selected in the Riva app")]
    async fn get_work_item(
        &self,
        Parameters(args): Parameters<GetWorkItemArgs>,
    ) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let project = resolve_project(&self.creds, args.project).await?;
        let item = azure::get_work_item_detail(&c.org_url, &c.pat, &project, args.id)
            .await
            .map_err(azure_error)?;
        json_result(&item)
    }

    #[tool(description = "Update an existing work item by id. Only fields provided are changed; others are left untouched. Falls back to the project selected in the Riva app")]
    async fn update_work_item(
        &self,
        Parameters(args): Parameters<UpdateWorkItemArgs>,
    ) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let project = resolve_project(&self.creds, args.project).await?;
        let item = azure::update_work_item(
            &c.org_url,
            &c.pat,
            &project,
            args.id,
            args.title.as_deref(),
            args.description.as_deref(),
            args.state.as_deref(),
            args.assigned_to.as_deref(),
            args.iteration_path.as_deref(),
            args.area_path.as_deref(),
            args.parent_id,
            args.tags.as_deref(),
            args.custom_fields.as_ref(),
        )
        .await
        .map_err(azure_error)?;
        json_result(&item)
    }

    #[tool(description = "Delete a work item by id (moves it to the Azure DevOps recycle bin). Falls back to the project selected in the Riva app")]
    async fn delete_work_item(
        &self,
        Parameters(args): Parameters<DeleteWorkItemArgs>,
    ) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let project = resolve_project(&self.creds, args.project).await?;
        azure::delete_work_item(&c.org_url, &c.pat, &project, args.id)
            .await
            .map_err(azure_error)?;
        json_result(&serde_json::json!({ "ok": true, "id": args.id }))
    }

    #[tool(description = "Create a new work item (Task, PBI, Bug, etc.) in an Azure DevOps project. Falls back to the project selected in the Riva app")]
    async fn create_work_item(
        &self,
        Parameters(args): Parameters<CreateWorkItemArgs>,
    ) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let project = resolve_project(&self.creds, args.project).await?;
        let item = azure::create_work_item(
            &c.org_url,
            &c.pat,
            &project,
            &args.work_item_type,
            &args.title,
            args.description.as_deref(),
            args.assigned_to.as_deref(),
            args.iteration_path.as_deref(),
            args.area_path.as_deref(),
            args.parent_id,
            args.tags.as_deref(),
            args.custom_fields.as_ref(),
        )
        .await
        .map_err(azure_error)?;
        json_result(&item)
    }
}

#[tool_handler]
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
