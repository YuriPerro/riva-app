# Riva — Project Plan

> **Tagline:** *Your Azure DevOps. Without the noise.*

---

## 1. Visão Geral

**Problema:** O Azure DevOps exige muita navegação para tarefas simples do dia a dia — ver suas tasks, checar pipelines, revisar PRs. Devs perdem tempo demais no browser.

**Solução:** App desktop nativo, cross-platform, focado no que o dev precisa ver em menos de 3 cliques.

**Plataformas:**
- macOS (primário)
- Windows (futuro)
- Linux (futuro)

---

## 2. Tech Stack

```
┌─────────────────────────────────────────────────────┐
│                     FORGE APP                       │
│                                                     │
│  FRONTEND                    BACKEND (Rust)         │
│  ┌──────────────────┐        ┌──────────────────┐   │
│  │ React 18         │        │ Tauri 2.0        │   │
│  │ TypeScript 5     │◄──────►│ reqwest (HTTP)   │   │
│  │ Tailwind CSS 3   │        │ keyring (secrets)│   │
│  │ shadcn/ui        │        │ serde (JSON)     │   │
│  │ Zustand          │        │ tokio (async)    │   │
│  │ TanStack Query   │        └──────────────────┘   │
│  │ React Router 6   │                               │
│  └──────────────────┘                               │
└─────────────────────────────────────────────────────┘

Armazenamento:
  ├── Credenciais → OS Keychain (nativo por plataforma)
  └── Preferências → tauri-plugin-store (SQLite)

CI/CD:
  └── GitHub Actions → builds automáticos (.dmg / .exe / .AppImage)
```

---

## 3. Arquitetura Geral

```
┌──────────────────────────────────────────────────────────────┐
│                        TAURI PROCESS                         │
│                                                              │
│   ┌─────────────────────┐      ┌────────────────────────┐   │
│   │     WEBVIEW          │      │     RUST CORE          │   │
│   │                     │      │                        │   │
│   │  React + TS         │      │  Commands:             │   │
│   │  ┌───────────────┐  │      │  ├── auth_*            │   │
│   │  │ UI Components │  │      │  ├── workitems_*       │   │
│   │  └───────────────┘  │      │  ├── pipelines_*       │   │
│   │  ┌───────────────┐  │      │  ├── pullrequests_*    │   │
│   │  │  Zustand Store│  │      │  └── settings_*        │   │
│   │  └───────────────┘  │      │                        │   │
│   │  ┌───────────────┐  │      │  Services:             │   │
│   │  │ TanStack Query│◄─┼──────┼──► AzureClient         │   │
│   │  └───────────────┘  │      │  └── KeychainService   │   │
│   └─────────────────────┘      └────────────┬───────────┘   │
│                                             │               │
└─────────────────────────────────────────────┼───────────────┘
                                              │ HTTPS
                              ┌───────────────▼──────────────┐
                              │      AZURE DEVOPS API        │
                              │                              │
                              │  /{org}/{project}/_apis/     │
                              │  ├── wit/workitems           │
                              │  ├── build/builds            │
                              │  ├── git/pullrequests        │
                              │  └── work/teamsettings       │
                              └──────────────────────────────┘
```

---

## 4. Fluxo de Autenticação

```
ONBOARDING
══════════

  Usuário abre o app
         │
         ▼
  ┌─────────────────┐
  │  Tem credenciais│──── SIM ──► Valida token ──► App carrega
  │  no Keychain?   │
  └────────┬────────┘
           │ NÃO
           ▼
  ┌─────────────────────────────┐
  │      Tela de Setup          │
  │                             │
  │  1. Organization URL        │
  │     ex: dev.azure.com/myorg │
  │                             │
  │  2. Personal Access Token   │
  │     (link pra criar o PAT)  │
  │                             │
  │  3. Selecionar projeto      │
  └────────────┬────────────────┘
               │
               ▼
       Rust valida via API
       GET /_apis/projects
               │
        ┌──────┴──────┐
        │             │
      ERRO          SUCESSO
        │             │
        ▼             ▼
   Mostra erro   Salva no Keychain
   + hint        (OS nativo)
                      │
                      ▼
                 App carrega
```

---

## 5. Screens e Navegação

