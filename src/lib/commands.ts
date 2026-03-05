/**
 * Enum of every Tauri command exposed by the Rust backend.
 * Use these constants in all `invoke()` calls — never raw strings.
 */
export enum TauriCommand {
  // ─── Credentials ────────────────────────────────────────────────────────────
  SaveCredentials       = "save_credentials",
  LoadCredentials       = "load_stored_credentials",
  ClearCredentials      = "clear_stored_credentials",

  // ─── Session ─────────────────────────────────────────────────────────────────
  ValidateCredentials   = "validate_credentials",
  InitSession           = "init_session",
  HasSession            = "has_session",
  ClearSession          = "clear_session",

  // ─── Azure DevOps ─────────────────────────────────────────────────────────
  GetProjects           = "get_projects",
  GetTeams              = "get_teams",
  GetMyWorkItems        = "get_my_work_items",
  GetRecentPipelines    = "get_recent_pipelines",
  GetPullRequests       = "get_pull_requests",
  GetCurrentSprint      = "get_current_sprint",
}
