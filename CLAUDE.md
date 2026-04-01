# PokeMMO Companion - Development Guide

## Project Overview
Tauri 2.x desktop overlay app for PokeMMO walkthrough guidance. Vanilla HTML/CSS/JS frontend, thin Rust backend.

## Quick Start
```bash
npm install
npx tauri dev
```

## Testing
```bash
npm test              # Frontend (Vitest, 134 tests)
cd src-tauri && cargo test  # Rust (6 profile tests)
```

## Architecture
- `src/` — Frontend (vanilla HTML/CSS/JS, no framework)
- `src/data/unova.json` — All walkthrough data (86 locations, 422 steps, enriched catch data with dex/types/percent)
- `src/data/types.json` — 18x18 type effectiveness matrix
- `src/js/ui.js` — Shared render functions (type badges, stat pills, rarity colors, sprite/pokeball builders)
- `src/js/catches.js` — Catch banner logic (sorting, layout choice, caught state toggle)
- `src/js/typechart.js` — Type chart calculations + panel rendering
- `src/js/settings.js` — Settings defaults, themes, merge logic + panel rendering
- `src/js/steps.js` — Step rendering, highlighting, completion, catch banner integration
- `src/js/profiles.js` — Profile CRUD, Tauri command wrappers with localStorage fallback
- `src/js/app.js` — View switching, hotkeys, window management, panel switching
- `src-tauri/src/profiles.rs` — Rust profile file I/O with unit tests
- `src-tauri/src/main.rs` — Tauri commands + global hotkey registration

## Critical Tauri 2.x Notes
- `withGlobalTauri: true` in app config is REQUIRED for `window.__TAURI__` to exist
- Every Tauri window API call needs an explicit permission in `src-tauri/capabilities/default.json`
- `core:window:default` does NOT include close/destroy/start-dragging — add them explicitly
- Retina displays: divide by `scaleFactor()` when saving position/size, use `LogicalSize`/`LogicalPosition` when restoring
- `-webkit-app-region: drag` CSS is faster than JS `startDragging()` for window dragging
- Transparent windows break dragging on macOS — keep `transparent: false`

## Data Format
Steps use plain text + structured tags (not HTML). Highlighting happens at render time:
```json
{ "text": "Go north - get a Potion", "tags": { "items": ["Potion"] } }
```

## Design Spec
Full design and v2 roadmap: `docs/specs/2026-04-01-companion-overlay-design.md`

## v3 Roadmap
- Team builder panel
- Multi-region support (Kanto, Johto, Hoenn, Sinnoh)
- Interactive catch map with encounter type icons
- Controller/gamepad input mapping
- Import progress from web checklist
