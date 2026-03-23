# Contributing to Riva

Thanks for your interest in contributing! This guide will help you get the project running locally.

## Prerequisites

- [Bun](https://bun.sh/) (package manager)
- [Rust](https://rustup.rs/) (stable toolchain)
- An Azure DevOps organization with a [Personal Access Token (PAT)](https://learn.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate)

## Setup

```bash
git clone https://github.com/YuriPerro/riva-app.git
cd riva
bun install
```

## Development

```bash
# Frontend only — no Rust required, runs on port 1420
bun dev

# Full native app (requires Rust)
bun tauri dev
```

## Code Quality

Before submitting a PR, make sure all checks pass:

```bash
bunx tsc --noEmit   # Type check
bun run lint        # ESLint
bun run format      # Prettier
```

## Submitting a Pull Request

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run the checks above
4. Open a PR with a clear description of what changed and why

## Project Structure

```
src/
├── pages/       # Dashboard, Tasks, Pipelines, Pull Requests, Releases, Settings
├── components/  # Shared UI components
├── store/       # Zustand stores
├── hooks/       # Custom hooks
├── lib/         # Core infra (Tauri invoke wrapper, theme manager)
├── types/       # Shared TypeScript types
├── utils/       # Helpers (formatters, mappers, search)
└── styles/      # Global CSS and design tokens

src-tauri/src/
├── main.rs      # Entry point
├── lib.rs       # Tauri command registration
├── azure.rs     # Azure DevOps API client
└── openai.rs    # OpenAI integration
```

## Reporting Bugs

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) when opening issues.
