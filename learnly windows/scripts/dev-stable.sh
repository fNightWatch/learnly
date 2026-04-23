#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-3000}"
HEALTH_BASE="http://${HOST}:${PORT}"
HEALTH_PATH="${HEALTH_PATH:-/api/health}"
NODE_BIN="${NODE_BIN:-/opt/homebrew/opt/node@22/bin/node}"
STARTUP_HEALTH_TIMEOUT_SEC="${STARTUP_HEALTH_TIMEOUT_SEC:-300}"
WARMUP_TIMEOUT_SEC="${WARMUP_TIMEOUT_SEC:-240}"
WARMUP_ROUTES="${WARMUP_ROUTES:-/,/dashboard,/study}"
POST_WARMUP_VERIFY_DELAY_SEC="${POST_WARMUP_VERIFY_DELAY_SEC:-5}"
POST_WARMUP_VERIFY_TIMEOUT_SEC="${POST_WARMUP_VERIFY_TIMEOUT_SEC:-40}"
MONITOR_INTERVAL_SEC="${MONITOR_INTERVAL_SEC:-20}"
MONITOR_MAX_FAILURES="${MONITOR_MAX_FAILURES:-10}"
LOCK_DIR="${ROOT_DIR}/.learnly/dev-stable.lock"
LOCK_PID_FILE="${LOCK_DIR}/pid"

if [[ ! -x "$NODE_BIN" ]]; then
  NODE_BIN="$(command -v node || true)"
fi

if [[ -z "${NODE_BIN:-}" || ! -x "$NODE_BIN" ]]; then
  echo "[guard] Node.js executable not found."
  exit 1
fi

TSX_CLI="${ROOT_DIR}/node_modules/tsx/dist/cli.mjs"
NEXT_BIN="${ROOT_DIR}/node_modules/next/dist/bin/next"
SEED_SCRIPT="${ROOT_DIR}/scripts/seed-db.ts"
DB_DIR="${ROOT_DIR}/.learnly"
DB_PATH="${DB_DIR}/learnly.db"
SAFETY_DIR="${DB_DIR}/safety-backups"

mkdir -p "$DB_DIR" "$SAFETY_DIR"

acquire_lock() {
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    echo "$$" > "$LOCK_PID_FILE"
    return 0
  fi

  if [[ -f "$LOCK_PID_FILE" ]]; then
    local existing_pid
    existing_pid="$(cat "$LOCK_PID_FILE" 2>/dev/null || true)"
    if [[ -n "$existing_pid" ]] && kill -0 "$existing_pid" 2>/dev/null; then
      echo "[guard] Another dev-stable watcher is already running (pid ${existing_pid})."
      if curl --noproxy '*' --max-time 2 -fsS "${HEALTH_BASE}${HEALTH_PATH}" >/dev/null 2>&1; then
        echo "[guard] Existing watcher is healthy at ${HEALTH_BASE}. Reusing it."
        exit 0
      fi
      echo "[guard] Existing watcher is still starting/unhealthy. Exiting without spawning another."
      exit 1
    fi
  fi

  rm -rf "$LOCK_DIR"
  mkdir -p "$LOCK_DIR"
  echo "$$" > "$LOCK_PID_FILE"
}

release_lock() {
  rm -rf "$LOCK_DIR" 2>/dev/null || true
}

snapshot_db() {
  if [[ -f "$DB_PATH" ]]; then
    local ts
    ts="$(date +%Y%m%d-%H%M%S)"
    local dst="${SAFETY_DIR}/learnly.db.before-dev-${ts}.db"
    cp -p "$DB_PATH" "$dst"
    echo "[guard] DB snapshot created: ${dst}"
  else
    echo "[guard] No DB file yet, skipping snapshot."
  fi
}

kill_stale_processes() {
  pkill -f "next dev" 2>/dev/null || true
  pkill -f "next-router-worker" 2>/dev/null || true
  pkill -f "${ROOT_DIR}/node_modules/next/dist/bin/next" 2>/dev/null || true
  while read -r stale_pid; do
    [[ -z "${stale_pid}" || "${stale_pid}" == "$$" ]] && continue
    kill "${stale_pid}" 2>/dev/null || true
  done < <(pgrep -f "${ROOT_DIR}/scripts/dev-stable.sh" || true)
}

health_ok() {
  curl --noproxy '*' --max-time 4 -fsS "${HEALTH_BASE}${HEALTH_PATH}" >/dev/null
}

wait_until_healthy() {
  local deadline=$((SECONDS + STARTUP_HEALTH_TIMEOUT_SEC))
  while (( SECONDS < deadline )); do
    if [[ -n "${child_pid}" ]] && ! kill -0 "$child_pid" 2>/dev/null; then
      echo "[guard] Next process exited before health endpoint became ready."
      return 1
    fi
    if health_ok; then
      echo "[guard] Health endpoint is ready: ${HEALTH_PATH}"
      return 0
    fi
    sleep 2
  done
  echo "[guard] App did not become healthy within ${STARTUP_HEALTH_TIMEOUT_SEC}s."
  return 1
}

switch_to_turbo() {
  local reason="$1"
  if [[ "$next_mode" == "plain" ]]; then
    echo "[guard] ${reason}"
    echo "[guard] Falling back to Next dev --turbo for the next restart."
    next_mode="turbo"
  fi
}

