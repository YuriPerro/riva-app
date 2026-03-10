import { useTranslation } from 'react-i18next';
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
import { usePipelines, type PipelineSortKey } from './use-pipelines';

export function PipelinesPage() {
  const { t } = useTranslation(['pipelines', 'common']);
  const pipelines = usePipelines();
  const {
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
    sortOptions,
    statusFilters,
    countByStatus,
  } = pipelines;

  return (
    <PageTransition
      isLoading={isLoading}
      loadingContent={
        <LoadingState
          icon={<Zap size={32} />}
          title={t('pipelines:loading.title')}
          phrases={t('pipelines:loading.phrases', { returnObjects: true }) as string[]}
        />
      }
    >
      <div className="flex h-full flex-col gap-4 overflow-hidden">
        <PageHeader title={t('pipelines:title')} subtitle={t('pipelines:subtitle', { count: groups.length })} />

        <div className="flex flex-wrap items-center gap-1.5">
          <SearchInput value={query} onChange={setQuery} placeholder={t('pipelines:searchPlaceholder')} />
          <span className="mx-0.5 h-4 w-px bg-border" />
          {statusFilters.map(({ value, label }) => (
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
                placeholder={t('pipelines:filterPlaceholder')}
              />
            </>
          )}

          <span className="ml-auto" />
          <SortSelector<PipelineSortKey>
            options={sortOptions}
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
