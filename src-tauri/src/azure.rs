use std::collections::HashSet;
use base64::{engine::general_purpose::STANDARD, Engine};
use reqwest::{Client, header};
use serde::{Deserialize, Serialize};

// ============================================================
// URL helpers
// ============================================================

/// Percent-encode path segment characters that would break URL parsing.
fn encode_path_segment(s: &str) -> String {
    s.replace('%', "%25")
        .replace(' ', "%20")
        .replace('#', "%23")
        .replace('?', "%3F")
        .replace('&', "%26")
        .replace('+', "%2B")
}

// ============================================================
// Auth helper
// ============================================================

fn basic_auth_header(pat: &str) -> String {
    let encoded = STANDARD.encode(format!(":{}", pat));
    format!("Basic {}", encoded)
}

fn build_client(pat: &str) -> Result<Client, String> {
    let mut headers = header::HeaderMap::new();
    headers.insert(
        header::AUTHORIZATION,
        header::HeaderValue::from_str(&basic_auth_header(pat))
            .map_err(|e| e.to_string())?,
    );
    headers.insert(
        header::ACCEPT,
        header::HeaderValue::from_static("application/json"),
    );

    Client::builder()
        .default_headers(headers)
        .build()
        .map_err(|e| e.to_string())
}

async fn api_error(resp: reqwest::Response) -> String {
    let status = resp.status();
    let body = resp.text().await.unwrap_or_default();

    serde_json::from_str::<serde_json::Value>(&body)
        .ok()
        .and_then(|v| v["message"].as_str().map(String::from))
        .unwrap_or_else(|| match status.as_u16() {
            401 => "Unauthorized — check your PAT permissions".into(),
            403 => "Access denied — check your PAT permissions".into(),
            404 => "Resource not found".into(),
            _ => format!("Request failed (HTTP {status})"),
        })
}

