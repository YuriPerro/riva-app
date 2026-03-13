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
    #[serde(rename = "System.Parent", default)]
    pub parent_id: Option<u64>,
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
    pub reason: Option<String>,
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
    #[serde(rename = "uniqueName", default)]
    pub unique_name: String,
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
    #[serde(rename = "Microsoft.VSTS.Scheduling.OriginalEstimate", default)]
    pub original_estimate: Option<f64>,
    #[serde(rename = "Microsoft.VSTS.Scheduling.DueDate", default)]
    pub due_date: Option<String>,
    #[serde(rename = "Microsoft.VSTS.Scheduling.StartDate", default)]
    pub start_date: Option<String>,
    #[serde(rename = "Microsoft.VSTS.Scheduling.FinishDate", default)]
    pub finish_date: Option<String>,
    #[serde(rename = "Microsoft.VSTS.CMMI.Blocked", default)]
    pub blocked: Option<String>,
    #[serde(skip_deserializing, default)]
    pub extra: std::collections::HashMap<String, serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RelatedWorkItem {
    pub id: u64,
    pub title: String,
    #[serde(rename = "workItemType")]
    pub work_item_type: String,
    pub state: String,
    #[serde(rename = "webUrl", default)]
    pub web_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkItemDetail {
    pub id: u64,
    pub fields: WorkItemDetailFields,
    #[serde(rename = "webUrl", default, skip_deserializing)]
    pub web_url: String,
    #[serde(skip_deserializing, default)]
    pub parent: Option<RelatedWorkItem>,
    #[serde(skip_deserializing, default)]
    pub children: Vec<RelatedWorkItem>,
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
pub async fn get_sprints(
    org_url: &str,
    pat: &str,
    project: &str,
    team: Option<&str>,
) -> Result<Vec<SprintIteration>, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let enc_project = encode_path_segment(project);

    let url = if let Some(team_name) = team {
        let enc_team = encode_path_segment(team_name);
        format!(
            "{}/{}/{}/_apis/work/teamsettings/iterations?api-version=7.1",
            base, enc_project, enc_team
        )
    } else {
        format!(
            "{}/{}/_apis/work/teamsettings/iterations?api-version=7.1",
            base, enc_project
        )
    };

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Ok(vec![]);
    }
    let sprints: SprintResponse = resp.json().await.map_err(|e| e.to_string())?;
    Ok(sprints.value)
}

pub async fn get_my_work_items(
    org_url: &str,
    pat: &str,
    project: &str,
    team: Option<&str>,
    only_mine: bool,
    iteration_path: Option<&str>,
) -> Result<Vec<WorkItem>, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let enc_project = encode_path_segment(project);

    let enc_team = team.map(|t| encode_path_segment(t));

    let assignee_clause = if only_mine {
        "AND [System.AssignedTo] = @Me "
    } else {
        ""
    };

    let iteration_clause = match iteration_path {
        Some(path) => format!("AND [System.IterationPath] = '{}' ", path),
        None if only_mine => "AND [System.IterationPath] = @CurrentIteration ".to_string(),
        None => String::new(),
    };

    let wiql_query = if let Some(t) = team {
        match get_team_area_path(&client, base, project, t).await {
            Some(area_path) => format!(
                "SELECT [System.Id] FROM WorkItems \
                 WHERE [System.TeamProject] = @project \
                 {}\
                 AND [System.AreaPath] UNDER '{}' \
                 {}\
                 AND [System.State] NOT IN ('Removed') \
                 ORDER BY [System.ChangedDate] DESC",
                assignee_clause, area_path, iteration_clause
            ),
            None => format!(
                "SELECT [System.Id] FROM WorkItems \
                 WHERE [System.TeamProject] = @project \
                 {}\
                 {}\
                 AND [System.State] NOT IN ('Removed') \
                 ORDER BY [System.ChangedDate] DESC",
                assignee_clause, iteration_clause
            ),
        }
    } else {
        format!(
            "SELECT [System.Id] FROM WorkItems \
             WHERE [System.TeamProject] = @project \
             {}\
             {}\
             AND [System.State] NOT IN ('Removed') \
             ORDER BY [System.ChangedDate] DESC",
            assignee_clause, iteration_clause
        )
    };

    let top = if only_mine { 100 } else { 200 };
    let wiql_url = if let Some(ref et) = enc_team {
        format!("{}/{}/{}/_apis/wit/wiql?api-version=7.1&$top={}", base, enc_project, et, top)
    } else {
        format!("{}/{}/_apis/wit/wiql?api-version=7.1&$top={}", base, enc_project, top)
    };
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

    let batch_limit = if only_mine { 50 } else { 200 };
    let ids: Vec<String> = refs.work_items.iter().take(batch_limit).map(|w| w.id.to_string()).collect();
    let ids_str = ids.join(",");
    let fields = "System.Title,System.WorkItemType,System.State,System.AssignedTo,System.IterationPath,System.Parent";
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

