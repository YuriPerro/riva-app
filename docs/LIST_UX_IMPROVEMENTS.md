# List UX Improvements Plan

Improving usability across all list views: Tasks, Pull Requests, Pipelines, and Releases.

---

## Current State

| Feature      | Tasks         | PRs           | Pipelines           | Releases                  |
| ------------ | ------------- | ------------- | ------------------- | ------------------------- |
| Filtering    | Status + Type | Status + Repo | Status + Def + Favs | Status + Def + Env + Favs |
| Sorting      | None          | None          | None                | None                      |
| Search       | None          | None          | None                | None                      |
| Grouping     | By sprint     | By repo       | By definition       | By definition             |
| Keyboard nav | None          | None          | None                | None                      |
| Pagination   | Scroll        | Scroll        | 3 per group         | 3 per group               |
| Bulk actions | None          | None          | None                | None                      |

Existing asset: `src/utils/search.ts` exports `fuzzyMatch()` (substring, acronym, word-based, character similarity) — currently unused.

---

## Phase 1 — Search & Sort

> Biggest UX win, least effort. One shared component per feature, wired into all 4 list pages.

### 1.1 Search Bar

**Goal:** Fuzzy search across item titles in every list page.

**Shared component:** `src/components/ui/search-input/`
- Controlled input with magnifying glass icon and clear button
- Debounced (200ms) to avoid re-filtering on every keystroke
- Placeholder adapts per page ("Search tasks...", "Search pull requests...")
- Auto-focuses on `/` keypress (global shortcut)

**Integration per page:**

| Page      | Fields searched                                            | Notes                       |
| --------- | ---------------------------------------------------------- | --------------------------- |
| Tasks     | `title`, `rawType`, `rawState`, `id`                       | Match "#1234" for ID search |
| PRs       | `title`, `authorName`, `sourceBranch`, `repo`              | Match branch names too      |
| Pipelines | `definitionName`, `buildNumber`, `branch`, `commitMessage` | Search across groups        |
| Releases  | `definitionName`, `releaseName`, `createdByName`           | Search across groups        |

**Behavior:**
- Search applies on top of existing filters (AND logic)
- Grouped lists: hide entire groups with zero matches
- Empty result: "No results for '{query}'" with clear button
- Uses existing `fuzzyMatch()` from `src/utils/search.ts`

**Files to create:**
- `src/components/ui/search-input/index.tsx`
- `src/components/ui/search-input/types.ts`

**Files to modify:**
- `src/pages/tasks/use-tasks.ts` — add `query` state, filter by fuzzyMatch
- `src/pages/tasks/index.tsx` — render SearchInput above filters
- `src/pages/pull-requests/use-pull-requests.ts` — same
- `src/pages/pull-requests/index.tsx` — same
- `src/pages/pipelines/use-pipelines.ts` — same
- `src/pages/pipelines/index.tsx` — same
- `src/pages/releases/use-releases.ts` — same
- `src/pages/releases/index.tsx` — same

---

### 1.2 Sort Selector

**Goal:** Click-to-sort with ascending/descending toggle per list page.

**Shared component:** `src/components/ui/sort-selector/`
- Dropdown button showing current sort label + direction arrow (↑/↓)
- Clicking same option toggles direction
- Default sort is "Relevance" (original API order)

**Sort options per page:**

| Page      | Options                                        | Default   |
| --------- | ---------------------------------------------- | --------- |
| Tasks     | Title (A-Z), Status, Type, Sprint              | API order |
| PRs       | Newest, Oldest, Title (A-Z), Approval progress | Newest    |
| Pipelines | Newest, Duration, Status                       | Newest    |
| Releases  | Newest, Release name, Status                   | Newest    |

**Behavior:**
- Sorting applies within groups (does not break grouping)
- Persisted to `localStorage` per page (optional, not required for v1)
- "Relevance" option resets to API order

