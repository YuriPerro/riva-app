#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/task-core.sh"
source "$SCRIPT_DIR/task-prompts.sh"

command -v gum &>/dev/null || { echo "gum não encontrado. Instale com: brew install gum"; exit 1; }
command -v glow &>/dev/null || { echo "glow não encontrado. Instale com: brew install glow"; exit 1; }

SKIP_SPEC=false
SKIP_QUALITY=false
FROM_STAGE=""
ONLY_STAGE=""

while [[ "${1:-}" == --* ]]; do
  case "$1" in
    --no-commit) AUTO_COMMIT=false; shift ;;
    --fast) FAST_MODE=true; SKIP_SPEC=true; SKIP_QUALITY=true; shift ;;
    --from)
      [ -z "${2:-}" ] && error "--from requer um stage: spec, impl, test, quality, commit"
      FROM_STAGE=$(echo "$2" | tr '[:lower:]' '[:upper:]')
      shift 2 ;;
    --only)
      [ -z "${2:-}" ] && error "--only requer um stage: spec, impl, test, quality, commit"
      ONLY_STAGE=$(echo "$2" | tr '[:lower:]' '[:upper:]')
      shift 2 ;;
    *) error "Flag desconhecida: $1" ;;
  esac
done

[ -z "${1:-}" ] && {
  gum style --foreground "$GUM_RED" --bold "Uso: ./scripts/task.sh [flags] \"descrição da task\""
  echo ""
  gum style --foreground "$GUM_DIM" "Flags:"
  gum style --foreground "$GUM_CYAN" "  --fast          Pula spec e quality (impl → review → commit)"
  gum style --foreground "$GUM_CYAN" "  --from <stage>  Começa a partir de: spec, impl, test, quality, commit"
  gum style --foreground "$GUM_CYAN" "  --only <stage>  Roda apenas um stage"
  gum style --foreground "$GUM_CYAN" "  --no-commit     Pula o commit"
  exit 1
}

command -v claude &>/dev/null || error "Claude Code não encontrado. Instale com: npm install -g @anthropic-ai/claude-code"
git rev-parse --git-dir &>/dev/null || error "Não é um repositório git."

TASK_DESC="$1"
load_config
load_claude_md
[ -z "$CLAUDE_MD_CONTENT" ] && warn "CLAUDE.md não encontrado na raiz."

mkdir -p "$TASK_DIR"
: > "$ERROR_LOG"

header "task.sh" "$(gum style --foreground "$GUM_DIM" "$TASK_DESC")"

if [ "$FAST_MODE" = true ]; then
  gum style --foreground "$GUM_YELLOW" --italic "  ⚡ Fast mode — pulando spec e quality"
fi

EXISTING_STATE=$(get_state)
if [ -n "$FROM_STAGE" ]; then
  EXISTING_STATE="$FROM_STAGE"
elif [ -n "$ONLY_STAGE" ]; then
  EXISTING_STATE="$ONLY_STAGE"
elif [ -n "$EXISTING_STATE" ] && [ "$EXISTING_STATE" != "DONE" ]; then
  if ask_confirm "Pipeline anterior na etapa $EXISTING_STATE. Continuar?"; then
    : # keep state
  else
    clear_state
    EXISTING_STATE=""
  fi
fi

should_run() {
  local stage="$1"

  [ "$SKIP_SPEC" = true ] && [ "$stage" = "SPEC" ] && return 1
  [ "$SKIP_QUALITY" = true ] && [ "$stage" = "QUALITY" ] && return 1

  if [ -n "$ONLY_STAGE" ]; then
    [ "$stage" = "$ONLY_STAGE" ] && return 0 || return 1
  fi

  [ -z "$EXISTING_STATE" ] && return 0

  local stages=("SPEC" "IMPL" "TEST" "QUALITY" "COMMIT")
  local existing_idx=-1
  local stage_idx=-1

  for i in "${!stages[@]}"; do
    [ "${stages[$i]}" = "$EXISTING_STATE" ] && existing_idx=$i
    [ "${stages[$i]}" = "$stage" ] && stage_idx=$i
  done

  [ $stage_idx -ge $existing_idx ]
}

