use base64::{engine::general_purpose::STANDARD, Engine};
use reqwest::{Client, header};
use serde::{Deserialize, Serialize};

// ─── URL helpers ─────────────────────────────────────────────────────────────

/// Percent-encode path segment characters that would break URL parsing.
fn encode_path_segment(s: &str) -> String {
    s.replace('%', "%25")
        .replace(' ', "%20")
        .replace('#', "%23")
        .replace('?', "%3F")
        .replace('&', "%26")
        .replace('+', "%2B")
}

// ─── Auth helper ────────────────────────────────────────────────────────────

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

// ─── Response types ──────────────────────────────────────────────────────────

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
    /// Web browser URL for this build — computed after deserialization.
    #[serde(rename = "webUrl", default, skip_deserializing)]
    pub web_url: String,
}

// ─── Pull Request types ───────────────────────────────────────────────────────

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
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkItemDetail {
    pub id: u64,
    pub fields: WorkItemDetailFields,
    #[serde(rename = "webUrl", default, skip_deserializing)]
    pub web_url: String,
}

// ─── API calls ───────────────────────────────────────────────────────────────

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
        return Err(format!("Azure DevOps returned {}", resp.status()));
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
        "{}/{}/_apis/build/builds?$top=50&queryOrder=queueTimeDescending&api-version=7.1",
        base, project
    );
    if let Some(tid) = team_id {
        url.push_str(&format!("&teamId={}", tid));
    }

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("Builds API returned {}", resp.status()));
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
        return Err(format!("Pull Requests API returned {}", resp.status()));
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
        return Err(format!("Teams API returned {}", resp.status()));
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
        return Err(format!("Work item detail API returned {}", resp.status()));
    }

    let mut item: WorkItemDetail = resp.json().await.map_err(|e| e.to_string())?;
    item.web_url = format!("{}/{}/_workitems/edit/{}", base, project, item.id);
    Ok(item)
}
