#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/task-core.sh"
source "$SCRIPT_DIR/task-prompts.sh"

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

[ -z "${1:-}" ] && error "Uso: ./scripts/task.sh [flags] \"descrição da task\"\n\n  Flags:\n    --fast          Pula spec e quality (impl → review → commit)\n    --from <stage>  Começa a partir de: spec, impl, test, quality, commit\n    --only <stage>  Roda apenas um stage\n    --no-commit     Pula o commit"
command -v claude &>/dev/null || error "Claude Code não encontrado. Instale com: npm install -g @anthropic-ai/claude-code"
git rev-parse --git-dir &>/dev/null || error "Não é um repositório git."

TASK_DESC="$1"
load_config
load_claude_md
[ -z "$CLAUDE_MD_CONTENT" ] && warn "CLAUDE.md não encontrado na raiz. Recomendado para melhores resultados."

mkdir -p "$TASK_DIR"
: > "$ERROR_LOG"

if [ "$FAST_MODE" = true ]; then
  log "Modo rápido ativado — pulando spec e quality review."
fi

EXISTING_STATE=$(get_state)
if [ -n "$FROM_STAGE" ]; then
  EXISTING_STATE="$FROM_STAGE"
elif [ -n "$ONLY_STAGE" ]; then
  EXISTING_STATE="$ONLY_STAGE"
elif [ -n "$EXISTING_STATE" ] && [ "$EXISTING_STATE" != "DONE" ]; then
  echo ""
  warn "Pipeline anterior detectado na etapa: ${BOLD}$EXISTING_STATE${RESET}"
  echo -e "Continuar de onde parou? ${YELLOW}[s/N]${RESET}"
  read -r RESUME_CONFIRM
  if [[ ! "$RESUME_CONFIRM" =~ ^[Ss]$ ]]; then
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
  step "ETAPA 1 · Aprofundamento da Task"
  log "Analisando a descrição e gerando spec..."

  DEEPENING_PROMPT=$(prompt_deepening "$TASK_DESC")
  DEEPENING_RESULT=$(run_claude "spec" "$MODEL_SPEC" -p "$DEEPENING_PROMPT" --output-format text)

  if echo "$DEEPENING_RESULT" | grep -q "PRECISA_CLARIFICACAO: sim"; then
    echo ""
    warn "Task precisa de mais informações:"
    echo ""
    echo "$DEEPENING_RESULT" | grep -A 20 "PERGUNTAS:" | grep "^-" | sed 's/^- /  → /'
    echo ""
    echo -e "${YELLOW}Responda as perguntas acima e rode novamente com a descrição completa.${RESET}"
    clear_state
    exit 0
  fi

  echo "$DEEPENING_RESULT" | sed 's/PRECISA_CLARIFICACAO: não//' | sed '/^$/d' > "$SPEC_FILE"
  success "Spec gerada em $SPEC_FILE ($(stage_duration $STAGE_START))"
  echo ""
  cat "$SPEC_FILE"
  echo ""

  echo -e "Spec OK? ${YELLOW}[s/editar/N]${RESET}"
  read -r SPEC_CONFIRM

  if [[ "$SPEC_CONFIRM" =~ ^[Ee](ditar)?$ ]]; then
    ${EDITOR:-vi} "$SPEC_FILE"
    success "Spec editada manualmente."
  elif [[ ! "$SPEC_CONFIRM" =~ ^[Ss]$ ]]; then
    warn "Pipeline cancelado. Spec salva em $SPEC_FILE para referência."
    clear_state
    exit 0
  fi

  save_state "IMPL"
fi

if [ "$FAST_MODE" = true ] && [ ! -f "$SPEC_FILE" ]; then
  echo "$TASK_DESC" > "$SPEC_FILE"
  log "Fast mode: usando descrição da task como spec."
fi

SPEC_CONTENT=$(cat "$SPEC_FILE" 2>/dev/null || echo "$TASK_DESC")