fn parse_work_item_id_from_url(url: &str) -> Option<u64> {
    url.rsplit('/').next().and_then(|s| s.parse::<u64>().ok())
}

async fn fetch_related_summaries(
    client: &reqwest::Client,
    base: &str,
    project: &str,
    ids: &[u64],
) -> Vec<RelatedWorkItem> {
    if ids.is_empty() {
        return vec![];
    }
    let ids_str: String = ids.iter().map(|id| id.to_string()).collect::<Vec<_>>().join(",");
    let fields = "System.Title,System.WorkItemType,System.State";
    let url = format!(
        "{}/{}/_apis/wit/workitems?ids={}&fields={}&api-version=7.1",
        base,
        encode_path_segment(project),
        ids_str,
        fields
    );
    let resp = match client.get(&url).send().await {
        Ok(r) if r.status().is_success() => r,
        _ => return vec![],
    };
    let body: serde_json::Value = match resp.json().await {
        Ok(v) => v,
        _ => return vec![],
    };
    let items = body["value"].as_array().cloned().unwrap_or_default();
    items
        .iter()
        .filter_map(|v| {
            let id = v["id"].as_u64()?;
            let fields = &v["fields"];
            Some(RelatedWorkItem {
                id,
                title: fields["System.Title"].as_str().unwrap_or("").to_string(),
                work_item_type: fields["System.WorkItemType"].as_str().unwrap_or("").to_string(),
                state: fields["System.State"].as_str().unwrap_or("").to_string(),
                web_url: format!("{}/{}/_workitems/edit/{}", base, project, id),
            })
        })
        .collect()
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
        "{}/{}/_apis/wit/workitems/{}?$expand=relations&api-version=7.1",
        base,
        encode_path_segment(project),
        id
    );
    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }

    let raw: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;

    let mut parent_id: Option<u64> = None;
    let mut child_ids: Vec<u64> = vec![];

    if let Some(relations) = raw["relations"].as_array() {
        for rel in relations {
            let rel_type = rel["rel"].as_str().unwrap_or("");
            let rel_url = rel["url"].as_str().unwrap_or("");
            match rel_type {
                "System.LinkTypes.Hierarchy-Reverse" => {
                    parent_id = parse_work_item_id_from_url(rel_url);
                }
                "System.LinkTypes.Hierarchy-Forward" => {
                    if let Some(child_id) = parse_work_item_id_from_url(rel_url) {
                        child_ids.push(child_id);
                    }
                }
                _ => {}
            }
        }
    }

    let raw_fields = raw["fields"].as_object().cloned().unwrap_or_default();
    let mut item: WorkItemDetail = serde_json::from_value(raw).map_err(|e| e.to_string())?;
    item.web_url = format!("{}/{}/_workitems/edit/{}", base, project, item.id);

    for (key, value) in &raw_fields {
        if !key.starts_with("System.") {
            item.fields.extra.insert(key.clone(), value.clone());
        }
    }

    let mut all_ids: Vec<u64> = child_ids.clone();
    if let Some(pid) = parent_id {
        all_ids.push(pid);
    }
    let summaries = fetch_related_summaries(&client, base, project, &all_ids).await;
    let summary_map: std::collections::HashMap<u64, RelatedWorkItem> =
        summaries.into_iter().map(|s| (s.id, s)).collect();

    item.parent = parent_id.and_then(|pid| summary_map.get(&pid).cloned());
    item.children = child_ids
        .iter()
        .filter_map(|cid| summary_map.get(cid).cloned())
        .collect();

    Ok(item)
}

pub async fn get_work_item_summaries(
    org_url: &str,
    pat: &str,
    project: &str,
    ids: Vec<u64>,
) -> Result<Vec<RelatedWorkItem>, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    Ok(fetch_related_summaries(&client, base, project, &ids).await)
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

