# 2048

A minimal, type-safe 2048 built with **React 18 + Vite + TypeScript**, in the same architectural family as
[Snake-Game](https://github.com/ZoliQua/Snake-Game) and
[Tetris-Game](https://github.com/ZoliQua/Tetris-Game).

> See [`2048-GAME-PLAN.md`](./2048-GAME-PLAN.md) for the full design and phased roadmap.

## Features

- 4×4 grid with the classic merge-once-per-move rule and leading-edge merge order
- Weighted spawn (90% → 2, 10% → 4) on every successful move and on initial seed
- Sticky win at 2048 with optional continue-mode for higher tiles
- Best score persisted in `localStorage` under `2048.highScore` (write-only-on-new-best)
- Real-time mm:ss timer that pauses with the game
- Keyboard input (arrows + WASD) and touch swipe input on the board
- CSS-only slide / spawn-pop / merge-pulse animations — no animation library

## Controls

| Key                          | Action            |
| ---------------------------- | ----------------- |
| ⬆ / **W**                    | Move up           |
| ⬇ / **S**                    | Move down         |
| ⬅ / **A**                    | Move left         |
| ➡ / **D**                    | Move right        |
| **Space** / **P**            | Pause / Resume    |
| **C**                        | Continue (after win) |
| **R**                        | Restart           |

On touch devices, swipe across the board in the direction you want to move.

## Scripts

```bash
npm install
npm run dev        # local dev server
npm run build      # production build
npm run preview    # preview production build
npm run typecheck  # tsc --noEmit
npm run lint       # ESLint
```

## Architecture

```
src/
  logic/         pure game rules — no React imports
    types.ts
    constants.ts
    grid.ts
    merge.ts
    move.ts
    spawn.ts
    win.ts
    game.ts        # advanceGame reducer + createInitialState
  hooks/
    useKeyboardMove.ts
    useSwipeInput.ts
    useHighScore.ts
    useElapsedSeconds.ts
  components/
    GameBoard.tsx
    Tile.tsx
    ScoreBoard.tsx
    GameControls.tsx
    Overlay.tsx
  styles/
  App.tsx
  main.tsx
```

`advanceGame(state, action, rng)` is the single entry point for every state transition. RNG is injected so the logic stays deterministic in tests. The `tiles` array — not a 4×4 matrix — is the canonical state; the matrix view is derived in `tilesToBoard` only when slide/merge math needs it.

## License

MIT