start_next_dev() {
  if [[ "$next_mode" == "turbo" ]]; then
    echo "[guard] Starting Next dev (--turbo) on ${HEALTH_BASE} ..."
    "$NODE_BIN" "$NEXT_BIN" dev --turbo -H "$HOST" -p "$PORT" &
  else
    echo "[guard] Starting Next dev on ${HEALTH_BASE} ..."
    "$NODE_BIN" "$NEXT_BIN" dev -H "$HOST" -p "$PORT" &
  fi
  child_pid="$!"
}

warm_route() {
  local route="$1"
  echo "[guard] Warming ${route} (timeout ${WARMUP_TIMEOUT_SEC}s)..."
  curl --noproxy '*' --max-time "$WARMUP_TIMEOUT_SEC" -fsS "${HEALTH_BASE}${route}" >/dev/null
}

warm_configured_routes() {
  local raw_routes="${WARMUP_ROUTES//,/ }"
  if [[ -z "${raw_routes// }" ]]; then
    echo "[guard] Warmup routes disabled (set WARMUP_ROUTES to enable)."
    return 0
  fi

  local route
  for route in $raw_routes; do
    [[ -z "$route" ]] && continue
    warm_route "$route"
  done
  echo "[guard] Warmed routes: ${raw_routes}"
}

child_pid=""
stop_requested="0"
next_mode="plain"

verify_warmed_routes_after_delay() {
  local raw_routes="${WARMUP_ROUTES//,/ }"
  if [[ -z "${raw_routes// }" ]]; then
    return 0
  fi

  echo "[guard] Rechecking warmed routes after ${POST_WARMUP_VERIFY_DELAY_SEC}s..."
  sleep "$POST_WARMUP_VERIFY_DELAY_SEC"

  local route
  for route in $raw_routes; do
    [[ -z "$route" ]] && continue
    echo "[guard] Verifying ${route} (timeout ${POST_WARMUP_VERIFY_TIMEOUT_SEC}s)..."
    curl --noproxy '*' --max-time "$POST_WARMUP_VERIFY_TIMEOUT_SEC" -fsS "${HEALTH_BASE}${route}" >/dev/null
  done
  echo "[guard] Core routes verified after delay."
}

cleanup() {
  stop_requested="1"
  if [[ -n "${child_pid}" ]]; then
    kill "$child_pid" 2>/dev/null || true
    wait "$child_pid" 2>/dev/null || true
  fi
  release_lock
}

trap cleanup INT TERM EXIT

acquire_lock
snapshot_db
kill_stale_processes

restart_count=0
while true; do
  restart_count=$((restart_count + 1))
  if (( restart_count > 1 )); then
    echo "[guard] Restart attempt #${restart_count}."
  fi

  echo "[guard] Running seed script..."
  "$NODE_BIN" "$TSX_CLI" "$SEED_SCRIPT"

  start_next_dev

  if ! wait_until_healthy; then
    kill "$child_pid" 2>/dev/null || true
    wait "$child_pid" 2>/dev/null || true
    child_pid=""
    if [[ "$stop_requested" == "1" ]]; then
      exit 0
    fi
    sleep 2
    continue
  fi

  if ! warm_configured_routes; then
    switch_to_turbo "Core-route warmup failed while the health endpoint was already healthy."
    echo "[guard] Route warmup failed. Restarting..."
    kill "$child_pid" 2>/dev/null || true
    wait "$child_pid" 2>/dev/null || true
    child_pid=""
    sleep 2
    continue
  fi

  if ! verify_warmed_routes_after_delay; then
    switch_to_turbo "Core routes failed delayed verification after startup."
    echo "[guard] Delayed route verification failed. Restarting..."
    kill "$child_pid" 2>/dev/null || true
    wait "$child_pid" 2>/dev/null || true
    child_pid=""
    sleep 2
    continue
  fi

  consecutive_failures=0
  while kill -0 "$child_pid" 2>/dev/null; do
    if health_ok; then
      consecutive_failures=0
    else
      consecutive_failures=$((consecutive_failures + 1))
      echo "[guard] Health endpoint failed (${consecutive_failures}/${MONITOR_MAX_FAILURES})."
      if (( consecutive_failures >= MONITOR_MAX_FAILURES )); then
        echo "[guard] Health endpoint has failed too many times. Restarting..."
        kill "$child_pid" 2>/dev/null || true
        wait "$child_pid" 2>/dev/null || true
        child_pid=""
        break
      fi
    fi
    sleep "$MONITOR_INTERVAL_SEC"
  done

  if [[ "$stop_requested" == "1" ]]; then
    exit 0
  fi

  if [[ -n "$child_pid" ]]; then
    set +e
    wait "$child_pid"
    exit_code=$?
    set -e
    child_pid=""

    if [[ "$stop_requested" == "1" ]]; then
      exit 0
    fi

    if [[ $exit_code -eq 130 || $exit_code -eq 143 || $exit_code -eq 0 ]]; then
      echo "[guard] Next dev exited by request (code ${exit_code})."
      exit 0
    fi
    echo "[guard] Next dev crashed (code ${exit_code}). Restarting..."
  fi

  sleep 2
done
