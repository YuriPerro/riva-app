import { AlertCircle, GitPullRequest, Loader2, GitBranch, Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { FilterPill } from "@/components/ui/filter-pill";
import { FilterSelector } from "@/components/ui/filter-selector";
import { usePullRequests, type PR, type ReviewVote, type PRFilter } from "./use-pull-requests";

// ============================================================
// Review vote badge
// ============================================================

const VOTE_CONFIG: Record<ReviewVote, { icon: React.ElementType; className: string; title: string }> = {
  approved: { icon: Check,  className: "text-success",  title: "Approved"  },
  rejected: { icon: X,      className: "text-error",    title: "Rejected"  },
  waiting:  { icon: Clock,  className: "text-fg-muted", title: "Waiting"   },
  none:     { icon: Clock,  className: "text-fg-muted", title: "No vote"   },
};

function ReviewerDot({ reviewer }: { reviewer: { initials: string; vote: ReviewVote; isRequired: boolean } }) {
  const { icon: Icon, className, title } = VOTE_CONFIG[reviewer.vote];

  return (
    <div
      className="group relative flex h-5 w-5 items-center justify-center"
      title={`${reviewer.initials} · ${title}`}
    >
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-semibold",
          reviewer.vote === "approved" ? "bg-success/15 text-success" :
          reviewer.vote === "rejected" ? "bg-error/15 text-error" :
          "bg-elevated text-fg-muted"
        )}
      >
        {reviewer.initials}
      </span>
      <Icon
        size={8}
        className={cn(
          "absolute -bottom-0.5 -right-0.5 rounded-full bg-surface p-px",
          className
        )}
      />
    </div>
  );
}

// ============================================================
// PR card
// ============================================================

