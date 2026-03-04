# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Forge

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

**Tauri config:** `src-tauri/tauri.conf.json` — window size, app identifier (`com.yuribaumgartner.forge`), bundle targets, and the dev/build URL hooks.

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
├── lib/               # Core utilities and Tauri invoke wrappers
├── types/             # Global TypeScript types (e.g., azure.ts)
└── styles/            # Global styles
```

**Global only** — components, hooks, and utils in the root of their folder must be reused in 2+ places. Otherwise they belong inside the page/component that owns them.

---

### State Management

- **Zustand stores** — global state (auth, UI preferences)
- **TanStack Query** — all server state (Azure API data, cache, refetch)
- **Local `useState`** — ephemeral UI state scoped to a component

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
