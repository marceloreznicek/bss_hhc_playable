#!/bin/bash
# Wrapper: dispara a fase pós-code (envie o diff real no context_file).
# Uso: run-postcode.sh <context_file> [run_id]
PIPELINE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "$PIPELINE_DIR/run.sh" postcode "$@"