function PRCard({ pr, onClick }: { pr: PR; onClick: () => void }) {
  const approved   = pr.reviewers.filter((r) => r.vote === "approved").length;
  const rejected   = pr.reviewers.filter((r) => r.vote === "rejected").length;
  const reqApproved = pr.reviewers.filter((r) => r.isRequired && r.vote === "approved").length;
  const reqTotal   = pr.reviewers.filter((r) => r.isRequired).length;

  const allRequiredApproved = reqTotal > 0 && reqApproved === reqTotal;
  const hasRejection = rejected > 0;

  return (
    <button
      onClick={onClick}
      className="group flex w-full cursor-pointer flex-col gap-2.5 rounded-lg border border-border bg-surface p-4 text-left transition-colors hover:bg-elevated"
    >
      {/* Top row: icon + title + draft badge */}
      <div className="flex items-start gap-2.5">
        <GitPullRequest
          size={14}
          className={cn(
            "mt-0.5 flex-shrink-0",
            pr.status === "draft" ? "text-fg-disabled" : "text-accent"
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex-1 truncate text-[13px] font-medium text-fg-secondary group-hover:text-fg">
              {pr.title}
            </span>
            {pr.status === "draft" && (
              <span className="flex-shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-fg-disabled">
                Draft
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-fg-disabled">
            {pr.repo} · #{pr.id}
          </p>
        </div>
      </div>

      {/* Branch info */}
      <div className="flex items-center gap-1.5 text-[11px] text-fg-disabled">
        <GitBranch size={10} className="flex-shrink-0" />
        <span className="truncate font-mono">{pr.sourceBranch}</span>
        <span className="flex-shrink-0">→</span>
        <span className="truncate font-mono">{pr.targetBranch}</span>
      </div>

      {/* Bottom row: author + reviewers + time + status */}
      <div className="flex items-center gap-3">
        {/* Author */}
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-elevated text-[8px] font-semibold text-fg-muted">
            {pr.authorInitials}
          </span>
          <span className="text-[11px] text-fg-disabled">{pr.author}</span>
        </div>

        {/* Reviewer dots */}
        {pr.reviewers.length > 0 && (
          <div className="flex items-center gap-0.5 ml-auto">
            {pr.reviewers.slice(0, 5).map((r, i) => (
              <ReviewerDot key={i} reviewer={r} />
            ))}
            {pr.reviewers.length > 5 && (
              <span className="ml-1 text-[10px] text-fg-disabled">
                +{pr.reviewers.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Review summary */}
        <span
          className={cn(
            "ml-auto flex-shrink-0 rounded border px-1.5 py-0.5 text-[10px]",
            hasRejection
              ? "border-error/40 bg-error/10 text-error"
              : allRequiredApproved
                ? "border-success/40 bg-success/10 text-success"
                : "border-border bg-elevated text-fg-disabled"
          )}
        >
          {hasRejection
            ? `${rejected} rejected`
            : `${approved}/${pr.reviewers.length} approved`}
        </span>

        {/* Time */}
        <span className="flex-shrink-0 text-[11px] text-fg-disabled">{pr.createdAgo}</span>
      </div>
    </button>
  );
}

// ============================================================
// Page
// ============================================================

const FILTERS: { value: PRFilter; label: string }[] = [
  { value: "all",    label: "All"    },
  { value: "active", label: "Active" },
  { value: "draft",  label: "Draft"  },
];

export function PullRequestsPage() {
  const {
    filtered, prs, isLoading, error, filter, setFilter,
    repos, repoFilters, addRepoFilter, removeRepoFilter, openPR,
  } = usePullRequests();

  // Counts respect active repo filters
  const baseForCount = repoFilters.length > 0 ? prs.filter((p) => repoFilters.includes(p.repo)) : prs;
  const countByFilter = (f: PRFilter) =>
    f === "all" ? baseForCount.length : baseForCount.filter((p) => p.status === f).length;

  // Group by repo
  const repoGroups = new Map<string, PR[]>();
  for (const pr of filtered) {
    if (!repoGroups.has(pr.repo)) repoGroups.set(pr.repo, []);
    repoGroups.get(pr.repo)!.push(pr);
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <PageHeader
        title="Pull Requests"
        subtitle={
          isLoading
            ? "Loading…"
            : `${prs.length} active pull request${prs.length !== 1 ? "s" : ""}`
        }
      />

      {/* Status filters + repo selector */}
      <div className="flex flex-wrap items-center gap-1.5">
        {FILTERS.map(({ value, label }) => (
          <FilterPill
            key={value}
            active={filter === value}
            onClick={() => setFilter(value)}
          >
            {label}
            <span
              className={cn(
                "ml-1.5 rounded-full px-1.5 py-0.5 text-[9px]",
                filter === value
                  ? "bg-accent/20 text-accent"
                  : "bg-elevated text-fg-disabled"
              )}
            >
              {countByFilter(value)}
            </span>
          </FilterPill>
        ))}

        {/* Divider + repo selector */}
        {!isLoading && repos.length > 1 && (
          <>
            <span className="h-4 w-px bg-border" />
            <FilterSelector
              options={repos}
              selected={repoFilters}
              onAdd={addRepoFilter}
              onRemove={removeRepoFilter}
              placeholder="Repo"
            />
          </>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={16} className="animate-spin text-fg-disabled" />
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center gap-2 text-[13px] text-error">
          <AlertCircle size={14} />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <GitPullRequest size={24} className="text-fg-disabled" />
          <span className="text-[13px] text-fg-disabled">No pull requests found</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-5 pb-2">
            {[...repoGroups.entries()].map(([repo, repoPRs]) => (
              <div key={repo}>
                {repoGroups.size > 1 && (
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-disabled">
                      {repo}
                    </span>
                    <span className="rounded-full bg-elevated px-1.5 py-0.5 text-[10px] text-fg-muted">
                      {repoPRs.length}
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {repoPRs.map((pr) => (
                    <PRCard key={pr.id} pr={pr} onClick={() => openPR(pr.url)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
