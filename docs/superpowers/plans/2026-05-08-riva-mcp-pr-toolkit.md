# Riva MCP — Pull Request Toolkit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 10-tool Pull Request toolkit to the Riva MCP server (list/get/create/comment/semantic vote actions), and refactor `mcp.rs` into a module so each Azure DevOps resource lives in its own file.

**Architecture:** Convert `src-tauri/src/mcp.rs` into `src-tauri/src/mcp/` with `mod.rs` (server, credentials, helpers, run_server, list_tools), `work_items.rs` (existing 8 tools moved as-is), and `pull_requests.rs` (10 new tools). Backend functions live in `src-tauri/src/azure.rs`. Multiple `#[tool_router]` blocks are merged in `RivaMcpServer::new()` using rmcp's `+` operator.

**Tech Stack:** Rust, Tauri 2.0, rmcp 1.4 (`server`, `macros`, `transport-streamable-http-server`, `schemars`), reqwest (already in tree), serde, tokio.

**Spec:** `docs/superpowers/specs/2026-05-08-riva-mcp-pr-toolkit-design.md` (commit 588fa7a)

---

## File Structure

| Path | Action | Responsibility |
|---|---|---|
| `src-tauri/src/mcp.rs` | Delete | Replaced by `mcp/` module |
| `src-tauri/src/mcp/mod.rs` | Create | `RivaMcpServer`, `McpCredentialStore`, helpers (`json_result`, `azure_error`, `resolve_project`, `resolve_team`), `run_server`, `list_tools`, snapshot tests |
| `src-tauri/src/mcp/work_items.rs` | Create | 8 existing tools, args structs, `work_items_router` |
| `src-tauri/src/mcp/pull_requests.rs` | Create | 10 new tools, args structs, `pull_requests_router`, `vote_for_action` helper |
| `src-tauri/src/azure.rs` | Modify | New PR functions (`get_repositories`, `get_pull_request_detail`, `create_pull_request`, etc.); promote `get_my_user_id` to pub; refactor `review_pull_request` → `set_pr_vote`; expand `get_pull_requests` with filters |
| `src-tauri/src/lib.rs` | Modify | None functionally — Rust auto-discovers the `mcp/` directory because `mod mcp;` resolves to either `mcp.rs` or `mcp/mod.rs` |
| `docs/superpowers/specs/2026-05-08-riva-mcp-pr-toolkit-smoke-test.md` | Create | Manual smoke checklist for all 10 new tools |

---

## Phase 0 — Refactor `mcp.rs` into module (no behavioral change)

### Task 0.1: Add baseline snapshot test for current 8 tools

**Files:**
- Modify: `src-tauri/src/mcp.rs` (append at the end)

- [ ] **Step 1: Append the snapshot test**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn list_tools_returns_expected_names() {
        let names: Vec<String> = list_tools().into_iter().map(|t| t.name).collect();
        let expected = [
            "list_projects",
            "list_teams",
            "list_boards",
            "list_work_items",
            "get_work_item",
            "create_work_item",
            "update_work_item",
            "delete_work_item",
        ];
        for name in expected {
            assert!(names.contains(&name.to_string()), "missing tool: {}", name);
        }
        assert_eq!(names.len(), expected.len(), "unexpected tool count: {:?}", names);
    }
}
```

- [ ] **Step 2: Run the test**

Run: `cd src-tauri && cargo test --lib mcp::tests::list_tools_returns_expected_names`
Expected: 1 test passes.

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/mcp.rs
git commit -m "test(mcp): snapshot the registered tool names"
```

---

### Task 0.2: Convert `mcp.rs` to `mcp/mod.rs`

**Files:**
- Delete: `src-tauri/src/mcp.rs`
- Create: `src-tauri/src/mcp/mod.rs` (with the contents previously in `mcp.rs`)

- [ ] **Step 1: Move the file**

```bash
mkdir -p src-tauri/src/mcp
git mv src-tauri/src/mcp.rs src-tauri/src/mcp/mod.rs
```

- [ ] **Step 2: Run snapshot test + build**

Run: `cd src-tauri && cargo build && cargo test --lib mcp::tests::list_tools_returns_expected_names`
Expected: build succeeds; test passes (no behavioral change).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor(mcp): move mcp.rs into mcp/mod.rs ahead of split"
```

---

### Task 0.3: Extract work item tools to `mcp/work_items.rs`

**Files:**
- Create: `src-tauri/src/mcp/work_items.rs`
- Modify: `src-tauri/src/mcp/mod.rs`

- [ ] **Step 1: Create `work_items.rs`**

Cut these items out of `mod.rs` and paste them into `work_items.rs`:

**Args structs to move** (currently in `mod.rs` lines 73-163):
- `ListTeamsArgs`
- `ListBoardsArgs`
- `ListWorkItemsArgs`
- `GetWorkItemArgs`
- `UpdateWorkItemArgs`
- `DeleteWorkItemArgs`
- `CreateWorkItemArgs`

**Tool methods to move** (currently in the `#[tool_router] impl RivaMcpServer` block, lines 209-349):
- `list_projects`
- `list_teams`
- `list_boards`
- `list_work_items`
- `get_work_item`
- `update_work_item`
- `delete_work_item`
- `create_work_item`

Each moved method gets visibility `pub(crate)`. The `pub fn new(...)` constructor stays in `mod.rs` (handled in Step 2).

Top of the new file:

```rust
use rmcp::{
    ErrorData as McpError,
    handler::server::{router::tool::ToolRouter, wrapper::Parameters},
    model::{CallToolResult, Content},
    schemars, tool, tool_router,
};
use serde::Deserialize;

use crate::azure;
use super::{RivaMcpServer, azure_error, json_result, resolve_project, resolve_team};

// Args structs (moved unchanged from mcp.rs lines 73-163)
// — ListTeamsArgs, ListBoardsArgs, ListWorkItemsArgs, GetWorkItemArgs,
// — UpdateWorkItemArgs, DeleteWorkItemArgs, CreateWorkItemArgs

#[tool_router(router = work_items_router, vis = "pub")]
impl RivaMcpServer {
    #[tool(description = "List all Azure DevOps projects visible to the authenticated user")]
    pub(crate) async fn list_projects(&self) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let projects = azure::get_projects(&c.org_url, &c.pat).await.map_err(azure_error)?;
        json_result(&projects)
    }

    // (other 7 tool methods moved unchanged from mcp.rs lines 222-349.
    //  Change visibility on each from default (private) to `pub(crate)`.
    //  No body edits.)
}
```

- [ ] **Step 2: Update `mod.rs`**

Remove the `#[tool_router] impl` block that contained the 8 tools and the args structs. Replace with:

```rust
mod work_items;

#[tool_router(router = core_router, vis = "pub")]
impl RivaMcpServer {
    pub fn new(creds: McpCredentialStore) -> Self {
        Self {
            creds,
            tool_router: Self::core_router() + Self::work_items_router(),
        }
    }
}
```

The `core_router` exists so `new()` follows the canonical rmcp pattern; it has no tools today and acts as the merge point. (Future modules merge with another `+`.)

Make `RivaMcpServer.creds` accessible to submodules:

```rust
#[derive(Clone)]
pub struct RivaMcpServer {
    pub(super) creds: McpCredentialStore,
    tool_router: ToolRouter<RivaMcpServer>,
}
```

Make helpers `pub(super)`:

```rust
pub(super) fn json_result<T: serde::Serialize>(value: &T) -> Result<CallToolResult, McpError> { ... }
pub(super) fn azure_error(e: String) -> McpError { ... }
pub(super) async fn resolve_project(...) -> Result<String, McpError> { ... }
pub(super) async fn resolve_team(...) -> Option<String> { ... }
```

- [ ] **Step 3: Run snapshot test + build**

Run: `cd src-tauri && cargo build && cargo test --lib mcp::tests::list_tools_returns_expected_names`
Expected: builds; snapshot still passes (8 names).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(mcp): extract work item tools into mcp::work_items"
```

---

## Phase 1 — Backend additions in `azure.rs`

### Task 1.1: Add `Repository` struct and `get_repositories`

**Files:**
- Modify: `src-tauri/src/azure.rs`

- [ ] **Step 1: Add the struct**

Place near the `PullRequestRepository` struct (around line 166):

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct Repository {
    pub id: String,
    pub name: String,
    #[serde(rename = "defaultBranch", default)]
    pub default_branch: Option<String>,
    #[serde(rename = "webUrl", default)]
    pub web_url: String,
    #[serde(default)]
    pub project: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
struct RepositoriesResponse {
    pub value: Vec<Repository>,
}
```

- [ ] **Step 2: Add the function**

After `get_pull_requests` (around line 630):

```rust
/// List Git repositories for a project.
pub async fn get_repositories(
    org_url: &str,
    pat: &str,
    project: &str,
) -> Result<Vec<Repository>, String> {
    let client = build_client(pat)?;
    let url = format!(
        "{}/{}/_apis/git/repositories?api-version=7.1",
        org_url.trim_end_matches('/'),
        encode_path_segment(project)
    );

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }
    resp.json::<RepositoriesResponse>()
        .await
        .map(|r| r.value)
        .map_err(|e| e.to_string())
}
```

- [ ] **Step 3: Build**

Run: `cd src-tauri && cargo build`
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/azure.rs
git commit -m "feat(azure): add get_repositories"
```

---

### Task 1.2: Identity helpers (TDD on `parse_identity_response`)

**Files:**
- Modify: `src-tauri/src/azure.rs`

- [ ] **Step 1: Write failing test for `parse_identity_response`**

Append at the bottom of `azure.rs`:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn parse_identity_response_no_match() {
        let body = json!({ "value": [] });
        assert_eq!(parse_identity_response(&body, "x@example.com"), None);
    }

    #[test]
    fn parse_identity_response_single_match() {
        let body = json!({
            "value": [
                { "id": "abc-123", "properties": { "Mail": { "$value": "alice@example.com" } } }
            ]
        });
        assert_eq!(parse_identity_response(&body, "alice@example.com").as_deref(), Some("abc-123"));
    }

    #[test]
    fn parse_identity_response_multi_match_picks_exact_email_case_insensitive() {
        let body = json!({
            "value": [
                { "id": "wrong", "properties": { "Mail": { "$value": "alice.fan@example.com" } } },
                { "id": "right", "properties": { "Mail": { "$value": "ALICE@example.com" } } }
            ]
        });
        assert_eq!(parse_identity_response(&body, "alice@example.com").as_deref(), Some("right"));
    }
}
```

Run: `cd src-tauri && cargo test --lib azure::tests::parse_identity_response_no_match`
Expected: FAIL — `parse_identity_response` not found.

- [ ] **Step 2: Implement the helper**

Add to `azure.rs` (in the section near other identity helpers, ~line 1010):

```rust
fn parse_identity_response(body: &serde_json::Value, email: &str) -> Option<String> {
    let needle = email.to_ascii_lowercase();
    let entries = body.get("value")?.as_array()?;

    let exact = entries.iter().find(|e| {
        let mail = e.pointer("/properties/Mail/$value").and_then(|v| v.as_str()).unwrap_or("");
        mail.eq_ignore_ascii_case(&needle)
    });

    let chosen = exact.or_else(|| entries.first());
    chosen?.get("id")?.as_str().map(String::from)
}
```