pub async fn update_work_item_title(
    org_url: &str,
    pat: &str,
    project: &str,
    id: u64,
    title: &str,
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
            "path": "/fields/System.Title",
            "value": title
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

const EDITABLE_FIELDS: &[&str] = &[
    "Microsoft.VSTS.Scheduling.Effort",
    "Microsoft.VSTS.Scheduling.OriginalEstimate",
    "Microsoft.VSTS.Scheduling.CompletedWork",
    "Microsoft.VSTS.Scheduling.RemainingWork",
    "Microsoft.VSTS.Scheduling.DueDate",
    "Microsoft.VSTS.Scheduling.StartDate",
    "Microsoft.VSTS.Scheduling.FinishDate",
    "Microsoft.VSTS.CMMI.Blocked",
    "Microsoft.VSTS.Common.Priority",
];

pub async fn update_work_item_field(
    org_url: &str,
    pat: &str,
    project: &str,
    id: u64,
    field_path: &str,
    value: serde_json::Value,
) -> Result<WorkItemDetail, String> {
    if !EDITABLE_FIELDS.contains(&field_path) {
        return Err(format!("Field '{}' is not editable", field_path));
    }

    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let url = format!(
        "{}/{}/_apis/wit/workitems/{}?api-version=7.1",
        base, project, id
    );

    let op = if value.is_null() { "remove" } else { "replace" };

    let patch_body = if value.is_null() {
        serde_json::json!([{ "op": op, "path": format!("/fields/{}", field_path) }])
    } else {
        serde_json::json!([{ "op": op, "path": format!("/fields/{}", field_path), "value": value }])
    };

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
    let url = format!("{}/_apis/connectionData?api-version=7.1-preview.1", base);

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
// Releases (VSRM)
// ============================================================

fn vsrm_url(org_url: &str) -> String {
    let base = org_url.trim_end_matches('/');
    base.replace("https://dev.azure.com/", "https://vsrm.dev.azure.com/")
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReleaseDefinitionRef {
    pub id: u64,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReleaseDefinitionEnvironment {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub rank: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReleaseDefinition {
    pub id: u64,
    pub name: String,
    #[serde(default)]
    pub environments: Vec<ReleaseDefinitionEnvironment>,
}

#[derive(Debug, Deserialize)]
struct ReleaseDefinitionsResponse {
    value: Vec<ReleaseDefinition>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReleaseIdentity {
    #[serde(rename = "displayName")]
    pub display_name: String,
    #[serde(rename = "uniqueName", default)]
    pub unique_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct ReleaseEnvironmentDeployStep {
    #[serde(rename = "lastModifiedOn", default)]
    pub last_modified_on: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReleaseApprovalIdentity {
    #[serde(rename = "displayName", default)]
    pub display_name: String,
    #[serde(rename = "uniqueName", default)]
    pub unique_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReleaseApproval {
    pub id: u64,
    #[serde(default)]
    pub status: String,
    #[serde(rename = "approvalType", default)]
    pub approval_type: String,
    #[serde(default)]
    pub approver: Option<ReleaseApprovalIdentity>,
    #[serde(rename = "createdOn", default)]
    pub created_on: Option<String>,
    #[serde(rename = "modifiedOn", default)]
    pub modified_on: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReleaseEnvironment {
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub rank: u32,
    #[serde(default)]
    pub status: String,
    #[serde(rename = "deploySteps", default)]
    pub deploy_steps: Vec<serde_json::Value>,
    #[serde(rename = "preDeployApprovals", default)]
    pub pre_deploy_approvals: Vec<ReleaseApproval>,
    #[serde(rename = "postDeployApprovals", default)]
    pub post_deploy_approvals: Vec<ReleaseApproval>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Release {
    pub id: u64,
    pub name: String,
    #[serde(rename = "releaseDefinition")]
    pub release_definition: ReleaseDefinitionRef,
    #[serde(rename = "createdBy")]
    pub created_by: ReleaseIdentity,
    #[serde(rename = "createdOn")]
    pub created_on: String,
    #[serde(default)]
    pub environments: Vec<ReleaseEnvironment>,
    #[serde(rename = "webUrl", default, skip_deserializing)]
    pub web_url: String,
}

#[derive(Debug, Deserialize)]
struct ReleasesResponse {
    value: Vec<serde_json::Value>,
}

pub async fn get_release_definitions(
    org_url: &str,
    pat: &str,
    project: &str,
) -> Result<Vec<ReleaseDefinition>, String> {
    let client = build_client(pat)?;
    let vsrm = vsrm_url(org_url);
    let url = format!(
        "{}/{}/_apis/release/definitions?$expand=environments&api-version=7.1",
        vsrm,
        encode_path_segment(project),
    );

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }

    resp.json::<ReleaseDefinitionsResponse>()
        .await
        .map(|r| r.value)
        .map_err(|e| e.to_string())
}

async fn fetch_releases_for_definition(
    client: &Client,
    vsrm: &str,
    project: &str,
    definition_id: u64,
) -> Result<Vec<Release>, String> {
    let url = format!(
        "{}/{}/_apis/release/releases?definitionId={}&$top=3&$expand=environments,approvals&api-version=7.1",
        vsrm,
        encode_path_segment(project),
        definition_id,
    );

    let resp = client.get(&url).send().await.map_err(|e| format!("HTTP error: {}", e))?;
    if !resp.status().is_success() {
        return Ok(vec![]);
    }

    let body = resp.text().await.map_err(|e| e.to_string())?;
    let raw_values = serde_json::from_str::<ReleasesResponse>(&body)
        .map(|r| r.value)
        .unwrap_or_default();

    let mut releases: Vec<Release> = Vec::new();
    for val in raw_values {
        if let Ok(r) = serde_json::from_value::<Release>(val) {
            releases.push(r);
        }
    }
    Ok(releases)
}

pub async fn get_releases(
    org_url: &str,
    pat: &str,
    project: &str,
    definition_ids: &[u64],
) -> Result<Vec<Release>, String> {
    let client = build_client(pat)?;
    let vsrm = vsrm_url(org_url);

    let fetches: Vec<_> = definition_ids
        .iter()
        .map(|&id| fetch_releases_for_definition(&client, &vsrm, project, id))
        .collect();

    let results = futures::future::join_all(fetches).await;

    let base = org_url.trim_end_matches('/');
    let mut all_releases: Vec<Release> = Vec::new();
    for result in results {
        if let Ok(mut batch) = result {
            for r in &mut batch {
                r.web_url = format!(
                    "{}/{}/_releaseProgress?_a=release-pipeline-progress&releaseId={}",
                    base,
                    encode_path_segment(project),
                    r.id,
                );
            }
            all_releases.append(&mut batch);
        }
    }

    Ok(all_releases)
}

pub async fn update_release_approval(
    org_url: &str,
    pat: &str,
    project: &str,
    approval_id: u64,
    status: &str,
    comments: &str,
) -> Result<(), String> {
    let client = build_client(pat)?;
    let vsrm = vsrm_url(org_url);
    let url = format!(
        "{}/{}/_apis/release/approvals/{}?api-version=7.1",
        vsrm,
        encode_path_segment(project),
        approval_id,
    );

    let body = serde_json::json!({
        "status": status,
        "comments": comments,
    });

    let resp = client
        .patch(&url)
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

struct MyIdentity {
    id: String,
    display_name: String,
    unique_name: String,
}

async fn get_my_identity(client: &Client, base: &str) -> Result<MyIdentity, String> {
    let url = format!("{}/_apis/connectionData?api-version=7.1-preview.1", base);
    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }
    let data: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let auth = &data["authenticatedUser"];
    let id = auth["id"]
        .as_str()
        .unwrap_or_default()
        .to_string();
    let display_name = auth["providerDisplayName"]
        .as_str()
        .unwrap_or_default()
        .to_string();
    let unique_name = auth["properties"]["Account"]["$value"]
        .as_str()
        .unwrap_or_default()
        .to_string();
    if unique_name.is_empty() {
        return Err("Could not resolve your identity".into());
    }
    Ok(MyIdentity { id, display_name, unique_name })
}

async fn get_my_display_name(client: &Client, base: &str) -> Result<String, String> {
    get_my_identity(client, base).await.map(|i| i.display_name)
}

pub async fn get_my_unique_name(org_url: &str, pat: &str) -> Result<String, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    get_my_identity(&client, base).await.map(|i| i.unique_name)
}

async fn run_wiql(client: &Client, base: &str, project: &str, team: Option<&str>, query: &str, top: u32) -> Result<Vec<u64>, String> {
    let url = match team {
        Some(t) => format!(
            "{}/{}/{}/_apis/wit/wiql?api-version=7.1&$top={}",
            base, encode_path_segment(project), encode_path_segment(t), top
        ),
        None => format!(
            "{}/{}/_apis/wit/wiql?api-version=7.1&$top={}",
            base, encode_path_segment(project), top
        ),
    };
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
    let fields = "System.Title,System.WorkItemType,System.State,System.AssignedTo,System.IterationPath,System.Parent";
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

fn cutoff_iso(lookback_days: u32) -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let epoch_secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("system clock error")
        .as_secs()
        .saturating_sub(lookback_days as u64 * 86400);
    let days = (epoch_secs / 86400) as i64;
    let z = days + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = (z - era * 146097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    format!("{:04}-{:02}-{:02}T00:00:00Z", y, m, d)
}

async fn get_state_transitions(
    client: &Client,
    base: &str,
    project: &str,
    item: &WorkItem,
    cutoff: &str,
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

    let mut first_from: Option<String> = None;
    let mut last_to: Option<String> = None;
    let mut last_date = String::new();

    for update in &updates.value {
        if let Some(fields) = &update.fields {
            let change_date = fields
                .get("System.ChangedDate")
                .and_then(|v| v.get("newValue"))
                .and_then(|v| v.as_str())
                .unwrap_or(update.revised_date.as_deref().unwrap_or(""));

            if change_date < cutoff || change_date.starts_with("9999") {
                continue;
            }

            if let Some(state_change) = fields.get("System.State") {
                let old = state_change.get("oldValue").and_then(|v| v.as_str()).unwrap_or("").to_string();
                let new = state_change.get("newValue").and_then(|v| v.as_str()).unwrap_or("").to_string();
                if !old.is_empty() && !new.is_empty() {
                    if first_from.is_none() {
                        first_from = Some(old);
                    }
                    last_to = Some(new);
                    last_date = change_date.to_string();
                }
            }
        }
    }

    match (first_from, last_to) {
        (Some(from), Some(to)) if from != to => vec![StandupTransition {
            work_item_id: item.id,
            title: item.fields.title.clone(),
            work_item_type: item.fields.work_item_type.clone(),
            from_state: from,
            to_state: to,
            changed_date: last_date,
            web_url: item.web_url.clone(),
        }],
        _ => vec![],
    }
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

    let iteration_clause = if team.is_some() {
        "AND [System.IterationPath] = @CurrentIteration"
    } else {
        ""
    };

    let changed_query = format!(
        "SELECT [System.Id] FROM WorkItems \
         WHERE [System.TeamProject] = @project \
         AND [System.AssignedTo] = @Me {} {} \
         AND [System.ChangedDate] >= @Today-{} \
         ORDER BY [System.ChangedDate] DESC",
        area_clause, iteration_clause, lookback_days
    );

    let today_query = format!(
        "SELECT [System.Id] FROM WorkItems \
         WHERE [System.TeamProject] = @project \
         AND [System.AssignedTo] = @Me {} {} \
         AND [System.State] IN ('In Progress', 'Active', 'Doing', 'Committed') \
         ORDER BY [System.ChangedDate] DESC",
        area_clause, iteration_clause
    );

    let blocked_query = format!(
        "SELECT [System.Id] FROM WorkItems \
         WHERE [System.TeamProject] = @project \
         AND [System.AssignedTo] = @Me {} {} \
         AND [Microsoft.VSTS.CMMI.Blocked] = 'Yes' \
         ORDER BY [System.ChangedDate] DESC",
        area_clause, iteration_clause
    );

    let changed_ids = run_wiql(&client, base, project, team, &changed_query, 30).await?;
    let today_ids = run_wiql(&client, base, project, team, &today_query, 30).await?;
    let blocked_ids = run_wiql(&client, base, project, team, &blocked_query, 30).await.unwrap_or_default();

    let (changed_items, today_items, blocked_items) = tokio::join!(
        batch_fetch_items(&client, base, project, &changed_ids),
        batch_fetch_items(&client, base, project, &today_ids),
        batch_fetch_items(&client, base, project, &blocked_ids),
    );
    let changed_items = changed_items?;
    let today_items = today_items?;
    let blocked_items = blocked_items.unwrap_or_default();

    let cutoff = cutoff_iso(lookback_days);

    let mut transitions = Vec::new();
    for item in &changed_items {
        let t = get_state_transitions(&client, base, project, item, &cutoff).await;
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

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserActivitySummary {
    pub active_dates: Vec<String>,
    pub this_week_count: u32,
    pub last_week_count: u32,
}

#[derive(Debug, Deserialize)]
struct GitRepository {
    pub id: String,
    #[allow(dead_code)]
    pub name: String,
}

#[derive(Debug, Deserialize)]
struct GitRepositoriesResponse {
    pub value: Vec<GitRepository>,
}

#[derive(Debug, Deserialize)]
struct GitPush {
    pub date: String,
}

#[derive(Debug, Deserialize)]
struct GitPushesResponse {
    pub value: Vec<GitPush>,
}

fn date_only(iso: &str) -> Option<String> {
    if iso.len() >= 10 {
        Some(iso[..10].to_string())
    } else {
        None
    }
}

fn monday_of_week(iso_date: &str) -> Option<String> {
    let parts: Vec<&str> = iso_date.split('-').collect();
    if parts.len() < 3 { return None; }
    let y: i64 = parts[0].parse().ok()?;
    let m: u64 = parts[1].parse().ok()?;
    let d: u64 = parts[2].parse().ok()?;

    let a = (14 - m) / 12;
    let yy = y - a as i64;
    let mm = m + 12 * a - 2;
    let day_of_week = ((d as i64 + yy + yy / 4 - yy / 100 + yy / 400 + (31 * mm as i64) / 12) % 7) as i64;
    let dow = if day_of_week == 0 { 6 } else { day_of_week - 1 };

    use std::time::{SystemTime, UNIX_EPOCH};
    let _ = SystemTime::now().duration_since(UNIX_EPOCH);

    let epoch_days = days_from_ymd(y, m as u32, d as u32)?;
    let monday_days = epoch_days - dow;
    days_to_ymd(monday_days)
}

fn days_from_ymd(y: i64, m: u32, d: u32) -> Option<i64> {
    let y2 = if m <= 2 { y - 1 } else { y };
    let era = if y2 >= 0 { y2 } else { y2 - 399 } / 400;
    let yoe = (y2 - era * 400) as u64;
    let doy = (153 * (if m > 2 { m as u64 - 3 } else { m as u64 + 9 }) + 2) / 5 + d as u64 - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    Some(era * 146097 + doe as i64 - 719468)
}

fn days_to_ymd(days: i64) -> Option<String> {
    let z = days + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = (z - era * 146097) as u64;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe as i64 + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    Some(format!("{:04}-{:02}-{:02}", y, m, d))
}

fn today_date() -> String {
    let cutoff = cutoff_iso(0);
    cutoff[..10].to_string()
}

fn week_counts(dates: &[String], activities: &[(String, u32)]) -> (u32, u32) {
    let today = today_date();
    let this_monday = monday_of_week(&today).unwrap_or_default();

    let this_monday_days = {
        let parts: Vec<&str> = this_monday.split('-').collect();
        if parts.len() == 3 {
            days_from_ymd(
                parts[0].parse().unwrap_or(0),
                parts[1].parse().unwrap_or(1),
                parts[2].parse().unwrap_or(1),
            ).unwrap_or(0)
        } else { 0 }
    };
    let last_monday_days = this_monday_days - 7;
    let last_monday = days_to_ymd(last_monday_days).unwrap_or_default();

    let mut this_week: u32 = 0;
    let mut last_week: u32 = 0;

    for (date, count) in activities {
        if *date >= this_monday && *date <= today {
            this_week += count;
        } else if *date >= last_monday && *date < this_monday {
            last_week += count;
        }
    }

    let _ = dates;
    (this_week, last_week)
}

pub async fn get_user_activity_dates(
    org_url: &str,
    pat: &str,
    project: &str,
    team: Option<&str>,
    lookback_days: Option<u32>,
) -> Result<UserActivitySummary, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let days = lookback_days.unwrap_or(14);
    let cutoff = cutoff_iso(days);
    let cutoff_date = &cutoff[..10];

    let identity = get_my_identity(&client, base).await?;

    let work_item_dates = {
        let area_clause = match team {
            Some(t) => match get_team_area_path(&client, base, project, t).await {
                Some(ap) => format!("AND [System.AreaPath] UNDER '{}'", ap),
                None => String::new(),
            },
            None => String::new(),
        };

        let query = format!(
            "SELECT [System.Id] FROM WorkItems \
             WHERE [System.TeamProject] = @project \
             AND [System.AssignedTo] = @Me {} \
             AND [System.ChangedDate] >= @Today-{} \
             ORDER BY [System.ChangedDate] DESC",
            area_clause, days
        );

        let ids = run_wiql(&client, base, project, team, &query, 200).await.unwrap_or_default();
        let items = batch_fetch_items(&client, base, project, &ids).await.unwrap_or_default();

        let mut dates_with_counts: Vec<(String, u32)> = Vec::new();
        for item in &items {
            let url = format!(
                "{}/{}/_apis/wit/workitems/{}/updates?api-version=7.1",
                base, encode_path_segment(project), item.id
            );
            let resp = match client.get(&url).send().await {
                Ok(r) if r.status().is_success() => r,
                _ => continue,
            };
            let updates: WiUpdatesResponse = match resp.json().await {
                Ok(u) => u,
                Err(_) => continue,
            };
            for update in &updates.value {
                if let Some(fields) = &update.fields {
                    let has_state_change = fields.get("System.State").is_some();
                    if !has_state_change { continue; }

                    let change_date = fields
                        .get("System.ChangedDate")
                        .and_then(|v| v.get("newValue"))
                        .and_then(|v| v.as_str())
                        .unwrap_or(update.revised_date.as_deref().unwrap_or(""));

                    if let Some(d) = date_only(change_date) {
                        if d.as_str() >= cutoff_date {
                            dates_with_counts.push((d, 1));
                        }
                    }
                }
            }
        }
        dates_with_counts
    };

    let pr_dates = {
        let active_url = format!(
            "{}/{}/_apis/git/pullrequests?searchCriteria.status=active&$top=100&api-version=7.1",
            base, encode_path_segment(project)
        );
        let completed_url = format!(
            "{}/{}/_apis/git/pullrequests?searchCriteria.status=completed&searchCriteria.minTime={}&$top=100&api-version=7.1",
            base, encode_path_segment(project), cutoff
        );

        let (active_resp, completed_resp) = tokio::join!(
            client.get(&active_url).send(),
            client.get(&completed_url).send(),
        );

        let mut dates: Vec<(String, u32)> = Vec::new();
        let my_name_lower = identity.unique_name.to_lowercase();

        for resp in [active_resp, completed_resp] {
            if let Ok(r) = resp {
                if r.status().is_success() {
                    if let Ok(prs) = r.json::<PullRequestsResponse>().await {
                        for pr in &prs.value {
                            if pr.created_by.unique_name.to_lowercase() == my_name_lower {
                                if let Some(d) = date_only(&pr.creation_date) {
                                    if d.as_str() >= cutoff_date {
                                        dates.push((d, 1));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        dates
    };

    let push_dates = {
        let repos_url = format!(
            "{}/{}/_apis/git/repositories?api-version=7.1",
            base, encode_path_segment(project)
        );
        let repos: Vec<GitRepository> = match client.get(&repos_url).send().await {
            Ok(r) if r.status().is_success() => {
                r.json::<GitRepositoriesResponse>().await.map(|r| r.value).unwrap_or_default()
            }
            _ => Vec::new(),
        };

        let push_fetches: Vec<_> = repos.iter().map(|repo| {
            let url = format!(
                "{}/{}/_apis/git/repositories/{}/pushes?searchCriteria.pusherId={}&searchCriteria.fromDate={}&$top=50&api-version=7.1",
                base, encode_path_segment(project), &repo.id, &identity.id, &cutoff
            );
            client.get(&url).send()
        }).collect();

        let results = futures::future::join_all(push_fetches).await;

        let mut dates: Vec<(String, u32)> = Vec::new();
        for result in results {
            if let Ok(r) = result {
                if r.status().is_success() {
                    if let Ok(pushes) = r.json::<GitPushesResponse>().await {
                        for push in &pushes.value {
                            if let Some(d) = date_only(&push.date) {
                                if d.as_str() >= cutoff_date {
                                    dates.push((d, 1));
                                }
                            }
                        }
                    }
                }
            }
        }
        dates
    };

    let approval_dates = {
        let defs = get_release_definitions(org_url, pat, project).await.unwrap_or_default();
        let def_ids: Vec<u64> = defs.iter().map(|d| d.id).collect();
        let releases = if def_ids.is_empty() {
            Vec::new()
        } else {
            get_releases(org_url, pat, project, &def_ids).await.unwrap_or_default()
        };

        let my_name_lower = identity.unique_name.to_lowercase();
        let mut dates: Vec<(String, u32)> = Vec::new();
        for release in &releases {
            for env in &release.environments {
                for approval in env.pre_deploy_approvals.iter().chain(env.post_deploy_approvals.iter()) {
                    if approval.status.to_lowercase() == "approved" {
                        if let Some(approver) = &approval.approver {
                            if approver.unique_name.to_lowercase() == my_name_lower {
                                let date_str = approval.modified_on.as_deref()
                                    .or(approval.created_on.as_deref())
                                    .unwrap_or("");
                                if let Some(d) = date_only(date_str) {
                                    if d.as_str() >= cutoff_date {
                                        dates.push((d, 1));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        dates
    };

    let mut all_activities: Vec<(String, u32)> = Vec::new();
    all_activities.extend(work_item_dates);
    all_activities.extend(pr_dates);
    all_activities.extend(push_dates);
    all_activities.extend(approval_dates);

    let unique_dates: Vec<String> = {
        let set: HashSet<String> = all_activities.iter().map(|(d, _)| d.clone()).collect();
        let mut v: Vec<String> = set.into_iter().collect();
        v.sort();
        v
    };

    let (this_week_count, last_week_count) = week_counts(&unique_dates, &all_activities);

    Ok(UserActivitySummary {
        active_dates: unique_dates,
        this_week_count,
        last_week_count,
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkItemComment {
    #[serde(rename = "workItemId")]
    pub work_item_id: u64,
    #[serde(rename = "workItemTitle")]
    pub work_item_title: String,
    #[serde(rename = "commentId")]
    pub comment_id: u64,
    pub text: String,
    #[serde(rename = "createdBy")]
    pub created_by: String,
    #[serde(rename = "createdDate")]
    pub created_date: String,
}

#[derive(Debug, Deserialize)]
struct CommentEntry {
    id: u64,
    text: String,
    #[serde(rename = "createdBy")]
    created_by: Option<CommentAuthor>,
    #[serde(rename = "createdDate", default)]
    created_date: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CommentAuthor {
    #[serde(rename = "displayName", default)]
    display_name: String,
}

#[derive(Debug, Deserialize)]
struct CommentsResponse {
    #[serde(default)]
    comments: Vec<CommentEntry>,
}

pub async fn get_work_item_recent_comments(
    org_url: &str,
    pat: &str,
    project: &str,
    since_timestamp: &str,
) -> Result<Vec<WorkItemComment>, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let enc_project = encode_path_segment(project);

    let query = format!(
        "SELECT [System.Id], [System.Title] FROM WorkItems \
         WHERE [System.AssignedTo] = @Me \
         AND [System.ChangedDate] >= '{}' \
         ORDER BY [System.ChangedDate] DESC",
        since_timestamp
    );
    let ids_and_titles = {
        let url = format!(
            "{}/{}/_apis/wit/wiql?api-version=7.1&$top=50",
            base, enc_project
        );
        let wiql = serde_json::json!({ "query": query });
        let resp = client.post(&url).json(&wiql).send().await.map_err(|e| e.to_string())?;
        if !resp.status().is_success() {
            return Err(format!("WIQL query failed: {}", resp.status()));
        }
        let refs: WiqlResponse = resp.json().await.map_err(|e| e.to_string())?;
        let ids: Vec<u64> = refs.work_items.iter().map(|w| w.id).collect();
        if ids.is_empty() {
            return Ok(vec![]);
        }

        let items = batch_fetch_items(&client, base, project, &ids).await.unwrap_or_default();
        let map: std::collections::HashMap<u64, String> = items
            .iter()
            .map(|item| (item.id, item.fields.title.clone()))
            .collect();
        (ids, map)
    };

    let (work_item_ids, titles_map) = ids_and_titles;
    let mut results: Vec<WorkItemComment> = Vec::new();

    for wid in &work_item_ids {
        let url = format!(
            "{}/{}/_apis/wit/workItems/{}/comments?api-version=7.1-preview.4&$top=10&order=desc",
            base, enc_project, wid
        );
        let resp = client.get(&url).send().await;
        let resp = match resp {
            Ok(r) => r,
            Err(_) => continue,
        };
        if !resp.status().is_success() {
            continue;
        }
        let comments: CommentsResponse = match resp.json().await {
            Ok(c) => c,
            Err(_) => continue,
        };

        let title = titles_map.get(wid).cloned().unwrap_or_default();

        for comment in &comments.comments {
            let created = comment.created_date.as_deref().unwrap_or("");
            if created >= since_timestamp {
                results.push(WorkItemComment {
                    work_item_id: *wid,
                    work_item_title: title.clone(),
                    comment_id: comment.id,
                    text: comment.text.clone(),
                    created_by: comment.created_by.as_ref().map(|a| a.display_name.clone()).unwrap_or_default(),
                    created_date: created.to_string(),
                });
            }
        }
    }

    Ok(results)
}

pub async fn get_pbi_ids_with_children(
    org_url: &str,
    pat: &str,
    project: &str,
    pbi_ids: Vec<u64>,
) -> Result<Vec<u64>, String> {
    if pbi_ids.is_empty() {
        return Ok(vec![]);
    }

    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let enc_project = encode_path_segment(project);

    let wiql_url = format!(
        "{}/{}/_apis/wit/wiql?api-version=7.1&$top=1",
        base, enc_project
    );

    let checks: Vec<_> = pbi_ids
        .iter()
        .map(|&pbi_id| {
            let client = &client;
            let url = &wiql_url;
            async move {
                let query = format!(
                    "SELECT [System.Id] FROM WorkItems \
                     WHERE [System.TeamProject] = @project \
                     AND [System.Parent] = {}",
                    pbi_id
                );
                let wiql = serde_json::json!({ "query": query });
                let resp = match client.post(url).json(&wiql).send().await {
                    Ok(r) if r.status().is_success() => r,
                    _ => return None,
                };
                let has_children = resp
                    .json::<WiqlResponse>()
                    .await
                    .map(|w| !w.work_items.is_empty())
                    .unwrap_or(false);

                if has_children { Some(pbi_id) } else { None }
            }
        })
        .collect();

    let results = futures::future::join_all(checks).await;
    Ok(results.into_iter().flatten().collect())
}

