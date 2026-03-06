export enum TauriCommand {
  SaveCredentials = 'save_credentials',
  LoadCredentials = 'load_stored_credentials',
  ClearCredentials = 'clear_stored_credentials',

  ValidateCredentials = 'validate_credentials',
  InitSession = 'init_session',
  HasSession = 'has_session',
  ClearSession = 'clear_session',

  GetProjects = 'get_projects',
  GetTeams = 'get_teams',
  GetTasks = 'get_my_work_items',
  GetRecentPipelines = 'get_recent_pipelines',
  GetPipelineDefinitions = 'get_pipeline_definitions',
  GetPullRequests = 'get_pull_requests',
  GetCurrentSprint = 'get_current_sprint',
  GetWorkItemDetail = 'get_work_item_detail',
  GetWorkItemTypeStates = 'get_work_item_type_states',
  UpdateWorkItemState = 'update_work_item_state',
  ReviewPullRequest = 'review_pull_request',
  GetStandupData = 'get_standup_data',
  GetWorkItemSummaries = 'get_work_item_summaries',
}
