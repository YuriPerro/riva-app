# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Riva

Desktop app for Azure DevOps — a fast, focused alternative to the browser UI. Built with Tauri 2.0 (Rust backend) + React 19 + TypeScript. See `docs/PLAN.md` for the full project plan, architecture diagrams, and roadmap.

## Commands

```bash
# Frontend only (no Rust required)
bun dev

# Full app (requires Rust installed)
bun tauri dev

# Type check
bunx tsc --noEmit

# Build frontend
bun run build

# Build native app (.dmg / .exe / .AppImage)
bun tauri build
```

> Vite dev server runs on port **1420** (strict — will fail if occupied).

---

## Architecture

Tauri 2.0 splits the app into two processes that communicate via IPC:

**Frontend** (`src/`) — React 19 + TypeScript rendered in a native OS webview. Calls Rust logic via `invoke()` from `@tauri-apps/api/core`. Never makes direct HTTP calls to Azure DevOps — all API access goes through Rust.

**Backend** (`src-tauri/src/`) — Rust. Entry point is `main.rs` → `lib.rs`. Commands are registered in `lib.rs` via `tauri::generate_handler![]` and exposed to the frontend.

```
invoke('command_name', { arg }) ← frontend
        ↓
#[tauri::command] fn command_name() ← src-tauri/src/lib.rs
        ↓
Azure DevOps REST API (via reqwest)
```

**Tauri config:** `src-tauri/tauri.conf.json` — window size, app identifier (`com.yuribaumgartner.riva`), bundle targets, and the dev/build URL hooks.

### Planned Stack (not yet installed)

Per `docs/PLAN.md`, these packages are planned but not yet added:
- **Frontend:** Tailwind CSS, shadcn/ui, Zustand, TanStack Query, React Router 6, React Hook Form, Zod, Lucide React
- **Rust:** `reqwest` (HTTP), `keyring` (OS keychain for PAT storage), `tokio`

When adding them, HTTP calls to Azure DevOps belong in Rust commands — the PAT token must never be exposed in the webview layer.

### Rust Notes

- `src-tauri/src/main.rs` — thin entry point, no logic here
- `src-tauri/src/lib.rs` — register all `#[tauri::command]` functions here
- Future commands go in `src-tauri/src/commands/` as separate modules, re-exported in `lib.rs`

---

## Frontend Code Rules

### Design Tokens — Strict Rule

**NEVER** use raw hex values or arbitrary color values in Tailwind classes. Always use the design tokens defined in `src/styles/globals.css`.

```tsx
// ❌ Wrong
<div className="bg-[#111111] text-[#fafafa] border-[#262626]">

// ✅ Correct
<div className="bg-surface text-fg border-border">
```

**Token reference:**

| Token | Usage |
|---|---|
| `bg-base` / `bg-surface` / `bg-elevated` / `bg-overlay` | Backgrounds |
| `text-fg` / `text-fg-secondary` / `text-fg-muted` / `text-fg-disabled` | Text |
| `border-border` / `border-border-subtle` | Borders |
| `bg-accent` / `text-accent-fg` / `bg-accent-muted` | Primary actions |
| `text-success` / `text-error` / `text-warning` / `text-running` / `text-info` | Status |

---

### Zero Comments — Strict Rule

**NEVER** add comments to code. Code must be 100% self-explanatory via descriptive names, well-defined types, and clear structure.

**Not allowed:**
- Comments explaining what code does
- Section comments (`// API calls`, `// State management`)
- TODO, FIXME, HACK comments
- Comments in JSX
- Descriptive function comments (use clear names instead)

**Only exception:** Extremely complex algorithmic logic that cannot be simplified.

---

### TypeScript Conventions

**Interface vs Type:**

```typescript
// Use INTERFACE for: component props, extensible objects
export interface ButtonProps {
  id: string;
  onClick?: () => void;
}

// Use TYPE for: unions, intersections, primitives, service types
export type Status = 'loading' | 'success' | 'error';
export type WorkItemType = 'task' | 'bug' | 'pbi';
export type AzureUser = {
  id: string;
  displayName: string;
};
```

