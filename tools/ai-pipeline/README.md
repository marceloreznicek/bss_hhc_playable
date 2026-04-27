# AI Pipeline — HeroHeroClicker

Pipeline de 5 etapas com 15 modelos distintos (via OpenRouter) usado por Claude Code para análise pré-code, síntese, execução, review pós-code e aprovação final.

Papéis refinados empiricamente após bateria de **90 chamadas** (15 modelos × 6 prompts) em 2026-04-24. Cada IA ocupa o seu melhor nicho qualitativo. Detalhes completos no `CLAUDE.md` da raiz do projeto.

## Estrutura

```
tools/ai-pipeline/
├── models.json          ← registry de modelos por fase (precode/synthesis/postcode/final)
├── roles/               ← system prompts por modelo (16 arquivos)
├── consult.sh           ← wrapper para chamar OpenRouter
├── run.sh               ← runner de uma fase
├── run-precode.sh       ← wrapper da ETAPA 1 (8 IAs em paralelo)
├── run-postcode.sh      ← wrapper da ETAPA 3 (6 IAs em paralelo)
├── run-final.sh         ← wrapper da ETAPA 4 (2 IAs)
├── parse.py             ← parser dos JSON retornados
├── context-precode.txt  ← template de contexto para pré-code
├── context-postcode.txt ← template de contexto para pós-code
├── context-final.txt    ← template de contexto para revisão final
└── runs/                ← outputs de execuções anteriores
```

## Setup

1. Criar `.openrouter.key` na raiz do projeto com a API key do OpenRouter:
   ```bash
   echo "sk-or-v1-..." > /c/Users/warva/HeroHeroClicker/.openrouter.key
   ```
   Alternativa: exportar `$OPENROUTER_KEY` ou colocar em `$HOME/.openrouter.key`.

2. Dependências: `bash`, `python3`, `curl`.

## Uso rápido

```bash
cd tools/ai-pipeline

# ETAPA 1 (pré-code, 8 IAs em paralelo)
./run-precode.sh context-precode.txt meu-run-id

# ETAPA 3 (pós-code, 6 IAs)
./run-postcode.sh context-postcode.txt meu-run-id

# ETAPA 4 (revisão final, 2 IAs)
./run-final.sh context-final.txt meu-run-id
```

Outputs são salvos em `runs/<run-id>/<fase>/<logical>.json`.

## Pipeline atual (2026-04-24)

### ETAPA 1 — Pré-code (8 IAs, cada uma com nicho único)
| Logical | Modelo | Nicho |
|---|---|---|
| opus | Claude Opus 4.7 | Detector de edge cases invisíveis |
| sonnet | Claude Sonnet 4.6 | Security auditor primário |
| gpt53-codex | GPT-5.3 Codex | Reasoning lógico puro |
| qwen | Qwen 3.6 Plus | Advogado do diabo defensivo |
| gemini-flash | Gemini 3 Flash | Brainstorm didático |
| kat | KAT Coder Pro V2 | TL;DR Unity-specific |
| gpt55 | GPT-5.5 | Co-coder ativo |
| grok | Grok 4.20 | Red team hacker exaustivo |

### ETAPA 1.5 — Síntese (1 IA)
| Logical | Modelo | Nicho |
|---|---|---|
| kimi | Kimi K2.6 | Consolidador multi-agente dos 8 pareceres |

### ETAPA 2 — Execução
Claude + GPT-5.5 como co-coder.

### ETAPA 3 — Pós-code (6 IAs)
| Logical | Modelo | Nicho |
|---|---|---|
| gpt55-triage | GPT-5.5 (triagem) | Triagem rápida do diff |
| gpt55 | GPT-5.5 | Reasoning + fix C# |
| gemini-pro | Gemini 3.1 Pro | Analista de impacto profundo |
| grok | Grok 4.20 | Cross-file exaustivo |
| minimax | MiniMax M2.7 | QA planner (⚠️ sem security) |
| mimo-v2.5 | MiMo V2.5 Pro | PR description + refactor architect |

### ETAPA 4 — Revisão Final (2 IAs)
| Logical | Modelo | Nicho |
|---|---|---|
| mimo | MiMo V2 Pro | Aprovação com foco em cenários |
| sonnet-final | Claude Sonnet 4.6 | Última linha de defesa (quality baseline) |

## Warnings importantes

- **MiniMax M2.7** recusa prompts de security por policy — NUNCA enviar análise de exploits/IAP/Firebase auth
- **Kimi K2.6** trunca em prompts abertos (reasoning interno consome tokens) — SEMPRE usar estrutura de N seções explícitas
- **MiMo V2/V2.5 Pro** têm apenas 1 provider (Xiaomi) — se falhar, tratar como skipped
- **GPT-5.4 Codex** (`openai/gpt-5.4-codex`) NÃO EXISTE no OpenRouter — foi removido do pipeline, não reintroduzir

## Resultados dos testes

Ver `ai_pipeline_test_results.json` na raiz do projeto (90 respostas brutas: latência, custo, tokens, conteúdo por modelo × prompt).
