use rmcp::{
    ErrorData as McpError,
    handler::server::wrapper::Parameters,
    model::CallToolResult,
    schemars, tool, tool_router,
};
use serde::Deserialize;

use crate::azure;
use super::{RivaMcpServer, azure_error, json_result, resolve_project, resolve_team};

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

#[tool_router(router = work_items_router, vis = "pub")]
impl RivaMcpServer {
    #[tool(description = "List all Azure DevOps projects visible to the authenticated user")]
    pub(crate) async fn list_projects(&self) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let projects = azure::get_projects(&c.org_url, &c.pat).await.map_err(azure_error)?;
        json_result(&projects)
    }

    #[tool(description = "List all teams for a given Azure DevOps project. If 'project' is omitted, uses the one selected in the Riva app")]
    pub(crate) async fn list_teams(
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
    pub(crate) async fn list_boards(
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
    pub(crate) async fn list_work_items(
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
    pub(crate) async fn get_work_item(
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
    pub(crate) async fn update_work_item(
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
    pub(crate) async fn delete_work_item(
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
    pub(crate) async fn create_work_item(
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
