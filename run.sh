#!/usr/bin/env bash
# KodaTrade — Unified Run Script
# Usage: ./run.sh [backend|frontend|web|mobile|all|dev|test|ingest|db|help]

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
WEB_DIR="$ROOT_DIR/web"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log()   { echo -e "${BLUE}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }

usage() {
  cat <<EOF
KodaTrade Run Script

Usage: ./run.sh <command>

Commands:
  backend       Start FastAPI backend (uvicorn, port 8000)
  frontend      Start Expo dev server (React Native + Web, port 19006)
  web           Start Next.js web dashboard (port 3000)
  mobile        Start Expo for mobile (QR code for Expo Go)
  all           Start all three via docker-compose
  dev           Start backend + frontend (no docker)
  test          Run all tests (backend pytest + frontend tsc)
  ingest        Ingest regulatory documents into Supabase
  db            Run Supabase migrations (prints SQL to run manually)
  help          Show this help

Examples:
  ./run.sh backend
  ./run.sh frontend
  ./run.sh all
  ./run.sh test
  ./run.sh ingest
EOF
}

check_venv() {
  if [[ ! -d "$BACKEND_DIR/venv" ]]; then
    warn "Backend venv not found. Creating..."
    python3 -m venv "$BACKEND_DIR/venv"
    "$BACKEND_DIR/venv/bin/pip" install --upgrade pip
    "$BACKEND_DIR/venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"
    ok "Venv ready"
  fi
}

cmd_backend() {
  log "Starting FastAPI backend on :8000"
  check_venv
  cd "$BACKEND_DIR"
  source venv/bin/activate
  exec uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
}

cmd_frontend() {
  log "Starting Expo dev server (React Native + Web)"
  cd "$FRONTEND_DIR"
  if [[ ! -d node_modules ]]; then
    warn "Installing frontend dependencies..."
    npm install --legacy-peer-deps
  fi
  exec npx expo start
}

cmd_web() {
  log "Starting Next.js web dashboard on :3000"
  cd "$WEB_DIR"
  if [[ ! -d node_modules ]]; then
    warn "Installing web dependencies..."
    npm install --legacy-peer-deps
  fi
  exec npm run dev
}

cmd_mobile() {
  log "Starting Expo for mobile (scan QR with Expo Go)"
  cd "$FRONTEND_DIR"
  if [[ ! -d node_modules ]]; then
    npm install --legacy-peer-deps
  fi
  exec npx expo start --lan
}

cmd_all() {
  log "Starting all services via docker-compose"
  cd "$ROOT_DIR"
  exec docker compose up --build
}

cmd_dev() {
  log "Starting backend + frontend (no docker)"
  # Backend in background
  cmd_backend &
  BACKEND_PID=$!
  trap "kill $BACKEND_PID" EXIT INT TERM
  # Frontend in foreground
  cmd_frontend
}

cmd_test() {
  log "Running backend tests..."
  check_venv
  cd "$BACKEND_DIR"
  source venv/bin/activate
  python -m pytest tests/ -v --tb=short

  log "Running frontend type-check..."
  cd "$FRONTEND_DIR"
  npx tsc --noEmit

  log "Running web build check..."
  cd "$WEB_DIR"
  npm run build

  ok "All tests passed!"
}

cmd_ingest() {
  log "Ingesting regulatory documents into Supabase..."
  check_venv
  cd "$BACKEND_DIR"
  source venv/bin/activate
  python -c "
from app.infrastructure.rag.document_ingestion import ingest_all_from_assets
import asyncio
result = asyncio.run(ingest_all_from_assets())
print('Ingestion result:', result)
"
}

cmd_db() {
  log "Supabase migrations (run manually in Supabase SQL Editor):"
  echo
  for f in "$BACKEND_DIR/migrations"/*.sql; do
    echo "=== $f ==="
    cat "$f"
    echo
  done
}

# Main
case "${1:-help}" in
  backend)    cmd_backend ;;
  frontend)   cmd_frontend ;;
  web)        cmd_web ;;
  mobile)     cmd_mobile ;;
  all)        cmd_all ;;
  dev)        cmd_dev ;;
  test)       cmd_test ;;
  ingest)     cmd_ingest ;;
  db)         cmd_db ;;
  help|*)     usage ;;
esac