import { useState, useMemo } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useQuery } from "@tanstack/react-query";
import { azure } from "@/lib/tauri";
import type { PullRequest } from "@/types/azure";
import { useSessionStore } from "@/store/session";
import { formatAgo, initials, stripRefs } from "@/utils/formatters";

export type PRStatus = "active" | "draft";
export type ReviewVote = "approved" | "rejected" | "waiting" | "none";

export interface Reviewer {
  displayName: string;
  initials: string;
  vote: ReviewVote;
  isRequired: boolean;
}

export interface PR {
  id: number;
  title: string;
  repo: string;
  sourceBranch: string;
  targetBranch: string;
  author: string;
  authorInitials: string;
  createdAgo: string;
  status: PRStatus;
  reviewers: Reviewer[];
  url: string;
}

function mapVote(vote: number): ReviewVote {
  if (vote === 10 || vote === 5) return "approved";
  if (vote === -10 || vote === -5) return "rejected";
  if (vote === 0) return "waiting";
  return "none";
}

function mapPR(raw: PullRequest): PR {
  return {
    id: raw.pullRequestId,
    title: raw.title,
    repo: raw.repository.name,
    sourceBranch: stripRefs(raw.sourceRefName),
    targetBranch: stripRefs(raw.targetRefName),
    author: raw.createdBy.displayName,
    authorInitials: initials(raw.createdBy.displayName),
    createdAgo: formatAgo(raw.creationDate),
    status: raw.isDraft ? "draft" : "active",
    reviewers: raw.reviewers.map((r) => ({
      displayName: r.displayName,
      initials: initials(r.displayName),
      vote: mapVote(r.vote),
      isRequired: r.isRequired,
    })),
    url: raw.webUrl,
  };
}

export type PRFilter = "all" | "active" | "draft";

export interface PullRequestsData {
  prs: PR[];
  filtered: PR[];
  isLoading: boolean;
  error: string | null;
  filter: PRFilter;
  setFilter: (f: PRFilter) => void;
  repos: string[];
  repoFilters: string[];
  addRepoFilter: (repo: string) => void;
  removeRepoFilter: (repo: string) => void;
  openPR: (url: string) => void;
}

export function usePullRequests(): PullRequestsData {
  const project = useSessionStore((s) => s.project);
  const [filter, setFilter] = useState<PRFilter>("all");
  const [repoFilters, setRepoFilters] = useState<string[]>([]);

  // PRs are repo-scoped, not team-scoped — show all active PRs for the project
  const { data: prs = [], isLoading, error } = useQuery({
    queryKey: ["pull-requests", project],
    queryFn: () => azure.getPullRequests(project!).then((raw) => raw.map(mapPR)),
    enabled: !!project,
  });

  const repos = useMemo(() => {
    const names = [...new Set(prs.map((pr) => pr.repo))];
    return names.sort((a, b) => a.localeCompare(b));
  }, [prs]);

  const filtered = useMemo(() => {
    let result = filter === "all" ? prs : prs.filter((pr) => pr.status === filter);
    if (repoFilters.length > 0) result = result.filter((pr) => repoFilters.includes(pr.repo));
    return result;
  }, [prs, filter, repoFilters]);

  return {
    prs,
    filtered,
    isLoading: !!project && isLoading,
    error: error ? (typeof error === "string" ? error : "Failed to load pull requests") : null,
    filter,
    setFilter,
    repos,
    repoFilters,
    addRepoFilter: (repo) => setRepoFilters((prev) => [...prev, repo]),
    removeRepoFilter: (repo) => setRepoFilters((prev) => prev.filter((r) => r !== repo)),
    openPR: openUrl,
  };
}
