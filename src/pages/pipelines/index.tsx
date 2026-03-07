import { Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingState } from '@/components/ui/loading-state';
import { PageTransition } from '@/components/ui/page-transition';
import { PageHeader } from '@/components/ui/page-header';
import { FilterPill } from '@/components/ui/filter-pill';
import { FilterSelector } from '@/components/ui/filter-selector';
import { SearchInput } from '@/components/ui/search-input';
import { SortSelector } from '@/components/ui/sort-selector';
import { PipelinesContent } from './components/pipelines-content';
import { usePipelines, type StatusFilter, type PipelineSortKey } from './use-pipelines';
import type { SortOption } from '@/components/ui/sort-selector/types';

const SORT_OPTIONS: SortOption<PipelineSortKey>[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'status', label: 'Status' },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'running', label: 'Running' },
  { value: 'succeeded', label: 'Succeeded' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function PipelinesPage() {
  const pipelines = usePipelines();
  const {
    runs,
    statusFilter,
    setStatusFilter,
    definitions,
    definitionFilters,
    addDefinitionFilter,
    removeDefinitionFilter,
    favorites,
    showFavoritesOnly,
    setShowFavoritesOnly,
    isLoading,
    groups,
    query,
    setQuery,
    sortKey,
    sortDirection,
    setSort,
  } = pipelines;

  const baseForCount =
    definitionFilters.length > 0 ? runs.filter((r) => definitionFilters.includes(r.definitionName)) : runs;
  const countByStatus = (s: StatusFilter) =>
    s === 'all' ? baseForCount.length : baseForCount.filter((r) => r.status === s).length;

  return (
    <PageTransition
      isLoading={isLoading}
      loadingContent={
        <LoadingState
          icon={<Zap size={32} />}
          title="Loading Pipelines"
          phrases={[
            'Waiting for CI to fail...',
            'Green builds are a myth...',
            'Blame game loading...',
            'Compiling excuses...',
            'Queueing your hopes and dreams...',
          ]}
        />
      }
    >
      <div className="flex h-full flex-col gap-4 overflow-hidden">
        <PageHeader
          title="Pipelines"
          subtitle={`${groups.length} pipeline${groups.length !== 1 ? 's' : ''}`}
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <SearchInput value={query} onChange={setQuery} placeholder="Search pipelines..." />
          <span className="mx-0.5 h-4 w-px bg-border" />
          {STATUS_FILTERS.map(({ value, label }) => (
            <FilterPill key={value} active={statusFilter === value} onClick={() => setStatusFilter(value)}>
              {label}
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 py-0.5 text-[9px]',
                  statusFilter === value ? 'bg-accent/20 text-accent' : 'bg-elevated text-fg-disabled',
                )}
              >
                {countByStatus(value)}
              </span>
            </FilterPill>
          ))}

          {favorites.size > 0 && (
            <>
              <span className="h-4 w-px bg-border" />
              <FilterPill active={showFavoritesOnly} onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}>
                <span className="flex items-center gap-1">
                  <Star size={10} className={showFavoritesOnly ? 'fill-current' : ''} />
                  Favorites
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[9px]',
                      showFavoritesOnly ? 'bg-accent/20 text-accent' : 'bg-elevated text-fg-disabled',
                    )}
                  >
                    {favorites.size}
                  </span>
                </span>
              </FilterPill>
            </>
          )}

          {definitions.length > 1 && (
            <>
              <span className="h-4 w-px bg-border" />
              <FilterSelector
                options={definitions}
                selected={definitionFilters}
                onAdd={addDefinitionFilter}
                onRemove={removeDefinitionFilter}
                placeholder="Pipeline"
              />
            </>
          )}

          <span className="ml-auto" />
          <SortSelector<PipelineSortKey>
            options={SORT_OPTIONS}
            value={sortKey}
            direction={sortDirection}
            onChange={setSort}
          />
        </div>

        <PipelinesContent {...pipelines} />
      </div>
    </PageTransition>
  );
}