- [ ] **Step 3: Tests pass**

Run: `cd src-tauri && cargo test --lib azure::tests::parse_identity_response`
Expected: 3 tests pass.

- [ ] **Step 4: Add `resolve_identity_by_email` and promote `get_my_user_id`**

In `azure.rs`, change the existing `async fn get_my_user_id` (line 1010) signature to `pub async fn`. Then add below it:

```rust
/// Resolve an Azure DevOps identity id from an email address.
pub async fn resolve_identity_by_email(
    org_url: &str,
    pat: &str,
    email: &str,
) -> Result<String, String> {
    let client = build_client(pat)?;
    let url = format!(
        "{}/_apis/identities?searchFilter=General&filterValue={}&api-version=7.1",
        org_url.trim_end_matches('/'),
        encode_path_segment(email)
    );
    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }
    let body: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    parse_identity_response(&body, email).ok_or_else(|| format!("Reviewer not found: {}", email))
}
```

Uses the existing `encode_path_segment` helper in `azure.rs`. Verify with `grep -n "fn encode_path_segment" src-tauri/src/azure.rs`.

- [ ] **Step 5: Build**

Run: `cd src-tauri && cargo build`
Expected: clean build.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/azure.rs
git commit -m "feat(azure): identity-by-email helper and pub get_my_user_id"
```

---

### Task 1.3: Expand `get_pull_requests` with filters

**Files:**
- Modify: `src-tauri/src/azure.rs`

- [ ] **Step 1: Add filter struct**

Above the existing `get_pull_requests` (line 597):

```rust
#[derive(Debug, Default, Clone)]
pub struct PullRequestFilters {
    pub status: Option<String>,
    pub creator_id: Option<String>,
    pub reviewer_id: Option<String>,
    pub repository_id: Option<String>,
    pub top: Option<u32>,
}
```

- [ ] **Step 2: Update the function**

Replace the body of `get_pull_requests` (lines 597-630):

```rust
pub async fn get_pull_requests(
    org_url: &str,
    pat: &str,
    project: &str,
    filters: PullRequestFilters,
) -> Result<Vec<PullRequest>, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');

    let mut params = vec![format!("api-version=7.1")];
    let status = filters.status.as_deref().unwrap_or("active");
    params.push(format!("searchCriteria.status={}", status));
    if let Some(id) = &filters.creator_id {
        params.push(format!("searchCriteria.creatorId={}", id));
    }
    if let Some(id) = &filters.reviewer_id {
        params.push(format!("searchCriteria.reviewerId={}", id));
    }
    if let Some(id) = &filters.repository_id {
        params.push(format!("searchCriteria.repositoryId={}", id));
    }
    let top = filters.top.unwrap_or(50).min(200);
    params.push(format!("$top={}", top));

    let url = format!("{}/{}/_apis/git/pullrequests?{}", base, project, params.join("&"));

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }
    let mut prs = resp
        .json::<PullRequestsResponse>()
        .await
        .map(|r| r.value)
        .map_err(|e| e.to_string())?;

    for pr in &mut prs {
        pr.web_url = format!("{}/{}/_git/{}/pullrequest/{}", base, project, pr.repository.name, pr.pull_request_id);
    }
    Ok(prs)
}
```

- [ ] **Step 3: Update existing caller in `get_standup_data`**

`grep -n "get_pull_requests(" src-tauri/src/azure.rs` finds the call site (currently line ~1629).

Change `get_pull_requests(org_url, pat, project)` → `get_pull_requests(org_url, pat, project, PullRequestFilters::default())`.

- [ ] **Step 4: Build**

Run: `cd src-tauri && cargo build`
Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/azure.rs
git commit -m "feat(azure): pull request filters (status, creator, reviewer, repo, top)"
```

---

### Task 1.4: Rename `review_pull_request` → `set_pr_vote`

**Files:**
- Modify: `src-tauri/src/azure.rs`

- [ ] **Step 1: Rename and simplify**

Replace `review_pull_request` (line 1028) with:

```rust
pub async fn set_pr_vote(
    org_url: &str,
    pat: &str,
    project: &str,
    repository: &str,
    pr_id: u64,
    vote: i32,
) -> Result<(), String> {
    let user_id = get_my_user_id(org_url, pat).await?;
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let url = format!(
        "{}/{}/_apis/git/repositories/{}/pullrequests/{}/reviewers/{}?api-version=7.1",
        base, project, repository, pr_id, user_id
    );
    let resp = client
        .put(&url)
        .json(&serde_json::json!({ "vote": vote }))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }
    Ok(())
}
```

- [ ] **Step 2: Find and update callers**

```bash
grep -rn "review_pull_request" src-tauri/src/
```

If there are non-test callers (e.g., a Tauri command in `lib.rs`), rename the call. Tauri command names exposed to the frontend should stay stable for now — if `review_pull_request` is also a `#[tauri::command]`, keep that command name and just have it call `azure::set_pr_vote` internally.

- [ ] **Step 3: Build**

