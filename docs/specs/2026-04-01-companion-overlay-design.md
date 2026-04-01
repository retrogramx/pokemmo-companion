# PokeMMO Companion — Overlay App Design Spec

**Date:** 2026-04-01
**Status:** Approved
**Scope:** v1 — Unova walkthrough overlay

## Overview

A lightweight desktop overlay app that sits on top of the PokeMMO game window, guiding players through the Unova region walkthrough step-by-step. Inspired by RestedXP (WoW leveling addon). Built with Tauri (Rust backend + vanilla HTML/CSS/JS frontend).

## Goals

- Provide a compact, always-visible walkthrough guide while playing PokeMMO
- Support multiple player profiles (accounts)
- Work on both macOS and Windows
- Stay lightweight — minimal RAM/CPU impact alongside the game
- Architecture supports adding more regions (Kanto, Johto, Hoenn, Sinnoh) in v2

## Non-Goals (v1)

- Interactive Unova catch map
- Team builder
- Type effectiveness chart
- Settings/customization menu
- Multi-region support (v2)
- Import from existing web checklist

---

## Architecture

### Tech Stack

- **Backend:** Tauri 2.x (Rust) — window management, global hotkeys, file I/O
- **Frontend:** Vanilla HTML/CSS/JS — step rendering, view switching, profile UI
- **Data:** JSON files — one per region, loaded by frontend
- **Profiles:** JSON files on disk — one per user profile
- **Tests:** `cargo test` (Rust), Vitest (frontend JS)

### Project Structure

```
pokemmo-companion/
├── src-tauri/
│   ├── src/
│   │   └── main.rs         # Window mgmt, hotkeys, profile I/O commands
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/
│   ├── index.html           # App shell
│   ├── styles/
│   │   ├── app.css          # Layout, compact/full modes
│   │   └── theme.css        # Purple aesthetic, fonts, type colors
│   ├── js/
│   │   ├── app.js           # Main logic, view switching, hotkey listeners
│   │   ├── steps.js         # Step rendering, completion, highlighting
│   │   └── profiles.js      # Profile CRUD, switching, save/load
│   └── data/
│       └── unova.json       # Walkthrough + catches + maps for Unova
├── tests/
│   ├── rust/                # Rust unit + integration tests
│   └── js/                  # Frontend JS tests
├── package.json
└── README.md
```

---

## Rust Backend

The Rust layer is thin (~150 lines). It handles three things the browser cannot:

### 1. Window Management

- Frameless, always-on-top window (custom drag handle drawn in HTML)
- Default size: 360x200px (compact), expands to 360x520px (full)
- Window position remembered in profile and restored on launch
- Semi-transparent (~92% opacity) so the game bleeds through
- Minimizes to a small floating pill (app icon) when hidden — clickable to restore

### 2. Global Hotkeys

Registered at the OS level, work even when PokeMMO has focus:

| Hotkey | Action |
|---|---|
| `Ctrl+Shift+G` | Toggle window visibility (show/hide) |
| `Ctrl+Shift+D` | Complete current step |
| `Ctrl+Shift+E` | Toggle compact/full mode |

Each hotkey fires a Tauri event to the frontend (e.g., `"hotkey-toggle"`, `"hotkey-complete"`, `"hotkey-expand"`).

### 3. Profile File I/O

Profiles stored as JSON files in the OS app data directory:
- macOS: `~/Library/Application Support/pokemmo-companion/profiles/`
- Windows: `%APPDATA%/pokemmo-companion/profiles/`

Tauri commands exposed to frontend:

| Command | Description |
|---|---|
| `profiles_list()` | Returns array of profile names |
| `load_profile(name)` | Returns profile JSON |
| `save_profile(name, data)` | Writes profile JSON to disk |
| `delete_profile(name)` | Removes profile file |

---

## Frontend

### Views

Two views rendered in one HTML file. Switching is CSS class toggles — no page reloads.

#### Compact Mode (default on launch)

- **Header bar:** location name (pixel font) + step count + expand button (▼) + hide button (✕)
- **Current step:** blue active indicator + full text with color highlighting
- **Next step preview:** faded below current
- **Header is the drag handle** for moving the window
- Clicking the step checkbox or pressing `Ctrl+Shift+D` marks it done and auto-advances
- When a location is fully complete, auto-advances to next location

#### Full Mode (expand via button or `Ctrl+Shift+E`)

