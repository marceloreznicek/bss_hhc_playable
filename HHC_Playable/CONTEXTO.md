# HHC Playable — Contexto do Projeto

## O que é
Playable ad em HTML/JS de arquivo único do jogo **Hero Hero Clicker**.
Todos os assets (imagens, fontes, áudio) estão embutidos como base64 no HTML.

## Estrutura do jogo
- **3 cards de herói (portrait) / 4 cards (landscape com extra):**
  - Dwarf (anão) — disponível desde o início
  - Ogre — desbloqueado por 3.000 moedas
  - Monster — desbloqueado por 10.000 moedas
  - **Extra card** (só landscape) — cópia visual bloqueada do Monster, não funcional
- Jogador toca no ruby para ganhar rubies → vende rubies por moedas → usa moedas para evoluir herói ou desbloquear novos cards

## Arquivos (raiz do projeto)
- **`HHC_playable_v0.9.html`** — **versão portrait** (1080×1920), base original intocada
- **`HHC_playable_v0.9_landscape.html`** — **versão landscape** (1920×1080), com 4º card extra
- **`HHC_playable_v0.9_full.html`** — **versão unificada** que detecta orientação no load e aplica o layout certo (pra Unity Ads e Google Ads que exigem single HTML pra ambos formatos)
- `art/` — assets de arte originais (já embutidos como base64)
- `sfx/` — arquivos de som originais (já embutidos como base64)
- `builds/v01/` e `builds/v02/` — exports portrait pras 3 plataformas (AppLovin, Google Ads, Unity Ads)
- `builds/v03/` — exports da versão full (portrait + landscape) para Unity Ads e Google Ads
- `CLAUDE.md` — instruções do projeto
- `CONTEXTO.md` — este arquivo

**Arquivos removidos:** `build.py` e `index.html` (versões antigas desatualizadas)

---

## Áudio — O que foi decidido

### Formato
- **MP3** mono, 44100Hz ou 22050Hz, embutido como base64
- Implementado no `index.html` (portrait original) antes do landscape

### Pontos onde SFX disparam no código
| Momento | Função |
|---|---|
| Tap no ruby | `addRuby()` |
| Evoluir herói | `tryEvolve()` |
| Moedas caindo | `sellRubies()` + `animateCoinsBurst()` |
| Desbloquear card | `unlock3k` / `unlock10k` |
| Fechar intro | `closeIntro()` |
| Estrelas enchendo | `animateStarBurst()` |
| Botão bloqueado | `_shakeBtn()` |

---

## Alterações feitas no jogo

### Economia
- Cada ruby vale **50 moedas** ao vender (era 20)

### Velocidade Dwarf card
- Barra enche em **0.15s**, ruby gerado a cada **0.15s** no auto-mine

### Regra clique manual vs auto-mine
- Quando auto-mine está ON, cliques manuais são ignorados
- Aplicado nos 3 cards (`isAuto` param)

### Light sweep no Dwarf
- Dispara quando intro fecha
- `mix-blend-mode: overlay` no container
- 1.2s, `skewX(-20deg)`, gradiente com fade laterais

---

## Versão LANDSCAPE — detalhes da conversão

### Layout geral 1920×1080
- **Esquerda (960px)**: HUD (coin bar no canto direito), hero section (bg+char+estrelas+evolve+stats+forest bg), bottom-bar com SELL no rodapé
- **Direita (960px)**: 4 cards empilhados (Dwarf, Ogre, Monster, Extra)
- **HUD superior**: barra de madeira esticada (1920px wide) cobrindo a tela inteira, moedas top-right

### Técnica de "panes"
Para reaproveitar o CSS portrait (coordenadas 1080×1920), usei wrappers scaled:
- `.left-pane-forest`, `.left-pane`, `.left-pane-bottom`, `.right-pane` (cards), `.right-pane.right-pane-overlay` (bubbles/tutoriais)
- Cada pane tem `.left-pane-inner`/`.right-pane-inner` com `transform: scale(...)` e offset top negativo
- Pane recorta só o pedaço do layout portrait que interessa e mostra escalado no espaço landscape

### Scales / offsets
- **Left pane principal** (hero): scale 0.889, inner top -150 (mostra portrait y=167 pra cima do pane)
- **Left pane bottom** (sell): scale 0.889, inner top -1451 (mostra portrait y~1670)
- **Right pane** (cards): scale **0.839** (ajustado pra caber 4 cards no pane de 903px), inner top -699

### Card backgrounds widened
- `#dwarf-card-bg`, `#ogre-card-bg`, `#monster-card-bg`: width 1080 → **1144** (pra preencher o pane de 960px visíveis após scale 0.839 — matemática: 1144 × 0.839 = 960)
- Sweeps (dwarf/ogre/knight): width → **1200** pra garantir cobertura dos 64px extras
- Elementos internos dos cards (icons, name labels, ruby btns, bar tracks, switch-auto): left values shifted +32 pra centralizar no card widened

