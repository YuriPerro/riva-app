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
