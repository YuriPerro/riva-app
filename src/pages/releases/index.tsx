import { useTranslation } from 'react-i18next';
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
import type { ReleaseSortKey } from './types';

export function ReleasesPage() {
  const { t } = useTranslation(['releases', 'common']);
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
    sortOptions,
    statusFilterOptions,
  } = releases;

  return (
    <PageTransition
      isLoading={isLoading}
      loadingContent={
        <LoadingState
          icon={<Rocket size={32} />}
          title={t('releases:loading.title')}
          phrases={t('releases:loading.phrases', { returnObjects: true }) as string[]}
        />
      }
    >
      <div className="flex h-full flex-col gap-4 overflow-hidden">
        <PageHeader
          title={t('releases:title')}
          subtitle={t('releases:subtitle', { count: groups.length })}
        />

        <div className="flex flex-wrap items-center gap-1.5">
          <SearchInput value={query} onChange={setQuery} placeholder={t('releases:searchPlaceholder')} />
          <span className="mx-0.5 h-4 w-px bg-border" />
          {statusFilterOptions.map(({ value, label }) => {
            const count = countByStatus(value);
            const isVisible = value === 'all' || count > 0;
            if (!isVisible) return null;
            return (
              <FilterPill key={value} active={statusFilter === value} onClick={() => setStatusFilter(value)}>
                <span className="flex items-center gap-1">
                  {label}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[9px]',
                      statusFilter === value ? 'bg-accent/20 text-accent' : 'bg-elevated text-fg-disabled',
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
                  {t('common:filters.favorites')}
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
                placeholder={t('releases:filterRelease')}
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
                placeholder={t('releases:filterEnvironment')}
              />
            </>
          )}

          <span className="ml-auto" />
          <SortSelector<ReleaseSortKey>
            options={sortOptions}
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