### Extra card (4º card)
- Adicionado via JS `addCard4()` (só roda em landscape)
- Clona elementos do Monster card com offset +269 inner-local
- Aplica `filter: blur(18px) grayscale(100%)` nos elementos internos (frame do card fica nítido, só grayscale)
- Background e avatar são assets dedicados (`bg_card_4.png`, `card4_avatar.png`) — não usam mais a imagem do Monster card
- Botão `#btn-unlock-locked` (`btn_unlock_locked.png`) posicionado em `top:1678px left:396px width:352px` — mesma posição/tamanho dos outros botões de unlock
  - Durante tutorial (`guideStep < 4`): só feedback visual `:active` (scale 0.95)
  - Após tutorial (`guideStep >= 4`): chama `_shakeBtn('btn-unlock-locked')` — shake lateral + SFX_LOCKED
  - Implementado em `tryUnlockCard4()`, estrutura `<div id="btn-unlock-locked"><img></div>` igual aos outros unlock buttons

### Shifts e ajustes finos (landscape)
- Hero-bg: top 200 → 220 (desceu 20px)
- Hero-char-wrap: top 211 → 231
- Badge-n: top 210 → 230
- Estrelas: tops 575/646/717 → 595/666/737
- `HERO_FEET_Y` = 834 (era 814) pra stages 1-3 alinharem com stage 0
- Eye positions em `tryEvolve`: absolute target y de 325 → 345
- Sparkles em `animateStarBurst`: converter coords inner-local pra game via `0.889 * slot + 15`
- `animateCoinsBurst` scaleRatio: `gameRect.width / 1920`

### Animação da moeda voando (sell → contador)
- Correção do deslize X no final: usar `epX = Math.min(1, ep / 0.75)` pro X completar antes do Y clampar no topo
- Moeda chega no alinhamento horizontal antes de descer verticalmente no contador

### HUD
- Wood bar estica 1920px (passa nos dois panes)
- Coin bar img + coins val: saídos dos panes, direto no #game, ficam no canto top-right

### Tutorial bubbles (landscape, coords inner-local do right-pane-overlay-inner)
- `#tut-mine`: top:679 left:612 (aponta ruby btn dwarf)
- `#tut-auto`: top:1075 left:484 (aponta switch-auto dwarf)
- `#tut-sell`: top:1480 left:-493 (aponta SELL na left pane via overflow:visible)
- `#tut-evolve`: top:1203 left:-606 (aponta EVOLVE na left pane)
- `#guide-hand-evolve`: top:1118 left:-272

### Show guide hands (landscape coords game)
- Ruby btn: `showGuideHand(302, 1766)` — apex no centro do ruby btn dwarf
- Sell btn: `showGuideHand(981, 725)` — apex no centro do SELL
- Auto btn: `showGuideHand(371, 1765)` — apex no centro do switch-auto

### Cards de intro e endcard (landscape)
- Centralizados em pilha vertical (ícone topo, texto meio, botão + mão baixo)
- Mão do intro: top:963 left:1103 (aponta START btn)
- Mão do endcard: top:891 left:1123 (aponta PLAY IT NOW)

---

## Versão FULL (merge portrait + landscape)

### Como funciona
- Detecta orientação **uma vez no load**: `IS_LANDSCAPE = window.innerWidth >= window.innerHeight`
- Adiciona classe `portrait` ou `landscape` em `<html>` e `<body>`
- CSS tem bloco `body.portrait { ... }` com ~70 regras que sobrescrevem valores landscape pra voltar ao layout portrait original
- JS branchea com `IS_LANDSCAPE` em: `scaleGame()`, `HERO_FEET_Y`, `animateStarBurst`, `animateCoinsBurst`, `showGuideHand` calls, `addCard4()` guard
- **Sem runtime switching**: ad networks fixam orientação antes de abrir o criativo. Resize listener só re-roda `scaleGame()` pra ajustar encaixe no viewport (não re-detecta orientação)

### Peculiaridade — intro-hand no portrait
- `body.portrait #intro-hand` tem `width: 144px !important` mas `top`/`left` SEM `!important`
- Motivo: `showGuideHand()` seta inline top/left dinâmicamente pra reposicionar a mão em cada step do tutorial. Se a CSS tivesse !important, sobrescreveria o inline e a mão ficaria presa na posição do intro
- Outras mãos (`#endcard-hand`, `#guide-hand-evolve`) mantêm `!important` porque não são repositionadas por JS

### Pra builds Unity Ads e Google Ads
Usar `HHC_playable_v0.9_full.html` como fonte única. Funciona tanto em portrait quanto landscape dependendo da orientação do device.

### Diferenças entre plataformas (v03)
| Plataforma | Arquivo | goToStore | Init |
|---|---|---|---|
| **Unity Ads** | `HHC_playable_v03_UnityAds.html` | `mraid.open(url)` | `mraid` check + fallback DOMContentLoaded |
| **Google Ads** | `HHC_playable_v03_GoogleAds.zip` (index.html) | `ExitApi.exit()` | `document.readyState` apenas |

---

## Próximos passos
- [x] Áudio implementado
- [x] Builds v1 e v2 (portrait) gerados pras 3 plataformas
- [x] Versão landscape completa com 4 cards (extra card visual-only)
- [x] Versão full (portrait + landscape) funcional
- [x] Builds v3 (full portrait+landscape) gerados para Unity Ads e Google Ads em `builds/v03/`
- [x] Extra card com assets próprios (bg_card_4, card4_avatar) e botão btn_unlock_locked funcional
- [ ] Testar em devices reais (portrait phone + landscape tablet/phone-rotated)
