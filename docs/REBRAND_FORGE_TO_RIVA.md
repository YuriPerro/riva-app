# Rebrand: Forge → Riva

Renaming the app from "Forge" to "Riva" across the entire codebase.

---

## Migration Strategy

Existing users have data at `~/.forge/` (credentials.json, openai.json). On first launch after rebrand, if `~/.riva/` doesn't exist but `~/.forge/` does, copy the files over automatically. No data loss.

localStorage keys change prefix from `forge_` to `riva_`. Same migration approach — read old keys if new ones don't exist, then write to new keys and clean up old ones.

---

## Changes

### 1. Config Files

| File | Before | After |
|------|--------|-------|
| `package.json:2` | `"name": "forge"` | `"name": "riva"` |
| `src-tauri/tauri.conf.json:3` | `"productName": "Forge"` | `"productName": "Riva"` |
| `src-tauri/tauri.conf.json:5` | `"identifier": "com.yuribaumgartner.forge"` | `"identifier": "com.yuribaumgartner.riva"` |
| `src-tauri/tauri.conf.json:15` | `"title": "Forge"` | `"title": "Riva"` |
| `src-tauri/Cargo.toml:2` | `name = "forge"` | `name = "riva"` |
| `src-tauri/Cargo.toml:14` | `name = "forge_lib"` | `name = "riva_lib"` |

### 2. Rust Backend

| File | Before | After |
|------|--------|-------|
| `src-tauri/src/lib.rs:34` | `.join(".forge")` | `.join(".riva")` |
| `src-tauri/src/openai.rs:34` | `.join(".forge")` | `.join(".riva")` |
| `src-tauri/src/main.rs:5` | `forge_lib::run()` | `riva_lib::run()` |

Add migration function in `lib.rs`: if `~/.riva/` doesn't exist and `~/.forge/` does, copy contents over.

### 3. localStorage Keys

| File | Before | After |
|------|--------|-------|
| `src/store/session.ts` | `forge_project`, `forge_team`, `forge_team_id` | `riva_project`, `riva_team`, `riva_team_id` |
| `src/store/notifications.ts` | `forge_notification_settings` | `riva_notification_settings` |
| `src/lib/theme-manager.ts` | `forge_theme` | `riva_theme` |
| `src/pages/setup/use-setup.ts` | `forge_onboarding_complete` | `riva_onboarding_complete` |
| `src/pages/pipelines/use-pipelines.ts` | `forge_favorite_pipelines_${project}` | `riva_favorite_pipelines_${project}` |
| `src/pages/releases/use-releases.ts` | `forge_favorite_releases_${project}` | `riva_favorite_releases_${project}` |
| `src/pages/dashboard/components/focus-score/use-focus-score.ts` | `forge_best_streak` | `riva_best_streak` |
| `src/components/sidebar-game/use-sidebar-game.ts` | `forge-game-save` | `riva-game-save` |

### 4. UI Text

| File | Before | After |
|------|--------|-------|
| `src/components/layout/sidebar.tsx:41` | `Forge` | `Riva` |
| `src/pages/settings/index.tsx:67` | `Sign out of Forge?` | `Sign out of Riva?` |
| `src/pages/setup/components/setup-ai/index.tsx:52` | `~/.forge/openai.json` | `~/.riva/openai.json` |

### 5. Capabilities

| File | Before | After |
|------|--------|-------|
| `src-tauri/capabilities/default.json:3` | `Default Forge capabilities` | `Default Riva capabilities` |

### 6. Documentation

| File | Before | After |
|------|--------|-------|
| `CLAUDE.md` | `What is Forge`, `com.yuribaumgartner.forge` | `What is Riva`, `com.yuribaumgartner.riva` |
| `docs/PLAN.md` | `Forge — Project Plan` | `Riva — Project Plan` |
| `docs/DESIGN_SYSTEM.md` | `Forge — Design System` | `Riva — Design System` |
| `docs/ONBOARDING_IMPROVEMENTS.md` | References to "Forge" | `Riva` |

---

## Implementation Order

```
1. Rust config (Cargo.toml, tauri.conf.json, main.rs)
2. Rust storage paths + migration function (lib.rs, openai.rs)
3. Frontend localStorage keys (8 files)
4. UI text (3 files)
5. Package.json
6. Capabilities
7. Documentation (4 files)
8. Verify: cargo build + bunx tsc --noEmit
```

---

## Verification

- [ ] `cargo build` passes (Rust crate rename)
- [ ] `bunx tsc --noEmit` passes (frontend)
- [ ] App launches with window title "Riva"
- [ ] Sidebar shows "Riva"
- [ ] Sign out dialog says "Riva"
- [ ] `~/.forge/` data migrates to `~/.riva/` on first launch
- [ ] localStorage old keys migrate to new prefix
- [ ] No remaining references to "forge" in codebase (grep check)
