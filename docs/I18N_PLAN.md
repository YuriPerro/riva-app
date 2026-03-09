# i18n Plan — Riva (EN + PT-BR)

Internationalization spec for the Riva desktop app. Two languages: English (default) and Brazilian Portuguese.

---

## Library Choice

**`react-i18next` + `i18next`** — Best fit for React 19, mature ecosystem, supports pluralization, interpolation, and namespace splitting. Lightweight with no SSR overhead (Tauri desktop app).

---

## Architecture

```
src/
├── i18n/
│   ├── index.ts                # i18next init + config
│   └── locales/
│       ├── en/
│       │   ├── common.json     # Shared: nav, buttons, status, filters
│       │   ├── dashboard.json  # Dashboard page strings
│       │   ├── tasks.json
│       │   ├── pipelines.json
│       │   ├── pull-requests.json
│       │   ├── releases.json
│       │   ├── settings.json
│       │   ├── setup.json
│       │   └── onboarding.json
│       └── pt-BR/
│           ├── common.json
│           ├── dashboard.json
│           ├── tasks.json
│           ├── pipelines.json
│           ├── pull-requests.json
│           ├── releases.json
│           ├── settings.json
│           ├── setup.json
│           └── onboarding.json
├── store/
│   └── locale.ts              # Zustand store for language preference
```

**Namespace strategy** — one namespace per page + `common` for shared strings. Keeps bundles small and translation files manageable.

---

## String Inventory (~150-200 strings)

| Category                      | Examples                                                         | Est. Count |
| ----------------------------- | ---------------------------------------------------------------- | ---------- |
| Navigation                    | Dashboard, Tasks, Pipelines, Pull Requests, Releases, Settings   | 6          |
| Page titles & subtitles       | "Manage your account and preferences"                            | 11         |
| Buttons & actions             | Connect, Save, Continue, Skip, Sign out, Get Started             | 20+        |
| Status labels                 | On Track, At Risk, Off Track, Succeeded, Failed, Running, etc.   | 30+        |
| Filter/sort options           | To Do, In Progress, Newest, Relevance, All, Active, Draft        | 25+        |
| Loading phrases               | Humorous loading messages (5 per page)                           | 40+        |
| Empty/error states            | "No items match the selected filters", "No active sprint"        | 15+        |
| Form labels & placeholders    | Organization URL, Personal Access Token, "Search..."             | 20+        |
| Descriptions & help text      | Security notice, AI summary info, notification descriptions      | 15+        |
| Dynamic text                  | "{{count}} days remaining", "{{count}} item(s)"                  | 10+        |

---

## Translation Key Convention

```
namespace:section.key
```

### Example: `en/common.json`

```json
{
  "nav": {
    "dashboard": "Dashboard",
    "tasks": "Tasks",
    "pipelines": "Pipelines",
    "pullRequests": "Pull Requests",
    "releases": "Releases",
    "settings": "Settings"
  },
  "status": {
    "onTrack": "On Track",
    "atRisk": "At Risk",
    "offTrack": "Off Track",
    "succeeded": "Succeeded",
    "failed": "Failed",
    "running": "Running",
    "cancelled": "Cancelled"
  },
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "continue": "Continue",
    "skip": "Skip",
    "signOut": "Sign out"
  },
  "filters": {
    "all": "All",
    "search": "Search...",
    "noResults": "No items match the selected filters"
  }
}
```

### Example: `en/dashboard.json`

```json
{
  "title": "Dashboard",
  "focusScore": "Focus Score",
  "streak": "Streak",
  "sprint": {
    "daysRemaining": "{{count}} day remaining",
    "daysRemaining_other": "{{count}} days remaining",
    "noActiveSprint": "No active sprint"
  },
  "loading": [
    "Counting your bugs...",
    "Green builds are a myth..."
  ],
  "standup": {
    "title": "Standup",
    "noActivity": "No activity"
  }
}
```

---

## Implementation Plan

### Phase 1 — Foundation

1. Install `i18next` and `react-i18next`
2. Create `src/i18n/index.ts` with config (default: `en`, fallback: `en`, detection from localStorage)
3. Create `src/store/locale.ts` Zustand store (persisted to localStorage)
4. Add `<I18nextProvider>` in app root
5. Create empty JSON files for both locales with the namespace structure

### Phase 2 — Extract `common` namespace

6. Extract all shared strings: nav labels, status labels, button text, filter labels, empty states
7. Replace hardcoded strings in `sidebar.tsx`, shared UI components (`filter-pill`, `search-input`, `sort-selector`, page headers)
8. Pattern: `const { t } = useTranslation('common')`

### Phase 3 — Extract page namespaces (one page at a time)

9. **Dashboard** — loading phrases, focus score labels, streak text, standup sections, sprint status
10. **Tasks** — sort options, type filters, status filters, empty states
11. **Pipelines** — status filters, sort options, favorites label
12. **Pull Requests** — status filters, repo filter label
13. **Releases** — `constants.ts` status labels, environment filter
14. **Settings** — all section titles, descriptions, dialog text, notification channel labels
15. **Setup** — step titles, subtitles, button labels
16. **Onboarding** — form labels, placeholders, security notice
17. **Team/Project Select** — titles, search placeholders, empty states

### Phase 4 — Special cases

18. **Pluralization** — sprint days, item counts (`{{count}}` with `_other` suffix)
19. **Interpolation** — dynamic values like `"No teams matching \"{{query}}\""`
20. **Zod validation** — custom error map using `t()` for form validation messages
21. **Loading phrases** — array-based translations (random pick from translated array)
22. **Constants refactor** — status config objects, sort/filter option arrays need to use `t()` at render time (not at module level)

### Phase 5 — Language switcher UI

23. Add language selector in Settings page (dropdown or toggle: English / Português)
24. Persist selection in Zustand store → localStorage
25. Apply `lang` attribute on `<html>` element

### Phase 6 — PT-BR translations

26. Translate all JSON files to PT-BR
27. Preserve tone for loading phrases (humor matters)
28. Handle PT-BR pluralization rules (same as EN for most cases)

---

## Key Technical Decisions

| Decision      | Choice                                  | Why                                                        |
| ------------- | --------------------------------------- | ---------------------------------------------------------- |
| Library       | `react-i18next`                         | React 19 compatible, hooks-based, lightweight              |
| Storage       | localStorage via Zustand                | Already using Zustand, persists across sessions            |
| Namespaces    | Per-page + common                       | Keeps files small, clear ownership                         |
| Key format    | Nested JSON                             | Readable, grouped by context                               |
| Type safety   | `resources.d.ts` generated from EN files | Autocomplete + compile-time checks                        |
| Lazy loading  | No (only 2 languages)                   | Total payload is tiny, not worth the complexity            |
| Constants     | Move from module-level to render-time   | `t()` must be called inside React lifecycle                |

---

## Constants Refactor Pattern

Status configs and filter arrays are currently defined at module level. They need to move to render-time so `t()` is available:

```tsx
// Before — module-level (t() not available here)
const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
];

// After — factory function called in hook
function getSortOptions(t: TFunction) {
  return [
    { value: 'relevance', label: t('filters.sortRelevance') },
  ];
}

// In the hook:
const { t } = useTranslation('tasks');
const sortOptions = useMemo(() => getSortOptions(t), [t]);
```

---

## What NOT to translate

- Route paths (`/dashboard`, `/tasks`)
- localStorage keys (`riva_project`, `riva_team`)
- API values from Azure DevOps (work item titles, PR names, pipeline names)
- Tauri command names
- CSS class names and design tokens
