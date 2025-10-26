#!/usr/bin/env bash
set -euo pipefail
LOG_DIR="${LOG_DIR:-dev-tools/workspace/context/session_store/logs}"
mkdir -p "$LOG_DIR"
echo "[ollama] $(date -Is) starting serve" | tee -a "$LOG_DIR/ollama.log"
OLLAMA_HOST="${OLLAMA_HOST:-127.0.0.1}"
OLLAMA_PORT="${OLLAMA_PORT:-11434}"
OLLAMA_MODELS="${OLLAMA_MODELS:-}"
export OLLAMA_HOST OLLAMA_PORT
if [ -n "$OLLAMA_MODELS" ]; then
  for MODEL in $OLLAMA_MODELS; do
    ollama pull "$MODEL" | tee -a "$LOG_DIR/ollama.log"
  done
fi
nohup ollama serve >> "$LOG_DIR/ollama.log" 2>&1 &
echo "[ollama] $(date -Is) serve running on $OLLAMA_HOST:$OLLAMA_PORT" | tee -a "$LOG_DIR/ollama.log"