Run: `cd src-tauri && cargo build`
Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/azure.rs src-tauri/src/lib.rs
git commit -m "refactor(azure): rename review_pull_request to set_pr_vote"
```

---

### Task 1.5: Add `get_pull_request_detail` and `get_pull_request_threads`

**Files:**
- Modify: `src-tauri/src/azure.rs`

- [ ] **Step 1: Add detail structs**

Near the existing PR structs (line 172):

```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct PullRequestDetail {
    #[serde(flatten)]
    pub base: PullRequest,
    #[serde(rename = "mergeStatus", default)]
    pub merge_status: Option<String>,
    #[serde(rename = "completionOptions", default)]
    pub completion_options: Option<serde_json::Value>,
    #[serde(rename = "workItemRefs", default)]
    pub work_item_refs: Vec<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrThreadComment {
    #[serde(default)]
    pub id: u64,
    #[serde(default)]
    pub content: String,
    #[serde(default)]
    pub author: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrThread {
    pub id: u64,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub comments: Vec<PrThreadComment>,
}

#[derive(Debug, Deserialize)]
struct PrThreadsResponse { pub value: Vec<PrThread> }
```

- [ ] **Step 2: Add the two functions**

Near the other PR functions:

```rust
pub async fn get_pull_request_detail(
    org_url: &str,
    pat: &str,
    project: &str,
    repository: &str,
    pr_id: u64,
) -> Result<PullRequestDetail, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let url = format!(
        "{}/{}/_apis/git/repositories/{}/pullrequests/{}?$expand=all&api-version=7.1",
        base, project, repository, pr_id
    );
    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }
    let mut detail: PullRequestDetail = resp.json().await.map_err(|e| e.to_string())?;
    detail.base.web_url = format!(
        "{}/{}/_git/{}/pullrequest/{}",
        base, project, detail.base.repository.name, detail.base.pull_request_id
    );
    Ok(detail)
}

pub async fn get_pull_request_threads(
    org_url: &str,
    pat: &str,
    project: &str,
    repository: &str,
    pr_id: u64,
) -> Result<Vec<PrThread>, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let url = format!(
        "{}/{}/_apis/git/repositories/{}/pullrequests/{}/threads?api-version=7.1",
        base, project, repository, pr_id
    );
    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }
    resp.json::<PrThreadsResponse>().await.map(|r| r.value).map_err(|e| e.to_string())
}
```

- [ ] **Step 3: Build + commit**

```bash
cd src-tauri && cargo build
git add src-tauri/src/azure.rs
git commit -m "feat(azure): get_pull_request_detail and get_pull_request_threads"
```

---

### Task 1.6: TDD `vote_for_action` helper

**Files:**
- Modify: `src-tauri/src/mcp/pull_requests.rs` (created in Task 3.1, but this helper is module-scoped to PRs)

This task is performed AFTER Task 3.1 creates `pull_requests.rs`. Reorder if executing strictly sequentially: do 3.1 first, then 1.6.

- [ ] **Step 1: Add VoteAction enum + failing test**

In `pull_requests.rs`:

```rust
#[derive(Clone, Copy)]
pub(crate) enum VoteAction {
    Approve,
    ApproveWithSuggestions,
    RequestChanges,
    Reject,
    Reset,
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
```

Run: `cd src-tauri && cargo test --lib mcp::pull_requests::tests::vote_for_action_table`
Expected: FAIL — `vote_for_action` not defined.

- [ ] **Step 2: Implement**

```rust
pub(crate) fn vote_for_action(a: VoteAction) -> i32 {
    match a {
        VoteAction::Approve => 10,
        VoteAction::ApproveWithSuggestions => 5,
        VoteAction::RequestChanges => -5,
        VoteAction::Reject => -10,
        VoteAction::Reset => 0,
    }
}
```

- [ ] **Step 3: Tests pass + commit**

```bash
cd src-tauri && cargo test --lib mcp::pull_requests::tests::vote_for_action_table
git add src-tauri/src/mcp/pull_requests.rs
git commit -m "feat(mcp): vote_for_action helper for semantic PR votes"
```

---

### Task 1.7: TDD `build_create_pr_body`

**Files:**
- Modify: `src-tauri/src/azure.rs`

- [ ] **Step 1: Add the args struct + failing test**

Near the other PR structs:

```rust
#[derive(Debug, Default, Clone)]
pub struct CreatePullRequestArgs {
    pub source_branch: String,
    pub target_branch: String,
    pub title: String,
    pub description: Option<String>,
    pub draft: bool,
    pub reviewer_ids: Vec<String>,
    pub work_item_ids: Vec<u64>,
}
```

Append to the test module:

```rust
#[test]
fn build_create_pr_body_minimal() {
    let args = CreatePullRequestArgs {
        source_branch: "feature/x".into(),
        target_branch: "main".into(),
        title: "T".into(),
        ..Default::default()
    };
    let body = build_create_pr_body(&args);
    assert_eq!(body["sourceRefName"], "refs/heads/feature/x");
    assert_eq!(body["targetRefName"], "refs/heads/main");
    assert_eq!(body["title"], "T");
    assert_eq!(body["isDraft"], false);
    assert!(body.get("reviewers").is_none() || body["reviewers"].as_array().unwrap().is_empty());
    assert!(body.get("workItemRefs").is_none() || body["workItemRefs"].as_array().unwrap().is_empty());
}

#[test]
fn build_create_pr_body_full() {
    let args = CreatePullRequestArgs {
        source_branch: "feature/x".into(),
        target_branch: "main".into(),
        title: "T".into(),
        description: Some("body".into()),
        draft: true,
        reviewer_ids: vec!["id-1".into(), "id-2".into()],
        work_item_ids: vec![123, 456],
    };
    let body = build_create_pr_body(&args);
    assert_eq!(body["isDraft"], true);
    assert_eq!(body["description"], "body");
    let reviewers = body["reviewers"].as_array().unwrap();
    assert_eq!(reviewers.len(), 2);
    assert_eq!(reviewers[0]["id"], "id-1");
    let refs = body["workItemRefs"].as_array().unwrap();
    assert_eq!(refs.len(), 2);
    assert_eq!(refs[0]["id"], "123");
    assert_eq!(refs[0]["name"], "ArtifactLink");
}
```

Run: `cd src-tauri && cargo test --lib azure::tests::build_create_pr_body`
Expected: FAIL — function not defined.

- [ ] **Step 2: Implement**

In `azure.rs`:

```rust
pub fn build_create_pr_body(args: &CreatePullRequestArgs) -> serde_json::Value {
    let mut body = serde_json::json!({
        "sourceRefName": format!("refs/heads/{}", args.source_branch),
        "targetRefName": format!("refs/heads/{}", args.target_branch),
        "title": args.title,
        "isDraft": args.draft,
    });
    if let Some(d) = &args.description {
        body["description"] = serde_json::Value::String(d.clone());
    }
    if !args.reviewer_ids.is_empty() {
        body["reviewers"] = args.reviewer_ids.iter()
            .map(|id| serde_json::json!({ "id": id }))
            .collect();
    }
    if !args.work_item_ids.is_empty() {
        body["workItemRefs"] = args.work_item_ids.iter()
            .map(|id| serde_json::json!({ "id": id.to_string(), "name": "ArtifactLink" }))
            .collect();
    }
    body
}
```

- [ ] **Step 3: Tests pass + commit**

```bash
cd src-tauri && cargo test --lib azure::tests::build_create_pr_body
git add src-tauri/src/azure.rs
git commit -m "feat(azure): build_create_pr_body pure helper"
```

---

### Task 1.8: Add `create_pull_request`

**Files:**
- Modify: `src-tauri/src/azure.rs`

- [ ] **Step 1: Add the function**

```rust
pub async fn create_pull_request(
    org_url: &str,
    pat: &str,
    project: &str,
    repository: &str,
    args: &CreatePullRequestArgs,
) -> Result<PullRequest, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let url = format!(
        "{}/{}/_apis/git/repositories/{}/pullrequests?api-version=7.1",
        base, project, repository
    );
    let body = build_create_pr_body(args);
    let resp = client.post(&url).json(&body).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }
    let mut pr: PullRequest = resp.json().await.map_err(|e| e.to_string())?;
    pr.web_url = format!(
        "{}/{}/_git/{}/pullrequest/{}",
        base, project, pr.repository.name, pr.pull_request_id
    );
    Ok(pr)
}
```

- [ ] **Step 2: Build + commit**

```bash
cd src-tauri && cargo build
git add src-tauri/src/azure.rs
git commit -m "feat(azure): create_pull_request"
```

---

### Task 1.9: Add `enable_pr_auto_complete`

**Files:**
- Modify: `src-tauri/src/azure.rs`

- [ ] **Step 1: Add the function**

```rust
pub async fn enable_pr_auto_complete(
    org_url: &str,
    pat: &str,
    project: &str,
    repository: &str,
    pr_id: u64,
    set_by_id: &str,
) -> Result<(), String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let url = format!(
        "{}/{}/_apis/git/repositories/{}/pullrequests/{}?api-version=7.1",
        base, project, repository, pr_id
    );
    let body = serde_json::json!({
        "autoCompleteSetBy": { "id": set_by_id },
        "completionOptions": {
            "mergeStrategy": "squash",
            "deleteSourceBranch": true,
        }
    });
    let resp = client.patch(&url).json(&body).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }
    Ok(())
}
```

- [ ] **Step 2: Build + commit**

```bash
cd src-tauri && cargo build
git add src-tauri/src/azure.rs
git commit -m "feat(azure): enable_pr_auto_complete"
```

---

### Task 1.10: Add `create_pr_thread` and `add_pr_thread_comment`

**Files:**
- Modify: `src-tauri/src/azure.rs`

- [ ] **Step 1: Add both functions**

```rust
pub async fn create_pr_thread(
    org_url: &str,
    pat: &str,
    project: &str,
    repository: &str,
    pr_id: u64,
    content: &str,
) -> Result<PrThread, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let url = format!(
        "{}/{}/_apis/git/repositories/{}/pullrequests/{}/threads?api-version=7.1",
        base, project, repository, pr_id
    );
    let body = serde_json::json!({
        "comments": [{ "content": content, "commentType": "text" }],
        "status": "active",
    });
    let resp = client.post(&url).json(&body).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }
    resp.json::<PrThread>().await.map_err(|e| e.to_string())
}

