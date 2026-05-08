use rmcp::{
    ErrorData as McpError,
    handler::server::wrapper::Parameters,
    model::CallToolResult,
    schemars, tool, tool_router,
};
use serde::Deserialize;

use crate::azure::{self, CreatePullRequestArgs, PullRequestFilters};
use super::{RivaMcpServer, azure_error, json_result, resolve_project};

#[derive(Clone, Copy)]
pub(crate) enum VoteAction {
    Approve,
    ApproveWithSuggestions,
    RequestChanges,
    Reject,
    Reset,
}

pub(crate) fn vote_for_action(a: VoteAction) -> i32 {
    match a {
        VoteAction::Approve => 10,
        VoteAction::ApproveWithSuggestions => 5,
        VoteAction::RequestChanges => -5,
        VoteAction::Reject => -10,
        VoteAction::Reset => 0,
    }
}

#[derive(Debug, Deserialize, schemars::JsonSchema, Default)]
pub struct ListRepositoriesArgs {
    #[schemars(description = "Azure DevOps project id or name. Omit to use the project currently selected in the Riva app")]
    pub project: Option<String>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema, Default)]
pub struct ListPullRequestsArgs {
    #[schemars(description = "Azure DevOps project id or name. Omit to use the project currently selected in the Riva app")]
    pub project: Option<String>,
    #[schemars(description = "Repository id or name. Optional — filters PRs to a single repo")]
    pub repository: Option<String>,
    #[schemars(description = "PR status: 'active' (default), 'completed', 'abandoned', or 'all'")]
    pub status: Option<String>,
    #[schemars(description = "Filter by creator email. Resolved server-side to identity")]
    pub creator: Option<String>,
    #[schemars(description = "Filter by reviewer email. Resolved server-side to identity")]
    pub reviewer: Option<String>,
    #[schemars(description = "Max results (default 50, max 200)")]
    pub top: Option<u32>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetPullRequestArgs {
    #[schemars(description = "Azure DevOps project id or name. Omit to use the project currently selected in the Riva app")]
    pub project: Option<String>,
    #[schemars(description = "Repository id or name")]
    pub repository: String,
    #[schemars(description = "Pull request id")]
    pub pr_id: u64,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct CreatePullRequestToolArgs {
    #[schemars(description = "Azure DevOps project id or name. Omit to use the project currently selected in the Riva app")]
    pub project: Option<String>,
    #[schemars(description = "Repository id or name")]
    pub repository: String,
    #[schemars(description = "Source branch (without refs/heads/ prefix)")]
    pub source_branch: String,
    #[schemars(description = "Target branch (without refs/heads/ prefix)")]
    pub target_branch: String,
    #[schemars(description = "PR title")]
    pub title: String,
    #[schemars(description = "PR description (Markdown). Optional")]
    pub description: Option<String>,
    #[schemars(description = "Open as draft. Default false")]
    pub draft: Option<bool>,
    #[schemars(description = "Reviewer emails. Each is resolved to an Azure identity. If any fails, no PR is created. Optional")]
    pub reviewers: Option<Vec<String>>,
    #[schemars(description = "Work item ids to link to the PR. Optional")]
    pub work_item_ids: Option<Vec<u64>>,
    #[schemars(description = "Set auto-complete on the PR (squash + delete source branch). Default false")]
    pub auto_complete: Option<bool>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct AddPrCommentArgs {
    #[schemars(description = "Azure DevOps project id or name. Omit to use the project currently selected in the Riva app")]
    pub project: Option<String>,
    #[schemars(description = "Repository id or name")]
    pub repository: String,
    #[schemars(description = "Pull request id")]
    pub pr_id: u64,
    #[schemars(description = "Comment content (plain text or Markdown)")]
    pub content: String,
    #[schemars(description = "Existing thread id to reply on. Omit to create a new general discussion thread")]
    pub thread_id: Option<u64>,
}

#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct PrVoteArgs {
    #[schemars(description = "Azure DevOps project id or name. Omit to use the project currently selected in the Riva app")]
    pub project: Option<String>,
    #[schemars(description = "Repository id or name")]
    pub repository: String,
    #[schemars(description = "Pull request id")]
    pub pr_id: u64,
}

impl RivaMcpServer {
    async fn dispatch_vote(&self, args: PrVoteArgs, action: VoteAction) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let project = resolve_project(&self.creds, args.project).await?;
        let vote = vote_for_action(action);
        azure::set_pr_vote(&c.org_url, &c.pat, &project, &args.repository, args.pr_id, vote)
            .await
            .map_err(azure_error)?;
        json_result(&serde_json::json!({ "ok": true, "vote": vote }))
    }
}

#[tool_router(router = pull_requests_router, vis = "pub")]
impl RivaMcpServer {
    #[tool(description = "List Git repositories in an Azure DevOps project. Falls back to the project selected in the Riva app")]
    pub(crate) async fn list_repositories(
        &self,
        Parameters(args): Parameters<ListRepositoriesArgs>,
    ) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let project = resolve_project(&self.creds, args.project).await?;
        let repos = azure::get_repositories(&c.org_url, &c.pat, &project)
            .await
            .map_err(azure_error)?;
        json_result(&repos)
    }

