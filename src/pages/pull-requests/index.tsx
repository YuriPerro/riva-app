import { GitPullRequest } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingState } from '@/components/ui/loading-state';
import { PageTransition } from '@/components/ui/page-transition';
import { PageHeader } from '@/components/ui/page-header';
import { FilterPill } from '@/components/ui/filter-pill';
import { FilterSelector } from '@/components/ui/filter-selector';
import { SearchInput } from '@/components/ui/search-input';
import { SortSelector } from '@/components/ui/sort-selector';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PullRequestsContent } from './components/pull-requests-content';
import { usePullRequests, type PRFilter, type PRSortKey } from './use-pull-requests';
import type { SortOption } from '@/components/ui/sort-selector/types';

const SORT_OPTIONS: SortOption<PRSortKey>[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title', label: 'Title (A-Z)' },
];

const FILTERS: { value: PRFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
];

export function PullRequestsPage() {
  const pullRequests = usePullRequests();
  const {
    prs, isLoading, filter, setFilter, repos, repoFilters, addRepoFilter, removeRepoFilter,
    query, setQuery, sortKey, sortDirection, setSort,
  } = pullRequests;

  const baseForCount = repoFilters.length > 0 ? prs.filter((p) => repoFilters.includes(p.repo)) : prs;
  const countByFilter = (f: PRFilter) =>
    f === 'all' ? baseForCount.length : baseForCount.filter((p) => p.status === f).length;

  return (
    <PageTransition
      isLoading={isLoading}
      loadingContent={
        <LoadingState
          icon={<GitPullRequest size={32} />}
          title="Loading Pull Requests"
          phrases={[
            'Loading unsolicited opinions...',
            'LGTM farming in progress...',
            'Fetching passive-aggressive comments...',
            'Counting merge conflicts...',
            'Reviewing your 2000-line PR...',
          ]}
        />
      }
    >
      <TooltipProvider delayDuration={150} skipDelayDuration={500} disableHoverableContent>
        <div className="flex h-full flex-col gap-4 overflow-hidden">
          <PageHeader
            title="Pull Requests"
            subtitle={`${prs.length} active pull request${prs.length !== 1 ? 's' : ''}`}
          />

          <div className="flex flex-wrap items-center gap-1.5">
            <SearchInput value={query} onChange={setQuery} placeholder="Search pull requests..." />
            <span className="mx-0.5 h-4 w-px bg-border" />
            {FILTERS.map(({ value, label }) => (
              <FilterPill key={value} active={filter === value} onClick={() => setFilter(value)}>
                {label}
                <span
                  className={cn(
                    'ml-1.5 rounded-full px-1.5 py-0.5 text-[9px]',
                    filter === value ? 'bg-accent/20 text-accent' : 'bg-elevated text-fg-disabled',
                  )}
                >
                  {countByFilter(value)}
                </span>
              </FilterPill>
            ))}

            {repos.length > 1 && (
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

            <span className="ml-auto" />
            <SortSelector<PRSortKey>
              options={SORT_OPTIONS}
              value={sortKey}
              direction={sortDirection}
              onChange={setSort}
            />
          </div>

          <PullRequestsContent {...pullRequests} />
        </div>
      </TooltipProvider>
    </PageTransition>
  );
}
