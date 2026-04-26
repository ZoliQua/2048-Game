# 🔢 2048

A minimal, type-safe 2048 built with **React 18**, **Vite**, and **TypeScript**. Keyboard- and touch-friendly, grid-based DOM, no canvas, no game engine, no animation library.

![license](https://img.shields.io/badge/license-MIT-green)
![node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![react](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)
![vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)
![typescript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)

> Sister projects in the same architectural family: [🐍 Snake-Game](https://github.com/ZoliQua/Snake-Game) · [🟦 Tetris-Game](https://github.com/ZoliQua/Tetris-Game).

---

## 📑 Table of contents

- [Features](#-features)
- [How it works](#-how-it-works)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Usage](#-usage)
- [Controls](#-controls)
- [Scoring](#-scoring)
- [Win, continue, lose](#-win-continue-lose)
- [Undo](#-undo)
- [Animations](#-animations)
- [Persistence](#-persistence)
- [Scripts](#-scripts)
- [Architecture](#-architecture)
- [Design rules](#-design-rules)
- [License](#-license)

## ✨ Features

- 🎮 **Classic 2048** on a fixed 4×4 grid
- 🧮 **Merge-once-per-move invariant** — a tile born from a merge cannot merge again the same move
- 🎯 **Leading-edge merge order** — `[2,2,2,2]` → `[4,4,0,0]`, never `[8,0,0,0]`
- 🎲 **Weighted spawn** — every successful move drops a 2 (90%) or a 4 (10%) on a random empty cell
- 🏆 **Win at 2048** with a sticky win flag and an optional **continue** mode for higher tiles
- ⏪ **Undo** — roll back the last 2 moves at any time (paused, won or game over included)
- ⌨️ **Keyboard input** — arrows, WASD, Space/P, C, R
- 📱 **Swipe input** on the board with a 30 px threshold and dominant-axis direction
- 🏅 **Persistent best score** stored in `localStorage` under `2048.highScore`
- ⏱️ **Real-time elapsed timer** (`mm:ss`) that pauses with the game and survives pause/resume
- 💫 **CSS-only animations** — slide, spawn-pop, merge-pulse; no animation library
- 🧼 **Pure game logic** isolated from React; the UI is dumb on purpose
- 🔒 **Strict TypeScript** with no `any` escape hatches in game code

## 🧠 How it works

The game is a state machine driven by player input. There is no auto-tick (unlike Snake's gravity loop) — every transition is user-triggered.

```
idle → running ↔ paused
                  │
                  ├─→ won ──(continue)──→ running
                  │                           │
                  └───────────────────────────┴─→ gameOver ──(restart)──→ idle/running
```

A single pure reducer, `advanceGame(state, action, rng): GameState`, owns every transition. One move dispatch flows like this:

1. **Slide & merge** — `applyMove(state, direction)` derives the four directions from one LEFT primitive (`slideAndMergeLine`) via `transpose` / `reverseRows`. Tile ids are preserved across pure slides; merges mint a fresh id and tag both source tiles `isDying` for one render so the UI can animate the collapse.
2. **No-op detection** — if no tile actually moved or merged, the action is dropped. No spawn, no `moveCount` bump, no score change.
3. **Spawn** — `spawnTile(state, rng)` picks a uniformly random empty cell and writes a 2 (90%) or 4 (10%) tile.
4. **Win check** — if a tile reached 2048 and `continueAfterWin` is false, status flips to `won`. The win flag is sticky.
5. **Lose check** — runs *after* the spawn. A board that fills up but where the spawned tile creates a legal merge is **not** game over.
6. **History push** — the pre-move state is snapshotted onto `state.history` (capped at 2) so `undo` can roll back.

RNG is injected so the logic stays deterministic in tests. The `tiles` array — not a 4×4 matrix — is the canonical state; the matrix view is derived in `tilesToBoard` only when slide/merge math needs it.

## 📦 Requirements

- 🟢 **Node ≥ 20**
- 📦 **npm** (the lockfile is committed as `package-lock.json`)

## 🚀 Installation

```bash
git clone https://github.com/ZoliQua/2048-Game.git
cd 2048-Game
npm install
```

## 🕹️ Usage

Start the dev server:

```bash
npm run dev
```

Then open `http://localhost:5173` in a modern browser.

For a production build:

```bash
npm run build
npm run preview
```

## ⌨️ Controls

| Key                            | Action                |
| ------------------------------ | --------------------- |
| ⬆️ / **W**                     | Move up               |
| ⬇️ / **S**                     | Move down             |
| ⬅️ / **A**                     | Move left             |
| ➡️ / **D**                     | Move right            |
| **Space** / **P**              | Pause / Resume        |
| **C**                          | Continue (after win)  |
| **R**                          | Restart               |
| 👆 Swipe on the board          | Move in swipe direction |

Arrow keys call `event.preventDefault()` so the page never scrolls during play. Touch swipes use a non-passive listener so mid-swipe `preventDefault()` actually suppresses the page scroll.

## 🎯 Scoring

Each merge adds the **merged tile's value** to the score (i.e. double the source tiles).

| Merge          | Points |
| -------------- | -----: |
| `2 + 2 → 4`    | **+4** |
| `4 + 4 → 8`    | **+8** |
| `8 + 8 → 16`   | **+16** |
| `512 + 512 → 1024` | **+1024** |
| `1024 + 1024 → 2048` | **+2048** |

A move with multiple merges adds each merge's score independently. There is no combo bonus, no level multiplier.

The **best score** is persisted to `localStorage` under the key `2048.highScore`, written **only** when strictly higher than the existing best — so it never regresses across refreshes.

## 🏁 Win, continue, lose

- 🏆 **Win** — the first time any tile reaches **2048**, the win overlay shows and `hasWon` becomes sticky. It stays `true` for the rest of the game and only resets on **restart**.
- ▶️ **Continue** — pressing **C** (or the *Continue* button) flips `continueAfterWin = true` and returns to `running`. Score, best, tiles, moves and the win flag all carry over. Crossing 2048 again will not retrigger the overlay.
- 💀 **Lose** — every cell occupied **and** no two orthogonally adjacent tiles share a value. Checked after the spawn step, so a board that fills mid-move but where the spawned tile creates a legal merge is **not** game over.

## ⏪ Undo

Undo rolls back the **last 2 moves at most** (2 clicks). The button is always rendered and disabled when there is nothing to undo. It is available in **any** game state — running, paused, won or game over — so a wrong swipe past the win or game-over overlay is recoverable.

- Each successful move pushes a snapshot of the prior state onto `history`, capped at 2.
- `undo` pops the head, restores it, and preserves the running **best** (best never rolls back).
- A new move after one or two undos pushes fresh history again, so undo capacity refills naturally.
- `restart` empties the history.

## 💫 Animations

CSS-only, visual-only, never blocks logic.

- 🎞️ **Slide** — each tile is absolutely positioned via `transform: translate(...)` with a `transition: transform 120ms ease-out`. Stable `id`-as-React-key is non-negotiable for the transition to fire.
- 🎉 **Spawn pop** — a tile with `isNew` mounts with a `scale(0) → scale(1)` keyframe.
- 💥 **Merge pulse** — a tile produced by a merge runs a `scale(1) → scale(1.12) → scale(1)` keyframe, delayed by 80 ms so it follows (rather than overlaps) the slide.
- 👻 **Dying source tiles** — the two source tiles of a merge are kept for one render at the merge target with `isDying: true`, then removed by a `commitAnimation` action dispatched after `ANIMATION_MS + 40 ms`.
- ⚡ The next move can be dispatched **while an animation is in flight** — `applyMove` runs against the canonical post-merge state, never the visual one.

## 💾 Persistence

| Key                  | Purpose                  |
| -------------------- | ------------------------ |
| `2048.highScore`     | Best score across games  |

Clear your site data to reset it. Nothing else is persisted — board, score, moves and undo history are session-local.

## 🧪 Scripts

| Script                | Purpose                              |
| --------------------- | ------------------------------------ |
| `npm run dev`         | Start the local dev server (Vite)    |
| `npm run build`       | Type-check and produce a prod bundle |
| `npm run preview`     | Preview the production build         |
| `npm run typecheck`   | Run `tsc --noEmit`                   |
| `npm run lint`        | Run ESLint across the project        |

## 🏗️ Architecture

Logic lives outside presentation. Game rules never leak into JSX.

```
src/
  logic/         pure game rules — no React imports
    types.ts       shared types (Tile, GameState, GameAction, HistorySnapshot, ...)
    constants.ts   grid size, target value (2048), spawn weights, tile colours, ANIMATION_MS
    grid.ts        tilesToBoard, transpose, reverseRows, emptyCells
    merge.ts       slideAndMergeLine — the 1-D leading-edge merge core
    move.ts        applyMove(state, direction) — derives all four directions from the LEFT primitive
    spawn.ts       spawnTile(state, rng) — RNG-injected, 90/10 weighting on 2 vs 4
    win.ts         hasWon (sticky), hasLost (full board with no adjacent equal pair)
    game.ts        advanceGame(state, action, rng) reducer + createInitialState
  hooks/
    useKeyboardMove.ts    arrows + WASD + Space/P + C + R, single keydown listener
    useSwipeInput.ts      native non-passive touch listeners on the board element
    useHighScore.ts       localStorage-backed best score (write-only-on-new-best)
    useElapsedSeconds.ts  mm:ss timer that ticks while running, accumulates across pause
  components/
    GameBoard.tsx      4×4 background grid + absolutely-positioned tile layer
    Tile.tsx           single tile, keyed by tile.id, palette colour, scale-down for 3/4-digit values
    ScoreBoard.tsx     score, best, moves, mm:ss timer, status badge
    GameControls.tsx   New game, Undo, Pause/Resume, Continue
    Overlay.tsx        paused / won / gameOver dialogs
  styles/
  App.tsx              useReducer over advanceGame + UI wiring
  main.tsx             React entry
```

## 📏 Design rules

- 🧪 **Pure logic, dumb UI** — nothing in `src/logic/*` imports from `react` or from `src/{hooks,components}/*`.
- 🎲 **RNG is injected** into `spawnTile` and `createInitialState` so they are deterministic in tests.
- 🪞 **Single source of truth** — the `tiles` array is canonical; the 4×4 matrix is derived only when needed.
- 🪛 **Single reducer** — every state transition goes through `advanceGame`. Hooks dispatch actions; they never mutate `tiles` directly.
- 🚫 **No new dependencies** without justification. Defaults are React + Vite + TS only.
- 🎨 **CSS-only animations** — no animation library, no imperative DOM mutations.
- 🧱 **No auto-tick** — every state change is user-driven. There is no `useGameLoop`.

## ⚖️ License

Released under the [MIT License](./LICENSE). © 2026 Zoltan Dul.

---

<p align="center">Made with ❤️ by Zoltan Dul</p>