    #[tool(description = "List pull requests in a project, optionally filtered by repository, status, creator email, or reviewer email")]
    pub(crate) async fn list_pull_requests(
        &self,
        Parameters(args): Parameters<ListPullRequestsArgs>,
    ) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let project = resolve_project(&self.creds, args.project).await?;

        let creator_id = match args.creator {
            Some(email) => Some(
                azure::resolve_identity_by_email(&c.org_url, &c.pat, &email)
                    .await
                    .map_err(azure_error)?,
            ),
            None => None,
        };
        let reviewer_id = match args.reviewer {
            Some(email) => Some(
                azure::resolve_identity_by_email(&c.org_url, &c.pat, &email)
                    .await
                    .map_err(azure_error)?,
            ),
            None => None,
        };

        let filters = PullRequestFilters {
            status: args.status,
            creator_id,
            reviewer_id,
            repository_id: args.repository,
            top: args.top,
        };
        let prs = azure::get_pull_requests(&c.org_url, &c.pat, &project, filters)
            .await
            .map_err(azure_error)?;
        json_result(&prs)
    }

    #[tool(description = "Fetch a pull request with details: branches, status, reviewers + votes, linked work items, open threads, merge status")]
    pub(crate) async fn get_pull_request(
        &self,
        Parameters(args): Parameters<GetPullRequestArgs>,
    ) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let project = resolve_project(&self.creds, args.project).await?;
        let detail = azure::get_pull_request_detail(
            &c.org_url,
            &c.pat,
            &project,
            &args.repository,
            args.pr_id,
        )
        .await
        .map_err(azure_error)?;
        let threads = azure::get_pull_request_threads(
            &c.org_url,
            &c.pat,
            &project,
            &args.repository,
            args.pr_id,
        )
        .await
        .map_err(azure_error)?;
        let summary = serde_json::json!({
            "pull_request": detail,
            "threads": threads,
        });
        json_result(&summary)
    }

    #[tool(description = "Create a pull request. Resolves reviewer emails to Azure identities; auto-complete is enabled via a follow-up PATCH after the PR is created")]
    pub(crate) async fn create_pull_request(
        &self,
        Parameters(args): Parameters<CreatePullRequestToolArgs>,
    ) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let project = resolve_project(&self.creds, args.project).await?;

        let mut reviewer_ids = Vec::new();
        if let Some(emails) = &args.reviewers {
            for email in emails {
                let id = azure::resolve_identity_by_email(&c.org_url, &c.pat, email)
                    .await
                    .map_err(azure_error)?;
                reviewer_ids.push(id);
            }
        }

        let create_args = CreatePullRequestArgs {
            source_branch: args.source_branch,
            target_branch: args.target_branch,
            title: args.title,
            description: args.description,
            draft: args.draft.unwrap_or(false),
            reviewer_ids,
            work_item_ids: args.work_item_ids.unwrap_or_default(),
        };

        let pr = azure::create_pull_request(&c.org_url, &c.pat, &project, &args.repository, &create_args)
            .await
            .map_err(azure_error)?;

        let mut auto_complete_failed: Option<String> = None;
        if args.auto_complete.unwrap_or(false) {
            let user_id = self.creds.get_or_fetch_user_id().await?;
            if let Err(e) = azure::enable_pr_auto_complete(
                &c.org_url,
                &c.pat,
                &project,
                &args.repository,
                pr.pull_request_id,
                &user_id,
            )
            .await
            {
                auto_complete_failed = Some(e);
            }
        }

        let result = serde_json::json!({
            "pull_request": pr,
            "auto_complete_failed": auto_complete_failed,
        });
        json_result(&result)
    }

    #[tool(description = "Post a PR-level discussion comment. If thread_id is provided, replies on that thread; otherwise creates a new thread. Not for inline file/line comments")]
    pub(crate) async fn add_pr_comment(
        &self,
        Parameters(args): Parameters<AddPrCommentArgs>,
    ) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let project = resolve_project(&self.creds, args.project).await?;
        match args.thread_id {
            Some(tid) => {
                let comment = azure::add_pr_thread_comment(
                    &c.org_url,
                    &c.pat,
                    &project,
                    &args.repository,
                    args.pr_id,
                    tid,
                    &args.content,
                )
                .await
                .map_err(azure_error)?;
                json_result(&comment)
            }
            None => {
                let thread = azure::create_pr_thread(
                    &c.org_url,
                    &c.pat,
                    &project,
                    &args.repository,
                    args.pr_id,
                    &args.content,
                )
                .await
                .map_err(azure_error)?;
                json_result(&thread)
            }
        }
    }

    #[tool(description = "Approve a pull request (vote = 10)")]
    pub(crate) async fn approve_pull_request(
        &self,
        Parameters(args): Parameters<PrVoteArgs>,
    ) -> Result<CallToolResult, McpError> {
        self.dispatch_vote(args, VoteAction::Approve).await
    }

    #[tool(description = "Approve a pull request with suggestions (vote = 5)")]
    pub(crate) async fn approve_with_suggestions(
        &self,
        Parameters(args): Parameters<PrVoteArgs>,
    ) -> Result<CallToolResult, McpError> {
        self.dispatch_vote(args, VoteAction::ApproveWithSuggestions).await
    }

    #[tool(description = "Mark a pull request as waiting for author (vote = -5)")]
    pub(crate) async fn request_changes(
        &self,
        Parameters(args): Parameters<PrVoteArgs>,
    ) -> Result<CallToolResult, McpError> {
        self.dispatch_vote(args, VoteAction::RequestChanges).await
    }

    #[tool(description = "Reject a pull request (vote = -10)")]
    pub(crate) async fn reject_pull_request(
        &self,
        Parameters(args): Parameters<PrVoteArgs>,
    ) -> Result<CallToolResult, McpError> {
        self.dispatch_vote(args, VoteAction::Reject).await
    }

    #[tool(description = "Reset your vote on a pull request (vote = 0)")]
    pub(crate) async fn reset_vote(
        &self,
        Parameters(args): Parameters<PrVoteArgs>,
    ) -> Result<CallToolResult, McpError> {
        self.dispatch_vote(args, VoteAction::Reset).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn vote_for_action_table() {
        assert_eq!(vote_for_action(VoteAction::Approve), 10);
        assert_eq!(vote_for_action(VoteAction::ApproveWithSuggestions), 5);
        assert_eq!(vote_for_action(VoteAction::RequestChanges), -5);
        assert_eq!(vote_for_action(VoteAction::Reject), -10);
        assert_eq!(vote_for_action(VoteAction::Reset), 0);
    }
}
