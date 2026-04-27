#!/usr/bin/env python
# parse.py — Parser robusto de respostas OpenRouter → markdown consolidado.
#
# Uso:
#   python parse.py <phase_dir>
#     onde <phase_dir> contém um ou mais arquivos <logical>.json (um por modelo)
#     e um meta.json opcional com [{logical, display, id, fallback_used}]
#
# Trata os 3 modos de falha reais:
#   1. UnicodeDecodeError (cp1252 no Windows) → abre tudo com utf-8
#   2. content:null com reasoning_details populado → fallback para o reasoning
#   3. HTTP error embarcado (choices[0].error.code) → reporta como indisponível

import io
import json
import os
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

VERDICT_RE = re.compile(r'\b(APROVADO|REJEITADO)\b', re.IGNORECASE)


def extract_content(data):
    """Retorna (content, note) onde note é string opcional sobre o modo de extração."""
    if not isinstance(data, dict):
        return None, "payload não é objeto JSON"

    # Erro no topo (ex: {"error": {"code": 400, "message": "..."}})
    top_err = data.get("error")
    if isinstance(top_err, dict):
        code = top_err.get("code", "?")
        msg = top_err.get("message", "sem mensagem")
        return None, f"erro top-level HTTP {code}: {msg}"

    choices = data.get("choices")
    if not choices or not isinstance(choices, list):
        return None, "sem choices na resposta"

    choice = choices[0] or {}

    # Erro embarcado na choice (caso real Gemini 3.1 Pro 502)
    embed_err = choice.get("error")

    msg = choice.get("message") or {}
    content = msg.get("content")

    if content:
        return content, None

    # Fallback 1: reasoning_details (Gemini 3.1 Pro)
    details = msg.get("reasoning_details")
    if isinstance(details, list):
        texts = [d.get("text", "") for d in details if isinstance(d, dict)]
        joined = "\n".join(t for t in texts if t).strip()
        if joined:
            note = "content vazio; extraído de reasoning_details"
            if isinstance(embed_err, dict):
                note += f" (após erro {embed_err.get('code', '?')}: {embed_err.get('message', '')})"
            return joined, note

    # Fallback 2: reasoning (string direto)
    reasoning = msg.get("reasoning")
    if isinstance(reasoning, str) and reasoning.strip():
        note = "content vazio; extraído de reasoning"
        if isinstance(embed_err, dict):
            note += f" (após erro {embed_err.get('code', '?')}: {embed_err.get('message', '')})"
        return reasoning.strip(), note

    if isinstance(embed_err, dict):
        code = embed_err.get("code", "?")
        err_msg = embed_err.get("message", "sem mensagem")
        return None, f"erro embarcado HTTP {code}: {err_msg}"

    return None, "resposta vazia"


def extract_verdict(content):
    if not content:
        return None
    # Última ocorrência (roles pedem verdict no fim)
    matches = VERDICT_RE.findall(content)
    if not matches:
        return None
    return matches[-1].upper()


def make_preview(content, max_lines=8, max_line_len=160):
    """Retorna as primeiras linhas não-vazias do content, truncadas e formatadas como blockquote."""
    if not content:
        return ""
    lines = content.splitlines()
    # Remove linhas vazias iniciais e headers markdown "top-level" (# Título) que não agregam
    out = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if out:  # preserva quebras dentro do preview
                out.append("")
            continue
        # Skipa título markdown "# X" se for o primeiro conteúdo (header vazio de seção)
        if not out and stripped.startswith("# ") and len(stripped.split()) <= 4:
            continue
        # Trunca linhas muito longas
        if len(line) > max_line_len:
            line = line[:max_line_len - 1] + "…"
        out.append(line)
        # Conta só linhas não-vazias pro limite
        non_empty = sum(1 for l in out if l.strip())
        if non_empty >= max_lines:
            break
    # Remove trailing blank
    while out and not out[-1].strip():
        out.pop()
    if not out:
        return ""
    total_lines = sum(1 for l in lines if l.strip())
    preview_lines = sum(1 for l in out if l.strip())
    suffix = ""
    if preview_lines < total_lines:
        suffix = f"\n> _… ({total_lines - preview_lines} linhas adicionais)_"
    # Blockquote markdown
    quoted = "\n".join(f"> {l}" if l else ">" for l in out)
    return quoted + suffix


