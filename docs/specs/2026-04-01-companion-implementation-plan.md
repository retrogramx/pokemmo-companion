# PokeMMO Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Tauri desktop overlay app that guides PokeMMO players through the Unova walkthrough step-by-step.

**Architecture:** Tauri 2.x wraps a vanilla HTML/CSS/JS frontend. The Rust backend handles window management (frameless, always-on-top), global hotkeys, and profile file I/O. The frontend renders a RestedXP-style step list with compact and full modes. Game data lives in a single `unova.json` file.

**Tech Stack:** Tauri 2.x, Rust, vanilla HTML/CSS/JS, Vitest (JS tests), Google Fonts (Press Start 2P, DM Sans)

**Source project:** `/Users/adrian/Documents/workspace/github.com/retrogramx/pokemmo-unova-checklist/index.html`
**Target project:** `/Users/adrian/Documents/workspace/github.com/retrogramx/pokemmo-companion`

---

## File Map

| File | Responsibility |
|---|---|
| `src-tauri/src/main.rs` | Tauri app entry, window config, global hotkeys, profile I/O commands |
| `src-tauri/src/profiles.rs` | Profile CRUD functions (save, load, list, delete) |
| `src-tauri/Cargo.toml` | Rust dependencies |
| `src-tauri/tauri.conf.json` | Tauri app config |
| `src-tauri/build.rs` | Tauri build script |
| `src/index.html` | App shell with compact and full mode markup |
| `src/styles/app.css` | Layout for both modes, header, steps, footer, profile dropdown |
| `src/styles/theme.css` | Colors, fonts, highlight classes, transparency |
| `src/js/app.js` | Init, view switching, hotkey listeners, window drag |
| `src/js/steps.js` | Step rendering, highlighting from tags, completion, auto-advance |
| `src/js/profiles.js` | Profile UI: dropdown, create, switch, delete |
| `src/data/unova.json` | All walkthrough, catch, and map data for Unova |
| `tests/js/steps.test.js` | Tests for step completion, highlighting, auto-advance |
| `scripts/convert-data.js` | One-time script to convert existing HTML data to unova.json |
| `package.json` | npm scripts, vitest dev dependency |
| `vitest.config.js` | Vitest configuration |

---

## Prerequisites

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
cargo install tauri-cli@^2.0
```

---

## Tasks

### Task 1: Scaffold Tauri Project

Set up the empty Tauri app that builds and launches as a frameless always-on-top window.

**Files:** `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `src-tauri/build.rs`, `src-tauri/src/main.rs`, `src/index.html`

### Task 2: Convert Existing Data to unova.json

Extract walkthrough, catch, and map data from the existing HTML file using regex-based parsing (no code string interpretation). Convert HTML span tags to plain text + structured tags.

**Files:** `scripts/convert-data.js`, `src/data/unova.json`

### Task 3: Rust Profile System

Build profile CRUD (save, load, list, delete) with unit tests. Wire up as Tauri commands.

**Files:** `src-tauri/src/profiles.rs`, `src-tauri/src/main.rs`

### Task 4: Global Hotkeys

Register Ctrl+Shift+G/D/E at the OS level via tauri-plugin-global-shortcut. Emit events to frontend.

**Files:** `src-tauri/src/main.rs`

### Task 5: Theme CSS

Purple aesthetic, Press Start 2P + DM Sans fonts, highlight classes for items/NPCs/Pokemon/battles/directions.

**Files:** `src/styles/theme.css`

### Task 6: App Layout CSS

Compact/full mode layouts, header, step styles, footer, profile dropdown, new profile modal, minimize pill.

**Files:** `src/styles/app.css`

### Task 7: HTML App Shell

Full markup with both views, profile modal, script tags.

**Files:** `src/index.html`

### Task 8: Step Rendering + Tests

highlightText, getNextStep, buildStepState pure functions with Vitest tests. DOM rendering for compact and full modes.

**Files:** `src/js/steps.js`, `tests/js/steps.test.js`, `vitest.config.js`

### Task 9: Profile UI Logic

Profile dropdown, create/switch/delete, Tauri command wrappers with localStorage fallback for dev.

**Files:** `src/js/profiles.js`

### Task 10: App Controller

View switching, hide/show/pill, Tauri hotkey event listeners, init sequence.

**Files:** `src/js/app.js`

### Task 11: Integration Test + Polish

End-to-end verification of compact mode, full mode, hotkeys, profiles. Fix bugs.

### Task 12: README + gitignore

**Files:** `README.md`, `.gitignore`

---

Detailed step-by-step code for each task is available in the companion design spec and mockups. Each task follows TDD where applicable (write test, verify fail, implement, verify pass, commit).
