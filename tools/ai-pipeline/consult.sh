#!/bin/bash
# consult.sh — Wrapper único para chamar OpenRouter.
# Uso: consult.sh <model_id> <role_file> <context_file> <out_json> [max_tokens]
#
# - Procura a API key em $OPENROUTER_KEY, depois $HOME/.openrouter.key, depois $PWD/.openrouter.key
# - Monta payload via python (json.dumps) pra evitar bugs de escape
# - Exit code != 0 em erro de rede/HTTP (deixa o runner decidir se retenta/fallback)

set -u

MODEL="${1:-}"
ROLE_FILE="${2:-}"
CONTEXT_FILE="${3:-}"
OUT_JSON="${4:-}"
MAX_TOKENS="${5:-1800}"

if [ -z "$MODEL" ] || [ -z "$ROLE_FILE" ] || [ -z "$CONTEXT_FILE" ] || [ -z "$OUT_JSON" ]; then
  echo "Uso: consult.sh <model_id> <role_file> <context_file> <out_json> [max_tokens]" >&2
  exit 2
fi

if [ ! -f "$ROLE_FILE" ]; then
  echo "consult.sh: role file não encontrado: $ROLE_FILE" >&2
  exit 2
fi

if [ ! -f "$CONTEXT_FILE" ]; then
  echo "consult.sh: context file não encontrado: $CONTEXT_FILE" >&2
  exit 2
fi

# Resolve API key
KEY=""
if [ -n "${OPENROUTER_KEY:-}" ]; then
  KEY="$OPENROUTER_KEY"
elif [ -f "$HOME/.openrouter.key" ]; then
  KEY=$(cat "$HOME/.openrouter.key")
elif [ -f ".openrouter.key" ]; then
  KEY=$(cat ".openrouter.key")
else
  echo "consult.sh: nenhuma API key encontrada (OPENROUTER_KEY, ~/.openrouter.key, ou ./.openrouter.key)" >&2
  exit 2
fi

# Sanitiza: remove CR/LF/whitespace (Windows Notepad adiciona CRLF ao editar)
KEY=$(printf '%s' "$KEY" | tr -d '\r\n\t ')
if [ -z "$KEY" ]; then
  echo "consult.sh: API key vazia após sanitização" >&2
  exit 2
fi

mkdir -p "$(dirname "$OUT_JSON")"

PAYLOAD_FILE=$(mktemp /tmp/consult_payload.XXXXXX.json)
trap 'rm -f "$PAYLOAD_FILE"' EXIT

# Monta payload com python (escape correto de aspas/newlines no role e context)
python <<PYEOF > "$PAYLOAD_FILE"
import json, io, sys
sys.stdout.reconfigure(encoding='utf-8')
with io.open(r"$ROLE_FILE", encoding='utf-8') as f:
    role = f.read()
with io.open(r"$CONTEXT_FILE", encoding='utf-8') as f:
    ctx = f.read()
payload = {
    "model": "$MODEL",
    "max_tokens": int("$MAX_TOKENS"),
    "messages": [
        {"role": "system", "content": role},
        {"role": "user", "content": ctx},
    ],
}
print(json.dumps(payload, ensure_ascii=False))
PYEOF

if [ ! -s "$PAYLOAD_FILE" ]; then
  echo "consult.sh: falha ao montar payload" >&2
  exit 3
fi

HTTP_CODE=$(curl -s -S --max-time 180 \
  -o "$OUT_JSON" \
  -w "%{http_code}" \
  -X POST "https://openrouter.ai/api/v1/chat/completions" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  --data @"$PAYLOAD_FILE" 2>/dev/null)

CURL_EXIT=$?

if [ $CURL_EXIT -ne 0 ]; then
  echo "consult.sh: curl falhou (exit $CURL_EXIT) para model=$MODEL" >&2
  exit 4
fi

# HTTP 4xx/5xx: ainda grava o body (que tem detalhes do erro) e sinaliza exit != 0.
# O parser trata erros embarcados no JSON; o runner pode acionar fallback baseado no exit code.
if [ "$HTTP_CODE" -ge 400 ] 2>/dev/null; then
  echo "consult.sh: HTTP $HTTP_CODE para model=$MODEL (body salvo em $OUT_JSON)" >&2
  exit 5
fi

exit 0
