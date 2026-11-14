# 2048 Game — CLAUDE.md

## Project Facts

* **Repository**: <https://github.com/ZoliQua/2048-Game>
* **Sister projects**:
  + <https://github.com/ZoliQua/Snake-Game> — same architectural family.
  + <https://github.com/ZoliQua/Tetris-Game> — same architectural family.
  Mirror their hook patterns and conventions unless a 2048-specific reason dictates otherwise.
* **Arcade**: part of Zoltan's Arcade (<https://github.com/ZoliQua/Arcade-Game-Center>), game id `2048`, colour token `--game-2048`.
* **Plan**: `2048-GAME-PLAN.md` is the historical v0 design/roadmap; this file and the code are authoritative.
* **Stack**: React 18.3, Vite 5.4, TypeScript 5.6, CSS Modules, ESLint 9 flat config, Vitest 2.1 + jsdom + Testing Library.
* **Package manager**: npm.
* **Node**: >=20.
* **Scripts**:
  + `npm run dev` — local dev server
  + `npm run build` — production build
  + `npm run preview` — preview production build
  + `npm run typecheck` — `tsc -b`
  + `npm run lint` — ESLint
  + `npm test` — Vitest (logic + component tests, jsdom)
  + `npm run check` — lint → typecheck → test → build (same as CI)
* **Board**: fixed 4 × 4. No configurable size in v1.
* **Spawn**: one new tile after every successful move, value 2 with probability 0.9 and 4 with probability 0.1. Initial state seeds 2 tiles drawn from the same distribution.
* **Win**: a tile of value 2048 appears. `hasWon` is sticky. The user may continue past the win for higher tiles.
* **Lose**: every cell occupied AND no two orthogonally adjacent tiles share a value. Checked **after** the spawn step.
* **Scoring**: each merge adds the merged tile's value (e.g. `2 + 2 → 4` adds `+4`). No combo, no level multiplier.
* **Stats / best**: recorded once per finished run by the kit (`useArcadeRun`) in `arcade.stats.2048`; the legacy `2048.highScore` key is migrated by the kit. Outcome `win` if max tile ≥ 2048, else `over`.
* **Autosave**: `arcade.session.2048` (schema 1) once a move has been made; validated by `logic/persist.ts` (`is2048State`, incl. undo history); restored paused with "Welcome back".
* **Status mapping**: no `idle` — a fresh board is `running`, the run clock starts with the first move. `paused` and `won` (win/continue choice) report `paused` to the arcade; `gameOver` when no move remains.
* **Controls**: arrow keys + WASD + swipe, `Space`/`Enter` primary (pause / keep going / new game), `P`/`Esc` pause, `C` keep going after win, `U` undo, `R` new game. `T` is reserved for the theme toggle.
* **Undo**: last 2 moves; allowed while `running` or `won`, never while paused or after `gameOver`.
* **Animations**: in scope for v1. CSS-only (`transform` + `transition`). No animation library.
* **Rendering**: grid-based DOM. Tiles are absolutely positioned with `transform: translate(...)` over a CSS-grid background. No canvas.
* **Game loop**: there is **no auto-tick**. Every state change is user-driven. There is **no `useGameLoop`** in this project.
* **Target platform**: desktop browser primary; touch support for phones/tablets via the kit's `useSwipe` (board has `.arc-board-touch`), plus Rules, Finish early and Full screen.
* **Communication**: respond to the user in **Hungarian** in chat, even though this file and the codebase are in English.

If any fact above disagrees with the real repository, verify first and flag the divergence to the user before editing code.

---

## Primary Goal

A correct, minimal, type-safe 2048 that is easy to review, debug, and extend. Treat this as a maintainable project, not a one-shot script. Mirror `Snake-Game` and `Tetris-Game` wherever possible — the three repos should feel like siblings.

**Priority order**: correctness → truthfulness → verification → small diffs → maintainability → polish.

---

## Architecture

Logic lives outside presentation. Do not bury game rules inside JSX. Animation lives in the components and CSS, not in the pure logic.