```
APP LAYOUT
══════════

┌─────────────────────────────────────────────────────┐
│ ● ● ●  [Project Name ▼]    Dashboard        ⟳ ↑ ⋮  │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ SIDEBAR  │           MAIN CONTENT                  │
│          │                                          │
│ 🏠 Home  │                                          │
│          │                                          │
│ ─────    │                                          │
│          │                                          │
│ 📋 My    │                                          │
│    Work  │                                          │
│          │                                          │
│ ⚡ Pipe- │                                          │
│   lines  │                                          │
│          │                                          │
│ 🔀 Pull  │                                          │
│    Reqs  │                                          │
│          │                                          │
│ ─────    │                                          │
│          │                                          │
│ 🔍 Search│                                          │
│          │                                          │
│ ⚙️ Config│                                          │
└──────────┴──────────────────────────────────────────┘


ROTAS:
  /                  → Dashboard (Home)
  /my-work           → Meus Work Items
  /my-work/:id       → Detalhe do Work Item
  /pipelines         → Lista de Pipelines
  /pipelines/:id     → Detalhe do Pipeline
  /pull-requests     → Lista de PRs
  /pull-requests/:id → Detalhe do PR
  /settings          → Configurações
  /onboarding        → Setup inicial
```

---

## 6. Screens em Detalhe

### 6.1 Dashboard

```
┌──────────────────────────────────────────────────────┐
│  Sprint 42  •  8 dias restantes          On Track ●  │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  5          │  │  3          │  │  2          │  │
│  │  My Tasks   │  │  In Review  │  │  Pipelines  │  │
│  │             │  │             │  │  Running    │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                      │
│  MY WORK ITEMS ─────────────────────────── Ver todos │
│  ┌────────────────────────────────────────────────┐  │
│  │ ● Implementar tela de login          In Progress│  │
│  │ ● Corrigir bug no pipeline           To Do      │  │
│  │ ● Code review: auth service          Review     │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  PIPELINES RECENTES ────────────────────── Ver todos │
│  ┌────────────────────────────────────────────────┐  │
│  │ ✅ main → Production    #142   há 23min        │  │
│  │ 🔄 feat/auth → Staging  #143   rodando...      │  │
│  │ ❌ hotfix → Production  #141   há 1h           │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 6.2 My Work

```
┌──────────────────────────────────────────────────────┐
│  My Work          [Sprint 42 ▼]  [Todos tipos ▼]  +  │
├──────────────────────────────────────────────────────┤
│  TO DO (2) ──────────────────────────────────────    │
│  │                                                   │
│  ├─ 📋 #1234  Implementar dark mode                  │
│  │           PBI: Design System  •  5pts  •  Alta    │
│  │                                                   │
│  └─ 🐛 #1240  Crash no startup em Windows            │
│               PBI: Stability  •  2pts  •  Crítica    │
│                                                      │
│  IN PROGRESS (1) ────────────────────────────────    │
│  │                                                   │
│  └─ 📋 #1235  Tela de onboarding                     │
│               PBI: Auth  •  8pts  •  Média           │
│                                                      │
│  IN REVIEW (2) ──────────────────────────────────    │
│  │                                                   │
│  ├─ 📋 #1230  Integração Azure API                   │
│  │                                                   │
│  └─ 📋 #1228  Sidebar navigation                     │
└──────────────────────────────────────────────────────┘
```

### 6.3 Pipelines

```
┌──────────────────────────────────────────────────────┐
│  Pipelines              [Todos ▼]  [Branch ▼]    ⟳   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ✅ CI - main                            há 23min    │
│     main → production  •  3min 42s  •  #142         │
│                                                      │
│  🔄 CI - feat/auth                       rodando     │
│     feat/auth → staging  •  1min 12s  •  #143  ████░│
│                                                      │
│  ❌ CD - hotfix                          há 1h        │
│     hotfix/fix-crash  •  0min 54s  •  #141           │
│     ⚠ Falhou em: Run Tests                          │
│                                                      │
│  ✅ CI - develop                         há 3h        │
│     develop → staging  •  4min 01s  •  #140         │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 7. Fluxo de Dados (Runtime)

```
DATA FLOW
══════════

  React Component precisa de dados
          │
          ▼
  TanStack Query
  (cache + refetch automático)
          │
    Cache hit? ──── SIM ──► Renderiza imediatamente
          │                  (+ revalida em background)
          │ NÃO
          ▼
  invoke('workitems_list', { sprint })   ← Tauri IPC
          │
          ▼
  Rust Command Handler
          │
          ▼
  AzureClient (reqwest)
  GET https://dev.azure.com/{org}/{project}/_apis/...
          │
          ▼
  Rust deserializa JSON → structs tipadas
          │
          ▼
  Retorna pro frontend (serializado)
          │
          ▼
  TanStack Query atualiza cache
          │
          ▼
  UI re-renderiza


CACHE STRATEGY:
  Work Items    → stale após 60s, refetch ao focar janela
  Pipelines     → stale após 15s (muda com frequência)
  Pull Requests → stale após 30s
  Sprint info   → stale após 5min
```

