#!/bin/bash

set -Eeuo pipefail

GUM_GREEN="#22c55e"
GUM_RED="#ef4444"
GUM_YELLOW="#eab308"
GUM_BLUE="#3b82f6"
GUM_CYAN="#06b6d4"
GUM_PURPLE="#a855f7"
GUM_DIM="#71717a"

log()     { gum log --level info "$1"; }
success() { gum log --level info --prefix "✓" --prefix.foreground "$GUM_GREEN" "$1"; }
warn()    { gum log --level warn "$1"; }
error()   { gum log --level error "$1"; exit 1; }

step() {
  echo ""
  gum style --foreground "$GUM_CYAN" --bold --border double --border-foreground "$GUM_CYAN" --padding "0 2" "$1"
  echo ""
}

header() {
  gum style --foreground "$GUM_PURPLE" --bold --border rounded --border-foreground "$GUM_DIM" --padding "1 3" --margin "1 0" "$@"
}

TASK_DIR=".task"
MAX_IMPL_RETRIES=3
MAX_QUALITY_RETRIES=3
CLAUDE_MD="CLAUDE.md"
TEST_COMMAND=""
AUTO_COMMIT=true
FAST_MODE=false

MODEL_SPEC="claude-sonnet-4-6"
MODEL_IMPL="claude-opus-4-6"
MODEL_FIX="claude-sonnet-4-6"
MODEL_REVIEW="claude-sonnet-4-6"
MODEL_QUALITY="claude-sonnet-4-6"
MODEL_COMMIT="claude-haiku-4-5-20251001"

SPEC_FILE="$TASK_DIR/spec.md"
REVIEW_FILE="$TASK_DIR/review.md"
QUALITY_FILE="$TASK_DIR/quality.md"
STATE_FILE="$TASK_DIR/state"
LOG_FILE="$TASK_DIR/pipeline.log"
ERROR_LOG="$TASK_DIR/claude-errors.log"
SUMMARY_FILE="$TASK_DIR/summary.json"

CLAUDE_CALLS=0
PIPELINE_START=$SECONDS
CLAUDE_MD_CONTENT=""
PREEXISTING_UNTRACKED=""

load_config() {
  local config_file
  config_file="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/taskrc"
  [ -f "$config_file" ] && source "$config_file"
  [ -f ".taskrc" ] && source ".taskrc"

  SPEC_FILE="$TASK_DIR/spec.md"
  REVIEW_FILE="$TASK_DIR/review.md"
  QUALITY_FILE="$TASK_DIR/quality.md"
  STATE_FILE="$TASK_DIR/state"
  LOG_FILE="$TASK_DIR/pipeline.log"
  ERROR_LOG="$TASK_DIR/claude-errors.log"
  SUMMARY_FILE="$TASK_DIR/summary.json"
}

load_claude_md() {
  if [ -f "$CLAUDE_MD" ]; then
    CLAUDE_MD_CONTENT=$(cat "$CLAUDE_MD")
  else
    CLAUDE_MD_CONTENT=""
  fi
}

claude_md_section() {
  local header="$1"
  if [ -n "$CLAUDE_MD_CONTENT" ]; then
    printf "## %s\n%s" "$header" "$CLAUDE_MD_CONTENT"
  fi
}

CODEBASE_CONTEXT=""

