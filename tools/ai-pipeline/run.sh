#!/bin/bash
# run.sh — Dispara todos os modelos de uma fase em paralelo e imprime summary.
#
# Uso: run.sh <phase> <context_file> [run_id]
#   <phase>: precode | postcode | final
#   <context_file>: arquivo com o contexto da tarefa (o input do usuário pras IAs)
#   [run_id]: opcional; default = <phase>-<timestamp>
#
# Output:
#   - Cada resposta crua em runs/<run_id>/<phase>/<logical>.json
#   - Cada resposta parseada em runs/<run_id>/<phase>/<logical>.md
#   - Summary consolidado em stdout

set -u

PIPELINE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# No Windows (MSYS/Git Bash), pwd retorna /c/... mas o Python é Windows-native;
# converte para path Windows se cygpath estiver disponível.
if command -v cygpath >/dev/null 2>&1; then
  PIPELINE_DIR_WIN=$(cygpath -w "$PIPELINE_DIR")
else
  PIPELINE_DIR_WIN="$PIPELINE_DIR"
fi
PHASE="${1:-}"
CONTEXT_FILE="${2:-}"
RUN_ID="${3:-}"

if [ -z "$PHASE" ] || [ -z "$CONTEXT_FILE" ]; then
  echo "Uso: run.sh <phase: precode|postcode|final> <context_file> [run_id]" >&2
  exit 2
fi

if [ ! -f "$CONTEXT_FILE" ]; then
  echo "run.sh: context file não encontrado: $CONTEXT_FILE" >&2
  exit 2
fi

case "$PHASE" in
  precode|synthesis|postcode|final) ;;
  *) echo "run.sh: fase inválida: $PHASE (use precode, synthesis, postcode ou final)" >&2; exit 2 ;;
esac

if [ -z "$RUN_ID" ]; then
  RUN_ID="${PHASE}-$(date +%Y%m%d-%H%M%S)"
fi

PHASE_DIR="$PIPELINE_DIR/runs/$RUN_ID/$PHASE"
mkdir -p "$PHASE_DIR"

if command -v cygpath >/dev/null 2>&1; then
  PHASE_DIR_WIN=$(cygpath -w "$PHASE_DIR")
  CONTEXT_FILE_WIN=$(cygpath -w "$CONTEXT_FILE")
else
  PHASE_DIR_WIN="$PHASE_DIR"
  CONTEXT_FILE_WIN="$CONTEXT_FILE"
fi

# Copia o contexto pra runs/ (pra auditoria)
cp "$CONTEXT_FILE" "$PHASE_DIR/../context-${PHASE}.txt" 2>/dev/null || true

# Gera meta.json e dispara cada modelo em paralelo via python (faz fallback + paralelismo)
# Passa paths via env vars (evita problema de interpolação em raw strings Python)
export AIPL_PIPELINE_DIR="$PIPELINE_DIR_WIN"
export AIPL_PHASE="$PHASE"
export AIPL_CONTEXT_FILE="$CONTEXT_FILE_WIN"
export AIPL_PHASE_DIR="$PHASE_DIR_WIN"

PYTHONIOENCODING=utf-8 python - <<'PYEOF'
import json, io, os, shutil, subprocess, sys, threading, time
sys.stdout.reconfigure(encoding='utf-8')

# Resolve bash absoluto — evita que o Windows pegue o WSL bash.exe (que falha se WSL não estiver configurado)
BASH = shutil.which("bash") or "bash"
if "System32" in BASH or "WindowsApps" in BASH:
    # Força Git Bash se o which pegou o WSL
    for candidate in (r"C:\Program Files\Git\usr\bin\bash.exe", r"C:\Program Files\Git\bin\bash.exe"):
        if os.path.exists(candidate):
            BASH = candidate
            break

PIPELINE_DIR = os.environ["AIPL_PIPELINE_DIR"]
PHASE = os.environ["AIPL_PHASE"]
CONTEXT_FILE = os.environ["AIPL_CONTEXT_FILE"]
PHASE_DIR = os.environ["AIPL_PHASE_DIR"]

