mod azure;
mod openai;

use azure::{PipelineDefinition, PipelineRun, Project, PullRequest, Release, ReleaseDefinition, RelatedWorkItem, SprintIteration, StandupData, Team, UserActivitySummary, WorkItem, WorkItemComment, WorkItemDetail, WorkItemTypeState};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// ============================================================
// Session state
// ============================================================

struct Credentials {
    org_url: String,
    pat: String,
}

pub struct AppState {
    credentials: Mutex<Option<Credentials>>,
}

// ============================================================
// File-based credential storage
// ============================================================

#[derive(Serialize, Deserialize)]
struct StoredCredentials {
    org_url: String,
    pat: String,
}

fn credentials_path() -> Result<std::path::PathBuf, String> {
    let home = std::env::var("HOME").map_err(|e| e.to_string())?;
    let dir = std::path::PathBuf::from(home).join(".riva");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("credentials.json"))
}

#[tauri::command]
fn save_credentials(org_url: String, pat: String) -> Result<(), String> {
    let path = credentials_path()?;
    let creds = StoredCredentials { org_url, pat };
    let json = serde_json::to_string(&creds).map_err(|e| e.to_string())?;
    std::fs::write(&path, &json).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o600))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn load_stored_credentials() -> Result<Option<StoredCredentials>, String> {
    let path = credentials_path()?;
    if !path.exists() {
        return Ok(None);
    }
    let content = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let creds: StoredCredentials =
        serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(Some(creds))
}

#[tauri::command]
fn clear_stored_credentials() -> Result<(), String> {
    let path = credentials_path()?;
    if path.exists() {
        std::fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ============================================================
// Credential commands
// ============================================================

/// Validate org URL + PAT against the Azure API (does NOT store anything).
#[tauri::command]
async fn validate_credentials(org_url: String, pat: String) -> Result<(), String> {
    azure::get_projects(&org_url, &pat).await?;
    Ok(())
}

/// Load credentials into the in-memory session.
#[tauri::command]
fn init_session(
    state: State<'_, AppState>,
    org_url: String,
    pat: String,
) -> Result<(), String> {
    let mut creds = state.credentials.lock().map_err(|e| e.to_string())?;
    *creds = Some(Credentials { org_url, pat });
    Ok(())
}

#[tauri::command]
fn has_session(state: State<'_, AppState>) -> bool {
    state.credentials.lock().map(|c| c.is_some()).unwrap_or(false)
}

#[tauri::command]
fn clear_session(state: State<'_, AppState>) -> Result<(), String> {
    let mut creds = state.credentials.lock().map_err(|e| e.to_string())?;
    *creds = None;
    Ok(())
}

// ============================================================
// Azure DevOps commands
// ============================================================

fn session_creds(state: &State<'_, AppState>) -> Result<(String, String), String> {
    let creds = state.credentials.lock().map_err(|e| e.to_string())?;
    let c = creds.as_ref().ok_or("No active session")?;
    Ok((c.org_url.clone(), c.pat.clone()))
}

#[tauri::command]
async fn get_projects(state: State<'_, AppState>) -> Result<Vec<Project>, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_projects(&org_url, &pat).await
}

#[tauri::command]
async fn get_my_work_items(
    state: State<'_, AppState>,
    project: String,
    team: Option<String>,
) -> Result<Vec<WorkItem>, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_my_work_items(&org_url, &pat, &project, team.as_deref()).await
}

#[tauri::command]
async fn get_recent_pipelines(
    state: State<'_, AppState>,
    project: String,
    team_id: Option<String>,
) -> Result<Vec<PipelineRun>, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_recent_pipelines(&org_url, &pat, &project, team_id.as_deref()).await
}

#[tauri::command]
async fn get_pipeline_definitions(
    state: State<'_, AppState>,
    project: String,
) -> Result<Vec<PipelineDefinition>, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_pipeline_definitions(&org_url, &pat, &project).await
}

#[tauri::command]
async fn get_teams(
    state: State<'_, AppState>,
    project: String,
) -> Result<Vec<Team>, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_teams(&org_url, &pat, &project).await
}

#[tauri::command]
async fn get_pull_requests(
    state: State<'_, AppState>,
    project: String,
) -> Result<Vec<PullRequest>, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_pull_requests(&org_url, &pat, &project).await
}

#[tauri::command]
async fn get_current_sprint(
    state: State<'_, AppState>,
    project: String,
    team: Option<String>,
) -> Result<Option<SprintIteration>, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_current_sprint(&org_url, &pat, &project, team.as_deref()).await
}

#[tauri::command]
async fn get_work_item_detail(
    state: State<'_, AppState>,
    project: String,
    id: u64,
) -> Result<WorkItemDetail, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_work_item_detail(&org_url, &pat, &project, id).await
}

