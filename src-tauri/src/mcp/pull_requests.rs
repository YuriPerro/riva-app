use rmcp::{
    ErrorData as McpError,
    handler::server::wrapper::Parameters,
    model::{CallToolResult, Content},
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

#[tool_router(router = pull_requests_router, vis = "pub")]
impl RivaMcpServer {
    // Tools added in tasks 3.2 - 3.7
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
