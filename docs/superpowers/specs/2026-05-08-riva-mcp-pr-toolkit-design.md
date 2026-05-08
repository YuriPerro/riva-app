# Riva MCP — Pull Request Toolkit

**Date:** 2026-05-08
**Status:** Approved (pending implementation plan)

## Goal

Expand the Riva MCP server with a complete toolkit for Azure DevOps pull requests, so an LLM agent connected to Riva can list, read, create, comment on, and vote on PRs. Today the MCP exposes only work item primitives; PRs are the natural complement, and most of the underlying Azure plumbing already exists in `src-tauri/src/azure.rs` but is not surfaced via MCP.

## Non-Goals

- Adding repo selection to the Riva app UI (`McpSelection` stays project + team only).
- Inline file/line review comments. Only PR-level discussion threads in v1.
- Configurable merge strategy / branch deletion on auto-complete (defaults are fine for v1; revisit if asked).
- Bringing a Rust test mocking stack (`wiremock`, `mockito`) into the project. v1 leans on pure unit tests + manual smoke.

## Architecture

`src-tauri/src/mcp.rs` (single file, ~400 lines) becomes a module:

```
src-tauri/src/mcp/
├── mod.rs           # server struct, McpCredentialStore, helpers, run_server, list_tools
├── work_items.rs    # 8 existing tools moved as-is
└── pull_requests.rs # 10 new tools
```

`mod.rs` keeps:
- `RivaMcpServer` struct (`creds`, `tool_router`)
- `McpCredentialStore` and `McpCredentials`
- Helpers: `resolve_project`, `resolve_team`, `json_result`, `azure_error`
- `run_server`, `list_tools`
- `pub fn new(creds) -> Self` that merges the per-module routers

**Routing pattern:** `rmcp` supports multiple `#[tool_router(router_ident = ...)]` blocks on the same struct. Each module declares its own sub-router (`work_items_router`, `pull_requests_router`) and `new()` merges them into `tool_router`. State stays unified on the struct.

`lib.rs` and `mcp_config.rs` are unchanged. No frontend impact.

## Tool Inventory (10 new)

### Discovery

**`list_repositories(project?)`**
Returns `Vec<Repository { id, name, default_branch, web_url }>`. Falls back to the project selected in the Riva app.

### Read

**`list_pull_requests(project?, repository?, status?, creator?, reviewer?, top?)`**
Wraps and expands the existing `get_pull_requests` in `azure.rs`. Filters:
- `status`: `active | completed | abandoned | all` (default `active`)
- `creator`: email, resolved server-side via `resolve_identity_by_email` (see Identity Resolution)
- `reviewer`: email, resolved server-side via `resolve_identity_by_email`
- `top`: default 50, max 200

**`get_pull_request(project?, repository, pr_id)`**
Returns full PR detail: branches, status, reviewers + votes, linked work items, list of open threads (id, status, last comment author + truncated content), merge status, completion options.

### Write

**`create_pull_request(project?, repository, source_branch, target_branch, title, description?, draft?, reviewers?, work_item_ids?, auto_complete?)`**
Creates a PR. Returns the created PR plus `web_url`.

- `draft`: defaults to `false`
- `reviewers`: list of emails, resolved to identity ids before the create call
- `work_item_ids`: list of numeric ids, attached as `workItemRefs` in the create body
- `auto_complete`: if `true`, follows the create with a PATCH that sets `autoCompleteSetBy.id` to the current authenticated user, with default `mergeStrategy: "squash"` and `deleteSourceBranch: true`

### Comment

**`add_pr_comment(project?, repository, pr_id, content, thread_id?)`**
PR-level discussion only (not inline file comments). If `thread_id` is provided, replies on the existing thread; otherwise creates a new thread with one comment. Returns the comment.

### Vote (semantic actions)

All call the same backend helper `set_pr_vote(org_url, pat, project, repository, pr_id, vote)`:

- **`approve_pull_request(project?, repository, pr_id)`** — vote `10`
- **`approve_with_suggestions(project?, repository, pr_id)`** — vote `5`
- **`request_changes(project?, repository, pr_id)`** — vote `-5` (waiting for author)
- **`reject_pull_request(project?, repository, pr_id)`** — vote `-10`
- **`reset_vote(project?, repository, pr_id)`** — vote `0`

Total MCP tools after this work: **18** (8 work items + 10 PR).

## Backend Additions (`azure.rs`)

All follow the existing signature shape: `(org_url: &str, pat: &str, ...) -> Result<T, String>`.

### New functions

- `get_repositories(org_url, pat, project) -> Vec<Repository>`
  `GET {org}/{project}/_apis/git/repositories?api-version=7.1`. New struct `Repository { id, name, default_branch, web_url, project }`.

- `get_pull_request_detail(org_url, pat, project, repository, pr_id) -> PullRequestDetail`
  `GET .../pullrequests/{id}?$expand=all&api-version=7.1`. Includes `workItemRefs`, `mergeStatus`, `completionOptions`.

- `get_pull_request_threads(org_url, pat, project, repository, pr_id) -> Vec<PrThread>`
  Used by `get_pull_request` to summarise open threads.

