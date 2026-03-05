mod azure;

use azure::{PipelineRun, Project, PullRequest, SprintIteration, Team, WorkItem};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// ─── Session state ────────────────────────────────────────────────────────────

struct Credentials {
    org_url: String,
    pat: String,
}

pub struct AppState {
    credentials: Mutex<Option<Credentials>>,
}

// ─── File-based credential storage ───────────────────────────────────────────
// Credentials are stored in ~/.forge/credentials.json with chmod 600.
// Same pattern as AWS CLI, git, npm — file permissions are the security layer.

#[derive(Serialize, Deserialize)]
struct StoredCredentials {
    org_url: String,
    pat: String,
}

fn credentials_path() -> Result<std::path::PathBuf, String> {
    let home = std::env::var("HOME").map_err(|e| e.to_string())?;
    let dir = std::path::PathBuf::from(home).join(".forge");
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

// ─── Credential commands ──────────────────────────────────────────────────────

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

// ─── Azure DevOps commands ────────────────────────────────────────────────────

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
) -> Result<Vec<WorkItem>, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_my_work_items(&org_url, &pat, &project).await
}

#[tauri::command]
async fn get_recent_pipelines(
    state: State<'_, AppState>,
    project: String,
) -> Result<Vec<PipelineRun>, String> {
    let (org_url, pat) = session_creds(&state)?;
    azure::get_recent_pipelines(&org_url, &pat, &project).await
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

// ─── App entry point ──────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
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
            get_pull_requests,
            get_current_sprint,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
