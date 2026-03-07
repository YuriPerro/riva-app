#!/bin/bash

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

log()     { echo -e "${BLUE}[task]${RESET} $1"; }
success() { echo -e "${GREEN}[✓]${RESET} $1"; }
warn()    { echo -e "${YELLOW}[!]${RESET} $1"; }
error()   { echo -e "${RED}[✗]${RESET} $1"; exit 1; }
step()    { echo -e "\n${BOLD}${CYAN}══ $1 ══${RESET}\n"; }

TASK_DIR=".task"
MAX_IMPL_RETRIES=3
MAX_QUALITY_RETRIES=2
CLAUDE_MD="CLAUDE.md"
TEST_COMMAND=""
AUTO_COMMIT=true

MODEL_SPEC="claude-sonnet-4-6"
MODEL_IMPL="claude-opus-4-6"
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

model_label() {
  case "$1" in
    *opus*)   echo "Opus"   ;;
    *sonnet*) echo "Sonnet" ;;
    *haiku*)  echo "Haiku"  ;;
    *)        echo "$1"     ;;
  esac
}

SPINNER_PID=""

start_spinner() {
  local agent="$1"
  local label="$2"
  local frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
  local i=0
  local start=$SECONDS
  (
    while true; do
      local elapsed=$((SECONDS - start))
      printf "\r${CYAN}%s${RESET} ${BOLD}%s${RESET} %s ${BLUE}%s${RESET}  " "${frames[$((i % ${#frames[@]}))]}" "$agent" "$label" "$(format_elapsed $elapsed)" >&2
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

trap 'stop_spinner' EXIT

run_claude() {
  local label="$1"; shift
  local model="$1"; shift
  local agent_name
  agent_name=$(model_label "$model")
  local output
  local call_start=$SECONDS
  CLAUDE_CALLS=$((CLAUDE_CALLS + 1))

  start_spinner "$agent_name" "$label"

  if ! output=$(claude --model "$model" "$@" 2>>"$ERROR_LOG"); then
    stop_spinner
    error "Claude falhou na etapa '$label'. Veja $ERROR_LOG"
  fi

  stop_spinner

  if [ -z "$output" ]; then
    error "Claude retornou vazio na etapa '$label'. Veja $ERROR_LOG"
  fi

  local elapsed=$((SECONDS - call_start))
  echo -e "${BOLD}${CYAN}[agent]${RESET} ${BOLD}$agent_name${RESET} ✓ $label ${BLUE}($(format_elapsed $elapsed))${RESET}" >&2

  echo "$output"
}

format_elapsed() {
  local s=$1
  if [ $s -lt 60 ]; then
    echo "${s}s"
  else
    echo "$((s / 60))m $((s % 60))s"
  fi
}

get_full_diff() {
  git add -N . 2>/dev/null
  local diff
  diff=$(git diff HEAD 2>/dev/null || true)
  git reset --quiet 2>/dev/null || true
  echo "$diff"
}

is_approved() {
  echo "$1" | grep -q "RESULTADO: APROVADO"
}

save_state() { echo "$1" > "$STATE_FILE"; }
get_state()  { [ -f "$STATE_FILE" ] && cat "$STATE_FILE" || echo ""; }
clear_state() { rm -f "$STATE_FILE"; }

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
