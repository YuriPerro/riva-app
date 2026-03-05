import { useState, useMemo } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useQuery } from "@tanstack/react-query";
import { azure, type PullRequest } from "@/lib/tauri";
import { useSessionStore } from "@/store/session";

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

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function mapVote(vote: number): ReviewVote {
  if (vote === 10 || vote === 5) return "approved";
  if (vote === -10 || vote === -5) return "rejected";
  if (vote === 0) return "waiting";
  return "none";
}

function stripRefs(ref: string): string {
  return ref.replace("refs/heads/", "");
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
  openPR: (url: string) => void;
}

export function usePullRequests(): PullRequestsData {
  const project = useSessionStore((s) => s.project);
  const [filter, setFilter] = useState<PRFilter>("all");

  const { data: prs = [], isLoading, error } = useQuery({
    queryKey: ["pull-requests", project],
    queryFn: () => azure.getPullRequests(project!).then((raw) => raw.map(mapPR)),
    enabled: !!project,
  });

  const filtered = useMemo(() =>
    filter === "all" ? prs : prs.filter((pr) => pr.status === filter),
    [prs, filter]
  );

  return {
    prs,
    filtered,
    isLoading: !!project && isLoading,
    error: error ? (typeof error === "string" ? error : "Failed to load pull requests") : null,
    filter,
    setFilter,
    openPR: openUrl,
  };
}