# =============================================================================
# STAGE 2 — IMPLEMENTATION + FIDELITY REVIEW
# =============================================================================
if should_run "IMPL"; then
  step "ETAPA 2 · Implementação"

  IMPL_APPROVED=false

  while [ $IMPL_ATTEMPT -lt $MAX_IMPL_RETRIES ] && [ "$IMPL_APPROVED" = false ]; do
    IMPL_ATTEMPT=$((IMPL_ATTEMPT + 1))
    STAGE_START=$SECONDS
    PREVIOUS_REVIEW=""

    CURRENT_DIFF=""
    if [ $IMPL_ATTEMPT -gt 1 ]; then
      warn "Tentativa $IMPL_ATTEMPT de $MAX_IMPL_RETRIES (patch mode)..."
      PREVIOUS_REVIEW=$(cat "$REVIEW_FILE" 2>/dev/null || echo "")
      CURRENT_DIFF=$(get_full_diff)
    fi

    log "Rodando agente de implementação..."

    IMPL_PROMPT=$(prompt_implementation "$SPEC_CONTENT" "$PREVIOUS_REVIEW" "$CURRENT_DIFF")
    run_claude "impl-$IMPL_ATTEMPT" "$MODEL_IMPL" \
      -p "$IMPL_PROMPT" \
      --allowedTools "Read,Write,Edit,MultiEdit,Bash,Glob,Grep" \
      --output-format text > /dev/null

    FULL_DIFF=$(get_full_diff)

    if [ -z "$FULL_DIFF" ]; then
      warn "Nenhuma mudança detectada após implementação."
      continue
    fi

    step "ETAPA 2b · Revisão de Fidelidade (tentativa $IMPL_ATTEMPT)"
    log "Revisando implementação contra a spec..."

    REVIEW_PROMPT=$(prompt_review "$SPEC_CONTENT" "$FULL_DIFF")
    REVIEW_RESULT=$(run_claude "review-$IMPL_ATTEMPT" "$MODEL_REVIEW" -p "$REVIEW_PROMPT" --output-format text)
    echo "$REVIEW_RESULT" > "$REVIEW_FILE"

    echo ""
    echo "$REVIEW_RESULT"
    echo ""

    if is_approved "$REVIEW_RESULT"; then
      success "Revisão de fidelidade: APROVADO ($(stage_duration $STAGE_START))"
      IMPL_APPROVED=true
    else
      REVIEW_ACTION=$(ask_review_action "Fidelity review")

      case "$REVIEW_ACTION" in
        [Cc])
          warn "Corrigindo automaticamente..."
          ;;
        [Ii])
          success "Ignorando — continuando com implementação atual."
          IMPL_APPROVED=true
          ;;
        [Ee])
          warn "Abrindo editor... Salve e feche quando terminar."
          ${EDITOR:-vi} .
          echo -e "Edição concluída. Re-rodar review? ${YELLOW}[s/N]${RESET}"
          read -r RERUN
          if [[ "$RERUN" =~ ^[Ss]$ ]]; then
            IMPL_ATTEMPT=$((IMPL_ATTEMPT - 1))
          else
            IMPL_APPROVED=true
          fi
          ;;
        [Aa])
          error "Pipeline abortado pelo usuário."
          ;;
        *)
          warn "Opção inválida. Corrigindo automaticamente..."
          ;;
      esac
    fi
  done

  if [ "$IMPL_APPROVED" = false ]; then
    error "Implementação não aprovada após $MAX_IMPL_RETRIES tentativas. Revise a spec e tente novamente."
  fi

  save_state "TEST"
fi

# =============================================================================
# STAGE 3 — TESTS
# =============================================================================
if should_run "TEST"; then
  step "ETAPA 3 · Testes"
  STAGE_START=$SECONDS

  TEST_CMD=$(detect_test_command)

  if [ -n "$TEST_CMD" ]; then
    log "Rodando testes com: $TEST_CMD"

    if eval "$TEST_CMD" 2>&1 | tee "$TASK_DIR/test-output.txt"; then
      success "Testes passando. ($(stage_duration $STAGE_START))"
    else
      warn "Testes falharam. Tentando corrigir..."

      CURRENT_DIFF=$(get_full_diff)
      TEST_OUTPUT=$(cat "$TASK_DIR/test-output.txt")
      FIX_PROMPT=$(prompt_test_fix "$SPEC_CONTENT" "$TEST_OUTPUT" "$CURRENT_DIFF")

      run_claude "test-fix" "$MODEL_FIX" \
        -p "$FIX_PROMPT" \
        --allowedTools "Read,Write,Edit,MultiEdit,Bash,Glob,Grep" \
        --output-format text > /dev/null

      if eval "$TEST_CMD" 2>/dev/null; then
        success "Testes corrigidos e passando. ($(stage_duration $STAGE_START))"
      else
        error "Testes ainda falhando após correção automática. Intervenção manual necessária."
      fi
    fi
  else
    warn "Nenhum script de teste encontrado. Pulando etapa."
  fi

  save_state "QUALITY"
fi