- `create_pull_request(org_url, pat, project, repository, args: CreatePullRequestArgs) -> PullRequest`
  `POST .../pullrequests`. Body: `sourceRefName: "refs/heads/{source}"`, `targetRefName: "refs/heads/{target}"`, `isDraft`, `reviewers` (`[{ id }]`), `workItemRefs` (`[{ id, name: "ArtifactLink" }]`).

- `enable_pr_auto_complete(org_url, pat, project, repository, pr_id, set_by_id) -> ()`
  `PATCH .../pullrequests/{id}` with `autoCompleteSetBy: { id }` and default completion options.

- `create_pr_thread(org_url, pat, project, repository, pr_id, content) -> PrThread`
  `POST .../pullrequests/{id}/threads` with one initial comment.

- `add_pr_thread_comment(org_url, pat, project, repository, pr_id, thread_id, content) -> PrComment`
  `POST .../pullrequests/{id}/threads/{thread_id}/comments`.

- `set_pr_vote(org_url, pat, project, repository, pr_id, vote: i32) -> ()`
  Refactor of the existing `review_pull_request` (line 1028). Resolves the current user id internally via the cache (see Identity Resolution); caller no longer passes a reviewer id.

### Refactor

- Existing `get_pull_requests(org_url, pat, project)` (line 597) gains an optional `filters: PullRequestFilters` parameter (`status`, `creator_id`, `reviewer_id`, `top`). The current call site in `get_standup_data` (line 1629) passes `Default::default()` to keep behavior unchanged.

## Identity Resolution

Three call sites need it:
1. **Vote** — current authenticated user's id (the `reviewerId` in the PUT path).
2. **Auto-complete** — current authenticated user's id (`autoCompleteSetBy.id`).
3. **`reviewers` array on create** — list of emails resolved to identity ids.

### New helpers

- `get_current_user_id(org_url, pat) -> String`
  `GET {org_url}/_apis/connectionData?api-version=7.1`, returns `authenticatedUser.id`.

- `resolve_identity_by_email(org_url, pat, email) -> Result<String, String>`
  `GET {org_url}/_apis/identities?searchFilter=General&filterValue={email}&api-version=7.1`. Returns clear error `"Reviewer not found: {email}"` on miss. If multiple results, picks the first whose mail matches the input case-insensitively.

### Cache

`McpCredentialStore` gains an `Arc<RwLock<Option<String>>>` field `current_user_id_cache`, populated lazily on first vote/auto-complete call. Cleared in both `set()` and `clear()` (same triggers as the credentials).

### Reviewer resolution behavior on create

Sequential resolution (small N, typically 1-3). If any single email fails to resolve, abort before the create POST and return the failing email in the error. No partial PR creation.

## Error Handling

Pattern: `azure.rs` propagates `Result<_, String>`; the MCP layer wraps via the existing `azure_error()` helper, which produces `McpError`. No client-side validation duplicated from Azure's API.

| Scenario | Behavior |
|---|---|
| Repository not found | `"Repository '{name}' not found in project '{project}'"` |
| Source/target branch missing | Azure 400 propagated |
| PR already exists between same branches | Azure 409 propagated |
| Reviewer email doesn't resolve | Aborts pre-create: `"Reviewer not found: {email}"` |
| Work item id doesn't exist | Azure 400 propagated |
| Vote on completed/abandoned PR | Azure 400 propagated |
| PAT lacks `Code (Read & Write)` or `Pull Request Threads` scope | Azure 401/403 propagated |

### Partial state on auto-complete failure

If `POST .../pullrequests` succeeds but the follow-up `PATCH` for auto-complete fails, the PR exists without auto-complete. **Do not roll back** (deleting a freshly-created PR is destructive). Instead, return the created PR with an `auto_complete_failed: true` flag and the URL in the response, plus a warning string in the result. The agent decides next steps.

### Logging

Each tool logs `tool_name + project + repository + pr_id` on entry via `tracing` (existing pattern). Comment/description bodies are not logged (potentially sensitive content). Errors propagate without being swallowed.

## Testing

The `src-tauri/` crate has no project-owned tests today. Bringing a mock HTTP stack in just for this feature is over-investment. v1 strategy:

### 1. Pure unit tests (no network)

- `vote_for_action(action: VoteAction) -> i32` — table test, 5 cases mapping semantic action to vote integer.
- `build_create_pr_body(args, resolved_reviewer_ids) -> serde_json::Value` — extract body construction as a pure function; assert JSON shape including `workItemRefs` and `reviewers`.
- `parse_identity_response(json, email) -> Option<String>` — covers no-match, single-match, multi-match-case-insensitive.

### 2. Tool registry snapshot

In `mod.rs`, a `#[test]` that calls `list_tools()` and asserts the 18 expected names are present. Catches accidental tool removal during the refactor.

### 3. Manual smoke test

A checklist document committed alongside this spec (`2026-05-08-riva-mcp-pr-toolkit-smoke-test.md`) listing each of the 10 new tools with sample invocations and expected responses. Run via `bun tauri dev` + a connected MCP client.

### When to invest more

If a future feature warrants `wiremock`, fold these tests into integration coverage at that time. Not now.

## Open Questions

None as of approval. Implementation plan picks up from here.