```
src/
  arcade/            # VENDORED shared kit from Arcade-Game-Center/packages/kit — never edit here
  logic/
    constants.ts     # grid size (4), target value (2048), spawn weights, tile colours, animation duration
    types.ts         # shared types
    grid.ts          # tiles ↔ board view, transpose, reverse, line extraction
    merge.ts         # slideAndMerge(line) — pure 1-D operation
    move.ts          # applyMove(state, direction) — pure 2-D operation built on merge.ts
    spawn.ts         # spawnTile(state, rng) — pure; takes RNG so it is testable
    win.ts           # hasWon(state), hasLost(state), maxTile(state)
    game.ts          # advanceGame(state, action, rng) reducer; createInitialState(rng, opts); canUndo; reachedTarget
    autopilot.ts     # chooseMove — expectimax-lite demo driver on the real applyMove
    persist.ts       # is2048State — strict saved-session validator
  hooks/
    useKeyboardMove.ts       # arrows + WASD + Space/Enter/P/Esc/C/U/R; single listener; shouldIgnoreKey
  components/
    GameBoard.tsx     # 4×4 grid + absolutely positioned Tile children (full + mini variant)
    Tile.tsx          # single tile, keyed by tile.id; transform-based positioning + transition
    GameBoard.module.css
  demo/Game2048Demo.tsx  # landing-page attract mode (no keys, stats or saves)
  Game2048.tsx        # embeddable game (ArcadeGameProps), state machine + wiring
  App.tsx             # standalone page: <ArcadeShell gameId="2048"><Game2048/></ArcadeShell>
  main.tsx            # entry, imports arcade/arcade.css once
  index.ts            # package entry for Arcade-Game-Center
```

Stats, best score, session autosave, theme, score panel and overlays come from `src/arcade/`
(`useArcadeRun`, `useSessionAutosave`, `useRestoredSession`, `useRunTimer`, `StatPanel`, `GameOverlay`, …).
Change the kit only in Arcade-Game-Center and sync it. The same `src/` is mirrored into
`Arcade-Game-Center/apps/2048/` — keep them identical.

Use this layout only after confirming what is already on disk. If the repo diverges, follow the existing convention and flag the divergence — do not silently restructure.

A central pure reducer — `advanceGame(state, action): GameState` — owns every state transition. Hooks dispatch actions and read state; they never mutate `tiles` directly.

---

## Type Model

```ts
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type GameStatus = 'running' | 'paused' | 'won' | 'gameOver';

type Tile = {
  id: number;             // stable identity across moves; React key; survives slides, replaced on merges
  value: number;          // power of 2: 2, 4, 8, ...
  row: number;            // 0..3, 0 at top
  col: number;            // 0..3, 0 at left
  mergedFrom?: [number, number];  // ids of source tiles; set ONLY on the move that produced this tile
  isNew?: boolean;        // true on the move it was spawned, false thereafter
  isDying?: boolean;      // true for source tiles kept one frame for the slide-into-merge animation
};

type GameState = {
  tiles: Tile[];                 // canonical state; the board is derived from this when needed
  size: 4;                       // hard-coded in v1
  status: GameStatus;
  score: number;
  hasWon: boolean;               // sticky once a 2048 tile has appeared
  continueAfterWin: boolean;     // true once the user picks "continue"
  moveCount: number;
  nextTileId: number;            // monotonic counter for fresh ids
  history: HistorySnapshot[];    // pre-move snapshots for undo, newest first, max 2
};

type GameAction =
  | { type: 'move'; direction: Direction }
  | { type: 'commitAnimation' }    // optional cleanup: drops tiles with isDying === true
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'continueAfterWin' }
  | { type: 'restart' }
  | { type: 'undo' };
```

Deviate only if the repo already uses a cleaner model. The `tiles` array — not a 4×4 matrix — is the canonical state. A `Board = (Tile | null)[][]` view is *derived* in pure helpers when needed for collision / merge math.

---

## Functional Requirements

State machine: `running ↔ paused`, `running → won → (continue) → running`, `running → gameOver → (restart) → running`.

Required behavior: fixed 4×4 grid, canonical `tiles[]` state, weighted random spawn (90% → 2, 10% → 4) on every successful move, four-direction slide-and-merge with merge-once invariant per tile per move, score update on merge, sticky win at 2048 with optional continue, lose detection on full board with no adjacent equals, full restart resets every field of `GameState`, keyboard input (arrows + WASD), touch input (swipe with directional threshold), CSS-only slide and pop animations.

