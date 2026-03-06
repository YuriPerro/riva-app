import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { FilterPill } from '@/components/ui/filter-pill';
import { FilterSelector } from '@/components/ui/filter-selector';
import { PipelinesContent } from './components/pipelines-content';
import { usePipelines, type StatusFilter } from './use-pipelines';

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
  } = pipelines;

  const baseForCount =
    definitionFilters.length > 0 ? runs.filter((r) => definitionFilters.includes(r.definitionName)) : runs;
  const countByStatus = (s: StatusFilter) =>
    s === 'all' ? baseForCount.length : baseForCount.filter((r) => r.status === s).length;

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <PageHeader
        title="Pipelines"
        subtitle={isLoading ? 'Loading…' : `${groups.length} pipeline${groups.length !== 1 ? 's' : ''}`}
      />

      <div className="flex flex-wrap items-center gap-1.5">
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

        {!isLoading && definitions.length > 1 && (
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
      </div>

      <PipelinesContent {...pipelines} />
    </div>
  );
}
