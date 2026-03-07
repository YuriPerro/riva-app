import { Star, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingState } from '@/components/ui/loading-state';
import { PageTransition } from '@/components/ui/page-transition';
import { PageHeader } from '@/components/ui/page-header';
import { FilterPill } from '@/components/ui/filter-pill';
import { FilterSelector } from '@/components/ui/filter-selector';
import { SearchInput } from '@/components/ui/search-input';
import { SortSelector } from '@/components/ui/sort-selector';
import { ReleasesContent } from './components/releases-content';
import { ReleaseDetailDialog } from './components/release-detail-dialog';
import { useReleases } from './use-releases';
import { STATUS_LABELS } from './constants';
import type { ReleaseStatusFilter, ReleaseSortKey } from './types';
import type { SortOption } from '@/components/ui/sort-selector/types';

const SORT_OPTIONS: SortOption<ReleaseSortKey>[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'name', label: 'Name (A-Z)' },
  { value: 'status', label: 'Status' },
];

export function ReleasesPage() {
  const releases = useReleases();
  const {
    groups,
    definitions,
    definitionFilters,
    addDefinitionFilter,
    removeDefinitionFilter,
    statusFilter,
    setStatusFilter,
    environmentFilters,
    addEnvironmentFilter,
    removeEnvironmentFilter,
    allEnvironmentNames,
    countByStatus,
    favorites,
    showFavoritesOnly,
    setShowFavoritesOnly,
    isLoading,
    query,
    setQuery,
    sortKey,
    sortDirection,
    setSort,
  } = releases;

  const statusPills: ReleaseStatusFilter[] = ['all', 'succeeded', 'inProgress', 'rejected', 'failed', 'cancelled'];
  const statusPillLabels: Record<string, string> = { all: 'All', ...STATUS_LABELS };

  return (
    <PageTransition
      isLoading={isLoading}
      loadingContent={
        <LoadingState
          icon={<Rocket size={32} />}
          title="Loading Releases"
          phrases={[
            'Deploying to production on a Friday...',
            'Rolling dice on staging...',
            'Praying to the deploy gods...',
            'Checking if rollback works...',
            'Crossing fingers for zero downtime...',
          ]}
        />
      }
    >
      <div className="flex h-full flex-col gap-4 overflow-hidden">
        <PageHeader
          title="Releases"
          subtitle={`${groups.length} release pipeline${groups.length !== 1 ? 's' : ''}`}
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <SearchInput value={query} onChange={setQuery} placeholder="Search releases..." />
          <span className="mx-0.5 h-4 w-px bg-border" />
          {statusPills.map((s) => {
            const count = countByStatus(s);
            const isVisible = s === 'all' || count > 0;
            if (!isVisible) return null;
            return (
              <FilterPill key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                <span className="flex items-center gap-1">
                  {statusPillLabels[s]}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[9px]',
                      statusFilter === s ? 'bg-accent/20 text-accent' : 'bg-elevated text-fg-disabled',
                    )}
                  >
                    {count}
                  </span>
                </span>
              </FilterPill>
            );
          })}

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
                placeholder="Release"
              />
            </>
          )}

          {allEnvironmentNames.length > 1 && (
            <>
              <span className="h-4 w-px bg-border" />
              <FilterSelector
                options={allEnvironmentNames}
                selected={environmentFilters}
                onAdd={addEnvironmentFilter}
                onRemove={removeEnvironmentFilter}
                placeholder="Environment"
              />
            </>
          )}

          <span className="ml-auto" />
          <SortSelector<ReleaseSortKey>
            options={SORT_OPTIONS}
            value={sortKey}
            direction={sortDirection}
            onChange={setSort}
          />
        </div>

        <ReleasesContent {...releases} />
        <ReleaseDetailDialog
          release={releases.selectedRelease}
          onClose={releases.closeReleaseDetail}
          onApprove={releases.approveRelease}
          onReject={releases.rejectRelease}
          isApproving={releases.isApproving}
          currentUserUniqueName={releases.currentUserUniqueName}
          myPendingApproval={releases.myPendingApproval}
        />
      </div>
    </PageTransition>
  );
}
