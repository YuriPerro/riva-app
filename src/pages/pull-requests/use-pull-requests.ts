import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { openUrl } from '@tauri-apps/plugin-opener';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { azure } from '@/lib/tauri';
import type { PullRequest } from '@/types/azure';
import { useSessionStore } from '@/store/session';
import { initials, stripRefs } from '@/utils/formatters';
import { fuzzyMatch } from '@/utils/search';
import type { SortDirection, SortOption } from '@/components/ui/sort-selector/types';

export type PRSortKey = 'relevance' | 'newest' | 'oldest' | 'title';

export type PRStatus = 'active' | 'draft';
export type ReviewVote = 'approved' | 'rejected' | 'waiting' | 'none';

export interface Reviewer {
  displayName: string;
  uniqueName: string;
  initials: string;
  vote: ReviewVote;
  isRequired: boolean;
}

export interface PR {
  id: number;
  title: string;
  repo: string;
  repoId: string;
  sourceBranch: string;
  targetBranch: string;
  author: string;
  authorInitials: string;
  createdDate: string;
  status: PRStatus;
  reviewers: Reviewer[];
  url: string;
}

function mapVote(vote: number): ReviewVote {
  if (vote === 10 || vote === 5) return 'approved';
  if (vote === -10 || vote === -5) return 'rejected';
  if (vote === 0) return 'waiting';
  return 'none';
}

function mapPR(raw: PullRequest): PR {
  return {
    id: raw.pullRequestId,
    title: raw.title,
    repo: raw.repository.name,
    repoId: raw.repository.id,
    sourceBranch: stripRefs(raw.sourceRefName),
    targetBranch: stripRefs(raw.targetRefName),
    author: raw.createdBy.displayName,
    authorInitials: initials(raw.createdBy.displayName),
    createdDate: raw.creationDate,
    status: raw.isDraft ? 'draft' : 'active',
    reviewers: raw.reviewers.map((r) => ({
      displayName: r.displayName,
      uniqueName: r.uniqueName,
      initials: initials(r.displayName),
      vote: mapVote(r.vote),
      isRequired: r.isRequired,
    })),
    url: raw.webUrl,
  };
}

export type PRFilter = 'all' | 'active' | 'draft' | 'myReviews';

export type PullRequestsData = ReturnType<typeof usePullRequests>;

export function usePullRequests() {
  const { t } = useTranslation(['pull-requests', 'common']);
  const project = useSessionStore((s) => s.project);
  const currentUser = useSessionStore((s) => s.uniqueName);
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialFilter = (searchParams.get('status') ?? 'all') as PRFilter;
  const [filter, setFilter] = useState<PRFilter>(initialFilter);
  const [repoFilters, setRepoFilters] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<PRSortKey>('relevance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const setSort = useCallback((key: PRSortKey, dir: SortDirection) => {
    setSortKey(key);
    setSortDirection(dir);
  }, []);

  const {
    data: prs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['pull-requests', project],
    queryFn: () => azure.getPullRequests(project!).then((raw) => raw.map(mapPR)),
    enabled: !!project,
    refetchInterval: 30_000,
  });

  const repos = useMemo(() => {
    const names = [...new Set(prs.map((pr) => pr.repo))];
    return names.sort((a, b) => a.localeCompare(b));
  }, [prs]);

  const filtered = useMemo(() => {
    let result = prs;
    if (filter === 'myReviews') {
      result = result.filter((pr) => pr.reviewers.some((r) => r.uniqueName === currentUser));
    } else if (filter !== 'all') {
      result = result.filter((pr) => pr.status === filter);
    }
    if (repoFilters.length > 0) result = result.filter((pr) => repoFilters.includes(pr.repo));

    if (query) {
      result = result.filter((pr) => {
        const searchTarget = `${pr.title} ${pr.author} ${pr.sourceBranch} ${pr.repo}`;
        return fuzzyMatch(query, searchTarget);
      });
    }

    if (sortKey !== 'relevance') {
      const dir = sortDirection === 'asc' ? 1 : -1;
      result = [...result].sort((a, b) => {
        if (sortKey === 'title') return dir * a.title.localeCompare(b.title);
        if (sortKey === 'newest') return dir * (new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
        if (sortKey === 'oldest') return dir * (new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime());
        return 0;
      });
    }

    return result;
  }, [prs, filter, repoFilters, query, sortKey, sortDirection, currentUser]);

  const reviewMutation = useMutation({
    mutationFn: (params: { repoId: string; prId: number; vote: number }) =>
      azure.reviewPullRequest(project!, params.repoId, params.prId, params.vote),
    onSuccess: (_data, variables) => {
      const label = variables.vote === 10 ? 'approved' : variables.vote === -10 ? 'rejected' : 'updated';
      toast.success(`PR ${label}`);
      queryClient.invalidateQueries({ queryKey: ['pull-requests', project] });
    },
  });

  const sortOptions: SortOption<PRSortKey>[] = useMemo(() => [
    { value: 'relevance', label: t('pull-requests:sort.relevance') },
    { value: 'newest', label: t('pull-requests:sort.newest') },
    { value: 'oldest', label: t('pull-requests:sort.oldest') },
    { value: 'title', label: t('pull-requests:sort.title') },
  ], [t]);

  const filterOptions: { value: PRFilter; label: string }[] = useMemo(() => [
    { value: 'all', label: t('common:filters.all') },
    { value: 'active', label: t('common:status.active') },
    { value: 'draft', label: t('common:status.draft') },
    { value: 'myReviews', label: t('pull-requests:myReviews') },
  ], [t]);

  const countByFilter = useCallback((f: PRFilter) => {
    const base = repoFilters.length > 0 ? prs.filter((p) => repoFilters.includes(p.repo)) : prs;
    if (f === 'all') return base.length;
    if (f === 'myReviews') return base.filter((p) => p.reviewers.some((r) => r.uniqueName === currentUser)).length;
    return base.filter((p) => p.status === f).length;
  }, [prs, repoFilters, currentUser]);

  return {
    prs,
    filtered,
    isLoading: !!project && isLoading,
    error: error ? (typeof error === 'string' ? error : 'Failed to load pull requests') : null,
    filter,
    setFilter,
    repos,
    repoFilters,
    addRepoFilter: (repo: string) => setRepoFilters((prev) => [...prev, repo]),
    removeRepoFilter: (repo: string) => setRepoFilters((prev) => prev.filter((r) => r !== repo)),
    openPR: openUrl,
    reviewPR: (repoId: string, prId: number, vote: number) => reviewMutation.mutate({ repoId, prId, vote }),
    isReviewing: reviewMutation.isPending,
    currentUser,
    sortOptions,
    filterOptions,
    countByFilter,
    query,
    setQuery,
    sortKey,
    sortDirection,
    setSort,
  };
}
