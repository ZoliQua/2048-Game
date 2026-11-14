# 🔢 2048

[English](README.md) · **Deutsch** · [Magyar](README.hu.md)

Ein minimales, typsicheres 2048, gebaut mit **React 18**, **Vite** und **TypeScript** – für Tastatur und Touch, gitterbasiertes DOM, kein Canvas, keine Game-Engine, keine Animationsbibliothek.
Läuft für sich allein **und** als eines der fünfzehn Spiele von **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)**.

[![CI](https://github.com/ZoliQua/2048-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/2048-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Inhaltsverzeichnis

- [Die Zoltan's-Arcade-Familie](#-die-zoltans-arcade-familie)
- [Funktionen](#-funktionen)
- [Schnellstart](#-schnellstart)
- [Steuerung](#%EF%B8%8F-steuerung)
- [Auf dem Handy](#-auf-dem-handy)
- [Punkte & Statistik](#-punkte--statistik)
- [Autosave & Fortsetzen](#-autosave--fortsetzen)
- [Einbindung in Arcade-Game-Center](#-einbindung-in-arcade-game-center)
- [So funktioniert es](#-so-funktioniert-es)
- [Skripte](#-skripte)
- [Architektur](#%EF%B8%8F-architektur)
- [Mitmachen](#-mitmachen)
- [Lizenz](#%EF%B8%8F-lizenz)

## 🕹️ Die Zoltan's-Arcade-Familie

Jedes Spiel ist ein eigenständiges Repo, das sich auch in das Portal einfügt. Alle teilen sich ein Designsystem, ein Punktemodell und ein Speicherformat über das mitgelieferte Kit [`src/arcade/`](./src/arcade).

| Spiel | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade-Portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | Alle Spiele an einem Ort, Live-Demos, Statistik, Bestenliste |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reaktion |
| 🔢 **2048** (dieses Repo) | [2048-Game](https://github.com/ZoliQua/2048-Game) | Puzzle |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Labyrinth |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategie |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duell |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Schläger |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 Vier gewinnt | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duell |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Sortieren |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Karten |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logik |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Karten |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Karten |
| 🂡 Schnapsen | [Snapszer-Game](https://github.com/ZoliQua/Snapszer-Game) | Karten |

## ✨ Funktionen

- 🎮 **Klassisches 2048** auf einem festen 4×4-Feld
- 🧮 **Einmal verschmelzen pro Zug** – eine durch Verschmelzen entstandene Kachel kann im selben Zug nicht noch einmal verschmelzen
- 🎯 **Verschmelzen von der Zugseite aus** – `[2,2,2,2]` → `[4,4,0,0]`, nie `[8,0,0,0]`
- 🎲 **Gewichtetes Erscheinen** – jeder gültige Zug setzt eine 2 (90 %) oder eine 4 (10 %) auf ein zufälliges leeres Feld
- 🏆 **Sieg bei 2048** mit dauerhafter Sieg-Markierung und der Wahl **Weiterspielen** für höhere Kacheln
- ⏪ **Rückgängig** – nimm die letzten 2 Züge zurück (wird mit dem Spiel gespeichert)
- 📱 **Touch-Spiel** – wische auf dem Spielfeld (24-px-Schwelle, dominante Achse, über das `useSwipe` des Kits); die Seite scrollt oder lädt unter deinem Finger nie neu
- 📖 **Regeln-Dialog** mit Verschmelzungs-Diagramm (8 + 8 → 16) in drei Sprachen; beim Öffnen pausiert das Spiel
- 🏁 **Vorzeitig beenden** – beende das Spiel mit Absicht und setze den aktuellen Punktestand auf die Bestenliste
- ⛶ **Vollbild** – echtes Vollbild, wo der Browser es unterstützt, auf dem iPhone ein immersiver Seitenmodus
- 💫 **Reine CSS-Animationen** – Schieben, Erscheinen, Verschmelzungs-Puls (mit Rücksicht auf *reduzierte Bewegung*)
- 💾 **Autosave & Fortsetzen** – Tab mitten im Spiel schließen und später weitermachen, samt Rückgängig-Verlauf
- 🏅 **Einheitliche Arcade-Statistik** – Bestwert, Spiele, Siege, Gesamtzeit, geteilt mit dem Portal
- ⏱️ **Pausenbewusste Spieluhr**, die mit deinem ersten Zug startet
- 🌗 **Dunkles / helles Design**, in allen Arcade-Spielen gleich (Taste **T**)
- 🌍 **Drei Sprachen** – Englisch, Ungarisch und Deutsch; umschaltbar in der oberen Leiste oder in den Einstellungen (auch per `?lang=en|hu|de` im Link); Zahlen folgen der Gruppierung der Sprache
- 🦷 **Zahnmodus** – ein Schalter „Fogas mód“ / „Dental mode“ / „Zahnmodus“ in den Einstellungen, standardmäßig aus (oder `?dental=1`), arcade-weit geteilt: Die Zahlen bleiben, die Kachelbilder wachsen vom Milchzahn über bleibende Zähne bis zur goldenen Krone bei 2048; nur Darstellung
- 🤖 **Attract-Mode-Demo** (`<Game2048Demo />`) – die echte Engine, gespielt von einem Expectimax-Lite-Autopiloten, gezeigt auf der Startseite des Portals
- ⌨️ **Tastatur zuerst**; Hotkeys werden ignoriert, solange du in ein Formularfeld tippst oder Cmd/Strg/Alt hältst
- 🧪 **Getestet** – reine Logiktests plus Komponententests mit Vitest + Testing Library

## 🚀 Schnellstart

Benötigt **Node ≥ 20** und npm.

```bash
git clone https://github.com/ZoliQua/2048-Game.git
cd 2048-Game
npm install
npm run dev          # http://localhost:5173
```

Produktions-Build: `npm run build && npm run preview`. Der Build nutzt relative Asset-Pfade, daher kann `dist/` aus jedem Unterordner ausgeliefert werden.

## ⌨️ Steuerung

| Taste | Aktion |
| --- | --- |
| ⬆️ ⬇️ ⬅️ ➡️ / **W A S D** | Alle Kacheln schieben |
| 👆 Wischen auf dem Spielfeld | In Wischrichtung schieben |
| **U** | Rückgängig (bis zu den letzten 2 Zügen) |
| **Leertaste** / **Enter** | Pause · weiter · nach 2048 weiterspielen · neues Spiel, wenn vorbei |
| **P** / **Esc** | Pause / weiter |
| **C** | Nach Erreichen von 2048 weiterspielen |
| **R** | Neues Spiel |
| **T** | Dunkles / helles Design umschalten (eigenständige Seite) |
| Tasten Regeln / Beenden / Vollbild | Regeln (pausiert das Spiel), Spiel vorzeitig beenden, Vollbild |

Die Pfeiltasten rufen `preventDefault()` auf, damit die Seite beim Spielen nie scrollt; das Spielfeld ist ein Gestenfeld (`touch-action: none`), daher scrollt ein Wisch die Seite auch nicht und löst kein Neuladen durch Herunterziehen aus.

### 📱 Auf dem Handy

Wische auf dem Spielfeld, um die Kacheln zu schieben; die Tasten Rückgängig, Pause, Regeln, Beenden und Vollbild liegen darunter. Auf dem iPhone nutzt Vollbild einen immersiven Seitenmodus; ganz ohne Browserleisten spielst du über Teilen → Zum Home-Bildschirm.

## 🎯 Punkte & Statistik

Jede Verschmelzung bringt den **Wert der entstandenen Kachel** als Punkte (die übliche 2048-Regel).

| Verschmelzung | Punkte |
| --- | ---: |
| `2 + 2 → 4` | **+4** |
| `4 + 4 → 8` | **+8** |
| `8 + 8 → 16` | **+16** |
| `512 + 512 → 1024` | **+1024** |
| `1024 + 1024 → 2048` | **+2048** |

Ein Zug mit mehreren Verschmelzungen addiert jede einzelne; es gibt keinen Kombo-Bonus und keinen Multiplikator.

**Ablauf eines Spiels.** Ein frisches Feld ist sofort *Im Spiel* – es gibt keinen Startbildschirm; die Spieluhr startet mit dem ersten Zug.
**P / Esc** pausieren (Overlay, Eingabe gesperrt, Uhr angehalten). Bei **2048** erscheint *Gewonnen!* mit **Weiterspielen** / **Neues Spiel**
(die Uhr steht, solange die Wahl offen ist). Das Spiel endet, wenn kein Zug mehr möglich ist – oder wenn du **Beenden** wählst. Das Ergebnis ist **Sieg**, wenn die
größte Kachel ≥ 2048 ist, bei vorzeitigem Beenden **beendet**, sonst **vorbei**.

- 🏆 **Sieg** – die erste 2048-Kachel zeigt das Sieg-Overlay; `hasWon` bleibt bis zum neuen Spiel gesetzt.
- ▶️ **Weiterspielen** – zurück ins Spiel mit unverändertem Punktestand, Kacheln, Zügen und Sieg-Markierung; weitere 2048er lösen das Overlay nicht erneut aus.
- 💀 **Niederlage** – jedes Feld belegt **und** kein orthogonal benachbartes gleiches Paar, geprüft *nach* dem Erscheinen der neuen Kachel.
- 🏁 **Vorzeitig beenden** – mit Bestätigung; der aktuelle Punktestand kommt auf die Bestenliste, das Spiel ist vorbei, der Speicherstand wird gelöscht.
- ⏪ **Rückgängig** – jeder Zug speichert den vorherigen Zustand (max. 2). Rückgängig funktioniert im Spiel und im Sieg-Overlay; es ist in der Pause und nach Spielende gesperrt (das Ergebnis ist schon erfasst).

Endet ein Spiel, erfasst das Kit es einmal im `localStorage` unter `arcade.stats.2048`
(`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, `lastScore`, `lastPlayedAt`).
Der alte Schlüssel `2048.highScore` wird übernommen und synchron gehalten, sodass ältere Builds ihren Rekord behalten.
Die Statistikleiste zeigt **Punkte · Bestwert · Höchste Kachel · Züge · Zeit**.

## 💾 Autosave & Fortsetzen

Sobald du einen Zug gemacht hast, wird das Spiel etwa einmal pro Sekunde gespeichert sowie wenn die Seite verborgen oder das Spiel entladen wird
(Schlüssel `arcade.session.2048`, mit Schema-Version und beim Laden streng geprüft – Kacheln, IDs, Positionen, Werte und der
Rückgängig-Verlauf). Beim Neuladen erscheint **Willkommen zurück** mit dem pausierten Spiel; eine offene Sieg-Wahl wird als *Weiterspielen* fortgesetzt.
**Verwerfen** neben dem Hinweis *Gespeichert* wirft den Speicherstand weg. Beendete Spiele und frische Felder löschen ihren Speicherstand automatisch.

## 🧩 Einbindung in Arcade-Game-Center

```tsx
import { Game2048, Game2048Demo } from '@arcade/2048';

<Game2048
  embedded                                   // Seitentitel ausblenden; das Portal zeigt ihn
  onGameOver={(score, info) => submitScore('2048', score, info?.finished)}
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<Game2048Demo active={cardIsVisible} />       // Attract-Mode der Startseite
```

Beide Komponenten folgen dem gemeinsamen Vertrag `ArcadeGameProps` / `ArcadeDemoProps` aus `src/arcade/types.ts`.
Der Spielstatus wird so auf den Arcade-Ablauf abgebildet: `running → running`, `paused`/`won → paused`, `gameOver → gameOver`
(2048 meldet nie `idle`).

## 🧠 So funktioniert es

```
running ↔ paused
   │
   ├─→ won ──(weiterspielen)──→ running
   │                               │
   └───────────────────────────────┴─→ gameOver ──(neues Spiel)──→ running
```

Ein einziger reiner Reducer, `advanceGame(state, action, rng): GameState`, besitzt jeden Übergang. Ein Zug läuft so ab:

1. **Schieben & Verschmelzen** – `applyMove(state, direction)` leitet alle vier Richtungen aus einer LINKS-Grundoperation (`slideAndMergeLine`) über `transpose` / `reverseRows` ab. Kachel-IDs bleiben beim reinen Schieben erhalten; Verschmelzungen erzeugen eine neue ID und markieren beide Quellkacheln für ein Rendering als `isDying`, damit die UI das Zusammenfallen animieren kann.
2. **Erkennung von Nicht-Zügen** – hat sich nichts bewegt oder verschmolzen, wird die Aktion verworfen: keine neue Kachel, kein Zugzähler, keine Punkte.
3. **Erscheinen** – `spawnTile(state, rng)` wählt gleichverteilt ein leeres Feld und setzt eine 2 (90 %) oder 4 (10 %).
4. **Siegprüfung** – die erste 2048-Kachel setzt den Status auf `won` (es sei denn, du hast schon Weiterspielen gewählt).
5. **Niederlagenprüfung** – läuft *nach* dem Erscheinen.
6. **Verlauf** – der Zustand vor dem Zug wird in `state.history` gesichert (max. 2) für `undo`.

Der Zufallsgenerator wird injiziert, daher ist die Logik in Tests deterministisch. Das Array `tiles` ist der maßgebliche Zustand; die 4×4-Matrix leitet `tilesToBoard` nur für die Schiebe-/Verschmelzungsrechnung ab.

**Animationen** sind reines CSS und blockieren nie die Eingabe: Kacheln sind absolut positioniert mit `transform: translate(...)` und einem 120-ms-Übergang (stabile `id`-Keys lassen das Schieben funktionieren), neue Kacheln poppen auf, verschmolzene pulsieren, und sterbende Quellkacheln entfernt kurz nach dem Zug die Aktion `commitAnimation`.

**Demo-Autopilot** (`logic/autopilot.ts`): Für jeden gültigen Zug (mit dem echten `applyMove` simuliert) mittelt er über alle möglichen Erscheinungsorte einer 2 die Bewertung des besten Folgezugs – ein in der Ecke verankerter Schlangen-Gradient plus Bonus für leere Felder und benachbarte gleiche Paare. Er baut zuverlässig Kacheln von 1024–4096; die Demo zieht alle 320 ms und startet nach einem Spielende oder sobald sie eine 2048 gezeigt hat neu.

## 🧪 Skripte

| Skript | Zweck |
| --- | --- |
| `npm run dev` | Vite-Entwicklungsserver |
| `npm run build` | Typprüfung (`tsc -b`) und Produktions-Build |
| `npm run preview` | Produktions-Build ausliefern |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (Logik- + Komponententests) |
| `npm run check` | lint → typecheck → test → build (was die CI ausführt) |

## 🏗️ Architektur

```
src/
  arcade/              mitgeliefertes Zoltan's-Arcade-Kit – hier nicht bearbeiten (siehe dessen README)
  logic/               reine Spielregeln – keine React-Importe
    types.ts constants.ts grid.ts
    merge.ts           slideAndMergeLine – der 1-D-Kern des Verschmelzens
    move.ts            applyMove(state, direction)
    spawn.ts           spawnTile(state, rng) – 90/10-Gewichtung von 2 und 4
    win.ts             hasWon, hasLost, maxTile
    game.ts            advanceGame-Reducer + createInitialState, canUndo, reachedTarget
    autopilot.ts       Expectimax-Lite-Zugwahl für die Demo
    persist.ts         Laufzeitprüfung gespeicherter Sitzungen (inkl. Rückgängig-Verlauf)
  hooks/               useKeyboardMove (Wischen nutzt das useSwipe des Kits)
  components/          GameBoard (voll + mini) + Tile + MergeDiagram, GameBoard.module.css
  rules.tsx            useRulesSections – Inhalt des Regeln-Dialogs
  demo/Game2048Demo.tsx  Attract-Mode der Startseite
  Game2048.tsx         das einbettbare Spiel (ArcadeGameProps)
  App.tsx              eigenständige Seite: <ArcadeShell><Game2048/></ArcadeShell>
  main.tsx             Einstieg; lädt die gemeinsame arcade.css einmal
  index.ts             Paket-Einstieg für Arcade-Game-Center
```

## 🤝 Mitmachen

Siehe [CONTRIBUTING.md](./CONTRIBUTING.md), den [Verhaltenskodex](./CODE_OF_CONDUCT.md) und [SECURITY.md](./SECURITY.md).
Mitwirkende stehen in [CONTRIBUTORS.md](./CONTRIBUTORS.md); Änderungen im [CHANGELOG.md](./CHANGELOG.md).

## ⚖️ Lizenz

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Mit ❤️ gemacht von Zoltán Dul · Teil von <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
