# Forge — Feature Roadmap

> Priorizado por impacto no dia a dia do dev.
> Atualizado: 2026-03-05

---

## Estado Atual

O Forge hoje funciona como **dashboard read-only** do Azure DevOps:
- Dashboard com work items + pipelines + sprint info
- My Work (items atribuidos, agrupados por status)
- Pull Requests (listagem com filtros)
- Pipelines (runs recentes com status)
- Work Item Detail (dialog com campos por tipo)
- Team Switcher + refresh global
- Settings (credenciais + projeto)

---

## Fase 1 — Daily Friction Killers

> Coisas que o dev faz 5-10x por dia e hoje precisa abrir o browser.

### 1.1 Quick Status Update ✅
- [x] Mudar estado do work item direto no Forge (ex: "In Progress" → "Ready for Review")
- [x] Dropdown no detail dialog com os estados válidos pro tipo
- [x] Feedback visual de sucesso/erro (toast centralizado)
- [x] Rust: `PATCH /wit/workitems/{id}` com JSON Patch
- [x] Error handling centralizado (Rust `api_error()` + global QueryClient handler)
- **Impacto:** Alto — elimina a ação mais repetitiva do dia

### 1.2 Copy Git Branch Name ✅
- [x] Botão no work item detail que copia o branch name sugerido
- [x] Formato: `feat/{type}-{id}` ou `bug/{type}-{id}`
- [x] Um clique → clipboard com toast de confirmação
- **Impacto:** Alto — todo dev precisa disso ao pegar uma task

### 1.3 Notifications / Activity Feed
- [ ] Polling ou WebSocket para detectar mudanças
- [ ] Alertas nativos do OS (tauri-plugin-notification) para:
  - PR aprovado / changes requested no seu PR
  - Pipeline falhou na sua branch
  - Menção em work item
- [ ] Badge counter no sidebar
- [ ] Activity feed page com histórico
- **Impacto:** Alto — dev para de checar email/browser pra ver status

### 1.4 PR Review Actions ✅
- [x] Aprovar PR direto do Forge
- [x] Rejeitar PR direto do Forge
- [x] Rust: `PUT /git/repositories/{repo}/pullrequests/{id}/reviewers/{userId}`
- [x] Reviewer tooltips com nome completo + status do voto
- [ ] Request changes com comentário (stretch)
- [ ] Deixar comentário inline (stretch)
- **Impacto:** Alto — code review sem sair do app

---

## Fase 2 — Workflow Accelerators

> Features que melhoram a produtividade mas não são bloqueantes.

### 2.1 Sprint Board View
- [ ] Kanban board do sprint atual
- [ ] Colunas = estados do workflow
- [ ] Drag & drop pra mudar status (integra com 1.1)
- [ ] Filtro por assignee, tipo, prioridade
- **Impacto:** Médio — visual overview melhor que lista

### 2.2 Pipeline Retrigger
- [ ] Botão "Re-run" em pipelines falhados
- [ ] Rust: `POST /build/builds` com definição + branch
- [ ] Feedback: "Pipeline triggered" → link pro run
- **Impacto:** Médio — evita navegar pro Azure DevOps só pra isso

### 2.3 Standup Summary ✅
- [x] Auto-gerar resumo baseado na atividade recente:
  - "Ontem: Trabalhei em #1234 (In Progress → Done)"
  - "Hoje: Pegar #1235, revisar PR #89"
  - "Bloqueado: #1240 aguardando deploy"
- [x] Copiar pro clipboard formatado
- [x] Período configurável (yesterday, last 24h, last 2 days)
- **Impacto:** Médio — standup em 10 segundos

---

## Fase 3 — Power User Features

> Polish e features pra quem vive no Forge.

### 3.1 Global Search (⌘K)
- [ ] Command palette style (⌘K)
- [ ] Busca unificada: work items, PRs, pipelines
- [ ] Resultados agrupados por tipo
- [ ] Atalho direto pra ações (ex: "change status of #1234")
- **Impacto:** Médio — power users adoram

### 3.2 Favorites / Pinned Items
- [ ] Pin work items ou PRs frequentes
- [ ] Seção "Pinned" no dashboard
- [ ] Persistência local
- **Impacto:** Baixo-médio — qualidade de vida

### 3.3 Keyboard Shortcuts
- [ ] Navegação entre páginas (⌘1-5)
- [ ] Ações rápidas (R = refresh, S = search, etc)
- [ ] Vim-style navigation nas listas (j/k)
- [ ] Shortcut help overlay (?)
- **Impacto:** Médio — produtividade pra power users

### 3.4 Multi-Project Support
- [ ] Switcher de projeto no sidebar
- [ ] Dados separados por projeto no cache
- [ ] Cross-project search
- **Impacto:** Médio — devs que trabalham em 2-3 projetos

---

## Fase 4 — Distribuição

### 4.1 Auto-Updater
- [ ] tauri-plugin-updater
- [ ] Check on startup + manual check
- [ ] Release notes inline

### 4.2 Builds
- [ ] GitHub Actions: .dmg (macOS), .exe (Windows), .AppImage (Linux)
- [ ] Code signing (macOS notarization)
- [ ] Release channel: stable / beta

### 4.3 Landing Page
- [ ] Site simples com download links
- [ ] Screenshots / demo GIF
- [ ] Changelog público

---

## Prioridade de Implementação

```
PRÓXIMO ──────────────────────────────────── FUTURO

1.1 Quick Status   →  1.2 Branch Copy  →  1.3 Notifications
       ↓                    ↓
2.1 Sprint Board   →  1.4 PR Actions   →  2.2 Pipeline Retrigger
       ↓                    ↓
3.1 ⌘K Search      →  2.3 Standup      →  3.3 Shortcuts
       ↓
3.4 Multi-Project  →  4.x Distribuição
```

---

## Notas

- Cada feature deve ser independente e funcional sozinha
- Priorizar UX: feedback visual, loading states, error handling
- Manter o app leve — evitar feature creep
- Testar no macOS primeiro, depois expandir