def load_meta(phase_dir):
    meta_path = phase_dir / "meta.json"
    if not meta_path.exists():
        return None
    try:
        with io.open(meta_path, encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"<!-- meta.json ilegível: {e} -->", file=sys.stderr)
        return None


def main():
    if len(sys.argv) < 2:
        print("Uso: parse.py <phase_dir>", file=sys.stderr)
        sys.exit(2)

    phase_dir = Path(sys.argv[1])
    if not phase_dir.is_dir():
        print(f"parse.py: diretório inválido: {phase_dir}", file=sys.stderr)
        sys.exit(2)

    meta = load_meta(phase_dir)
    if meta:
        entries = meta
    else:
        # Fallback: descobre pelos arquivos .json (exceto meta.json)
        entries = []
        for j in sorted(phase_dir.glob("*.json")):
            if j.name == "meta.json":
                continue
            entries.append({"logical": j.stem, "display": j.stem, "id": "?"})

    phase_name = phase_dir.name
    print(f"## Resumo da fase `{phase_name}` ({len(entries)} modelos)\n")

    approved = 0
    rejected = 0
    errors = 0

    for entry in entries:
        logical = entry.get("logical") or entry.get("display") or "?"
        display = entry.get("display") or logical
        model_id = entry.get("id", "?")
        fallback_used = entry.get("fallback_used")

        json_path = phase_dir / f"{logical}.json"
        md_path = phase_dir / f"{logical}.md"

        header_suffix = ""
        if fallback_used:
            header_suffix = f" → fallback `{fallback_used}`"

        if not json_path.exists():
            print(f"### ❓ {display}{header_suffix}\n")
            print(f"_(sem arquivo de resposta em {json_path.name})_\n")
            errors += 1
            continue

        try:
            with io.open(json_path, encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            print(f"### ⚠️ {display}{header_suffix}\n")
            print(f"_(JSON ilegível: {e})_\n")
            errors += 1
            continue

        content, note = extract_content(data)

        if content is None:
            print(f"### ⚠️ {display}{header_suffix} — indisponível")
            print(f"- Modelo: `{model_id}`")
            print(f"- Motivo: {note or 'desconhecido'}\n")
            errors += 1
            # Ainda grava o .md pra inspeção, com JSON raw pra debug
            with io.open(md_path, "w", encoding="utf-8") as f:
                f.write(f"# {display}\n\n")
                f.write(f"**Indisponível:** {note}\n\n")
                f.write("---\n\n")
                f.write("## JSON raw da resposta\n\n```json\n")
                try:
                    f.write(json.dumps(data, ensure_ascii=False, indent=2))
                except Exception:
                    f.write(str(data))
                f.write("\n```\n")
            continue

        verdict = extract_verdict(content)
        if verdict == "APROVADO":
            icon = "✅"
            approved += 1
        elif verdict == "REJEITADO":
            icon = "❌"
            rejected += 1
        else:
            icon = "💬"

        print(f"### {icon} {display}{header_suffix}")
        if verdict:
            print(f"- **Verdict:** {verdict}")
        model_line = f"- Modelo: `{model_id}`"
        elapsed = entry.get("elapsed_s")
        if elapsed is not None:
            model_line += f" · {elapsed}s"
        print(model_line)
        if note:
            print(f"- Nota: _{note}_")
        preview = make_preview(content)
        if preview:
            print()
            print(preview)
        print(f"\n_Completo em `{md_path.name}`_\n")

        # Resposta completa num .md ao lado (para eu ler on-demand sem re-parsear JSON)
        with io.open(md_path, "w", encoding="utf-8") as f:
            f.write(f"# {display}\n\n")
            f.write(f"- Modelo: `{model_id}`\n")
            if fallback_used:
                f.write(f"- Fallback usado: `{fallback_used}`\n")
            if verdict:
                f.write(f"- Verdict: **{verdict}**\n")
            if note:
                f.write(f"- Nota: {note}\n")
            f.write("\n---\n\n")
            f.write(content)
            f.write("\n")

    print(f"---\n")
    print(f"**Totais:** ✅ {approved} aprovados · ❌ {rejected} rejeitados · ⚠️ {errors} erros · "
          f"💬 {len(entries) - approved - rejected - errors} sem verdict explícito\n")
    print(f"**Respostas completas em:** `{phase_dir}/<modelo>.md`")


if __name__ == "__main__":
    main()