Shipped beyond v1: undo (last 2 moves), autosave & resume, arcade stats, demo autopilot. Out of scope unless asked: redo, configurable board size, alternative win targets, multiplayer, sound, skins, themes, custom themes beyond the arcade light/dark theme.

---

## Input

Two input sources, one dispatch pipeline.

* **Keyboard** (`useKeyboardMove`): single `keydown` listener attached once per mount, removed on unmount; handlers are read from a ref; every event first goes through the kit's `shouldIgnoreKey` (form fields, Cmd/Ctrl/Alt). Arrows and `WASD` dispatch `{ type: 'move', direction }`. `P`/`Esc` toggle pause, `Space`/`Enter` are the primary action. `C` triggers `continueAfterWin`, `U` undo, `R` restart. Arrow keys must call `event.preventDefault()` so the page never scrolls during play. Keys other than the listed ones are ignored.

* **Touch** (kit `useSwipe`): Pointer Events on the board ref; dominant axis, 24 px threshold; the board carries `.arc-board-touch` (`touch-action: none`, `overscroll-behavior: contain`) so the page neither scrolls nor pull-to-refreshes. Swipes dispatch the same `{ type: 'move', direction }` action as the keyboard. Rules (`src/rules.tsx`, no R hotkey: R is New game), Finish early (`finish` action → `gameOver` + `finishedEarly`, outcome `finished`) and Full screen (`useImmersive`) sit in the Game panel.

No moves are accepted in `paused`, `won`, or `gameOver` — only the status-changing keys (and undo on the win overlay). Touch input is suppressed in those states for symmetry.

---

## Animations

CSS-only, visual-only, never blocks logic. The animation layer must not be able to corrupt or delay game state.

* **Tile slide**: each `Tile` is absolutely positioned via `transform: translate(...)` with a `transition: transform 120ms ease-out` (exact duration pinned in `constants.ts` as `ANIMATION_MS`). When a tile's `row`/`col` change between renders, the transition produces the slide. Stable `id`-as-React-key is non-negotiable for this to work.
* **Spawn pop**: a tile with `isNew === true` mounts with a `spawn` CSS class that animates `transform: scale(0) → scale(1)` over `ANIMATION_MS`.
* **Merge pulse**: a tile with `mergedFrom` set mounts with a `merge` CSS class that animates `scale(1) → scale(1.1) → scale(1)` over `ANIMATION_MS`. Pinned to the `transitionend` of the slide so the pulse follows the slide, not overlaps it.
* **Dying source tiles**: when two tiles merge, both source tiles are kept in `tiles[]` for one render with `isDying: true` and their `row`/`col` set to the merge target's coordinates. They slide into place under the merged tile and then are removed by a `commitAnimation` action dispatched from `useEffect` after `ANIMATION_MS`. The merged tile renders on top with a higher z-index.

Rule: the user can dispatch the next move while an animation is mid-flight. The next move's `applyMove` operates on the post-merge canonical state (with dying tiles already cleaned up by `commitAnimation`); CSS transitions naturally retarget. The animation layer must never gate input.

---

## Working Rules

**Verify before and after every non-trivial change.** Before: read the target file and its neighbours, understand data flow and state shape. After: re-check imports, signatures, call sites, state transitions, and that no stale code remains.

**No hallucination.** Do not invent files, hooks, scripts, dependencies, or prior decisions. If something is not verified, say so — "I have not confirmed X", "I do not see evidence of Y". Never claim a build, lint, or test passed without running it.

**Small, local, reversible changes.** One fix or one feature at a time. Do not bundle refactor + feature + style. If the scope feels large, decompose and ask before proceeding.

**Preserve architecture.** Do not change Vite config, `tsconfig`, folder layout, styling approach, or rendering strategy without a stated reason and user approval.

**Explicitness over cleverness.** Small pure functions, explicit types, direct state transitions. Avoid clever one-liners and hidden side effects.

**No new dependencies** without justification. Default: React + Vite + TS only. No Zustand, no game engines, no lodash, no immer, no react-spring, no framer-motion.

**Pure logic, dumb UI.** `src/logic/*` must not import from `react`, `src/hooks/*`, or `src/components/*`. Components read state and dispatch actions; they never mutate `tiles`. Animations are CSS classes driven by tile flags (`isNew`, `mergedFrom`, `isDying`), never imperative DOM mutations.