snapshot_untracked

IMPL_ATTEMPT=0
QUALITY_ATTEMPT=0

# =============================================================================
# STAGE 1 — SPEC
# =============================================================================
if should_run "SPEC"; then
  STAGE_START=$SECONDS
  step "1 · Spec"
  log "Mapeando codebase..."
  gather_codebase_context
  log "Analisando task e gerando spec..."

  DEEPENING_PROMPT=$(prompt_deepening "$TASK_DESC")
  DEEPENING_RESULT=$(run_claude "spec" "$MODEL_SPEC" \
    -p "$DEEPENING_PROMPT" \
    --allowedTools "Read,Glob,Grep" \
    --output-format text)

  if echo "$DEEPENING_RESULT" | grep -q "PRECISA_CLARIFICACAO: sim"; then
    echo ""
    gum style --foreground "$GUM_YELLOW" --border rounded --border-foreground "$GUM_YELLOW" --padding "1 2" \
      "Task precisa de mais informações:"
    echo ""
    echo "$DEEPENING_RESULT" | grep -A 20 "PERGUNTAS:" | grep "^-" | sed 's/^- /  → /'
    echo ""
    gum style --foreground "$GUM_DIM" --italic "Responda as perguntas e rode novamente."
    clear_state
    exit 0
  fi

  echo "$DEEPENING_RESULT" | sed 's/PRECISA_CLARIFICACAO: não//' | sed '/^$/d' > "$SPEC_FILE"
  success "Spec gerada ($(stage_duration $STAGE_START))"

  echo ""
  render_md "$(cat "$SPEC_FILE")"
  echo ""

  SPEC_ACTION=$(gum choose \
    --header "Spec OK?" \
    --header.foreground "$GUM_YELLOW" \
    --cursor.foreground "$GUM_CYAN" \
    "Aprovar" "Editar" "Cancelar")

  case "$SPEC_ACTION" in
    "Editar")
      ${EDITOR:-vi} "$SPEC_FILE"
      success "Spec editada manualmente."
      ;;
    "Cancelar")
      warn "Pipeline cancelado. Spec salva em $SPEC_FILE."
      clear_state
      exit 0
      ;;
  esac

  save_state "IMPL"
fi

if [ "$FAST_MODE" = true ] && [ ! -f "$SPEC_FILE" ]; then
  echo "$TASK_DESC" > "$SPEC_FILE"
  log "Fast mode: usando descrição como spec."
fi

SPEC_CONTENT=$(cat "$SPEC_FILE" 2>/dev/null || echo "$TASK_DESC")