pub async fn add_pr_thread_comment(
    org_url: &str,
    pat: &str,
    project: &str,
    repository: &str,
    pr_id: u64,
    thread_id: u64,
    content: &str,
) -> Result<PrThreadComment, String> {
    let client = build_client(pat)?;
    let base = org_url.trim_end_matches('/');
    let url = format!(
        "{}/{}/_apis/git/repositories/{}/pullrequests/{}/threads/{}/comments?api-version=7.1",
        base, project, repository, pr_id, thread_id
    );
    let body = serde_json::json!({ "content": content, "commentType": "text" });
    let resp = client.post(&url).json(&body).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(api_error(resp).await);
    }
    resp.json::<PrThreadComment>().await.map_err(|e| e.to_string())
}
```

- [ ] **Step 2: Build + commit**

```bash
cd src-tauri && cargo build
git add src-tauri/src/azure.rs
git commit -m "feat(azure): create_pr_thread and add_pr_thread_comment"
```

---

## Phase 2 — Cache the current user id in `McpCredentialStore`

### Task 2.1: Add `current_user_id_cache`

**Files:**
- Modify: `src-tauri/src/mcp/mod.rs`

- [ ] **Step 1: Update the struct and methods**

```rust
#[derive(Clone, Default)]
pub struct McpCredentialStore {
    credentials: Arc<RwLock<Option<McpCredentials>>>,
    selection: Arc<RwLock<McpSelection>>,
    current_user_id: Arc<RwLock<Option<String>>>,
}

