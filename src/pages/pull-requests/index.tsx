import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { FilterPill } from "@/components/ui/filter-pill";
import { FilterSelector } from "@/components/ui/filter-selector";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PullRequestsContent } from "./components/pull-requests-content";
import { usePullRequests, type PRFilter } from "./use-pull-requests";

const FILTERS: { value: PRFilter; label: string }[] = [
  { value: "all",    label: "All"    },
  { value: "active", label: "Active" },
  { value: "draft",  label: "Draft"  },
];

export function PullRequestsPage() {
  const pullRequests = usePullRequests();
  const {
    prs,
    isLoading,
    filter,
    setFilter,
    repos,
    repoFilters,
    addRepoFilter,
    removeRepoFilter,
  } = pullRequests;

  const baseForCount = repoFilters.length > 0 ? prs.filter((p) => repoFilters.includes(p.repo)) : prs;
  const countByFilter = (f: PRFilter) =>
    f === "all" ? baseForCount.length : baseForCount.filter((p) => p.status === f).length;

  return (
    <TooltipProvider delayDuration={150} skipDelayDuration={500} disableHoverableContent>
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <PageHeader
        title="Pull Requests"
        subtitle={
          isLoading
            ? "Loading…"
            : `${prs.length} active pull request${prs.length !== 1 ? "s" : ""}`
        }
      />

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

      <PullRequestsContent {...pullRequests} />
    </div>
    </TooltipProvider>
  );
}