# =============================================================================
# STAGE 2 — IMPLEMENTATION + FIDELITY REVIEW
# =============================================================================
if should_run "IMPL"; then
  step "2 · Implementação"

  if [ -z "$CODEBASE_CONTEXT" ]; then
    log "Mapeando codebase..."
    gather_codebase_context
  fi

  IMPL_APPROVED=false

  while [ $IMPL_ATTEMPT -lt $MAX_IMPL_RETRIES ] && [ "$IMPL_APPROVED" = false ]; do
    IMPL_ATTEMPT=$((IMPL_ATTEMPT + 1))
    STAGE_START=$SECONDS
    PREVIOUS_REVIEW=""

    CURRENT_DIFF=""
    if [ $IMPL_ATTEMPT -gt 1 ]; then
      gum style --foreground "$GUM_YELLOW" "  ↻ Tentativa $IMPL_ATTEMPT de $MAX_IMPL_RETRIES (patch mode)"
      PREVIOUS_REVIEW=$(cat "$REVIEW_FILE" 2>/dev/null || echo "")
      CURRENT_DIFF=$(get_full_diff)
    fi

    IMPL_PROMPT=$(prompt_implementation "$SPEC_CONTENT" "$PREVIOUS_REVIEW" "$CURRENT_DIFF")
    run_claude "impl-$IMPL_ATTEMPT" "$MODEL_IMPL" \
      -p "$IMPL_PROMPT" \
      --allowedTools "Read,Write,Edit,MultiEdit,Bash,Glob,Grep" \
      --output-format text > /dev/null

    FULL_DIFF=$(get_full_diff)

    if [ -z "$FULL_DIFF" ]; then
      warn "Nenhuma mudança detectada."
      continue
    fi

    step "2b · Fidelity Review (#$IMPL_ATTEMPT)"

    REVIEW_PROMPT=$(prompt_review "$SPEC_CONTENT" "$FULL_DIFF")
    REVIEW_RESULT=$(run_claude "review-$IMPL_ATTEMPT" "$MODEL_REVIEW" -p "$REVIEW_PROMPT" --output-format text)
    echo "$REVIEW_RESULT" > "$REVIEW_FILE"

    show_result "$REVIEW_RESULT"

    if is_approved "$REVIEW_RESULT"; then
      success "Fidelity review: APROVADO ($(stage_duration $STAGE_START))"
      IMPL_APPROVED=true
    else
      REVIEW_ACTION=$(ask_review_action "Fidelity review")

      case "$REVIEW_ACTION" in
        c) ;; # continues loop, will patch
        i)
          success "Ignorando — continuando."
          IMPL_APPROVED=true
          ;;
        e)
          warn "Abrindo editor..."
          ${EDITOR:-vi} .
          if ask_confirm "Re-rodar review?"; then
            IMPL_ATTEMPT=$((IMPL_ATTEMPT - 1))
          else
            IMPL_APPROVED=true
          fi
          ;;
        a) error "Pipeline abortado." ;;
      esac
    fi
  done

  if [ "$IMPL_APPROVED" = false ]; then
    error "Implementação não aprovada após $MAX_IMPL_RETRIES tentativas."
  fi

  save_state "TEST"
fi

# =============================================================================
# STAGE 3 — TESTS
# =============================================================================
if should_run "TEST"; then
  step "3 · Testes"
  STAGE_START=$SECONDS

  TEST_CMD=$(detect_test_command)

  if [ -n "$TEST_CMD" ]; then
    log "Rodando: $TEST_CMD"

    if eval "$TEST_CMD" 2>&1 | tee "$TASK_DIR/test-output.txt"; then
      success "Testes passando ($(stage_duration $STAGE_START))"
    else
      warn "Testes falharam. Corrigindo..."

      CURRENT_DIFF=$(get_full_diff)
      TEST_OUTPUT=$(cat "$TASK_DIR/test-output.txt")
      FIX_PROMPT=$(prompt_test_fix "$SPEC_CONTENT" "$TEST_OUTPUT" "$CURRENT_DIFF")

      run_claude "test-fix" "$MODEL_FIX" \
        -p "$FIX_PROMPT" \
        --allowedTools "Read,Write,Edit,MultiEdit,Bash,Glob,Grep" \
        --output-format text > /dev/null

      if eval "$TEST_CMD" 2>/dev/null; then
        success "Testes corrigidos ($(stage_duration $STAGE_START))"
      else
        error "Testes ainda falhando. Intervenção manual necessária."
      fi
    fi
  else
    gum style --foreground "$GUM_DIM" --italic "  Nenhum script de teste encontrado. Pulando."
  fi

  save_state "QUALITY"
fi