impl McpCredentialStore {
    pub fn new() -> Self {
        Self {
            credentials: Arc::new(RwLock::new(None)),
            selection: Arc::new(RwLock::new(McpSelection::default())),
            current_user_id: Arc::new(RwLock::new(None)),
        }
    }

    pub async fn set(&self, creds: McpCredentials) {
        *self.credentials.write().await = Some(creds);
        *self.current_user_id.write().await = None;
    }

    pub async fn clear(&self) {
        *self.credentials.write().await = None;
        *self.selection.write().await = McpSelection::default();
        *self.current_user_id.write().await = None;
    }

    pub async fn get_or_fetch_user_id(&self) -> Result<String, McpError> {
        if let Some(id) = self.current_user_id.read().await.clone() {
            return Ok(id);
        }
        let c = self.get().await?;
        let id = crate::azure::get_my_user_id(&c.org_url, &c.pat)
            .await
            .map_err(azure_error)?;
        *self.current_user_id.write().await = Some(id.clone());
        Ok(id)
    }
}
```

`azure_error` is the same module-level helper that already lives in `mod.rs` — `McpCredentialStore`'s impl block is in the same file, so the unqualified call resolves correctly.

- [ ] **Step 2: Build + commit**

```bash
cd src-tauri && cargo build
git add src-tauri/src/mcp/mod.rs
git commit -m "feat(mcp): cache current user id in credential store"
```

---

## Phase 3 — PR tools module

### Task 3.1: Create `mcp/pull_requests.rs` skeleton with merged router

**Files:**
- Create: `src-tauri/src/mcp/pull_requests.rs`
- Modify: `src-tauri/src/mcp/mod.rs`

- [ ] **Step 1: Create the file**

```rust
use rmcp::{
    ErrorData as McpError,
    handler::server::wrapper::Parameters,
    model::{CallToolResult, Content},
    schemars, tool, tool_router,
};
use serde::Deserialize;

use crate::azure::{self, CreatePullRequestArgs, PullRequestFilters};
use super::{RivaMcpServer, azure_error, json_result, resolve_project};

#[tool_router(router = pull_requests_router, vis = "pub")]
impl RivaMcpServer {
    // Tools added in tasks 3.2 - 3.7
}
```

- [ ] **Step 2: Wire into `mod.rs`**

```rust
mod work_items;
mod pull_requests;

#[tool_router(router = core_router, vis = "pub")]
impl RivaMcpServer {
    pub fn new(creds: McpCredentialStore) -> Self {
        Self {
            creds,
            tool_router: Self::core_router()
                + Self::work_items_router()
                + Self::pull_requests_router(),
        }
    }
}
```

- [ ] **Step 3: Build**

Run: `cd src-tauri && cargo build`
Expected: clean build (zero new tools registered yet).

- [ ] **Step 4: Now do Task 1.6** (`vote_for_action`) and return here.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/mcp/
git commit -m "feat(mcp): scaffold pull_requests module"
```

---

### Task 3.2: `list_repositories` tool

**Files:**
- Modify: `src-tauri/src/mcp/pull_requests.rs`

- [ ] **Step 1: Add args + tool**

```rust
#[derive(Debug, Deserialize, schemars::JsonSchema, Default)]
pub struct ListRepositoriesArgs {
    #[schemars(description = "Azure DevOps project id or name. Omit to use the project currently selected in the Riva app")]
    pub project: Option<String>,
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
        let repos = azure::get_repositories(&c.org_url, &c.pat, &project).await.map_err(azure_error)?;
        json_result(&repos)
    }
}
```

- [ ] **Step 2: Build + commit**

```bash
cd src-tauri && cargo build
git add src-tauri/src/mcp/pull_requests.rs
git commit -m "feat(mcp): list_repositories tool"
```

---

### Task 3.3: `list_pull_requests` tool

**Files:**
- Modify: `src-tauri/src/mcp/pull_requests.rs`

- [ ] **Step 1: Add args + tool**

```rust
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

#[tool_router(router = pull_requests_router, vis = "pub")]
impl RivaMcpServer {
    #[tool(description = "List pull requests in a project, optionally filtered by repository, status, creator email, or reviewer email")]
    pub(crate) async fn list_pull_requests(
        &self,
        Parameters(args): Parameters<ListPullRequestsArgs>,
    ) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let project = resolve_project(&self.creds, args.project).await?;

        let creator_id = match args.creator {
            Some(email) => Some(azure::resolve_identity_by_email(&c.org_url, &c.pat, &email).await.map_err(azure_error)?),
            None => None,
        };
        let reviewer_id = match args.reviewer {
            Some(email) => Some(azure::resolve_identity_by_email(&c.org_url, &c.pat, &email).await.map_err(azure_error)?),
            None => None,
        };

        let filters = PullRequestFilters {
            status: args.status,
            creator_id,
            reviewer_id,
            repository_id: args.repository,
            top: args.top,
        };
        let prs = azure::get_pull_requests(&c.org_url, &c.pat, &project, filters).await.map_err(azure_error)?;
        json_result(&prs)
    }
}
```

- [ ] **Step 2: Build + commit**

```bash
cd src-tauri && cargo build
git add src-tauri/src/mcp/pull_requests.rs
git commit -m "feat(mcp): list_pull_requests tool"
```

---

### Task 3.4: `get_pull_request` tool

**Files:**
- Modify: `src-tauri/src/mcp/pull_requests.rs`

- [ ] **Step 1: Add args + tool**

