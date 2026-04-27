#!/bin/bash
# Wrapper: dispara a fase de revisão final (MiMo V2 Pro + Codex com fallback).
# Uso: run-final.sh <context_file> [run_id]
PIPELINE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$PIPELINE_DIR/run.sh" final "$@"