// ============================================================
// Response types
// ============================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ProjectsResponse {
    pub value: Vec<Project>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkItemRef {
    pub id: u64,
    pub url: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct WiqlResponse {
    #[serde(rename = "workItems")]
    pub work_items: Vec<WorkItemRef>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WorkItemFields {
    #[serde(rename = "System.Title")]
    pub title: String,
    #[serde(rename = "System.WorkItemType")]
    pub work_item_type: String,
    #[serde(rename = "System.State")]
    pub state: String,
    #[serde(rename = "System.AssignedTo", default)]
    pub assigned_to: Option<serde_json::Value>,
    #[serde(rename = "System.IterationPath", default)]
    pub iteration_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkItem {
    pub id: u64,
    pub fields: WorkItemFields,
    /// Web browser URL for this work item — computed after deserialization.
    #[serde(rename = "webUrl", default, skip_deserializing)]
    pub web_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct WorkItemsBatchResponse {
    pub value: Vec<WorkItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PipelineRun {
    pub id: u64,
    #[serde(rename = "buildNumber")]
    pub build_number: String,
    pub status: String,
    pub result: Option<String>,
    #[serde(rename = "sourceBranch")]
    pub source_branch: String,
    #[serde(rename = "finishTime")]
    pub finish_time: Option<String>,
    #[serde(rename = "queueTime")]
    pub queue_time: Option<String>,
    pub definition: PipelineDefinition,
    #[serde(rename = "triggerInfo", default)]
    pub trigger_info: Option<std::collections::HashMap<String, String>>,
    /// Web browser URL for this build — computed after deserialization.
    #[serde(rename = "webUrl", default, skip_deserializing)]
    pub web_url: String,
}

// ============================================================
// Pull Request types
// ============================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct PullRequestIdentity {
    #[serde(rename = "displayName")]
    pub display_name: String,
    #[serde(rename = "uniqueName", default)]
    pub unique_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PullRequestReviewer {
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub vote: i32,
    #[serde(rename = "isRequired", default)]
    pub is_required: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PullRequestRepository {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PullRequest {
    #[serde(rename = "pullRequestId")]
    pub pull_request_id: u64,
    pub title: String,
    #[serde(rename = "sourceRefName")]
    pub source_ref_name: String,
    #[serde(rename = "targetRefName")]
    pub target_ref_name: String,
    #[serde(rename = "createdBy")]
    pub created_by: PullRequestIdentity,
    #[serde(rename = "creationDate")]
    pub creation_date: String,
    pub status: String,
    pub repository: PullRequestRepository,
    #[serde(rename = "isDraft", default)]
    pub is_draft: bool,
    #[serde(default)]
    pub reviewers: Vec<PullRequestReviewer>,
    /// Web browser URL — computed after deserialization.
    #[serde(rename = "webUrl", default, skip_deserializing)]
    pub web_url: String,
}

#[derive(Debug, Deserialize)]
struct PullRequestsResponse {
    pub value: Vec<PullRequest>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PipelineDefinition {
    pub id: u64,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct BuildsResponse {
    pub value: Vec<PipelineRun>,
}

#[derive(Debug, Serialize, Deserialize)]
struct DefinitionsResponse {
    pub value: Vec<PipelineDefinition>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SprintIteration {
    pub id: String,
    pub name: String,
    pub path: String,
    pub attributes: SprintAttributes,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SprintAttributes {
    #[serde(rename = "startDate")]
    pub start_date: Option<String>,
    #[serde(rename = "finishDate")]
    pub finish_date: Option<String>,
    #[serde(rename = "timeFrame")]
    pub time_frame: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct SprintResponse {
    pub value: Vec<SprintIteration>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Team {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct TeamsListResponse {
    pub value: Vec<Team>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WorkItemDetailFields {
    #[serde(rename = "System.Title")]
    pub title: String,
    #[serde(rename = "System.WorkItemType")]
    pub work_item_type: String,
    #[serde(rename = "System.State")]
    pub state: String,
    #[serde(rename = "System.AssignedTo", default)]
    pub assigned_to: Option<serde_json::Value>,
    #[serde(rename = "System.IterationPath", default)]
    pub iteration_path: Option<String>,
    #[serde(rename = "System.Description", default)]
    pub description: Option<String>,
    #[serde(rename = "System.CreatedDate", default)]
    pub created_date: Option<String>,
    #[serde(rename = "System.ChangedDate", default)]
    pub changed_date: Option<String>,
    #[serde(rename = "System.CreatedBy", default)]
    pub created_by: Option<serde_json::Value>,
    #[serde(rename = "System.Tags", default)]
    pub tags: Option<String>,
    #[serde(rename = "Microsoft.VSTS.Common.Priority", default)]
    pub priority: Option<u32>,
    #[serde(rename = "Microsoft.VSTS.Scheduling.RemainingWork", default)]
    pub remaining_work: Option<f64>,
    #[serde(rename = "Microsoft.VSTS.Scheduling.CompletedWork", default)]
    pub completed_work: Option<f64>,
    #[serde(rename = "Microsoft.VSTS.Scheduling.Effort", default)]
    pub effort: Option<f64>,
    #[serde(rename = "Microsoft.VSTS.Scheduling.DueDate", default)]
    pub due_date: Option<String>,
    #[serde(rename = "Microsoft.VSTS.Scheduling.StartDate", default)]
    pub start_date: Option<String>,
    #[serde(rename = "Microsoft.VSTS.Scheduling.FinishDate", default)]
    pub finish_date: Option<String>,
    #[serde(rename = "Microsoft.VSTS.CMMI.Blocked", default)]
    pub blocked: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkItemDetail {
    pub id: u64,
    pub fields: WorkItemDetailFields,
    #[serde(rename = "webUrl", default, skip_deserializing)]
    pub web_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkItemTypeState {
    pub name: String,
    pub color: String,
    pub category: String,
}

#[derive(Debug, Deserialize)]
struct WorkItemTypeStatesResponse {
    value: Vec<WorkItemTypeState>,
}

// ============================================================
// API calls
// ============================================================

/// Verify credentials and return the list of projects
pub async fn get_projects(org_url: &str, pat: &str) -> Result<Vec<Project>, String> {
    let client = build_client(pat)?;
    let url = format!("{}/_apis/projects?api-version=7.1", org_url.trim_end_matches('/'));

    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }

    resp.json::<ProjectsResponse>()
        .await
        .map(|r| r.value)
        .map_err(|e| e.to_string())
}

/// Fetch the team's default area path from `teamfieldvalues`.
/// Returns `None` on any failure so callers can safely fall back.
async fn get_team_area_path(
    client: &Client,
    base: &str,
    project: &str,
    team: &str,
) -> Option<String> {
    #[derive(Deserialize)]
    struct FieldValuesResponse {
        #[serde(rename = "defaultValue")]
        default_value: String,
    }

    let url = format!(
        "{}/{}/{}/_apis/work/teamsettings/teamfieldvalues?api-version=7.1",
        base,
        encode_path_segment(project),
        encode_path_segment(team),
    );

    let resp = client.get(&url).send().await.ok()?;
    if !resp.status().is_success() {
        return None;
    }
    resp.json::<FieldValuesResponse>().await.ok().map(|r| r.default_value)
}

/// Get work items assigned to the current user in a project.
///
/// When `team` is provided the team's area path is fetched first and injected
/// as a literal `UNDER` clause so results are scoped to that team's areas.
pub async fn get_my_work_items(
    org_url: &str,
    pat: &str,
    project: &str,
    team: Option<&str>,
) -> Result<Vec<WorkItem>, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let enc_project = encode_path_segment(project);

    // Build the WIQL query, optionally injecting an area-path filter
    let wiql_query = if let Some(t) = team {
        match get_team_area_path(&client, base, project, t).await {
            Some(area_path) => format!(
                "SELECT [System.Id] FROM WorkItems \
                 WHERE [System.TeamProject] = @project \
                 AND [System.AssignedTo] = @Me \
                 AND [System.AreaPath] UNDER '{}' \
                 AND [System.State] NOT IN ('Done', 'Closed', 'Resolved') \
                 ORDER BY [System.ChangedDate] DESC",
                area_path
            ),
            // Area path lookup failed — fall back to project-wide query
            None => "SELECT [System.Id] FROM WorkItems \
                     WHERE [System.TeamProject] = @project \
                     AND [System.AssignedTo] = @Me \
                     AND [System.State] NOT IN ('Done', 'Closed', 'Resolved') \
                     ORDER BY [System.ChangedDate] DESC"
                .to_string(),
        }
    } else {
        "SELECT [System.Id] FROM WorkItems \
         WHERE [System.TeamProject] = @project \
         AND [System.AssignedTo] = @Me \
         AND [System.State] NOT IN ('Done', 'Closed', 'Resolved') \
         ORDER BY [System.ChangedDate] DESC"
            .to_string()
    };

    let wiql_url = format!("{}/{}/_apis/wit/wiql?api-version=7.1&$top=100", base, enc_project);
    let wiql = serde_json::json!({ "query": wiql_query });
    let wiql_resp = client
        .post(&wiql_url)
        .json(&wiql)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let wiql_status = wiql_resp.status();
    if !wiql_status.is_success() {
        return Err(format!("WIQL query failed: {}", wiql_status));
    }

    let refs: WiqlResponse = wiql_resp.json().await.map_err(|e| e.to_string())?;
    if refs.work_items.is_empty() {
        return Ok(vec![]);
    }

    // Batch fetch work item details (up to 50 items)
    let ids: Vec<String> = refs.work_items.iter().take(50).map(|w| w.id.to_string()).collect();
    let ids_str = ids.join(",");
    let fields = "System.Title,System.WorkItemType,System.State,System.AssignedTo,System.IterationPath";
    let batch_url = format!(
        "{}/{}/_apis/wit/workitems?ids={}&fields={}&api-version=7.1",
        base, project, ids_str, fields
    );

    let batch_resp = client
        .get(&batch_url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let mut items = batch_resp
        .json::<WorkItemsBatchResponse>()
        .await
        .map(|r| r.value)
        .map_err(|e| e.to_string())?;

    // Attach web URLs
    for item in &mut items {
        item.web_url = format!("{}/{}/_workitems/edit/{}", base, project, item.id);
    }
    Ok(items)
}

/// Get the most recent pipeline runs for a project.
///
/// When `team_id` (a team GUID) is provided it is forwarded to the builds API
/// as `teamId` so only builds queued in that team's context are returned.
pub async fn get_recent_pipelines(
    org_url: &str,
    pat: &str,
    project: &str,
    team_id: Option<&str>,
) -> Result<Vec<PipelineRun>, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let mut url = format!(
        "{}/{}/_apis/build/builds?$top=200&maxBuildsPerDefinition=5&queryOrder=queueTimeDescending&api-version=7.1",
        base, project
    );
    if let Some(tid) = team_id {
        url.push_str(&format!("&teamId={}", tid));
    }

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }

    let mut runs = resp
        .json::<BuildsResponse>()
        .await
        .map(|r| r.value)
        .map_err(|e| e.to_string())?;

    // Attach web URLs
    for run in &mut runs {
        run.web_url = format!(
            "{}/{}/_build/results?buildId={}&view=results",
            base, project, run.id
        );
    }
    Ok(runs)
}

pub async fn get_pipeline_definitions(
    org_url: &str,
    pat: &str,
    project: &str,
) -> Result<Vec<PipelineDefinition>, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let url = format!(
        "{}/{}/_apis/build/definitions?api-version=7.1",
        base, project
    );

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }

    resp.json::<DefinitionsResponse>()
        .await
        .map(|r| r.value)
        .map_err(|e| e.to_string())
}

/// Get active pull requests for a project.
/// PRs are repo-scoped, not team-scoped — returns all active PRs in the project.
pub async fn get_pull_requests(
    org_url: &str,
    pat: &str,
    project: &str,
) -> Result<Vec<PullRequest>, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let url = format!(
        "{}/{}/_apis/git/pullrequests?searchCriteria.status=active&$top=50&api-version=7.1",
        base, project
    );

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }

    let mut prs = resp
        .json::<PullRequestsResponse>()
        .await
        .map(|r| r.value)
        .map_err(|e| e.to_string())?;

    // Attach web URLs
    for pr in &mut prs {
        pr.web_url = format!(
            "{}/{}/_git/{}/pullrequest/{}",
            base, project, pr.repository.name, pr.pull_request_id
        );
    }

    Ok(prs)
}

/// Get all teams for a project.
pub async fn get_teams(
    org_url: &str,
    pat: &str,
    project: &str,
) -> Result<Vec<Team>, String> {
    let client = build_client(pat)?;
    let url = format!(
        "{}/_apis/projects/{}/teams?api-version=7.1",
        org_url.trim_end_matches('/'),
        encode_path_segment(project)
    );

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }

    resp.json::<TeamsListResponse>()
        .await
        .map(|r| r.value)
        .map_err(|e| e.to_string())
}

/// Get the current sprint for a project.
///
/// If `team` is provided the request goes directly to that team's endpoint.
/// Otherwise we try the implicit default-team path first, then fall back to
/// enumerating all teams via `/_apis/projects/{project}/teams`.
pub async fn get_current_sprint(
    org_url: &str,
    pat: &str,
    project: &str,
    team: Option<&str>,
) -> Result<Option<SprintIteration>, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let enc_project = encode_path_segment(project);

    // ── Fast path: specific team provided by the caller ─────────────────────
    if let Some(team_name) = team {
        let enc_team = encode_path_segment(team_name);
        let url = format!(
            "{}/{}/{}/_apis/work/teamsettings/iterations?$timeframe=current&api-version=7.1",
            base, enc_project, enc_team
        );
        let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
        if resp.status().is_success() {
            let sprints: SprintResponse = resp.json().await.map_err(|e| e.to_string())?;
            return Ok(sprints.value.into_iter().next());
        }
        return Ok(None);
    }

    // ── Attempt 1: implicit default team ────────────────────────────────────
    let url = format!(
        "{}/{}/_apis/work/teamsettings/iterations?$timeframe=current&api-version=7.1",
        base, enc_project
    );
    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if resp.status().is_success() {
        let sprints: SprintResponse = resp.json().await.map_err(|e| e.to_string())?;
        if let Some(s) = sprints.value.into_iter().next() {
            return Ok(Some(s));
        }
    }

    // ── Attempt 2: enumerate teams via stable org-level endpoint ────────────
    let teams = get_teams(org_url, pat, project).await.unwrap_or_default();
    for t in teams {
        let enc_team = encode_path_segment(&t.name);
        let team_url = format!(
            "{}/{}/{}/_apis/work/teamsettings/iterations?$timeframe=current&api-version=7.1",
            base, enc_project, enc_team
        );
        let r = client.get(&team_url).send().await.map_err(|e| e.to_string())?;
        if !r.status().is_success() {
            continue;
        }
        let sprints: SprintResponse = r.json().await.map_err(|e| e.to_string())?;
        if let Some(s) = sprints.value.into_iter().next() {
            return Ok(Some(s));
        }
    }

    Ok(None)
}

pub async fn get_work_item_detail(
    org_url: &str,
    pat: &str,
    project: &str,
    id: u64,
) -> Result<WorkItemDetail, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let url = format!(
        "{}/{}/_apis/wit/workitems/{}?api-version=7.1",
        base, project, id
    );

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }

    let mut item: WorkItemDetail = resp.json().await.map_err(|e| e.to_string())?;
    item.web_url = format!("{}/{}/_workitems/edit/{}", base, project, item.id);
    Ok(item)
}

pub async fn get_work_item_type_states(
    org_url: &str,
    pat: &str,
    project: &str,
    work_item_type: &str,
) -> Result<Vec<WorkItemTypeState>, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let encoded_type = encode_path_segment(work_item_type);
    let url = format!(
        "{}/{}/_apis/wit/workitemtypes/{}/states?api-version=7.1",
        base, project, encoded_type
    );

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }

    let data: WorkItemTypeStatesResponse = resp.json().await.map_err(|e| e.to_string())?;
    Ok(data.value)
}

pub async fn update_work_item_state(
    org_url: &str,
    pat: &str,
    project: &str,
    id: u64,
    state: &str,
) -> Result<WorkItemDetail, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let url = format!(
        "{}/{}/_apis/wit/workitems/{}?api-version=7.1",
        base, project, id
    );

    let patch_body = serde_json::json!([
        {
            "op": "replace",
            "path": "/fields/System.State",
            "value": state
        }
    ]);

    let resp = client
        .patch(&url)
        .header("Content-Type", "application/json-patch+json")
        .json(&patch_body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }

    let mut item: WorkItemDetail = resp.json().await.map_err(|e| e.to_string())?;
    item.web_url = format!("{}/{}/_workitems/edit/{}", base, project, item.id);
    Ok(item)
}

// ============================================================
// Pull Request review
// ============================================================

async fn get_my_user_id(org_url: &str, pat: &str) -> Result<String, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let url = format!("{}/_apis/connectionData?api-version=7.1", base);

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }

    let data: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    data["authenticatedUser"]["id"]
        .as_str()
        .map(String::from)
        .ok_or_else(|| "Could not resolve your user ID".into())
}

pub async fn review_pull_request(
    org_url: &str,
    pat: &str,
    project: &str,
    repo_id: &str,
    pr_id: u64,
    vote: i32,
) -> Result<(), String> {
    let user_id = get_my_user_id(org_url, pat).await?;
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let url = format!(
        "{}/{}/_apis/git/repositories/{}/pullrequests/{}/reviewers/{}?api-version=7.1",
        base, project, repo_id, pr_id, user_id
    );

    let body = serde_json::json!({ "vote": vote });

    let resp = client
        .put(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }

    Ok(())
}

// ============================================================
// Standup summary
// ============================================================

#[derive(Debug, Serialize)]
pub struct StandupTransition {
    #[serde(rename = "workItemId")]
    pub work_item_id: u64,
    pub title: String,
    #[serde(rename = "workItemType")]
    pub work_item_type: String,
    #[serde(rename = "fromState")]
    pub from_state: String,
    #[serde(rename = "toState")]
    pub to_state: String,
    #[serde(rename = "changedDate")]
    pub changed_date: String,
    #[serde(rename = "webUrl")]
    pub web_url: String,
}

#[derive(Debug, Serialize)]
pub struct StandupItem {
    pub id: u64,
    pub title: String,
    #[serde(rename = "workItemType")]
    pub work_item_type: String,
    pub state: String,
    #[serde(rename = "webUrl")]
    pub web_url: String,
}

#[derive(Debug, Serialize)]
pub struct StandupPR {
    pub id: u64,
    pub title: String,
    pub repo: String,
    #[serde(rename = "activityType")]
    pub activity_type: String,
    #[serde(rename = "webUrl")]
    pub web_url: String,
}

#[derive(Debug, Serialize)]
pub struct StandupData {
    pub transitions: Vec<StandupTransition>,
    pub today: Vec<StandupItem>,
    #[serde(rename = "todayPrs")]
    pub today_prs: Vec<StandupPR>,
    pub blockers: Vec<StandupItem>,
}

#[derive(Debug, Deserialize)]
struct WiUpdate {
    #[serde(default)]
    fields: Option<std::collections::HashMap<String, serde_json::Value>>,
    #[serde(rename = "revisedDate", default)]
    revised_date: Option<String>,
}

#[derive(Debug, Deserialize)]
struct WiUpdatesResponse {
    value: Vec<WiUpdate>,
}

async fn get_my_display_name(client: &Client, base: &str) -> Result<String, String> {
    let url = format!("{}/_apis/connectionData?api-version=7.1", base);
    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }
    let data: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    data["authenticatedUser"]["providerDisplayName"]
        .as_str()
        .map(String::from)
        .ok_or_else(|| "Could not resolve your display name".into())
}