- **Header:** same as compact but with collapse button (▲) + hide button (✕)
- **Scrollable step list:** numbered steps (01, 02, 03...)
- **Current step** highlighted with blue left border
- **Completed steps** show green checkmark, reduced opacity
- **Location dividers** when the next section begins
- **Inline catch tips** on relevant steps (e.g., "Lillipup available here — recommended")
- **Footer bar:** Map button, Catches button, Complete button

#### Button Controls

Every hotkey has a clickable equivalent for controller players:

| Action | Hotkey | Compact button | Full button |
|---|---|---|---|
| Complete step | `Ctrl+Shift+D` | ✓ button next to current step | "Complete" in footer |
| Expand/collapse | `Ctrl+Shift+E` | ▼ bar at bottom | ▲ in header |
| Hide window | `Ctrl+Shift+G` | ✕ in header | ✕ in header |

All buttons sized for easy clicking when switching from a controller.

### Step Text Highlighting

Color-coded inline text, rendered from structured tags (not regex):

| Category | Color | Example |
|---|---|---|
| Items | Gold (#ffc048) | Xtransceiver, Potion, TM |
| NPCs | Pink (#f8a5c2) | Bianca, Professor Juniper |
| Pokemon | Green (#7bed9f) | Tepig, Lillipup |
| Battles | Red (#ff4757) | Battle Cheren |
| Directions | Cyan (#18dcff), uppercase | NORTH, SW, NE |
| Tips | Purple (#c07af0), italic | (say yes to her 2nd question) |

### Profile Dropdown

- Small user icon in the header opens the profile list
- Shows all profiles + "New Profile" option
- Switching profiles reloads all step state instantly
- New profile prompts for: name + starter choice (Snivy / Tepig / Oshawott)
- Delete option per profile

### Visual Style

- Dark purple theme matching the existing web checklist aesthetic
- "Press Start 2P" pixel font for headers/location names
- "DM Sans" for body text
- Semi-transparent background (~92% opacity)
- Frameless window with custom header/drag handle

---

## Data Architecture

### Region Data (`src/data/unova.json`)

```json
{
  "region": "Unova",
  "locations": [
    {
      "name": "NUVEMA TOWN",
      "steps": [
        {
          "text": "Pick your starter Pokemon from the box (Tepig / Oshawott / Snivy)",
          "tags": { "pokemon": ["Tepig", "Oshawott", "Snivy"] }
        }
      ],
      "catches": [
        {
          "name": "Lillipup",
          "method": "grass",
          "rate": "Very Common",
          "top25": true,
          "why": "Pickup ability, evolves into strong Normal type"
        }
      ],
      "maps": {
        "overview": "https://...",
        "detail": "https://..."
      }
    }
  ],
  "typeChart": {},
  "pokeTypes": {}
}
```

Key decisions:
- **Step text is plain text** — highlighting derived from the `tags` object at render time, not embedded HTML
- **Tags are structured** — each step declares its items, NPCs, Pokemon, battles, directions explicitly
- **One file per region** — `unova.json` for v1, add `kanto.json` etc. in v2
- **Catches co-located with their location** — no separate lookup table

### Profile Data (on disk per user)

```json
{
  "name": "Retrogram",
  "region": "unova",
  "starter": "Tepig",
  "completedSteps": { "0-0": true, "0-1": true },
  "currentLocation": 0,
  "currentStep": 2,
  "windowPosition": { "x": 100, "y": 50 },
  "windowMode": "compact"
}
```

---

## Testing

### Rust Tests (`cargo test`)

**Unit tests:**
- Profile save/load round-trip
- Profile list returns correct names
- Profile delete removes file
- JSON serialization/deserialization
- Edge cases: missing file returns error, corrupted JSON handled gracefully, empty profile name rejected

**Integration tests:**
- Full lifecycle: create profile → save progress → load → verify state matches
- Multiple profiles don't interfere with each other
- Window position persistence

### Frontend Tests (Vitest)

- Step completion logic: marking done, auto-advance to next step, auto-advance to next location
- Highlighting: tags correctly produce colored spans
- Profile switching: state resets to loaded profile data
- View toggling: compact ↔ full mode class switching
- Edge cases: last step in last location, empty profile, unknown region

---

## v2 Roadmap

- Interactive Unova catch map with encounter type icons
- Team builder panel
- Type effectiveness chart
- Catch recommendations per route
- Window opacity/transparency slider
- Settings/customization menu
- Import progress from existing web checklist
- Multi-region support: Johto, Kanto, Hoenn, Sinnoh