# =============================================================================
# STAGE 4 — QUALITY REVIEW
# =============================================================================
if should_run "QUALITY"; then
  step "ETAPA 4 · Revisão de Qualidade"

  QUALITY_APPROVED=false
  PREVIOUS_QUALITY=""
  FINAL_DIFF=$(get_full_diff)

  while [ $QUALITY_ATTEMPT -lt $MAX_QUALITY_RETRIES ] && [ "$QUALITY_APPROVED" = false ]; do
    QUALITY_ATTEMPT=$((QUALITY_ATTEMPT + 1))
    STAGE_START=$SECONDS
    log "Rodando senior code review (tentativa $QUALITY_ATTEMPT)..."

    QUALITY_PROMPT=$(prompt_quality "$FINAL_DIFF" "$PREVIOUS_QUALITY")
    QUALITY_RESULT=$(run_claude "quality-$QUALITY_ATTEMPT" "$MODEL_QUALITY" -p "$QUALITY_PROMPT" --output-format text)
    echo "$QUALITY_RESULT" > "$QUALITY_FILE"

    echo ""
    echo "$QUALITY_RESULT"
    echo ""

    if is_approved "$QUALITY_RESULT"; then
      success "Code review: APROVADO ($(stage_duration $STAGE_START))"
      QUALITY_APPROVED=true
    else
      QUALITY_ACTION=$(ask_review_action "Quality review")

      case "$QUALITY_ACTION" in
        [Cc])
          warn "Corrigindo automaticamente..."
          PREVIOUS_QUALITY="$QUALITY_RESULT"

          QUALITY_FIX_PROMPT=$(prompt_quality_fix "$SPEC_CONTENT" "$QUALITY_RESULT" "$FINAL_DIFF")
          run_claude "quality-fix-$QUALITY_ATTEMPT" "$MODEL_FIX" \
            -p "$QUALITY_FIX_PROMPT" \
            --allowedTools "Read,Write,Edit,MultiEdit,Bash,Glob,Grep" \
            --output-format text > /dev/null

          FINAL_DIFF=$(get_full_diff)
          ;;
        [Ii])
          success "Ignorando — continuando com código atual."
          QUALITY_APPROVED=true
          ;;
        [Ee])
          warn "Abrindo editor... Salve e feche quando terminar."
          ${EDITOR:-vi} .
          FINAL_DIFF=$(get_full_diff)
          echo -e "Edição concluída. Re-rodar quality review? ${YELLOW}[s/N]${RESET}"
          read -r RERUN
          if [[ "$RERUN" =~ ^[Ss]$ ]]; then
            QUALITY_ATTEMPT=$((QUALITY_ATTEMPT - 1))
          else
            QUALITY_APPROVED=true
          fi
          ;;
        [Aa])
          error "Pipeline abortado pelo usuário."
          ;;
        *)
          warn "Opção inválida. Corrigindo automaticamente..."
          PREVIOUS_QUALITY="$QUALITY_RESULT"

          QUALITY_FIX_PROMPT=$(prompt_quality_fix "$SPEC_CONTENT" "$QUALITY_RESULT" "$FINAL_DIFF")
          run_claude "quality-fix-$QUALITY_ATTEMPT" "$MODEL_FIX" \
            -p "$QUALITY_FIX_PROMPT" \
            --allowedTools "Read,Write,Edit,MultiEdit,Bash,Glob,Grep" \
            --output-format text > /dev/null

          FINAL_DIFF=$(get_full_diff)
          ;;
      esac
    fi
  done

  if [ "$QUALITY_APPROVED" = false ]; then
    warn "Code review não aprovado após $MAX_QUALITY_RETRIES tentativas. Prosseguindo com aviso."
  fi

  save_state "COMMIT"
fi

# =============================================================================
# STAGE 5 — COMMIT
# =============================================================================
if should_run "COMMIT"; then
  step "ETAPA 5 · Commit"

  if [ "$AUTO_COMMIT" = false ]; then
    warn "Commit desabilitado (--no-commit). Mudanças prontas para commit manual."
    git add -A
  else
    log "Gerando mensagem de commit..."

    COMMIT_DIFF=$(get_full_diff | head -200 || true)
    SPEC_SUMMARY=$(head -20 "$SPEC_FILE")
    COMMIT_PROMPT=$(prompt_commit "$COMMIT_DIFF" "$SPEC_SUMMARY")

    COMMIT_MSG=$(run_claude "commit-msg" "$MODEL_COMMIT" -p "$COMMIT_PROMPT" --output-format text | head -1)

    echo ""
    log "Mensagem de commit gerada: ${BOLD}$COMMIT_MSG${RESET}"
    echo ""
    echo -e "Deseja fazer o commit? ${YELLOW}[s/N]${RESET}"
    read -r CONFIRM

    if [[ "$CONFIRM" =~ ^[Ss]$ ]]; then
      git add -A
      git commit -m "$COMMIT_MSG"
      success "Commit realizado: $COMMIT_MSG"
    else
      warn "Commit cancelado. Suas mudanças estão prontas para commit manual."
      git add -A
    fi
  fi

  save_state "DONE"
fi

# =============================================================================
# SUMMARY
# =============================================================================
write_summary "$IMPL_ATTEMPT" "$QUALITY_ATTEMPT"
TOTAL_DURATION=$((SECONDS - PIPELINE_START))

step "RESUMO"
success "Pipeline concluído!"
echo ""
echo -e "  ${CYAN}Modo:${RESET}            $([ "$FAST_MODE" = true ] && echo "fast" || echo "full")"
echo -e "  ${CYAN}Spec:${RESET}            $SPEC_FILE"
echo -e "  ${CYAN}Revisão:${RESET}         $REVIEW_FILE"
echo -e "  ${CYAN}Code Review:${RESET}     $QUALITY_FILE"
echo -e "  ${CYAN}Summary:${RESET}         $SUMMARY_FILE"
echo ""
echo -e "  ${CYAN}Implementação:${RESET}   $IMPL_ATTEMPT tentativa(s)"
echo -e "  ${CYAN}Quality:${RESET}         $QUALITY_ATTEMPT tentativa(s)"
echo -e "  ${CYAN}Claude calls:${RESET}    $CLAUDE_CALLS"
echo -e "  ${CYAN}Duração total:${RESET}   $(stage_duration $PIPELINE_START)"
echo ""
