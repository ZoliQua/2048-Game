# 🔢 2048

A minimal, type-safe 2048 built with **React 18**, **Vite** and **TypeScript** — keyboard- and touch-friendly, grid-based DOM, no canvas, no game engine, no animation library.
Runs on its own **and** as one of the fourteen games of **[Zoltan's Arcade](https://github.com/ZoliQua/Arcade-Game-Center)**.

[![CI](https://github.com/ZoliQua/2048-Game/actions/workflows/ci.yml/badge.svg)](https://github.com/ZoliQua/2048-Game/actions/workflows/ci.yml)
![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

---

## 📑 Table of contents

- [The Zoltan's Arcade family](#-the-zoltans-arcade-family)
- [Features](#-features)
- [Quick start](#-quick-start)
- [Controls](#%EF%B8%8F-controls)
- [Scoring & stats](#-scoring--stats)
- [Autosave & resume](#-autosave--resume)
- [Embedding in Arcade-Game-Center](#-embedding-in-arcade-game-center)
- [How it works](#-how-it-works)
- [Scripts](#-scripts)
- [Architecture](#%EF%B8%8F-architecture)
- [Contributing](#-contributing)
- [License](#%EF%B8%8F-license)

## 🕹️ The Zoltan's Arcade family

Every game is a standalone repo that also plugs into the portal. They share one design system, one scoring model and one save format through the vendored [`src/arcade/`](./src/arcade) kit.

| Game | Repo | Genre |
| --- | --- | --- |
| 🏠 **Arcade portal** | [Arcade-Game-Center](https://github.com/ZoliQua/Arcade-Game-Center) | All games in one place, live demos, stats, leaderboard |
| 🧱 Tetris | [Tetris-Game](https://github.com/ZoliQua/Tetris-Game) | Arcade |
| 🐍 Snake | [Snake-Game](https://github.com/ZoliQua/Snake-Game) | Reflex |
| 🔢 **2048** (this repo) | [2048-Game](https://github.com/ZoliQua/2048-Game) | Puzzle |
| 🟡 Pac-Man | [Pac-Man-Game](https://github.com/ZoliQua/Pac-Man-Game) | Maze |
| ⚫ Gomoku | [Gomoku-Game](https://github.com/ZoliQua/Gomoku-Game) | Strategy |
| 🦷 Tic-Tac-Toe | [Tic-Tac-Toe-Game](https://github.com/ZoliQua/Tic-Tac-Toe-Game) | Duel |
| 🏓 Breakout | [Breakout-Game](https://github.com/ZoliQua/Breakout-Game) | Paddle |
| 👾 Space Invaders | [Space-Invaders-Game](https://github.com/ZoliQua/Space-Invaders-Game) | Shooter |
| 🔴 Connect Four | [Connect-Four-Game](https://github.com/ZoliQua/Connect-Four-Game) | Duel |
| 🔩 Nut Sort | [Nut-Sort-Game](https://github.com/ZoliQua/Nut-Sort-Game) | Sorting |
| 🃏 Texas Hold'em | [Texas-Holdem-Game](https://github.com/ZoliQua/Texas-Holdem-Game) | Cards |
| 💣 Minesweeper | [Minesweeper-Game](https://github.com/ZoliQua/Minesweeper-Game) | Logic |
| ♠️ Solitaire | [Solitaire-Game](https://github.com/ZoliQua/Solitaire-Game) | Cards |
| 🎴 Ulti | [Ulti-Game](https://github.com/ZoliQua/Ulti-Game) | Cards |

## ✨ Features

- 🎮 **Classic 2048** on a fixed 4×4 grid
- 🧮 **Merge-once-per-move invariant** — a tile born from a merge cannot merge again the same move
- 🎯 **Leading-edge merge order** — `[2,2,2,2]` → `[4,4,0,0]`, never `[8,0,0,0]`
- 🎲 **Weighted spawn** — every successful move drops a 2 (90%) or a 4 (10%) on a random empty cell
- 🏆 **Win at 2048** with a sticky win flag and a **keep going** choice for higher tiles
- ⏪ **Undo** — roll back the last 2 moves (also saved with the run)
- 📱 **Swipe input** on the board (30 px threshold, dominant axis)
- 💫 **CSS-only animations** — slide, spawn-pop, merge-pulse (respecting *reduced motion*)
- 💾 **Autosave & resume** — close the tab mid-run and pick up where you left off, undo history included
- 🏅 **Unified arcade stats** — best score, plays, wins, total time, shared with the portal
- ⏱️ **Pause-aware run timer** that starts with your first move
- 🌗 **Dark / light theme** shared with every arcade game (press **T**)
- 🌍 **Three languages** — English, Hungarian and German; switch in the top bar or in the settings (also `?lang=en|hu|de` for link hand-off); numbers follow the locale's grouping
- 🦷 **Dental mode** — a „Fogas mód” / "Dental mode" / „Zahnmodus” toggle in the settings, off by default (or `?dental=1`), shared across the whole arcade: the numbers stay, the tile art grows from a milk tooth through permanent teeth to a golden crown at 2048; presentation only
- 🤖 **Attract-mode demo** (`<Game2048Demo />`) — the real engine played by an expectimax-lite autopilot, shown on the portal's landing page
- ⌨️ **Keyboard-first**; hotkeys are ignored while you type in a form field or hold Cmd/Ctrl/Alt
- 🧪 **Tested** — pure-logic unit tests plus component tests with Vitest + Testing Library

## 🚀 Quick start

Requires **Node ≥ 20** and npm.

```bash
git clone https://github.com/ZoliQua/2048-Game.git
cd 2048-Game
npm install
npm run dev          # http://localhost:5173
```

Production build: `npm run build && npm run preview`. The build uses relative asset paths, so `dist/` can be served from any sub-folder.

## ⌨️ Controls

| Key | Action |
| --- | --- |
| ⬆️ ⬇️ ⬅️ ➡️ / **W A S D** | Slide all tiles |
| 👆 Swipe on the board | Slide in the swipe direction |
| **U** | Undo (up to the last 2 moves) |
| **Space** / **Enter** | Pause · resume · keep going after 2048 · new game when over |
| **P** / **Esc** | Pause / resume |
| **C** | Keep going after reaching 2048 |
| **R** | New game |
| **T** | Toggle dark / light theme (standalone page) |

Arrow keys call `preventDefault()` so the page never scrolls during play; touch swipes use a non-passive listener so a swipe never scrolls the page either.

## 🎯 Scoring & stats

Each merge adds the **merged tile's value** to the score (the standard 2048 rule).

| Merge | Points |
| --- | ---: |
| `2 + 2 → 4` | **+4** |
| `4 + 4 → 8` | **+8** |
| `8 + 8 → 16` | **+16** |
| `512 + 512 → 1024` | **+1024** |
| `1024 + 1024 → 2048` | **+2048** |

A move with several merges adds each one; there is no combo bonus or multiplier.

**Run lifecycle.** A fresh board is immediately *Playing* — there is no start screen; the run clock starts with the first move.
**P / Esc** pause (overlay, input blocked, clock stopped). Reaching **2048** shows *You win!* with **Keep going** / **New game**
(the clock is stopped while the choice is open). The run ends when no move is possible. Its outcome is **win** if the
largest tile is ≥ 2048, otherwise **over**.

- 🏆 **Win** — the first 2048 tile shows the win overlay; `hasWon` stays sticky until a new game.
- ▶️ **Keep going** — returns to play with score, tiles, moves and the win flag intact; later 2048s do not retrigger the overlay.
- 💀 **Lose** — every cell occupied **and** no orthogonally adjacent equal pair, checked *after* the spawn.
- ⏪ **Undo** — each move snapshots the previous state (max 2). Undo works while playing and on the win overlay; it is
  disabled while paused and after the run has ended (the result is already recorded).

When a run ends the kit records it once in `localStorage` under `arcade.stats.2048`
(`best`, `plays`, `wins`, `totalScore`, `totalSeconds`, `lastScore`, `lastPlayedAt`).
The legacy `2048.highScore` key is migrated and kept in sync, so older builds keep their record.
The stat strip shows **Score · Best · Max tile · Moves · Time**.

## 💾 Autosave & resume

Once you have made a move, the run is saved about once a second and whenever the page is hidden or the game is unmounted
(key `arcade.session.2048`, schema-versioned and strictly validated on load — tiles, ids, positions, values and the undo
history). Reloading shows **Welcome back** with the restored run paused; a pending win choice resumes as *keep going*.
**Discard** next to the *Autosaved* badge throws the save away. Finished runs and fresh boards clear their save automatically.

## 🧩 Embedding in Arcade-Game-Center

```tsx
import { Game2048, Game2048Demo } from '@arcade/2048';

<Game2048
  embedded                                   // hide the page title; the portal shows it
  onGameOver={(score) => submitScore('2048', score)}
  onStatusChange={({ status, score, seconds }) => updateHeader(status, seconds)}
/>
<Game2048Demo active={cardIsVisible} />       // landing-page attract mode
```

Both components follow the shared `ArcadeGameProps` / `ArcadeDemoProps` contract from `src/arcade/types.ts`.
Game status maps onto the arcade lifecycle as `running → running`, `paused`/`won → paused`, `gameOver → gameOver`
(2048 never reports `idle`).

## 🧠 How it works

```
running ↔ paused
   │
   ├─→ won ──(keep going)──→ running
   │                            │
   └────────────────────────────┴─→ gameOver ──(new game)──→ running
```

A single pure reducer, `advanceGame(state, action, rng): GameState`, owns every transition. One move flows like this:

1. **Slide & merge** — `applyMove(state, direction)` derives all four directions from one LEFT primitive (`slideAndMergeLine`) via `transpose` / `reverseRows`. Tile ids are preserved across pure slides; merges mint a fresh id and tag both source tiles `isDying` for one render so the UI can animate the collapse.
2. **No-op detection** — if nothing moved or merged, the action is dropped: no spawn, no move count, no score change.
3. **Spawn** — `spawnTile(state, rng)` picks a uniformly random empty cell and writes a 2 (90%) or 4 (10%).
4. **Win check** — the first 2048 tile flips status to `won` (unless the player already chose to keep going).
5. **Lose check** — runs *after* the spawn.
6. **History push** — the pre-move state is snapshotted onto `state.history` (capped at 2) for `undo`.

RNG is injected, so the logic is deterministic in tests. The `tiles` array is the canonical state; the 4×4 matrix is derived by `tilesToBoard` only for slide/merge math.

**Animations** are CSS-only and never block input: tiles are absolutely positioned with `transform: translate(...)` and a 120 ms transition (stable `id` keys make the slide work), new tiles pop in, merged tiles pulse, and dying source tiles are removed by a `commitAnimation` action shortly after the move.

**Demo autopilot** (`logic/autopilot.ts`): for each legal move (simulated with the real `applyMove`) it averages, over every possible spawn of a 2, the best follow-up move's evaluation — a corner-anchored snake gradient plus a bonus for empty cells and adjacent equal pairs. It reliably builds 1024–4096 tiles; the demo moves every 320 ms and restarts after a game over or once it has shown a 2048.

## 🧪 Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and production build |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (logic + component tests) |
| `npm run check` | lint → typecheck → test → build (what CI runs) |

## 🏗️ Architecture

```
src/
  arcade/              vendored Zoltan's Arcade kit — do not edit here (see its README)
  logic/               pure game rules — no React imports
    types.ts constants.ts grid.ts
    merge.ts           slideAndMergeLine — the 1-D leading-edge merge core
    move.ts            applyMove(state, direction)
    spawn.ts           spawnTile(state, rng) — 90/10 weighting on 2 vs 4
    win.ts             hasWon, hasLost, maxTile
    game.ts            advanceGame reducer + createInitialState, canUndo, reachedTarget
    autopilot.ts       expectimax-lite move choice for the demo
    persist.ts         runtime validation of saved sessions (incl. undo history)
  hooks/               useKeyboardMove, useSwipeInput
  components/          GameBoard (full + mini) + Tile, GameBoard.module.css
  demo/Game2048Demo.tsx  landing-page attract mode
  Game2048.tsx         the embeddable game (ArcadeGameProps)
  App.tsx              standalone page: <ArcadeShell><Game2048/></ArcadeShell>
  main.tsx             entry; loads the shared arcade.css once
  index.ts             package entry used by Arcade-Game-Center
```

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md), the [Code of Conduct](./CODE_OF_CONDUCT.md) and [SECURITY.md](./SECURITY.md).
Contributors are listed in [CONTRIBUTORS.md](./CONTRIBUTORS.md); changes in [CHANGELOG.md](./CHANGELOG.md).

## ⚖️ License

[MIT](./LICENSE) © 2026 Zoltán Dul

---

<p align="center">Made with ❤️ by Zoltán Dul · part of <a href="https://github.com/ZoliQua/Arcade-Game-Center">Zoltan's Arcade</a></p>