```rust
#[derive(Debug, Deserialize, schemars::JsonSchema)]
pub struct GetPullRequestArgs {
    #[schemars(description = "Azure DevOps project id or name. Omit to use the project currently selected in the Riva app")]
    pub project: Option<String>,
    #[schemars(description = "Repository id or name")]
    pub repository: String,
    #[schemars(description = "Pull request id")]
    pub pr_id: u64,
}

#[tool_router(router = pull_requests_router, vis = "pub")]
impl RivaMcpServer {
    #[tool(description = "Fetch a pull request with details: branches, status, reviewers + votes, linked work items, open threads, merge status")]
    pub(crate) async fn get_pull_request(
        &self,
        Parameters(args): Parameters<GetPullRequestArgs>,
    ) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let project = resolve_project(&self.creds, args.project).await?;
        let detail = azure::get_pull_request_detail(&c.org_url, &c.pat, &project, &args.repository, args.pr_id).await.map_err(azure_error)?;
        let threads = azure::get_pull_request_threads(&c.org_url, &c.pat, &project, &args.repository, args.pr_id).await.map_err(azure_error)?;
        let summary = serde_json::json!({
            "pull_request": detail,
            "threads": threads,
        });
        json_result(&summary)
    }
}
```

- [ ] **Step 2: Build + commit**

```bash
cd src-tauri && cargo build
git add src-tauri/src/mcp/pull_requests.rs
git commit -m "feat(mcp): get_pull_request tool"
```

---

### Task 3.5: `create_pull_request` tool

**Files:**
- Modify: `src-tauri/src/mcp/pull_requests.rs`

- [ ] **Step 1: Add args + tool**

```rust
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

#[tool_router(router = pull_requests_router, vis = "pub")]
impl RivaMcpServer {
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
                let id = azure::resolve_identity_by_email(&c.org_url, &c.pat, email).await.map_err(azure_error)?;
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

        let pr = azure::create_pull_request(&c.org_url, &c.pat, &project, &args.repository, &create_args).await.map_err(azure_error)?;

        let mut auto_complete_failed: Option<String> = None;
        if args.auto_complete.unwrap_or(false) {
            let user_id = self.creds.get_or_fetch_user_id().await?;
            if let Err(e) = azure::enable_pr_auto_complete(
                &c.org_url, &c.pat, &project, &args.repository, pr.pull_request_id, &user_id
            ).await {
                auto_complete_failed = Some(e);
            }
        }

        let result = serde_json::json!({
            "pull_request": pr,
            "auto_complete_failed": auto_complete_failed,
        });
        json_result(&result)
    }
}
```

- [ ] **Step 2: Build + commit**

```bash
cd src-tauri && cargo build
git add src-tauri/src/mcp/pull_requests.rs
git commit -m "feat(mcp): create_pull_request tool"
```

---

### Task 3.6: `add_pr_comment` tool

**Files:**
- Modify: `src-tauri/src/mcp/pull_requests.rs`

- [ ] **Step 1: Add args + tool**

```rust
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

#[tool_router(router = pull_requests_router, vis = "pub")]
impl RivaMcpServer {
    #[tool(description = "Post a PR-level discussion comment. If thread_id is provided, replies on that thread; otherwise creates a new thread. Not for inline file/line comments")]
    pub(crate) async fn add_pr_comment(
        &self,
        Parameters(args): Parameters<AddPrCommentArgs>,
    ) -> Result<CallToolResult, McpError> {
        let c = self.creds.get().await?;
        let project = resolve_project(&self.creds, args.project).await?;
        match args.thread_id {
            Some(tid) => {
                let comment = azure::add_pr_thread_comment(&c.org_url, &c.pat, &project, &args.repository, args.pr_id, tid, &args.content).await.map_err(azure_error)?;
                json_result(&comment)
            }
            None => {
                let thread = azure::create_pr_thread(&c.org_url, &c.pat, &project, &args.repository, args.pr_id, &args.content).await.map_err(azure_error)?;
                json_result(&thread)
            }
        }
    }
}
```

- [ ] **Step 2: Build + commit**

```bash
cd src-tauri && cargo build
git add src-tauri/src/mcp/pull_requests.rs
git commit -m "feat(mcp): add_pr_comment tool"
```

---

### Task 3.7: 5 vote tools (semantic actions)

**Files:**
- Modify: `src-tauri/src/mcp/pull_requests.rs`

- [ ] **Step 1: Add shared args + private dispatch**

```rust
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
        azure::set_pr_vote(&c.org_url, &c.pat, &project, &args.repository, args.pr_id, vote).await.map_err(azure_error)?;
        json_result(&serde_json::json!({ "ok": true, "vote": vote }))
    }
}
```

- [ ] **Step 2: Add the 5 tool methods**

```rust
#[tool_router(router = pull_requests_router, vis = "pub")]
impl RivaMcpServer {
    #[tool(description = "Approve a pull request (vote = 10)")]
    pub(crate) async fn approve_pull_request(&self, Parameters(args): Parameters<PrVoteArgs>) -> Result<CallToolResult, McpError> {
        self.dispatch_vote(args, VoteAction::Approve).await
    }

    #[tool(description = "Approve a pull request with suggestions (vote = 5)")]
    pub(crate) async fn approve_with_suggestions(&self, Parameters(args): Parameters<PrVoteArgs>) -> Result<CallToolResult, McpError> {
        self.dispatch_vote(args, VoteAction::ApproveWithSuggestions).await
    }

    #[tool(description = "Mark a pull request as waiting for author (vote = -5)")]
    pub(crate) async fn request_changes(&self, Parameters(args): Parameters<PrVoteArgs>) -> Result<CallToolResult, McpError> {
        self.dispatch_vote(args, VoteAction::RequestChanges).await
    }

    #[tool(description = "Reject a pull request (vote = -10)")]
    pub(crate) async fn reject_pull_request(&self, Parameters(args): Parameters<PrVoteArgs>) -> Result<CallToolResult, McpError> {
        self.dispatch_vote(args, VoteAction::Reject).await
    }

    #[tool(description = "Reset your vote on a pull request (vote = 0)")]
    pub(crate) async fn reset_vote(&self, Parameters(args): Parameters<PrVoteArgs>) -> Result<CallToolResult, McpError> {
        self.dispatch_vote(args, VoteAction::Reset).await
    }
}
```