**Naming:** Always PascalCase for types and interfaces. Never camelCase.

**Avoid `any`** — use `satisfies` and `const assertions` where appropriate.

---

### Component Structure

**Every component must be a folder**, never a single `.tsx` file:

```
components/[component-name]/
├── index.tsx              # JSX only — zero business logic
├── use-[component-name].ts  # All logic (useState, handlers, effects)
└── types.ts               # Component-specific types
```

```typescript
// ❌ Wrong
components/pipeline-card.tsx

// ✅ Correct
components/pipeline-card/
├── index.tsx
├── use-pipeline-card.ts
└── types.ts
```

**`index.tsx`** — only JSX and component composition, no logic.
**`use-[name].ts`** — all state, effects, and handlers.
**`types.ts`** — types and interfaces scoped to this component.

### No Constants or Logic in `index.tsx` — Strict Rule

**NEVER** define constants, computed values, or helper functions inside page or component `index.tsx` files. All filter option arrays, sort option arrays, `countBy*` functions, and any derived data must live in the `use-[name].ts` hook and be returned from it.

```typescript
// ❌ Wrong — constants and logic in index.tsx
export function PipelinesPage() {
  const { t } = useTranslation(['pipelines', 'common']);
  const SORT_OPTIONS = useMemo(() => [...], [t]);
  const STATUS_FILTERS = useMemo(() => [...], [t]);
  const countByStatus = (s: StatusFilter) => ...;
  // ...
}

// ✅ Correct — everything comes from the hook
export function PipelinesPage() {
  const { t } = useTranslation(['pipelines', 'common']);
  const { sortOptions, statusFilters, countByStatus, ...rest } = usePipelines();
  // only JSX below
}
```

`index.tsx` may only contain: the hook call, `useTranslation` (for inline JSX text), and JSX rendering.

---

### Page Structure

Each page follows this exact structure:

```
pages/[page-name]/
├── index.tsx              # Page component (UI only)
├── types.ts               # Page-specific types and utilities
├── use-[page-name].ts     # Single hook with ALL page logic
└── components/            # Components used only by this page
    └── [component-name]/
        ├── index.tsx
        ├── use-[component-name].ts
        └── types.ts
```

### Flat Components — Strict Rule

**NEVER** create a `components/` folder inside another component. All page-scoped components live flat in `pages/[page]/components/`. Use naming prefixes to express parent-child relationships instead of folder nesting.

```
// ❌ Wrong — nested components folders
pages/dashboard/components/
└── focus-score/
    └── components/
        └── focus-score-drawer/
            └── components/
                └── activity-section/

// ✅ Correct — flat with naming prefixes
pages/dashboard/components/
├── focus-score/
├── focus-score-drawer/
├── activity-section/
├── streak-card/
└── score-section/
```

Max depth is always: `pages/[page]/components/[component]/index.tsx` — never deeper.

---

### Single Hook Per Page

**Always** export exactly one hook per page. Consolidate all logic there.

```typescript
// ❌ Wrong — multiple hooks
export const usePipelinesData = () => { ... }
export const usePipelinesActions = () => { ... }

// ✅ Correct — single consolidated hook
export const usePipelines = () => {
  return {
    pipelines,
    isLoading,
    handleRetrigger,
    handleFilter,
  };
};
```

**Hook return value** — always return an object (except utility hooks like `useLocalStorage`).

---

### Conditional Rendering

Prefer `&&` over ternaries for simple conditionals:

```typescript
// ✅ Correct
{isLoading && <Spinner />}
{pipeline && <PipelineCard pipeline={pipeline} />}

// ❌ Avoid
{isLoading ? <Spinner /> : null}

// ✅ Ternary only when there's an explicit else
{isLoading ? <Spinner /> : <PipelineList />}
```