**Files to create:**
- `src/components/ui/sort-selector/index.tsx`
- `src/components/ui/sort-selector/types.ts`

**Files to modify:**
- `src/pages/tasks/use-tasks.ts` — add `sortKey` + `sortDir` state, apply sort in `useMemo`
- `src/pages/tasks/index.tsx` — render SortSelector next to filters
- `src/pages/pull-requests/use-pull-requests.ts` — same
- `src/pages/pull-requests/index.tsx` — same
- `src/pages/pipelines/use-pipelines.ts` — same
- `src/pages/pipelines/index.tsx` — same
- `src/pages/releases/use-releases.ts` — same
- `src/pages/releases/index.tsx` — same

---

## Phase 2 — Richer Data & Keyboard Navigation

> Medium effort. Makes the app feel more complete and power-user friendly.

### 2.1 Additional Task Fields

**Goal:** Show priority, tags, and recency on the Tasks list for faster triage.

**New fields to display:**

| Field        | Display                            | Position                     |
| ------------ | ---------------------------------- | ---------------------------- |
| Priority     | Colored dot or P1/P2/P3 badge      | After status badge           |
| Tags         | Small pills (max 2 visible + "+N") | Below title                  |
| Changed date | "updated 2h ago" in muted text     | Right side                   |
| Parent title | Small breadcrumb above title       | Above title (like dashboard) |

**Data availability:**
- Priority: `Microsoft.VSTS.Common.Priority` — already fetched in work item fields
- Tags: `System.Tags` — already fetched, `parseTags()` exists in `src/utils/formatters.ts`
- ChangedDate: `System.ChangedDate` — already fetched
- Parent: needs `System.Parent` field + summary lookup (already have `getWorkItemSummaries` command)

**Files to modify:**
- `src/pages/tasks/use-tasks.ts` — extend `TaskItem` type with new fields
- `src/pages/tasks/components/grouped-items/index.tsx` — render new fields
- `src/types/work-item.ts` — add Priority type if needed
- `src/utils/mappers.ts` — add `mapPriority()` if needed

---

### 2.2 Keyboard Navigation

**Goal:** Navigate and interact with lists using only the keyboard.

**Global shortcuts:**

| Key   | Action                      | Scope         |
| ----- | --------------------------- | ------------- |
| `/`   | Focus search bar            | Any list page |
| `Esc` | Clear search / close dialog | Any list page |

**List navigation:**

| Key       | Action                               |
| --------- | ------------------------------------ |
| `↓` / `j` | Move focus to next item              |
| `↑` / `k` | Move focus to previous item          |
| `Enter`   | Open detail (dialog or Azure link)   |
| `o`       | Open in Azure DevOps (external)      |
| `f`       | Toggle favorite (pipelines/releases) |

**Implementation approach:**
- Custom hook: `src/hooks/use-list-keyboard-nav.ts`
- Tracks `focusedIndex` state
- Renders a visible focus ring on the active item
- Each list page wires the hook to its items array

**Files to create:**
- `src/hooks/use-list-keyboard-nav.ts`
- `src/hooks/types.ts` (if needed for shared hook types)

**Files to modify:**
- All 4 list page hooks — integrate `useListKeyboardNav`
- All 4 list page item components — accept `isFocused` prop, render focus ring

---

## Phase 3 — Expandable Groups & Bulk Actions

> Larger scope. Transforms the app from "viewer" to "workstation".

### 3.1 Expandable Grouped Lists

**Goal:** Remove the hard 3-item cap on Pipelines and Releases groups. Let users see all runs/releases inline.

**Current behavior:**
- `MAX_RUNS_PER_DEFINITION = 3` in Pipelines
- `MAX_RELEASES_PER_DEFINITION = 3` in Releases
- No way to see older items without going to Azure DevOps

**New behavior:**
- Show 3 items by default (unchanged)
- "Show all N runs" / "Show all N releases" link at bottom of group
- Clicking expands the group to show all fetched items
- Collapse link to return to 3-item view
- Track expanded state per group in local component state