with io.open(os.path.join(PIPELINE_DIR, "models.json"), encoding="utf-8") as f:
    registry = json.load(f)

entries = registry.get(PHASE, [])
if not entries:
    print(f"run.sh: nenhum modelo configurado para fase {PHASE}", file=sys.stderr)
    sys.exit(3)

print(f"Disparando {len(entries)} modelos para fase '{PHASE}' em paralelo...", file=sys.stderr)

results = {}
threads = []
lock = threading.Lock()

def call_model(entry):
    logical = entry["logical"]
    model_id = entry["id"]
    role = entry["role"]
    max_tokens = entry.get("max_tokens", 1800)
    fallback = entry.get("fallback")

    role_path = os.path.join(PIPELINE_DIR, "roles", role)
    out_json = os.path.join(PHASE_DIR, f"{logical}.json")
    consult = os.path.join(PIPELINE_DIR, "consult.sh")

    def run_consult(mid):
        return subprocess.run(
            [BASH, consult, mid, role_path, CONTEXT_FILE, out_json, str(max_tokens)],
            capture_output=True, text=True
        )

    t_start = time.time()
    res = run_consult(model_id)
    fallback_used = None

    # Fallback em HTTP 4xx/5xx e só se declarado
    if res.returncode != 0 and fallback:
        # Cheque se foi 400 "not a valid model ID" ou similar — aciona fallback
        try:
            with io.open(out_json, encoding="utf-8") as f:
                body = json.load(f)
            err = body.get("error") or (body.get("choices", [{}])[0].get("error") if body.get("choices") else None)
            is_model_error = False
            if isinstance(err, dict):
                msg = (err.get("message") or "").lower()
                code = err.get("code")
                if code in (400, 404) or "not a valid model" in msg or "model not found" in msg:
                    is_model_error = True
            if is_model_error:
                with lock:
                    print(f"  [{logical}] primary {model_id} falhou → acionando fallback {fallback}", file=sys.stderr)
                res = run_consult(fallback)
                if res.returncode == 0:
                    fallback_used = fallback
        except Exception:
            pass

    elapsed = time.time() - t_start
    with lock:
        results[logical] = {
            "fallback_used": fallback_used,
            "returncode": res.returncode,
            "elapsed_s": round(elapsed, 1),
            "stderr_tail": (res.stderr or "").splitlines()[-3:] if res.stderr else [],
        }
        status = "OK" if res.returncode == 0 else f"FAIL({res.returncode})"
        fb = f" [fallback={fallback_used}]" if fallback_used else ""
        print(f"  [{logical}] {status}{fb} ({elapsed:.1f}s)", file=sys.stderr)
        if res.returncode != 0:
            # Dump stderr completo para debug (só em falha)
            err_out = (res.stderr or "").strip() or "(stderr vazio)"
            for line in err_out.splitlines()[-10:]:
                print(f"    {logical}: {line}", file=sys.stderr)
            out_out = (res.stdout or "").strip()
            if out_out:
                for line in out_out.splitlines()[-5:]:
                    print(f"    {logical} [stdout]: {line}", file=sys.stderr)

for entry in entries:
    t = threading.Thread(target=call_model, args=(entry,))
    t.start()
    threads.append(t)

for t in threads:
    t.join()

# Grava meta.json com o que foi efetivamente disparado + fallback_used
meta_entries = []
for entry in entries:
    logical = entry["logical"]
    r = results.get(logical, {})
    meta_entries.append({
        "logical": logical,
        "display": entry.get("display", logical),
        "id": entry["id"],
        "fallback_used": r.get("fallback_used"),
        "elapsed_s": r.get("elapsed_s"),
    })

with io.open(os.path.join(PHASE_DIR, "meta.json"), "w", encoding="utf-8") as f:
    json.dump(meta_entries, f, ensure_ascii=False, indent=2)

print("", file=sys.stderr)
PYEOF

# Roda o parser
echo ""
PYTHONIOENCODING=utf-8 python "$PIPELINE_DIR_WIN/parse.py" "$PHASE_DIR_WIN"

echo ""
echo "_Run directory: ${PHASE_DIR_WIN}_"