**Pure logic is RNG-injected.** `spawnTile` and `createInitialState` accept an RNG so they can be tested deterministically. Do not call `Math.random()` from inside pure logic.

---

## 2048-Specific Bug Checklist

Before concluding any 2048 task, confirm each item was checked — or explicitly state it was not:

* **Merge-once invariant**: a tile produced by a merge in the current move cannot merge again in the same move, even if a same-value neighbour appears after the slide.
* **Merge order at the leading edge**: `[2,2,2,2]` LEFT yields `[4,4,0,0]`, not `[8,0,0,0]`. The corresponding test exists for every direction.
* **No-op detection**: a move that produces no slide and no merge does not spawn a tile, does not increment `moveCount`, does not change `score`, and does not exit `idle`.
* **Spawn ratio**: weighted RNG produces 2 with probability 0.9 and 4 with probability 0.1. Verify empirically over a large sample, not from the literal alone.
* **Spawn placement**: the new tile only lands on a cell that was empty *after* the slide+merge step, never under a surviving or dying tile.
* **Tile id stability**: a tile that slides without merging keeps its id. A merge produces one new id; the two source ids appear on `mergedFrom` of the new tile.
* **Direction symmetry**: UP, DOWN, LEFT, RIGHT all go through the same `slideAndMerge` core via deterministic transpose/reverse transforms. No copy-pasted per-direction logic.
* **Win flag stickiness**: once `hasWon` is `true`, it stays `true` across all subsequent moves. It only resets to `false` on `restart`.
* **Continue does not reset**: `continueAfterWin = true` only changes status from `won` to `running`. Score, best, tiles, moves, hasWon — all carry over.
* **Lose detection runs after spawn**: a board that becomes full mid-move but where the spawned tile creates a legal merge is **not** game over.
* **Lose detection is exhaustive**: every cell occupied AND no orthogonally adjacent pair shares a value (checked in both axes) ⇒ `gameOver`.
* **Best score never regresses**: the kit records each finished run once; Best shown is `max(stats.best, score)`.
* **Restart resets everything**: `tiles`, `score`, `status`, `hasWon`, `continueAfterWin`, `moveCount`, `nextTileId` — `history` — all reinitialised, and the run gets a new `runKey`.
* **Keyboard hygiene**: single listener per mount, cleaned up on unmount, no duplicates accumulate across renders, arrows call `preventDefault`.
* **Touch hygiene**: listeners attached to the board element (not `window`), `touchmove` calls `preventDefault` once a swipe is in progress, swipe under threshold is treated as a tap (no dispatch).
* **Animation never blocks logic**: the next move can be dispatched while animations are mid-flight. `applyMove` runs against the canonical post-merge state, never the visual one.
* **`commitAnimation` cleanup**: dying tiles are removed within `ANIMATION_MS + small margin` of the move that created them. A second move arriving before cleanup must still see them and dispatch its own cleanup correctly.
* **Initial state**: `createInitialState(rng)` produces exactly 2 tiles on distinct empty cells, values drawn from the 90/10 distribution.

---

## Implementation Protocol (short)

For every non-trivial task:

1. **Current state** — only what you verified from the repo.
2. **Goal** — the exact requested change.
3. **Plan** — the smallest safe path and which files you will touch.
4. **Edit** — only the scoped change.
5. **Verify** — run `npm run typecheck` and `npm run build` when available; note any checks you skipped.
6. **Report** — see below.

---

## End-of-Task Report

End every meaningful change with:

* **Changed files** — each file with a one-line reason.
* **Verified** — which checks actually ran (typecheck, build, lint, tests, manual inspection).
* **Not verified** — explicit gaps.
* **Risks / follow-ups** — only real concerns, no filler.

---

**Guiding principle**: correctness over speed, verification over confidence, truth over fluency, small safe diffs over large rewrites. When in doubt — inspect more, assume less, change less, state uncertainty clearly.

---

## Git & Commit Rules

- Commit **only** as `Zoltán Dul <zoltan.dul@gmail.com>` (the global git identity).
- **Never** add `Co-Authored-By: Claude …`, "Generated with Claude Code" or any AI attribution
  to commit messages or pull-request descriptions.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
