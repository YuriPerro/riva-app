# Riva — Design System

## Decisions

| Token         | Value       | Notes                 |
| ------------- | ----------- | --------------------- |
| Theme         | Dark only   | No light mode         |
| Font          | Geist       | Via Fontsource        |
| Border radius | 4px         | Sharp, technical feel |
| Density       | Comfortable | Standard spacing      |

---

## Color Tokens

### Background Scale
```
--bg-base:      #0a0a0a   Base app background
--bg-surface:   #111111   Cards, sidebar, panels
--bg-elevated:  #1a1a1a   Hover states, dropdowns
--bg-overlay:   #222222   Modals, popovers
```

### Border
```
--border:       #262626   Default borders
--border-muted: #1f1f1f   Subtle separators
```

### Text
```
--text-primary:   #fafafa   Headings, primary content
--text-secondary: #a1a1aa   Labels, secondary info
--text-muted:     #71717a   Placeholders, timestamps
--text-disabled:  #3f3f46   Disabled states
```

### Accent (Primary Action)
```
--accent:         #fafafa   Buttons, links, focus rings
--accent-fg:      #0a0a0a   Text on accent background
--accent-hover:   #e4e4e7   Hover state
```

### Status (Pipelines / Work Items)
```
--status-success: #22c55e   Succeeded, Done
--status-error:   #ef4444   Failed, Blocked
--status-warning: #eab308   Warnings, On Hold
--status-running: #8b5cf6   In progress, Running
--status-info:    #3b82f6   Info, Review
--status-neutral: #71717a   Cancelled, Inactive
```

---

## Typography

**Font:** Geist (via `@fontsource/geist`)

| Role              | Size        | Weight | Color          |
| ----------------- | ----------- | ------ | -------------- |
| Page title        | 16px / 1rem | 600    | text-primary   |
| Section heading   | 13px        | 500    | text-primary   |
| Body              | 13px        | 400    | text-primary   |
| Label / caption   | 12px        | 400    | text-secondary |
| Micro / timestamp | 11px        | 400    | text-muted     |

---

## Spacing (Comfortable density)

Base unit: 4px

```
xs:   4px    (inner padding on badges, tight gaps)
sm:   8px    (gap between inline elements)
md:   12px   (component internal padding)
lg:   16px   (section padding, card padding)
xl:   24px   (section gaps)
2xl:  32px   (page-level padding)
```

---

## Border Radius

```
--radius-sm:  2px   Tags, badges, small inputs
--radius:     4px   Buttons, cards, inputs (default)
--radius-lg:  6px   Modals, large panels
```

---

## Elevation / Shadows

Dark mode shadows use borders, not drop shadows.

```
level-0: no border          Base background
level-1: border #262626     Cards, panels
level-2: border #333333     Focused / active states
```

---

## Component Reference

### Status Badge
```
● Succeeded   → bg #22c55e/10  text #22c55e  border #22c55e/20
● Failed      → bg #ef4444/10  text #ef4444  border #ef4444/20
● Running     → bg #8b5cf6/10  text #8b5cf6  border #8b5cf6/20  (pulse animation)
● In Progress → bg #3b82f6/10  text #3b82f6  border #3b82f6/20
● Warning     → bg #eab308/10  text #eab308  border #eab308/20
● Inactive    → bg #71717a/10  text #71717a  border #71717a/20
```

### Work Item Type Icons (Lucide)
```
Task (📋)  → CheckSquare
Bug  (🐛)  → Bug
PBI  (📦)  → Layers
Epic (⚡)  → Zap
```

### Pipeline Status Icons (Lucide)
```
Succeeded → CheckCircle2   #22c55e
Failed    → XCircle        #ef4444
Running   → Loader2        #8b5cf6  (spin)
Cancelled → MinusCircle    #71717a
Waiting   → Clock          #eab308
```
