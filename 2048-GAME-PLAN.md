# 🔢 2048 — PLAN.md

Development plan for a minimal, type-safe 2048 built in the same spirit as
[ZoliQua/Snake-Game](https://github.com/ZoliQua/Snake-Game) and
[ZoliQua/Tetris-Game](https://github.com/ZoliQua/Tetris-Game): **React 18 + Vite + TypeScript**,
keyboard-first, grid-based DOM (no canvas), pure game logic separated from presentation,
strict types with no `any` escape hatches in game code.

> **Repository**: <https://github.com/ZoliQua/2048-Game>
> **Mirror architecture**: Snake-Game / Tetris-Game. Same folder layout, same hook patterns, same CSS-modules-or-plain-CSS approach, same "logic outside JSX" rule.

---

## 📑 Table of contents

* [Goals](#-goals)
* [Non-goals (v1)](#-non-goals-v1)
* [Tech stack](#-tech-stack)
* [Game specification](#-game-specification)
* [Type model](#-type-model)
* [Architecture](#-architecture)
* [State machine](#-state-machine)
* [Scoring](#-scoring)
* [Tile colours](#-tile-colours)
* [Controls](#-controls)
* [Phased roadmap](#-phased-roadmap)
* [2048-specific bug checklist](#-2048-specific-bug-checklist)
* [Working rules](#-working-rules)
* [Open questions](#-open-questions)

---

## 🎯 Goals

* A correct, minimal, type-safe 2048 that is easy to review, debug, and extend.
* Follow Snake-Game / Tetris-Game conventions exactly: `logic/` + `hooks/` + `components/`, a single pure entry point for state transitions, keyboard-first input, `localStorage`-backed best score, real-time elapsed timer.
* Standard 2048 mechanics: 4×4 board, 90 / 10 spawn ratio (2 vs 4), merge-once-per-move, score on merge, sticky win at 2048 with optional continue.
* Desktop browser only in v1. Mobile / touch is explicitly out of scope.

**Priority order**: correctness → truthfulness → verification → small diffs → maintainability → polish.

---

## 🚫 Non-goals (v1)

* No undo / redo. Each move is final.
* No swipe / touch controls. Keyboard only.
* No tile-slide physics or spring animations. CSS transitions on `transform` are allowed; no animation library.
* No configurable board size in v1. Always 4×4.
* No multiplayer, no networking, no accounts.
* No sound, no skins, no themes.
* No canvas, no WebGL, no game engine.
* No leaderboard beyond the local-best stored in `localStorage`.

---

## 🧰 Tech stack

| Area        | Choice                       | Reason                          |
| ----------- | ---------------------------- | ------------------------------- |
| Framework   | React 18                     | Same as Snake-Game / Tetris-Game |
| Bundler     | Vite 5                       | Same as the rest of the family  |
| Language    | TypeScript (strict)          | No `any` in game logic          |
| Styling     | Plain CSS or CSS Modules     | No runtime CSS-in-JS            |
| State       | Local React state + hooks    | No Zustand, no Redux            |
| Persistence | `localStorage`               | Best score only                 |
| Renderer    | DOM grid (CSS grid)          | Matches the family, no canvas   |
| Package mgr | npm                          | `package-lock.json` committed   |
| Node        | ≥ 20                         | Same as the family              |

**Scripts** (to mirror Snake-Game / Tetris-Game):
`npm run dev`, `npm run build`, `npm run preview`, `npm run typecheck`, `npm run lint`.

---

## 🎮 Game specification

* **Board**: 4 × 4 grid. Empty cells hold no tile.
* **Initial state**: 2 tiles spawned on random empty cells.
* **Spawn rule**: after every move that *actually changes the board*, exactly one new tile appears on a random empty cell. Value is 2 with 90% probability and 4 with 10% probability.
* **Move**: a single direction key (UP / DOWN / LEFT / RIGHT) slides every tile as far as possible in that direction.
* **Merge rule**: two adjacent tiles of equal value collapse into one tile whose value is the sum (i.e. double). Each tile may take part in **at most one merge per move**. The merged tile cannot merge again in the same move, even if a same-value neighbour appears after the slide.
* **Merge order**: when sliding, merges resolve from the *leading edge* of the move direction inward. E.g. row `[2, 2, 2, 2]` moving LEFT becomes `[4, 4, 0, 0]`, **not** `[8, 0, 0, 0]`.
* **No-op move**: if a direction key produces no change (no slide, no merge), it is ignored — no spawn, no score change, no `moveCount` increment.
* **Win condition**: a tile of value 2048 appears on the board. The win flag becomes sticky.
* **Continue**: after winning, the user may continue playing for higher tiles (4096, 8192, …). Continue does **not** reset the win flag, the score, or anything else — it only changes status from `won` back to `running`.
* **Lose condition**: no legal moves remain. Formally: every cell is occupied AND no two orthogonally adjacent cells share a value.

---

## 🧱 Type model

```ts
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameStatus = 'idle' | 'running' | 'paused' | 'won' | 'gameOver';

type Tile = {
  id: number;            // stable identity across moves; used as React key and for animations
  value: number;         // power of 2: 2, 4, 8, …
  row: number;           // 0..3, 0 at top
  col: number;           // 0..3, 0 at left
  mergedFrom?: [number, number]; // ids of the two source tiles, set on the merge-producing move
  isNew?: boolean;       // true on the move it was spawned, false thereafter
};

type GameState = {
  tiles: Tile[];                 // canonical source of truth; the board is derived from this
  size: 4;                       // hard-coded for v1
  status: GameStatus;
  score: number;
  best: number;                  // mirror of localStorage; recomputed on load
  hasWon: boolean;               // sticky once a 2048 tile has appeared
  continueAfterWin: boolean;     // true once the user picks "continue"
  moveCount: number;
  nextTileId: number;            // monotonic counter for assigning fresh ids
};
```

The `tiles` array — not a 4×4 matrix — is the canonical state. A `Board = Cell[][]` view is *derived* in pure helpers when needed for collision / merge math. Tile identity must survive across moves so that React reconciles them in place and any future slide animation has a stable target.

---

## 🏗️ Architecture

Logic lives outside presentation. Do not bury game rules inside JSX.

```
src/
  logic/
    types.ts          # shared types
    constants.ts      # grid size, target value (2048), spawn weights, tile colours
    grid.ts           # tiles ↔ board view, transpose, reverse, line extraction
    merge.ts          # slideAndMerge(line): pure 1-D operation
    move.ts           # applyMove(state, direction): pure 2-D operation built on merge.ts
    spawn.ts          # spawnTile(state, rng): pure, takes RNG so it is testable
    win.ts            # hasWon(state), hasLost(state)
    game.ts           # advanceGame(state, action) + createInitialState(overrides)
  hooks/
    useKeyboardMove.ts        # arrows + WASD; one move per keydown; preventDefault
    useHighScore.ts            # localStorage-backed best score
    useElapsedSeconds.ts       # real-time mm:ss timer; pauses with the game
  components/
    GameBoard.tsx     # 4×4 grid background + absolutely positioned tiles
    Tile.tsx          # single tile: value, colour, transition; keyed by tile.id
    ScoreBoard.tsx    # score + best + moves + status
    GameControls.tsx  # new game / continue (after win) / restart
    Overlay.tsx       # idle / paused / won / gameOver
  styles/
  App.tsx             # state machine + wiring
  main.tsx            # React entry
```

Central pure reducer shape:

```ts
type GameAction =
  | { type: 'move'; direction: Direction }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'continueAfterWin' }
  | { type: 'restart' };

function advanceGame(state: GameState, action: GameAction): GameState;
```

`advanceGame` owns every state transition. Hooks only dispatch actions and read state; they never mutate `tiles` directly.

> **Note on the loop**: 2048 has **no auto-tick**. Unlike Snake's gravity loop or Tetris's gravity table, every state change is user-triggered. There is no `useGameLoop` in this project. The elapsed-seconds timer is a render-only concern and runs independently of game state.

---

## 🔄 State machine

```
idle → running ↔ paused
                  │
                  ├─→ won ──(continueAfterWin)──→ running
                  │                                  │
                  └──────────────────────────────────┴─→ gameOver ──(restart)──→ idle/running
```

Transitions:

* `idle → running`: any move key, or the Start button.
* `running ↔ paused`: `P` or `Space`.
* `running → won`: a merge produces a 2048 tile and `continueAfterWin === false`.
* `won → running`: user presses `C` or clicks Continue. `hasWon` stays `true`.
* `running → gameOver`: `hasLost(state)` becomes true after a move-and-spawn cycle.
* `gameOver → idle/running`: `R` or Restart button. Full state reset.

No moves are accepted in `paused`, `won`, or `gameOver` except the keys that change status (`P`, `C`, `R`).

---

## 🎯 Scoring

* Each merge adds the **merged tile's value** to the score (i.e. double the source tiles).

  * `2 + 2 → 4`: `+4`
  * `4 + 4 → 8`: `+8`
  * `1024 + 1024 → 2048`: `+2048`
* A move with multiple merges adds each merge's score independently.
* No bonus, no combo multiplier, no level multiplier in v1.
* **Score never decreases.** Continue mode after winning keeps the same score channel.
* **Best score** is persisted to `localStorage` under key `2048.highScore`. Only written when strictly higher than the existing best.

---

## 🎨 Tile colours

Standard 2048 palette — pinned in `constants.ts` as a `Record<number, { bg: string; fg: string }>`:

| Value | Background | Foreground |
| ----- | ---------- | ---------- |
|     2 | `#eee4da`  | `#776e65`  |
|     4 | `#ede0c8`  | `#776e65`  |
|     8 | `#f2b179`  | `#f9f6f2`  |
|    16 | `#f59563`  | `#f9f6f2`  |
|    32 | `#f67c5f`  | `#f9f6f2`  |
|    64 | `#f65e3b`  | `#f9f6f2`  |
|   128 | `#edcf72`  | `#f9f6f2`  |
|   256 | `#edcc61`  | `#f9f6f2`  |
|   512 | `#edc850`  | `#f9f6f2`  |
|  1024 | `#edc53f`  | `#f9f6f2`  |
|  2048 | `#edc22e`  | `#f9f6f2`  |
| 4096+ | `#3c3a32`  | `#f9f6f2`  |

Font size scales down for 4-digit values so they fit within the cell.

---

## ⌨️ Controls

| Key                          | Action            |
| ---------------------------- | ----------------- |
| ⬆️ / **W**                   | Move up           |
| ⬇️ / **S**                   | Move down         |
| ⬅️ / **A**                   | Move left         |
| ➡️ / **D**                   | Move right        |
| **Space** / **P**            | Pause / Resume    |
| **C**                        | Continue (after win) |
| **R**                        | Restart           |

All arrow keys must call `event.preventDefault()` so the page never scrolls during play. Single `keydown` listener, attached once per mount and cleaned up on unmount. Keys other than the listed ones are ignored.

---

## 🗺️ Phased roadmap

Each phase ends with a concrete **Done when** criterion. Do not start the next phase until the previous one is verified.

### Phase 0 — Scaffold

Vite + React + TS setup mirroring Snake-Game / Tetris-Game. Copy the ESLint config, `tsconfig*`, script names. Empty `src/logic/`, `src/hooks/`, `src/components/`.
**Done when**: `npm run dev` shows an empty page; `npm run typecheck` and `npm run build` pass.

### Phase 1 — Static board + tile rendering

Render the 4×4 background grid. Render a hard-coded `tiles` array via absolutely positioned `Tile` components keyed by `id`. No movement.
**Done when**: each value from 2 to 4096 renders with the correct colour, and tiles are placed at the correct cell coordinates.

### Phase 2 — `slideAndMerge(line)` — the 1-D core

Pure function on a `number[]` of length 4 (zeros = empty). Slides non-zero values to the leading edge, merges adjacent equals once, returns `{ line, scoreDelta, mergedIndices }`. Direction is always "left" — other directions are derived in Phase 3.
**Done when**: unit table — `[2,2,2,2] → [4,4,0,0] (+8)`, `[2,2,4,0] → [4,4,0,0] (+4)`, `[2,0,2,4] → [4,4,0,0] (+4)`, `[4,4,2,2] → [8,4,0,0] (+12)`, `[2,4,2,4] → [2,4,2,4] (0)` — all pass.

### Phase 3 — `applyMove(state, direction)` via grid transforms

Implement RIGHT as reverse → slideLeft → reverse, UP as transpose → slideLeft → transpose, DOWN as transpose → reverse → slideLeft → reverse → transpose. All of this must operate on the *board view* derived from tiles, then write back to canonical tile coordinates with stable ids on merge survivors.
**Done when**: each direction matches a hand-traced board for at least 5 starting positions, and tile ids are preserved across non-merge slides.

### Phase 4 — Spawn after move

`spawnTile(state, rng)` picks a uniformly random empty cell and assigns 2 (90%) or 4 (10%). RNG is injected so spawn is testable. Spawn fires only when the move actually changed the board.
**Done when**: a no-op move never spawns; over 10 000 spawns the empirical 2/4 ratio is within ±2% of 90/10.

### Phase 5 — Score + best

Apply scoring per merge. Update `best` via `useHighScore` only when strictly higher.
**Done when**: a `[2,2,2,2]` LEFT yields `+8` exactly once; `best` survives a refresh; `best` does not regress.

### Phase 6 — Win detection + continue

`hasWon(state)` returns true iff any tile equals 2048. On the move that crosses the threshold, set `hasWon = true` and (if `continueAfterWin` is false) `status = 'won'`. The `C` key flips `continueAfterWin = true` and returns to `running`.
**Done when**: the first 2048 triggers the won overlay exactly once; pressing `C` returns to play and a second crossing (e.g. another 2048) does not retrigger the overlay.

### Phase 7 — Lose detection

`hasLost(state)` returns true iff every cell is filled AND no two orthogonally adjacent tiles share a value. Check after the spawn step of the move, not before.
**Done when**: a hand-built lose board triggers `gameOver` immediately after the next spawn; a board with one empty cell does not.

### Phase 8 — Pause, restart, elapsed timer

`P` / `Space` toggles pause. `R` performs a full reset (`tiles`, `score`, `status`, `hasWon`, `continueAfterWin`, `moveCount`, `nextTileId`). `useElapsedSeconds` pauses with the game, same shape as Snake-Game.
**Done when**: pause is frame-accurate; restart is clean (no stale closures); the timer pauses and resumes correctly.

### Phase 9 — Tile visuals + score board

Apply the colour table. Auto-shrink font for 4-digit values. ScoreBoard shows score, best, moves, and current status.
**Done when**: visual hierarchy is readable for every value 2…4096, and the score board never overlaps the playfield.

### Phase 10 — Animations *(optional, can ship as v1.1)*

CSS `transform: translate()` + `transition` for slide. Spawn tiles get a `scale(0) → scale(1)` pop. Merged tiles get a brief `scale(1) → scale(1.1) → scale(1)` pulse. No animation library.
**Done when**: animations never desync from logical state; an animation in flight does not block input on the next move.

### Phase 11 — Polish + ship

README mirroring Snake-Game / Tetris-Game structure (badges, TOC, features, controls, scoring, scripts, architecture, license). Deploy to Vercel. Tag `v1.0.0`.
**Done when**: `npm run build` produces a clean prod bundle; the app is live; the release is tagged.

---

## 🧪 2048-specific bug checklist

Confirm each item was checked before closing any non-trivial task, or explicitly state it was not:

* **Merge-once invariant**: a tile produced by a merge in the current move cannot merge again in the same move, even if its new neighbour matches.
* **Merge order at the leading edge**: `[2,2,2,2]` LEFT yields `[4,4,0,0]`, not `[8,0,0,0]`. The corresponding test must exist for every direction.
* **No-op detection**: a move that produces no slide and no merge must not spawn a tile, must not increment `moveCount`, and must not change `score`.
* **Spawn ratio**: weighted RNG produces 2 with probability 0.9 and 4 with probability 0.1. Verified empirically over a large sample, not assumed from the literal.
* **Spawn placement**: the new tile only lands on a cell that was empty *after* the slide+merge step.
* **Tile id stability**: a tile that slides without merging keeps its id. A merge produces a new id; the two source ids are recorded on `mergedFrom` for that move.
* **Direction symmetry**: UP, DOWN, LEFT, RIGHT are all implemented via the same `slideAndMerge` core plus deterministic grid transforms. No copy-pasted per-direction logic.
* **Win flag is sticky**: once `hasWon` is `true`, it stays `true` across all subsequent moves, including a restart-then-win sequence (where it flips back to `false` on restart, not before).
* **Continue does not reset score**: `continueAfterWin = true` only changes status; score, best, tiles, moves all carry over.
* **Lose detection runs after spawn**: a board that becomes full mid-move but where the spawned tile creates a legal merge is **not** game over.
* **Lose detection on full board**: every cell occupied + no adjacent equal pair (horizontally OR vertically) ⇒ `gameOver`.
* **Best score never regresses**: `useHighScore.recordScore(s)` only writes when `s > best`.
* **Restart resets everything**: `tiles`, `score`, `status`, `hasWon`, `continueAfterWin`, `moveCount`, `nextTileId` all reinitialised.
* **Keyboard listener hygiene**: attached once per mount, cleaned up on unmount, no duplicates accumulate across renders.
* **`preventDefault` on arrows**: the page does not scroll while playing.
* **No input in dead states**: in `paused`, `won`, or `gameOver`, only the status-changing keys (`P`, `C`, `R`) do anything.
* **Initial state**: `createInitialState()` always produces exactly 2 tiles on distinct empty cells, with values drawn from the same 90/10 distribution.

---

## 📏 Working rules

* **Verify before and after every non-trivial change.** Read the target file and its neighbours. After the edit, re-check imports, signatures, call sites, and state transitions.
* **No hallucination.** Do not invent files, hooks, or scripts. If something is not verified, say so explicitly.
* **Small, local, reversible changes.** One fix or one feature at a time. No bundling refactor + feature + style.
* **Preserve architecture.** No changes to Vite config, `tsconfig`, folder layout, styling approach, or rendering strategy without a stated reason and approval.
* **Explicitness over cleverness.** Small pure functions, explicit types, direct state transitions.
* **No new dependencies** without justification. Default is React + Vite + TS only.
* **Pure logic is RNG-injected.** `spawnTile` and `createInitialState` accept an RNG so they can be tested deterministically. Do not call `Math.random()` from inside pure logic.
* **End-of-task report**: changed files, verified checks, unverified gaps, real risks only.

**Communication**: respond to the user in **Hungarian** in chat, even though this file and the codebase are in English (same convention as Snake-Game and Tetris-Game).

---

## ❓ Open questions

* **Animations in v1 or v1.1?** The reference 2048 is famous for slide-and-merge motion. Ship a static v1 first and add animations in v1.1, or include CSS-only animations from the start?
* **Touch / swipe**: skip entirely (mirror Snake/Tetris policy), or add minimum-viable swipe in a Phase 10b? It is genre-defining for 2048 in a way it isn't for Snake.
* **`localStorage` key**: align with Snake's `snake.highScore` ⇒ `2048.highScore`, or pick something more explicit like `2048-game.bestScore`?
* **Configurable board size**: hard-pin 4×4 in v1 (current plan), or expose a 3×3 / 5×5 / 6×6 selector behind a Phase 11 polish ticket?
* **Continue mode score channel**: one unified score across pre-win and post-win (current plan), or split into "win score" + "endless score" with a soft separator on the scoreboard?
* **Move counter visibility**: show on the main scoreboard, or only in the game-over overlay?
* **Starting tile values**: always start with two 2s, or apply the 90/10 distribution to the initial pair as well? The reference implementation uses 90/10 from the very first tile.

---

**Guiding principle**: correctness over speed, verification over confidence, truth over fluency, small safe diffs over large rewrites. When in doubt — inspect more, assume less, change less, state uncertainty clearly.
