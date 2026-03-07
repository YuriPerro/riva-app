# task.sh — Roadmap de Evolução

Pipeline de desenvolvimento assistido por IA. Plano de melhorias organizado em fases incrementais.

---

## Fase 1 — Modos de Execução

Tornar o pipeline flexível para diferentes tamanhos de task.

### 1.1 Fast Mode (`--fast`)
- Pula etapas de spec e quality review
- Fluxo: impl → fidelity review → commit
- Para tasks claras e pequenas que não precisam de spec formal
- Flag: `./scripts/task.sh --fast "fix button color"`

### 1.2 Stage Selection (`--from`, `--only`)
- `--from impl` — começa na implementação (spec já existe em `.task/spec.md`)
- `--from quality` — pula direto para quality review
- `--only quality` — roda apenas uma etapa isolada
- Útil para: spec manual, re-review após edit manual, testar prompts

### 1.3 Git Branch per Task
- Auto-cria branch `task/slug-name` antes de implementar
- Flag `--branch` (opt-in) ou configurável via `taskrc`
- Protege `main` de implementações quebradas
- Ao final, oferece: `[m]erge na main / [k]eep branch / [d]elete`

---

## Fase 2 — Inteligência do Loop

Melhorar como o pipeline lida com falhas e retentativas.

### 2.1 Patch Instead of Rollback
- Ao reprovar na fidelity review, NÃO apagar o código e reimplementar do zero
- Passar o diff atual + review feedback para o próximo attempt
- O agente de impl recebe o código existente e CORRIGE apenas os problemas apontados
- Economia: evita jogar fora 90% de código correto

### 2.2 Interactive Review
- Quando reviewer reprova, mostrar problemas e perguntar ao dev:
  - `[c]orrigir automaticamente` — comportamento atual, chama o agente
  - `[i]gnorar e continuar` — aceita mesmo com problemas, segue para próxima etapa
  - `[e]ditar manual` — abre `$EDITOR` para o dev corrigir manualmente
  - `[a]bortar` — para o pipeline
- Aplica-se tanto à fidelity review quanto à quality review
- Dá controle sem perder automação

### 2.3 Codebase Context for Spec Agent
- Spec agent atualmente roda sem acesso ao codebase (só `-p`)
- Injetar no prompt do spec:
  - Árvore de diretórios (`src/` com 2 níveis de profundidade)
  - Lista de tipos existentes em `src/types/`
  - Lista de componentes em `src/pages/` e `src/components/`
- Alternativa: dar tool access (Read, Glob, Grep) ao spec agent
- Resultado: specs com nomes de arquivos e tipos corretos, menos retrabalho na impl

---

## Fase 3 — Visibilidade e Custo

Instrumentação para entender performance e custo do pipeline.

### 3.1 Cost Tracking
- Estimar tokens por chamada baseado no tamanho do prompt (`chars / 4`)
- Tabela de preço por modelo (input/output por 1M tokens):
  - Opus: $15 / $75
  - Sonnet: $3 / $15
  - Haiku: $0.80 / $4
- Mostrar custo estimado por stage no output
- Custo total acumulado no summary JSON
- Flag `--cost` para mostrar estimativa sem rodar (dry run parcial)

### 3.2 Task History
- Salvar cada run completo em `.task/history/{timestamp}-{slug}.json`
- Campos: task description, stages (status, attempts, duration, model), total cost estimate
- Comando `./scripts/task.sh --history` para listar runs anteriores
- Após 10+ runs: dados para identificar quais tipos de task falham mais, tempo médio, custo médio

### 3.3 Dry Run (`--dry-run`)
- Mostrar o que aconteceria sem chamar Claude
- Imprime: prompts que seriam enviados, modelos selecionados, custo estimado
- Útil para debug de prompts e validação de config

---

## Fase 4 — Performance

Otimizações para reduzir tempo e custo total do pipeline.

### 4.1 Parallel Codebase Scan
- Enquanto o spec agent roda, disparar uma chamada Haiku em paralelo
- Haiku escaneia: arquivos relacionados, padrões existentes, componentes similares
- Resultado alimenta o prompt de implementação com contexto real
- Custo adicional mínimo (Haiku), ganho significativo de qualidade na impl

### 4.2 Incremental Diff Review
- Quality review recebe o diff inteiro toda vez, mesmo em retry
- Na retry, enviar apenas o delta entre o diff anterior e o atual
- Reduz tokens no prompt → mais rápido e barato

### 4.3 Prompt Caching
- Se CLAUDE.md não mudou entre runs, reutilizar a seção no prompt sem reprocessar
- Investigar se Claude CLI suporta prompt caching nativo
- Se não, implementar hash-based cache local para seções estáticas

---

## Fase 5 — Aprendizado

Pipeline que melhora com o uso.

### 5.1 Prompt Versioning
- Hash de cada prompt template por stage
- Registrar no summary qual versão do prompt produziu qual resultado
- Ao alterar prompts, comparar taxa de aprovação antes/depois
- Permite A/B testing de prompts com dados reais

### 5.2 Pattern Learning
- Após N runs aprovados, extrair padrões:
  - Quais tipos de task passam de primeira?
  - Quais problemas o quality review mais encontra?
  - Quais correções o fix agent mais aplica?
- Alimentar esses padrões de volta nos prompts como exemplos
- Meta: reduzir taxa de rejeição ao longo do tempo

### 5.3 Project-Specific Tuning
- Gerar um `.task/learned-rules.md` baseado no histórico
- Regras tipo: "neste projeto, sempre usar X ao invés de Y"
- Injetar automaticamente nos prompts de impl e quality
- O pipeline se adapta ao projeto ao longo do tempo

---

## Prioridade de Implementação

| Ordem | Item                      | Fase | Impacto            | Esforço |
| ----- | ------------------------- | ---- | ------------------ | ------- |
| 1     | Fast Mode                 | 1.1  | Alto               | Baixo   |
| 2     | Patch Instead of Rollback | 2.1  | Alto               | Médio   |
| 3     | Interactive Review        | 2.2  | Alto               | Médio   |
| 4     | Stage Selection           | 1.2  | Médio              | Baixo   |
| 5     | Codebase Context for Spec | 2.3  | Médio              | Baixo   |
| 6     | Cost Tracking             | 3.1  | Médio              | Baixo   |
| 7     | Git Branch per Task       | 1.3  | Médio              | Baixo   |
| 8     | Task History              | 3.2  | Médio              | Médio   |
| 9     | Dry Run                   | 3.3  | Baixo              | Baixo   |
| 10    | Parallel Codebase Scan    | 4.1  | Médio              | Médio   |
| 11    | Incremental Diff Review   | 4.2  | Baixo              | Médio   |
| 12    | Prompt Versioning         | 5.1  | Baixo              | Médio   |
| 13    | Pattern Learning          | 5.2  | Alto (longo prazo) | Alto    |
| 14    | Prompt Caching            | 4.3  | Baixo              | Médio   |
| 15    | Project-Specific Tuning   | 5.3  | Alto (longo prazo) | Alto    |