gather_codebase_context() {
  local ctx=""

  if [ -d "src" ]; then
    ctx+="## Directory Structure (src/)
\`\`\`
$(find src -type f -not -path '*/node_modules/*' -not -path '*/.git/*' | head -80 | sort | sed 's|^|  |')
\`\`\`
"
  fi

  if [ -d "src/types" ]; then
    ctx+="
## Existing Types (src/types/)
\`\`\`
$(for f in src/types/*.ts; do [ -f "$f" ] && echo "--- $f ---" && head -30 "$f"; done)
\`\`\`
"
  fi

  if [ -d "src/pages" ]; then
    ctx+="
## Pages
$(ls -1 src/pages/ 2>/dev/null | sed 's/^/- /')
"
  fi

  if [ -d "src/components" ]; then
    ctx+="
## Components
$(ls -1 src/components/ 2>/dev/null | sed 's/^/- /')
"
  fi

  if [ -d "src-tauri/src" ]; then
    ctx+="
## Rust Backend (src-tauri/src/)
$(ls -1 src-tauri/src/*.rs 2>/dev/null | sed 's/^/- /')
"
  fi

  CODEBASE_CONTEXT="$ctx"
}

codebase_context_section() {
  if [ -n "$CODEBASE_CONTEXT" ]; then
    printf "## CODEBASE SNAPSHOT (real files — use tools to explore further):\n%s" "$CODEBASE_CONTEXT"
  fi
}

model_label() {
  case "$1" in
    *opus*)   echo "Opus"   ;;
    *sonnet*) echo "Sonnet" ;;
    *haiku*)  echo "Haiku"  ;;
    *)        echo "$1"     ;;
  esac
}

model_color() {
  case "$1" in
    *opus*)   echo "$GUM_PURPLE" ;;
    *sonnet*) echo "$GUM_BLUE"   ;;
    *haiku*)  echo "$GUM_CYAN"   ;;
    *)        echo "$GUM_DIM"    ;;
  esac
}

format_elapsed() {
  local s=$1
  if [ $s -lt 60 ]; then
    echo "${s}s"
  else
    echo "$((s / 60))m $((s % 60))s"
  fi
}

SPINNER_PID=""

start_spinner() {
  local agent="$1"
  local label="$2"
  local color="$3"
  local frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
  local i=0
  local start=$SECONDS
  (
    while true; do
      local elapsed=$((SECONDS - start))
      printf "\r  \033[0;36m%s\033[0m \033[1m%s\033[0m → %s \033[0;34m%s\033[0m  " \
        "${frames[$((i % ${#frames[@]}))]}" "$agent" "$label" "$(format_elapsed $elapsed)" >&2
      i=$((i + 1))
      sleep 0.12
    done
  ) &
  SPINNER_PID=$!
}

stop_spinner() {
  if [ -n "$SPINNER_PID" ]; then
    kill "$SPINNER_PID" 2>/dev/null
    wait "$SPINNER_PID" 2>/dev/null || true
    printf "\r\033[K" >&2
    SPINNER_PID=""
  fi
}

CURRENT_STAGE=""

cleanup_on_exit() {
  local exit_code=$?
  stop_spinner
  if [ $exit_code -ne 0 ] && [ -n "$CURRENT_STAGE" ] && [ "$CURRENT_STAGE" != "DONE" ]; then
    echo "" >&2
    warn "Pipeline interrompido na etapa $CURRENT_STAGE. Retome com: --from $(echo "$CURRENT_STAGE" | tr '[:upper:]' '[:lower:]')"
  fi
}

trap 'cleanup_on_exit' EXIT
trap 'exit 130' INT TERM

run_claude() {
  local label="$1"; shift
  local model="$1"; shift
  local agent_name
  agent_name=$(model_label "$model")
  local color
  color=$(model_color "$model")
  local output
  local call_start=$SECONDS
  CLAUDE_CALLS=$((CLAUDE_CALLS + 1))

  start_spinner "$agent_name" "$label" "$color"

  if ! output=$(claude --model "$model" "$@" 2>>"$ERROR_LOG"); then
    stop_spinner
    error "Claude falhou na etapa '$label'. Veja $ERROR_LOG"
  fi

  stop_spinner

  if [ -z "$output" ]; then
    error "Claude retornou vazio na etapa '$label'. Veja $ERROR_LOG"
  fi

  local elapsed=$((SECONDS - call_start))
  printf "\033[1m  ✓ %s → %s (%s)\033[0m\n" "$agent_name" "$label" "$(format_elapsed $elapsed)" >&2

  printf '%s' "$output"
}

get_full_diff() {
  git add -N . 2>/dev/null
  local diff
  diff=$(git diff HEAD 2>/dev/null || true)
  git reset --quiet 2>/dev/null || true
  echo "$diff"
}

is_approved() {
  printf '%s' "$1" | grep -q "RESULTADO: APROVADO"
}

save_state() { echo "$1" > "$STATE_FILE"; }
get_state()  { [ -f "$STATE_FILE" ] && cat "$STATE_FILE" || echo ""; }
clear_state() { rm -f "$STATE_FILE"; }

ask_review_action() {
  local stage_name="$1"
  echo "" >&2
  gum style --foreground "$GUM_RED" --bold --border rounded --border-foreground "$GUM_RED" --padding "0 2" \
    "$stage_name reprovado" >&2
  echo "" >&2
  local choice
  choice=$(gum choose \
    --header "O que fazer?" \
    --header.foreground "$GUM_YELLOW" \
    --cursor.foreground "$GUM_CYAN" \
    --selected.foreground "$GUM_GREEN" \
    "Corrigir" \
    "Ignorar" \
    "Editar" \
    "Abortar")

  case "$choice" in
    Corrigir) echo "c" ;;
    Ignorar)  echo "i" ;;
    Editar)   echo "e" ;;
    Abortar)  echo "a" ;;
    *)        echo "a" ;;
  esac
}

ask_confirm() {
  local prompt="$1"
  gum confirm --prompt.foreground "$GUM_YELLOW" "$prompt"
}

render_md() {
  local content="$1"
  if command -v glow &>/dev/null; then
    printf '%s\n' "$content" | glow -s dark -w 80 - 2>/dev/null || printf '%s\n' "$content"
  else
    printf '%s\n' "$content" | gum format 2>/dev/null || printf '%s\n' "$content"
  fi
}

show_result() {
  local content="$1"
  echo ""
  if printf '%s' "$content" | grep -q "RESULTADO: APROVADO"; then
    gum style --foreground "$GUM_GREEN" --bold "  ● APROVADO"
  else
    gum style --foreground "$GUM_RED" --bold "  ● REPROVADO"
  fi
  echo ""
  local body
  body=$(printf '%s\n' "$content" | grep -v "^RESULTADO:" || true)
  render_md "$body"
  echo ""
}

snapshot_untracked() {
  PREEXISTING_UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | sort)
}

safe_rollback() {
  git checkout -- . 2>/dev/null || true

  local current_untracked
  current_untracked=$(git ls-files --others --exclude-standard 2>/dev/null | sort)

  local to_delete
  to_delete=$(comm -23 <(echo "$current_untracked") <(echo "$PREEXISTING_UNTRACKED") 2>/dev/null || true)

  if [ -n "$to_delete" ]; then
    echo "$to_delete" | while IFS= read -r file; do
      if [ -n "$file" ] && [[ "$file" != .task/* ]]; then
        rm -f "$file"
      fi
    done
    find . -type d -empty -not -path './.git/*' -not -path './.task/*' -delete 2>/dev/null || true
  fi
}

detect_test_command() {
  if [ -n "$TEST_COMMAND" ]; then
    echo "$TEST_COMMAND"
    return
  fi

  if [ ! -f "package.json" ]; then
    echo ""
    return
  fi

  local test_script
  test_script=$(node -e "const p=require('./package.json'); console.log(p.scripts?.test || '')" 2>/dev/null || echo "")

  if [ -n "$test_script" ] && [ "$test_script" != 'echo "Error: no test specified" && exit 1' ]; then
    if [ -f "bun.lockb" ] || [ -f "bun.lock" ]; then
      echo "bun test"
    elif [ -f "pnpm-lock.yaml" ]; then
      echo "pnpm test"
    elif [ -f "yarn.lock" ]; then
      echo "yarn test"
    else
      echo "npm test"
    fi
  else
    echo ""
  fi
}

stage_duration() {
  local start=$1
  local elapsed=$((SECONDS - start))
  if [ $elapsed -lt 60 ]; then
    echo "${elapsed}s"
  else
    echo "$((elapsed / 60))m $((elapsed % 60))s"
  fi
}

write_summary() {
  local impl_attempts="$1"
  local quality_attempts="$2"
  local total_duration=$((SECONDS - PIPELINE_START))

  cat > "$SUMMARY_FILE" <<EOF
{
  "task": $(echo "$TASK_DESC" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read().strip()))' 2>/dev/null || echo "\"$TASK_DESC\""),
  "stages": {
    "spec": "ok",
    "implementation": { "attempts": $impl_attempts, "status": "approved" },
    "quality": { "attempts": $quality_attempts }
  },
  "claude_calls": $CLAUDE_CALLS,
  "duration_seconds": $total_duration
}
EOF
}