#[tauri::command]
async fn get_work_item_type_states(
    state: State<'_, AppState>,
    project: String,
    work_item_type: String,
) -> Result<Vec<WorkItemTypeState>, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_work_item_type_states(&org_url, &pat, &project, &work_item_type).await
}

#[tauri::command]
async fn update_work_item_state(
    state: State<'_, AppState>,
    project: String,
    id: u64,
    new_state: String,
) -> Result<WorkItemDetail, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::update_work_item_state(&org_url, &pat, &project, id, &new_state).await
}

#[tauri::command]
async fn update_work_item_title(
    state: State<'_, AppState>,
    project: String,
    id: u64,
    title: String,
) -> Result<WorkItemDetail, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::update_work_item_title(&org_url, &pat, &project, id, &title).await
}

#[tauri::command]
async fn review_pull_request(
    state: State<'_, AppState>,
    project: String,
    repo_id: String,
    pr_id: u64,
    vote: i32,
) -> Result<(), String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::review_pull_request(&org_url, &pat, &project, &repo_id, pr_id, vote).await
}

#[tauri::command]
async fn get_standup_data(
    state: State<'_, AppState>,
    project: String,
    team: Option<String>,
    lookback_days: u32,
) -> Result<StandupData, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_standup_data(&org_url, &pat, &project, team.as_deref(), lookback_days).await
}

#[tauri::command]
async fn get_work_item_summaries(
    state: State<'_, AppState>,
    project: String,
    ids: Vec<u64>,
) -> Result<Vec<RelatedWorkItem>, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_work_item_summaries(&org_url, &pat, &project, ids).await
}

#[tauri::command]
async fn get_pbi_ids_with_children(
    state: State<'_, AppState>,
    project: String,
    pbi_ids: Vec<u64>,
) -> Result<Vec<u64>, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_pbi_ids_with_children(&org_url, &pat, &project, pbi_ids).await
}

#[tauri::command]
async fn get_my_unique_name(state: State<'_, AppState>) -> Result<String, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_my_unique_name(&org_url, &pat).await
}

#[tauri::command]
async fn get_release_definitions(
    state: State<'_, AppState>,
    project: String,
) -> Result<Vec<ReleaseDefinition>, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_release_definitions(&org_url, &pat, &project).await
}

#[tauri::command]
async fn get_releases(
    state: State<'_, AppState>,
    project: String,
    definition_ids: Vec<u64>,
) -> Result<Vec<Release>, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_releases(&org_url, &pat, &project, &definition_ids).await
}

#[tauri::command]
async fn update_release_approval(
    state: State<'_, AppState>,
    project: String,
    approval_id: u64,
    status: String,
    comments: String,
) -> Result<(), String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::update_release_approval(&org_url, &pat, &project, approval_id, &status, &comments).await
}

#[tauri::command]
async fn get_user_activity_dates(
    state: State<'_, AppState>,
    project: String,
    team: Option<String>,
    lookback_days: Option<u32>,
) -> Result<UserActivitySummary, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_user_activity_dates(&org_url, &pat, &project, team.as_deref(), lookback_days).await
}

#[tauri::command]
async fn get_work_item_recent_comments(
    state: State<'_, AppState>,
    project: String,
    since_timestamp: String,
) -> Result<Vec<WorkItemComment>, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_work_item_recent_comments(&org_url, &pat, &project, &since_timestamp).await
}

// ============================================================
// OpenAI commands
// ============================================================

#[tauri::command]
fn save_openai_key(key: String) -> Result<(), String> {
    openai::save_api_key(&key)
}

#[tauri::command]
fn load_openai_key() -> Result<Option<String>, String> {
    openai::load_api_key()
}

#[tauri::command]
fn clear_openai_key() -> Result<(), String> {
    openai::clear_api_key()
}

#[tauri::command]
async fn generate_standup_summary(prompt: String) -> Result<String, String> {
    let api_key = openai::load_api_key()?
        .ok_or_else(|| "No OpenAI API key configured. Add one in Settings.".to_string())?;
    openai::generate_standup(&api_key, &prompt).await
}

// ============================================================
// App entry point
// ============================================================

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .manage(AppState {
            credentials: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            save_credentials,
            load_stored_credentials,
            clear_stored_credentials,
            validate_credentials,
            init_session,
            has_session,
            clear_session,
            get_projects,
            get_teams,
            get_my_work_items,
            get_recent_pipelines,
            get_pipeline_definitions,
            get_pull_requests,
            get_current_sprint,
            get_work_item_detail,
            get_work_item_type_states,
            update_work_item_state,
            update_work_item_title,
            review_pull_request,
            get_standup_data,
            get_work_item_summaries,
            get_pbi_ids_with_children,
            get_my_unique_name,
            get_release_definitions,
            get_releases,
            update_release_approval,
            get_user_activity_dates,
            get_work_item_recent_comments,
            save_openai_key,
            load_openai_key,
            clear_openai_key,
            generate_standup_summary,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