---

### No Nested Ternary Chains — Strict Rule

**NEVER** chain ternaries for state rendering (loading → error → empty → data). Extract a `[Page]Content` component that uses early returns instead.

```tsx
// ❌ Wrong — nested ternary chain in JSX
{isLoading ? (
  <Spinner />
) : error ? (
  <ErrorMessage />
) : items.length === 0 ? (
  <EmptyState />
) : (
  <ItemList />
)}

// ✅ Correct — separate component with early returns
function ItemsContent(props: ReturnType<typeof useItems>) {
  const { isLoading, error, items } = props;

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage />;
  if (items.length === 0) return <EmptyState />;

  return <ItemList items={items} />;
}

// Page stays flat
export function ItemsPage() {
  const items = useItems();
  return (
    <div>
      <PageHeader />
      <Filters />
      <ItemsContent {...items} />
    </div>
  );
}
```

Extract `[Page]Content` into its own component folder under `pages/[page]/components/`. Pass the hook return directly via spread props.

---

### Props Destructuring

Always receive props as an object and destructure in the function body:

```typescript
// ✅ Correct
export function PipelineCard(props: PipelineCardProps) {
  const { pipeline, onRetrigger, isLoading } = props;
  return (...);
}

// ❌ Avoid
export function PipelineCard({ pipeline, onRetrigger, isLoading }: PipelineCardProps) {
  return (...);
}
```

---

### Folder Structure

```
src/
├── components/        # Global reusable components only
├── hooks/             # Global custom hooks only
├── pages/             # Page components (see page structure above)
├── routes/            # Route configuration
├── store/             # Zustand global state
├── lib/               # Core wrappers (Tauri invoke, utils) — NOT for business logic
├── utils/             # Global reusable functions (formatters, mappers, search)
├── types/             # Global TypeScript types (e.g., azure.ts, work-item.ts, pipeline.ts)
└── styles/            # Global styles
```

**Global only** — components, hooks, and utils in the root of their folder must be reused in 2+ places. Otherwise they belong inside the page/component that owns them.

**DRY rule** — when 2+ components share the same UI pattern (e.g. filter pills, page headers), extract it into a shared component under `src/components/ui/` immediately. Never duplicate inline components across pages.

---

### Separation of Concerns — Strict Rule

**Types NEVER live inside utility/function files.** Shared types belong in `src/types/`, shared functions belong in `src/utils/`. Never mix them.

```typescript
// ❌ Wrong — types defined inside a utility file
// src/utils/mappers.ts
export type WorkItemType = "task" | "bug" | "pbi";
export function mapWorkItemType(type: string): WorkItemType { ... }

// ✅ Correct — types in src/types/, functions in src/utils/
// src/types/work-item.ts
export type WorkItemType = "task" | "bug" | "pbi";

// src/utils/mappers.ts
import type { WorkItemType } from "@/types/work-item";
export function mapWorkItemType(type: string): WorkItemType { ... }
```

**`src/lib/`** is strictly for core infrastructure wrappers (Tauri invoke, cn utility). Business logic utilities (formatters, mappers, search helpers) go in **`src/utils/`**.

**`src/types/`** is the single source of truth for all shared types. When a type is used across 2+ pages or components, move it here immediately. Page-scoped types stay in `pages/[page]/types.ts`.

**When creating a reusable function**, always check:
1. Does a similar function already exist in `src/utils/`? → Reuse it.
2. Is the type it returns defined in `src/types/`? → Import from there.
3. Is the function used in 2+ places? → It belongs in `src/utils/`, not inline.

---

### No Re-exports — Strict Rule

**NEVER** re-export types or values from another file. Every consumer must import directly from the source.

```typescript
// ❌ Wrong — re-exporting types from another module
// src/lib/tauri.ts
export type { Project, Team } from "@/types/azure";
export { TauriCommand } from "@/types/commands";

// ❌ Wrong — importing a type through a re-exporter
import { azure, type Project } from "@/lib/tauri";

// ✅ Correct — import each thing from its actual source
import { azure } from "@/lib/tauri";
import type { Project } from "@/types/azure";
```