async fn run_wiql(client: &Client, base: &str, project: &str, query: &str, top: u32) -> Result<Vec<u64>, String> {
    let url = format!("{}/{}/_apis/wit/wiql?api-version=7.1&$top={}", base, encode_path_segment(project), top);
    let body = serde_json::json!({ "query": query });
    let resp = client.post(&url).json(&body).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }
    let refs: WiqlResponse = resp.json().await.map_err(|e| e.to_string())?;
    Ok(refs.work_items.iter().map(|w| w.id).collect())
}

async fn batch_fetch_items(client: &Client, base: &str, project: &str, ids: &[u64]) -> Result<Vec<WorkItem>, String> {
    if ids.is_empty() {
        return Ok(vec![]);
    }
    let ids_str: Vec<String> = ids.iter().map(|id| id.to_string()).collect();
    let fields = "System.Title,System.WorkItemType,System.State,System.AssignedTo,System.IterationPath";
    let url = format!(
        "{}/{}/_apis/wit/workitems?ids={}&fields={}&api-version=7.1",
        base, project, ids_str.join(","), fields
    );
    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let mut items = resp
        .json::<WorkItemsBatchResponse>()
        .await
        .map(|r| r.value)
        .map_err(|e| e.to_string())?;
    for item in &mut items {
        item.web_url = format!("{}/{}/_workitems/edit/{}", base, project, item.id);
    }
    Ok(items)
}

