# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [1.1.2] — 2026-12-06

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the eleventh arcade game, Texas Hold'em, with its accent colour.
- README: the Zoltan's Arcade family table lists all eleven games.

## [1.1.1] — 2026-11-22

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the tenth arcade game, Nut Sort, with its accent colour.
- README: the Zoltan's Arcade family table lists all ten games.

## [1.1.0] — 2026-11-13

### Changed

- Vendored kit (`src/arcade/`) updated: the registry knows the three new arcade games — Breakout, Space Invaders and
  Connect Four — with their accent colours; the duel round-score docs mention Connect Four.
- README: the Zoltan's Arcade family table lists all nine games.

## [1.0.0] — 2026-10-24

### Added
- Shared Zoltan's Arcade kit (`src/arcade/`): unified stats, theme, standalone shell and UI.
- Embeddable `Game2048` component with the shared `ArcadeGameProps` contract (`embedded`, `onGameOver`, `onRunEnd`, `onStatusChange`).
- Autosave & resume of the run in progress (`arcade.session.2048`), including the undo history, with a strict validator.
- `Game2048Demo` attract mode driven by an expectimax-lite autopilot on the real move logic.
- Max tile in the stat strip; run outcome `win` when the largest tile is ≥ 2048.
- **U** undoes, **Esc** pauses, **Enter** acts like Space.
- Vitest + Testing Library test suite (merge rules, spawns, win/lose, undo, persistence, autopilot, component flows), `npm run check`, GitHub Actions CI.
- Code of Conduct, Contributing, Contributors and Security docs, issue/PR templates, favicon.

### Changed
- Score panel, overlays, buttons and panels use the shared arcade design system (dark & light theme); all game CSS is scoped in CSS Modules.
- A fresh board is playable immediately (no `idle` state); the run clock starts with the first move. The win choice counts as a pause for the arcade status.
- Undo is unavailable while paused and after the run has ended (the result is already recorded).
- High score now lives in `arcade.stats.2048`; the legacy `2048.highScore` key is migrated by the kit.
- Toolchain aligned with the arcade family: ESLint 9 flat config, Vitest 2.1, jsdom 25; base path is relative (`base: './'`).
- Tile font sizes scale with the board (container units), so the mini demo board and 5-digit tiles fit.

### Removed
- `ScoreBoard`, `Overlay`, `GameControls`, `useHighScore`, `useElapsedSeconds` and the global `styles/index.css` (replaced by the kit).

### Fixed
- `npm run typecheck` checked nothing (`tsc --noEmit` on the empty solution tsconfig); it now runs `tsc -b`.
- Game hotkeys fired with Cmd/Ctrl held (Cmd+R reloaded *and* restarted the board) and while typing in form fields.
- Restarting while the clock was running did not reset the timer (the interval kept its old baseline).
- Choosing *Continue* after a winning move that also locked the board left the game "running" with no possible move; it now ends the run.
- Undo while paused silently unpaused the game.
- Global CSS (`:root`, `html`, `body`, `*`) leaked into any host page.
- Overlay dialogs had no accessible name.

## [0.0.0] — 2026-04-26

- First playable release: 4×4 2048 with slide/merge animations, swipe input, win/continue, undo of the last 2 moves,
  timer and a `localStorage` high score.