- [ ] **Step 3: Build + commit**

```bash
cd src-tauri && cargo build
git add src-tauri/src/mcp/pull_requests.rs
git commit -m "feat(mcp): semantic PR vote tools"
```

---

### Task 3.8: Update snapshot test to 18 tools

**Files:**
- Modify: `src-tauri/src/mcp/mod.rs`

- [ ] **Step 1: Replace the test**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn list_tools_returns_all_18_names() {
        let names: Vec<String> = list_tools().into_iter().map(|t| t.name).collect();
        let expected = [
            "list_projects",
            "list_teams",
            "list_boards",
            "list_work_items",
            "get_work_item",
            "create_work_item",
            "update_work_item",
            "delete_work_item",
            "list_repositories",
            "list_pull_requests",
            "get_pull_request",
            "create_pull_request",
            "add_pr_comment",
            "approve_pull_request",
            "approve_with_suggestions",
            "request_changes",
            "reject_pull_request",
            "reset_vote",
        ];
        for name in expected {
            assert!(names.contains(&name.to_string()), "missing tool: {}", name);
        }
        assert_eq!(names.len(), expected.len(), "unexpected tool count: {:?}", names);
    }
}
```

- [ ] **Step 2: Update server description**

In `get_info()` of `mcp/mod.rs`, update the instruction string from `"Available tools: list_projects, ..."` to include the 10 new names.

- [ ] **Step 3: Test + commit**

```bash
cd src-tauri && cargo test --lib mcp::tests::list_tools_returns_all_18_names
git add src-tauri/src/mcp/mod.rs
git commit -m "test(mcp): snapshot all 18 tool names"
```

---

## Phase 4 — Smoke test doc

### Task 4.1: Write the smoke checklist

**Files:**
- Create: `docs/superpowers/specs/2026-05-08-riva-mcp-pr-toolkit-smoke-test.md`

- [ ] **Step 1: Write the checklist**

```markdown
# Riva MCP PR Toolkit — Manual Smoke Test

## Setup
1. `bun tauri dev`
2. Sign in to AzDO inside Riva (PAT with `Code (Read & Write)` and `Pull Request Threads` scopes).
3. Connect a Claude Code or other MCP client to the Riva HTTP MCP endpoint.
4. Pick a low-stakes test repo with a feature branch ready.

## Tools to verify

For each tool: invoke once with valid args, once with a deliberately bad arg (e.g., wrong repo name).

- [ ] `list_repositories` — happy path; expect array with at least one repo
- [ ] `list_pull_requests` — no filters; with `status=completed`; with `creator=<your email>`
- [ ] `get_pull_request` — known PR id; threads array present
- [ ] `create_pull_request` — minimal args; with reviewers; with work_item_ids; with auto_complete=true; with bad reviewer email (expect "Reviewer not found")
- [ ] `add_pr_comment` — new thread; reply on existing thread_id
- [ ] `approve_pull_request` — verify vote shows in AzDO web UI as approved
- [ ] `approve_with_suggestions` — verify vote
- [ ] `request_changes` — verify vote
- [ ] `reject_pull_request` — verify vote
- [ ] `reset_vote` — verify vote cleared

## Regression
- [ ] `list_work_items` still works
- [ ] `get_work_item` still works
- [ ] Server startup logs show 18 tools registered
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-05-08-riva-mcp-pr-toolkit-smoke-test.md
git commit -m "docs(specs): smoke test checklist for PR toolkit"
```

---

## Phase 5 — Final verification

### Task 5.1: Full build + test sweep

- [ ] **Step 1: Run all checks**

```bash
cd src-tauri && cargo build
cd src-tauri && cargo test --lib
cd .. && bunx tsc --noEmit
cd .. && bun run build
```

Expected: all green. No new warnings introduced compared to baseline.

- [ ] **Step 2: Manual smoke (run the Phase 4 checklist)**

`bun tauri dev`, then walk through `docs/superpowers/specs/2026-05-08-riva-mcp-pr-toolkit-smoke-test.md`. Tick each box as you go.

- [ ] **Step 3: Commit any fixes from smoke**

If smoke reveals issues, fix and commit. If clean, no commit needed.

---

## Notes for implementer

- **rmcp router merging:** verified against rmcp 1.5 docs — `#[tool_router(router = name, vis = "pub")]` generates `Self::name_router()`, and `ToolRouter` supports `+` for combination. Riva uses rmcp 1.4 (`Cargo.toml`); the API is identical for this surface.
- **Where the `creds.get_or_fetch_user_id()` is called:** only in `create_pull_request` for auto-complete. Vote tools call `azure::set_pr_vote`, which internally does its own `get_my_user_id` lookup (see Task 1.4). This is intentional — vote tools don't need the cache because the lookup happens inside `azure.rs` and isn't the hot path. The cache exists for auto-complete chaining.
- **Potential gotcha:** `pub(crate)` on tool methods is fine for rmcp; visibility is needed so the router macro can dispatch from `mod.rs`.
- **Spec deviation:** the spec calls the helper `get_current_user_id`. Implementation reuses the existing `get_my_user_id` (`azure.rs:1010`) and only promotes its visibility — same behavior, less churn.
