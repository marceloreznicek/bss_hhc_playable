#!/bin/bash
# Wrapper: dispara a fase de síntese multi-agente (ETAPA 1.5 — Kimi K2.6).
# Uso: run-synthesis.sh <context_file> [run_id]
PIPELINE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$PIPELINE_DIR/run.sh" synthesis "$@"