# =============================================================================
# STAGE 4 — QUALITY REVIEW
# =============================================================================
if should_run "QUALITY"; then
  step "4 · Quality Review"

  QUALITY_APPROVED=false
  PREVIOUS_QUALITY=""
  FINAL_DIFF=$(get_full_diff)

  while [ $QUALITY_ATTEMPT -lt $MAX_QUALITY_RETRIES ] && [ "$QUALITY_APPROVED" = false ]; do
    QUALITY_ATTEMPT=$((QUALITY_ATTEMPT + 1))
    STAGE_START=$SECONDS
    log "Senior code review (tentativa $QUALITY_ATTEMPT)..."

    QUALITY_PROMPT=$(prompt_quality "$FINAL_DIFF" "$PREVIOUS_QUALITY")
    QUALITY_RESULT=$(run_claude "quality-$QUALITY_ATTEMPT" "$MODEL_QUALITY" -p "$QUALITY_PROMPT" --output-format text)
    echo "$QUALITY_RESULT" > "$QUALITY_FILE"

    show_result "$QUALITY_RESULT"

    if is_approved "$QUALITY_RESULT"; then
      success "Quality review: APROVADO ($(stage_duration $STAGE_START))"
      QUALITY_APPROVED=true
    else
      QUALITY_ACTION=$(ask_review_action "Quality review")

      case "$QUALITY_ACTION" in
        c)
          PREVIOUS_QUALITY="$QUALITY_RESULT"
          QUALITY_FIX_PROMPT=$(prompt_quality_fix "$SPEC_CONTENT" "$QUALITY_RESULT" "$FINAL_DIFF")
          run_claude "quality-fix-$QUALITY_ATTEMPT" "$MODEL_FIX" \
            -p "$QUALITY_FIX_PROMPT" \
            --allowedTools "Read,Write,Edit,MultiEdit,Bash,Glob,Grep" \
            --output-format text > /dev/null
          FINAL_DIFF=$(get_full_diff)
          ;;
        i)
          success "Ignorando — continuando."
          QUALITY_APPROVED=true
          ;;
        e)
          warn "Abrindo editor..."
          ${EDITOR:-vi} .
          FINAL_DIFF=$(get_full_diff)
          if ask_confirm "Re-rodar quality review?"; then
            QUALITY_ATTEMPT=$((QUALITY_ATTEMPT - 1))
          else
            QUALITY_APPROVED=true
          fi
          ;;
        a) error "Pipeline abortado." ;;
      esac
    fi
  done

  if [ "$QUALITY_APPROVED" = false ]; then
    warn "Quality review não aprovado após $MAX_QUALITY_RETRIES tentativas. Prosseguindo."
  fi

  save_state "COMMIT"
fi

# =============================================================================
# STAGE 5 — COMMIT
# =============================================================================
if should_run "COMMIT"; then
  step "5 · Commit"

  if [ "$AUTO_COMMIT" = false ]; then
    warn "Commit desabilitado. Mudanças prontas para commit manual."
    git add -A
  else
    log "Gerando mensagem de commit..."

    COMMIT_DIFF=$(get_full_diff)
    COMMIT_DIFF=$(head -200 <<< "$COMMIT_DIFF" || true)
    SPEC_SUMMARY=$(head -20 "$SPEC_FILE")
    COMMIT_PROMPT=$(prompt_commit "$COMMIT_DIFF" "$SPEC_SUMMARY")

    COMMIT_MSG_RAW=$(run_claude "commit-msg" "$MODEL_COMMIT" -p "$COMMIT_PROMPT" --output-format text)
    COMMIT_MSG=$(head -1 <<< "$COMMIT_MSG_RAW")

    echo ""
    gum style --foreground "$GUM_GREEN" --border rounded --border-foreground "$GUM_DIM" --padding "0 2" \
      "  $COMMIT_MSG"
    echo ""

    if ask_confirm "Fazer commit?"; then
      git add -A
      git commit -m "$COMMIT_MSG"
      success "Commit realizado."
    else
      warn "Commit cancelado. Mudanças staged para commit manual."
      git add -A
    fi
  fi

  save_state "DONE"
fi

# =============================================================================
# SUMMARY
# =============================================================================
write_summary "$IMPL_ATTEMPT" "$QUALITY_ATTEMPT"

echo ""
gum style \
  --border double \
  --border-foreground "$GUM_GREEN" \
  --foreground "$GUM_GREEN" \
  --bold \
  --padding "1 3" \
  --margin "1 0" \
  "Pipeline concluído!"

gum style --foreground "$GUM_DIM" \
  "  Modo:            $([ "$FAST_MODE" = true ] && echo "⚡ fast" || echo "full")" \
  "  Impl attempts:   $IMPL_ATTEMPT" \
  "  Quality attempts: $QUALITY_ATTEMPT" \
  "  Claude calls:    $CLAUDE_CALLS" \
  "  Duração:         $(stage_duration $PIPELINE_START)" \
  "" \
  "  Spec:      $SPEC_FILE" \
  "  Review:    $REVIEW_FILE" \
  "  Quality:   $QUALITY_FILE" \
  "  Summary:   $SUMMARY_FILE"
echo ""