---

## 8. Estrutura de Pastas

```
forge/
├── docs/
│   └── PLAN.md                 ← este arquivo
│
├── src-tauri/                  ← Rust (backend)
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/           ← Tauri commands (IPC)
│   │   │   ├── auth.rs
│   │   │   ├── workitems.rs
│   │   │   ├── pipelines.rs
│   │   │   └── pullrequests.rs
│   │   ├── services/           ← Lógica de negócio
│   │   │   ├── azure_client.rs ← HTTP client
│   │   │   └── keychain.rs     ← Armazenamento seguro
│   │   └── models/             ← Structs tipadas da API
│   └── Cargo.toml
│
├── src/                        ← React (frontend)
│   ├── components/
│   │   ├── ui/                 ← shadcn/ui base
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── workitems/
│   │   ├── pipelines/
│   │   └── pullrequests/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── MyWork.tsx
│   │   ├── Pipelines.tsx
│   │   ├── PullRequests.tsx
│   │   ├── Settings.tsx
│   │   └── Onboarding.tsx
│   ├── store/                  ← Zustand
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   ├── hooks/                  ← TanStack Query hooks
│   │   ├── useWorkItems.ts
│   │   ├── usePipelines.ts
│   │   └── usePullRequests.ts
│   ├── lib/
│   │   └── tauri.ts            ← Wrappers dos commands
│   └── types/
│       └── azure.ts            ← TypeScript types da API
│
├── package.json
├── vite.config.ts
└── tauri.conf.json
```

---

## 9. Azure DevOps API — Endpoints Principais

```
BASE: https://dev.azure.com/{organization}/{project}/_apis

WORK ITEMS
  GET  /wit/wiql                     → Query WIQL (tasks do sprint)
  GET  /wit/workitems?ids=1,2,3      → Detalhes por IDs
  PATCH /wit/workitems/{id}          → Atualizar status

PIPELINES
  GET  /build/builds                 → Lista builds recentes
  GET  /build/builds/{id}            → Detalhe + logs
  POST /build/builds                 → Trigger manual

PULL REQUESTS
  GET  /git/pullrequests             → PRs ativos
  GET  /git/repositories             → Lista de repos

SPRINT
  GET  /work/teamsettings/iterations → Sprints do time
  GET  /work/iterations/{id}/workitems → Tasks do sprint

AUTH HEADER:
  Authorization: Basic base64(:{PAT})
```

---

## 10. Decisões Técnicas

| Decisão | Escolha | Motivo |
|---|---|---|
| Chamadas HTTP | Rust (não fetch no front) | PAT nunca exposto no webview |
| Estado servidor | TanStack Query | Cache, retry, revalidação automática |
| Estado global | Zustand | Simples, sem boilerplate |
| Estilo | Tailwind + shadcn/ui | Consistência + dark mode nativo |
| Persistência local | tauri-plugin-store | Leve, sem overhead |
| Auth storage | OS Keychain nativo | Segurança por plataforma |
| Build pipeline | GitHub Actions | .dmg + .exe + .AppImage automático |

---

## 11. Roadmap

```
FASE 1 — Fundação (Semana 1-2)
══════════════════════════════
  ├── Setup Tauri 2.0 + React + TypeScript         ✅
  ├── Configurar Tailwind + shadcn/ui (dark theme)
  ├── Layout base: Sidebar + Header
  ├── Tela de Onboarding (auth com PAT)
  └── Rust: AzureClient + Keychain

FASE 2 — Core Features (Semana 3-4)
═════════════════════════════════════
  ├── Dashboard com métricas do sprint
  ├── My Work — lista de work items
  ├── Detalhe do work item + mudar status
  └── TanStack Query + estratégia de cache

FASE 3 — Pipelines + PRs (Semana 5-6)
═══════════════════════════════════════
  ├── Tela de Pipelines com status em tempo real
  ├── Trigger manual de pipeline
  ├── Tela de Pull Requests
  └── Notificações nativas do OS

FASE 4 — Polish (Semana 7-8)
══════════════════════════════
  ├── Multi-projeto (trocar projeto no sidebar)
  ├── Search global (work items, pipelines)
  ├── Keyboard shortcuts
  ├── Settings completo
  └── Builds: .dmg / .exe / .AppImage via CI

FASE 5 — Distribuição (futuro)
═══════════════════════════════
  ├── Auto-updater (tauri-plugin-updater)
  ├── Landing page
  └── Considerar: free tier + pro (multi-org)
```