async fn get_state_transitions(
    client: &Client,
    base: &str,
    project: &str,
    item: &WorkItem,
) -> Vec<StandupTransition> {
    let url = format!(
        "{}/{}/_apis/wit/workitems/{}/updates?api-version=7.1",
        base, encode_path_segment(project), item.id
    );
    let resp = match client.get(&url).send().await {
        Ok(r) if r.status().is_success() => r,
        _ => return vec![],
    };
    let updates: WiUpdatesResponse = match resp.json().await {
        Ok(u) => u,
        Err(_) => return vec![],
    };

    let mut transitions = Vec::new();
    for update in updates.value.iter().rev() {
        if let Some(fields) = &update.fields {
            if let Some(state_change) = fields.get("System.State") {
                let old = state_change.get("oldValue").and_then(|v| v.as_str()).unwrap_or("").to_string();
                let new = state_change.get("newValue").and_then(|v| v.as_str()).unwrap_or("").to_string();
                if !old.is_empty() && !new.is_empty() {
                    transitions.push(StandupTransition {
                        work_item_id: item.id,
                        title: item.fields.title.clone(),
                        work_item_type: item.fields.work_item_type.clone(),
                        from_state: old,
                        to_state: new,
                        changed_date: update.revised_date.clone().unwrap_or_default(),
                        web_url: item.web_url.clone(),
                    });
                    break;
                }
            }
        }
    }
    transitions
}