**Files to modify:**
- `src/pages/pipelines/use-pipelines.ts` — fetch more runs, track expanded groups
- `src/pages/pipelines/components/pipeline-group-card/index.tsx` — render expand/collapse
- `src/pages/releases/use-releases.ts` — same pattern
- `src/pages/releases/components/release-group-card/index.tsx` — same pattern

**Backend consideration:**
- Currently fetches `top=3` from Azure API (check `src-tauri/src/azure.rs`)
- May need to increase fetch limit or add a "fetch more" command
- Alternative: fetch top 10 always, display 3 by default, expand up to 10

---

### 3.2 Bulk Actions (Tasks)

**Goal:** Select multiple work items and perform batch state transitions.

**UI:**
- Checkbox on each task row (appears on hover or when bulk mode is active)
- "Select all" checkbox in group header
- Floating action bar at bottom when 1+ items selected:
  - "Move to [State]" dropdown
  - "N items selected" label
  - "Clear selection" button

**Actions available:**
- Move to "To Do"
- Move to "In Progress"
- Move to "In Review"
- Move to "Done"

**Implementation:**
- Selection state: `Set<number>` of work item IDs
- Batch mutation: sequential calls to `update_work_item_state` (Azure API has no batch endpoint)
- Progress indicator during batch update
- Toast on completion: "Moved 5 items to In Progress"
- Invalidate query cache after batch completes

**Files to create:**
- `src/pages/tasks/components/bulk-action-bar/index.tsx`
- `src/pages/tasks/components/bulk-action-bar/types.ts`
- `src/pages/tasks/components/bulk-action-bar/use-bulk-action-bar.ts`

**Files to modify:**
- `src/pages/tasks/use-tasks.ts` — add selection state, bulk mutation
- `src/pages/tasks/components/grouped-items/index.tsx` — render checkboxes
- `src/pages/tasks/index.tsx` — render BulkActionBar

---

## Implementation Order

```
Phase 1 (immediate)
├── 1.1 SearchInput component
│   ├── Create shared component
│   ├── Wire into Tasks
│   ├── Wire into PRs
│   ├── Wire into Pipelines
│   └── Wire into Releases
└── 1.2 SortSelector component
    ├── Create shared component
    ├── Wire into Tasks
    ├── Wire into PRs
    ├── Wire into Pipelines
    └── Wire into Releases

Phase 2 (next)
├── 2.1 Task fields (priority, tags, date, parent)
└── 2.2 Keyboard navigation hook + integration

Phase 3 (later)
├── 3.1 Expandable groups (pipelines + releases)
└── 3.2 Bulk actions (tasks)
```

---

## Verification Checklist

### Phase 1
- [ ] SearchInput renders on all 4 list pages
- [ ] Fuzzy search matches titles, IDs, branch names
- [ ] Search + filter combine correctly (AND logic)
- [ ] Empty search results show clear message
- [ ] `/` shortcut focuses search from anywhere on the page
- [ ] SortSelector renders on all 4 list pages
- [ ] Sorting works within groups (doesn't break grouping)
- [ ] Sort direction toggles on same-option click
- [ ] "Relevance" resets to API order
- [ ] `bunx tsc --noEmit` passes

### Phase 2
- [ ] Priority badge visible on task items
- [ ] Tags render as pills (max 2 + overflow)
- [ ] "Updated X ago" shows on task items
- [ ] Arrow keys navigate list items
- [ ] Enter opens detail, Esc closes
- [ ] Focus ring visible on active item
- [ ] `/` focuses search bar

### Phase 3
- [ ] "Show all" link appears when group has >3 items
- [ ] Expanding group shows all fetched items
- [ ] Collapse returns to 3-item view
- [ ] Checkboxes appear on task items
- [ ] Floating bar shows with selection count
- [ ] Batch state change works and refreshes list
- [ ] Progress indicator during batch operation