Each file owns what it defines. If it didn't define it, it doesn't export it.

---

### State Management

- **Zustand stores** — global state (auth, UI preferences)
- **TanStack Query** — all server state (Azure API data, cache, refetch)
- **Local `useState`** — ephemeral UI state scoped to a component

---

### Readable Conditionals — Strict Rule

**NEVER** inline complex boolean expressions. Extract them into named helpers or named variables that read like English.

```typescript
// ❌ Wrong — unreadable inline condition
const isEmpty =
  !standup ||
  (standup.transitions.length === 0 &&
    standup.today.length === 0 &&
    standup.todayPrs.length === 0 &&
    standup.blockers.length === 0);

// ✅ Correct — named helper
function hasActivity(data: StandupData): boolean {
  const hasTransitions = data.transitions.length > 0;
  const hasTodayData = data.today.length > 0;
  const hasTodayPRs = data.todayPrs.length > 0;
  const hasBlockers = data.blockers.length > 0;

  return hasTransitions || hasTodayData || hasTodayPRs || hasBlockers;
}

const isEmpty = !standup || !hasActivity(standup);
```

When a condition checks 3+ properties, extract it. Name the variables so the logic is obvious without reading the implementation.

**Event/callback conditionals** — same rule applies inside subscribers and callbacks. Break chained checks into named booleans that build on each other:

```typescript
// ❌ Wrong — chained inline checks
if (event.type === 'updated' && event.action.type === 'success' && event.query.queryKey[0] === 'dashboard') {
  setLastSync(Date.now());
}

// ✅ Correct — progressive named booleans
const isUpdateEvent = event.type === 'updated';
const isSuccessEvent = isUpdateEvent && event.action.type === 'success';
const isDashboardQuery = event.query.queryKey[0] === 'dashboard';

if (isSuccessEvent && isDashboardQuery) setLastSync(Date.now());
```

---

### Naming Conventions

**Queries and mutations** must use descriptive suffixes:

```typescript
// ✅ Correct
export const useWorkItemsQuery = createQuery<...>({...});
export const useUpdateWorkItemMutation = createMutation<...>({...});

// ❌ Wrong
export const useWorkItems = createQuery<...>({...});
export const useUpdateWorkItem = createMutation<...>({...});
```

**Files:** kebab-case (`pipeline-card/`, `use-pipelines.ts`)
**Components:** PascalCase (`PipelineCard`, `WorkItemList`)
**Hooks:** camelCase with `use` prefix (`usePipelines`, `useWorkItems`)

---

### One Component Per File — Strict Rule

**NEVER** define more than one component in a single `.tsx` file. Every component gets its own folder with `index.tsx` and `types.ts`.

```typescript
// ❌ Wrong — two components in one file
// pages/items/index.tsx
function ItemsContent(props: ItemsContentProps) { ... }
export function ItemsPage() { ... }

// ✅ Correct — each component in its own folder
// pages/items/components/items-content/index.tsx
export function ItemsContent(props: ItemsContentProps) { ... }

// pages/items/index.tsx
export function ItemsPage() { ... }
```

Constants (`STATUS_FILTERS`, config maps) and non-component helpers may live alongside the component that uses them.

---

### Cursor Pointer — Strict Rule

**ALWAYS** add `cursor-pointer` to every clickable element: buttons, links, icon buttons, close icons, interactive cards, and any element with an `onClick` handler. Never rely on browser defaults — Tauri's webview does not apply `cursor: pointer` to `<button>` elements automatically.

```tsx
// ❌ Wrong — missing cursor-pointer
<button className="rounded-md px-3 py-1.5">Submit</button>

// ✅ Correct
<button className="cursor-pointer rounded-md px-3 py-1.5">Submit</button>
```
