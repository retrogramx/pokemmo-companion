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
npm test              # Frontend (Vitest, 10 tests)
cd src-tauri && cargo test  # Rust (6 profile tests)
```

## Architecture
- `src/` — Frontend (vanilla HTML/CSS/JS, no framework)
- `src/data/unova.json` — All walkthrough data (86 locations, 422 steps)
- `src/js/steps.js` — Step rendering, highlighting, completion (exports pure functions for testing)
- `src/js/profiles.js` — Profile CRUD, Tauri command wrappers with localStorage fallback
- `src/js/app.js` — View switching, hotkeys, window management
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

## v2 Roadmap
- Interactive catch map with encounter type icons
- Team builder
- Type chart
- Settings/customization menu
- Multi-region support (Kanto, Johto, Hoenn, Sinnoh)