pub async fn get_standup_data(
    org_url: &str,
    pat: &str,
    project: &str,
    team: Option<&str>,
    lookback_days: u32,
) -> Result<StandupData, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let area_clause = match team {
        Some(t) => match get_team_area_path(&client, base, project, t).await {
            Some(ap) => format!("AND [System.AreaPath] UNDER '{}'", ap),
            None => String::new(),
        },
        None => String::new(),
    };

    let changed_query = format!(
        "SELECT [System.Id] FROM WorkItems \
         WHERE [System.TeamProject] = @project \
         AND [System.AssignedTo] = @Me {} \
         AND [System.ChangedDate] >= @Today-{} \
         ORDER BY [System.ChangedDate] DESC",
        area_clause, lookback_days
    );

    let today_query = format!(
        "SELECT [System.Id] FROM WorkItems \
         WHERE [System.TeamProject] = @project \
         AND [System.AssignedTo] = @Me {} \
         AND [System.State] IN ('In Progress', 'Active', 'Doing', 'Committed') \
         ORDER BY [System.ChangedDate] DESC",
        area_clause
    );

    let blocked_query = format!(
        "SELECT [System.Id] FROM WorkItems \
         WHERE [System.TeamProject] = @project \
         AND [System.AssignedTo] = @Me {} \
         AND [Microsoft.VSTS.CMMI.Blocked] = 'Yes' \
         ORDER BY [System.ChangedDate] DESC",
        area_clause
    );

    let changed_ids = run_wiql(&client, base, project, &changed_query, 30).await?;
    let today_ids = run_wiql(&client, base, project, &today_query, 30).await?;
    let blocked_ids = run_wiql(&client, base, project, &blocked_query, 30).await.unwrap_or_default();

    let (changed_items, today_items, blocked_items) = tokio::join!(
        batch_fetch_items(&client, base, project, &changed_ids),
        batch_fetch_items(&client, base, project, &today_ids),
        batch_fetch_items(&client, base, project, &blocked_ids),
    );
    let changed_items = changed_items?;
    let today_items = today_items?;
    let blocked_items = blocked_items.unwrap_or_default();

    let mut transitions = Vec::new();
    for item in &changed_items {
        let t = get_state_transitions(&client, base, project, item).await;
        transitions.extend(t);
    }

    let transition_ids: HashSet<u64> = transitions.iter().map(|t| t.work_item_id).collect();

    let today: Vec<StandupItem> = today_items
        .iter()
        .filter(|w| !transition_ids.contains(&w.id))
        .map(|w| StandupItem {
            id: w.id,
            title: w.fields.title.clone(),
            work_item_type: w.fields.work_item_type.clone(),
            state: w.fields.state.clone(),
            web_url: w.web_url.clone(),
        })
        .collect();

    let blockers: Vec<StandupItem> = blocked_items
        .iter()
        .map(|w| StandupItem {
            id: w.id,
            title: w.fields.title.clone(),
            work_item_type: w.fields.work_item_type.clone(),
            state: w.fields.state.clone(),
            web_url: w.web_url.clone(),
        })
        .collect();

    let my_name = get_my_display_name(&client, base).await.unwrap_or_default();
    let prs = get_pull_requests(org_url, pat, project).await.unwrap_or_default();

    let mut today_prs = Vec::new();
    for pr in &prs {
        if pr.created_by.display_name == my_name {
            today_prs.push(StandupPR {
                id: pr.pull_request_id,
                title: pr.title.clone(),
                repo: pr.repository.name.clone(),
                activity_type: "created".into(),
                web_url: pr.web_url.clone(),
            });
        } else if pr.reviewers.iter().any(|r| r.display_name == my_name) {
            today_prs.push(StandupPR {
                id: pr.pull_request_id,
                title: pr.title.clone(),
                repo: pr.repository.name.clone(),
                activity_type: "reviewing".into(),
                web_url: pr.web_url.clone(),
            });
        }
    }

    Ok(StandupData {
        transitions,
        today,
        today_prs,
        blockers,
    })
}

