# PokeMMO Companion v2 — Design Spec

**Date:** 2026-04-01
**Status:** Approved
**Scope:** v2 — Catch banner, type chart, settings, polish

---

## Overview

v2 transforms the companion from a step-by-step walkthrough overlay into a full gameplay companion. The core addition is the catch banner system — showing what Pokemon are available at each location with encounter rates, type info, and a caught toggle. Supporting features include a type chart quick lookup, settings/customization menu, and comprehensive UI polish.

## Design Principles

These principles were established during brainstorming with interactive mockups and govern all v2 work:

- **Information density over decoration** — every pixel in a 360px overlay must earn its place. Use tiered layouts (full cards for important items, compact rows for the rest, ice tray grids for many items).
- **Glow as meaning** — golden glow = important/recommended, green glow = done/caught. No decorative glows.
- **Stat pills** — structured data (encounter type, level, percentage) gets segmented pill UI with connected borders. Rarity % is always HSL-gradient colored (green at 100% → red at 1%).
- **Type badges everywhere** — mini 3-letter labels (`FIR`, `GND`, `DRK`) on sprite overlays, full labels (`Fire`, `Ground`, `Dark`) on expanded cards. Official Pokemon type color palette.
- **Golden star for Top 25** — SVG star with `drop-shadow`, consistent across all contexts (ice tray corners, card names, expand panels).
- **Pokeball as caught toggle** — ghosted at 30% opacity when uncaught, full opacity + golden radial glow when caught. Row dims to 50% opacity.
- **No emoji** — use SVG icons, PokeAPI sprites, or placeholder boxes. Emoji are inconsistent across platforms.
- **Sprites fill their containers** — `transform: scale(1.2-1.3)` with `image-rendering: pixelated` in dark rounded boxes.
- **Smooth and responsive** — transitions on all state changes (0.15-0.25s), slide-down animations for expanding panels, opacity transitions for caught/uncaught.

---

## 1. Catch Banner System

### Behavior

- Appears at the top of the step list in full mode when entering a location that has wild Pokemon.
- Does NOT show in compact mode — compact stays focused on the current step only.
- Collapsible — tap the banner header to collapse to a summary bar ("X Pokemon"), tap to re-expand.
- Auto-collapse behavior configurable in settings (off / after first step / after 5 seconds).

### Tiered Layout (1-3 Pokemon)

Card layout with two tiers:

**Top 25 Pokemon — full card:**
- 48px sprite in dark rounded box with `scale(1.2)`, mini type label badges (`FIR`, `GND DRK`) in bottom-right corner
- Name + golden star SVG + full type badges (`Fire`, `Ground Dark`) on the same line
- Stat pills: `[Encounter type] [Level range] [%]` — percentage colored by HSL rarity gradient
- Why text in italic muted color
- Pokeball caught toggle on the right

**Regular Pokemon — compact row:**
- 24px sprite with `scale(1.3)`, mini type badges in corner
- Name + stat pills (encounter + %) inline
- Pokeball caught toggle on the right

### Ice Tray Layout (4+ Pokemon)

Compact grid for locations with many encounters:

- Single-row CSS grid, one cell per Pokemon, `aspect-ratio: 1`
- Top 25 sorted first with golden border glow + golden star SVG in top-right corner
- Regular Pokemon have subtle border, no glow
- Mini type label badges in bottom-right of each cell
- "tap to inspect" hint text in the header

**Expand on tap:**
- Tapping a sprite cell expands a detail card below the tray (slide-down animation)
- Detail card matches the full card format: sprite, name, star, type badges, stat pills, why text, Pokeball toggle
- Tapping the same cell again collapses the detail card
- Selected cell scales up slightly with blue outline

### Caught Toggle

- Pokeball sprite from PokeAPI (`/sprites/items/poke-ball.png`)
- **Uncaught:** 30% opacity, no background
- **Caught:** 100% opacity, `radial-gradient` golden glow behind it, `box-shadow` in gold
- Catching a Pokemon: row/card dims to 50% opacity, ice tray cell border shifts from golden to green glow
- Caught state is global (not per-location) — saved to profile as `caughtPokemon` map

### Rarity % Color Scale

HSL hue mapping from green (common) to red (rare):
```
hue = (percent / 100) * 120
color = hsl(hue, 75%, 55%)
```

| Percent | Color |
|---|---|
| 40%+ | Green |
| 25-39% | Yellow-green |
| 15-24% | Yellow-orange |
| 10-14% | Orange |
| 5-9% | Orange-red |
| 1-4% | Red |

### Type Badge Specifications

**Mini badges (sprite overlay):**
- 3-letter abbreviation (NRM, FIR, WTR, GRS, ELC, ICE, FGT, PSN, GND, FLY, PSY, BUG, RCK, GHO, DRK, DRG, STL, FRY)
- 5px font, 700 weight, 9px line-height
- Official type background color, white or dark text depending on contrast
- 2px border-radius, 0.5px dark border
- Positioned absolute bottom-right of sprite container

**Full badges (card/expand):**
- Full type name, 8px font, 600 weight, 14px line-height
- Same color palette, 3px border-radius, 5px horizontal padding

**Official type colors:**
```
Normal: #A8A878    Fire: #F08030     Water: #6890F0
Grass: #78C850     Electric: #F8D030  Ice: #98D8D8
Fighting: #C03028  Poison: #A040A0   Ground: #E0C068
Flying: #A890F0    Psychic: #F85888  Bug: #A8B820
Rock: #B8A038      Ghost: #705898    Dark: #705848
Dragon: #7038F8    Steel: #B8B8D0    Fairy: #EE99AC
```

---

## 2. Type Chart — Quick Lookup

### Access

New footer button alongside existing buttons. Tapping opens the type chart panel.

### UX Flow

1. Type chart panel slides over the step list (same container, different view)
2. 18-type selection grid using the same type badge style (official colors, labeled)
3. Tap one type for single-type lookup, tap a second for dual-type
4. Results appear instantly below the grid:
   - **Weak to (takes 2x/4x)** — red-tinted list
   - **Resistant to (takes 0.5x/0.25x)** — green-tinted list
   - **Immune to (takes 0x)** — blue-tinted list
   - **Super effective against** — for offense planning
5. Dual-type calculates combined multipliers (4x, 2x, 1x, 0.5x, 0.25x, 0x)
6. Tap any result type badge to pivot the lookup to that type
7. Back button or second tap returns to step list

### Data

New shared file `src/data/types.json` containing the full 18x18 effectiveness matrix. Not region-specific.

---

## 3. Settings Menu

### Access

New gear icon button in the header (next to the lock button). Opens settings panel over the step list.

### Sections

**Display**
- Window opacity slider: 80% → 100% (default 92%)
- Font size: Small / Default / Large
- Theme preset: Dark Purple (default), Dark Blue, OLED Black

**Behavior**
- Auto-advance step: on/off (default on) — automatically highlight next step after completing one
- Auto-advance location: on/off (default on) — jump to next location when all steps done, or show "location complete" summary first
- Catch banner auto-collapse: Off / After first step / After 5 seconds (default off)

**Controls**
- Hotkey rebinding for all three hotkeys
- Shows current binding, click to enter "press any key" capture mode
- Defaults: Ctrl+Shift+G (toggle), Ctrl+Shift+D (complete), Ctrl+Shift+E (expand)

**Progress Stats**
- Steps completed: X / 422 with progress bar
- Locations visited: X / 86
- Pokemon caught: X (from `caughtPokemon` data)
- Overall percentage

**Data**
- Region: Unova (read-only for v2, placeholder for v3 multi-region)
- Export profile (download JSON)
- Import profile (upload JSON)
- Reset progress (with confirmation dialog)

### Implementation

- Settings saved to profile JSON under a `settings` key
- All changes apply immediately — no save button
- Settings panel is a view toggle (same pattern as type chart)

---

## 4. UI Polish

### Animations & Transitions

- **Step completion:** brief green flash on the step circle + checkmark fade-in, then transition to done state (0.3s)
- **Step auto-scroll:** `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` to keep current step visible
- **View switching (compact ↔ full):** window height animates smoothly via Tauri `setSize` with intermediate frames, or CSS transition on the content
- **Catch banner expand/collapse:** `max-height` + `opacity` transition with easing (0.2s)
- **Panel transitions (settings, type chart):** slide in from bottom or right with backdrop dim (0.15s)
- **Location change:** crossfade on header location name (0.2s)
- **Ice tray expand:** slide-down with `translateY` animation (0.15s)

### Visual Refinements

- **Loading skeleton:** pulsing placeholder bars while `unova.json` fetches
- **Location complete state:** brief "All done!" with green checkmark before auto-advancing (if auto-advance location is on). Shows reminder of uncaught Pokemon if any.
- **Expand bar redesign:** replace "EXPAND GUIDE" with compact chevron icon + "X/Y steps" count
- **Pill minimize polish:** show current location name + progress in the pill ("ROUTE 1 · 2/6") instead of just "PMC"
- **Footer button states:** active state highlight for current view (steps / type chart / settings)
- **Profile dropdown:** add starter Pokemon sprite next to username
- **Step hover states:** subtle background highlight on hoverable steps

### Code Quality

- Extract shared UI components into reusable render functions:
  - `renderStatPills(encounter, level, percent)` — segmented pill with rarity color
  - `renderTypeBadge(type, size)` — mini or full type badge
  - `renderTypeBadgeMini(type)` — 3-letter overlay badge
  - `renderStarBadge(size)` — golden star SVG
  - `renderPokeballToggle(caught, onClick)` — pokeball with glow state
  - `renderSprite(dex, size)` — sprite in dark container with scaling
- CSS custom properties for all theme values (enables theme preset switching)
- Consolidate inline styles into proper CSS classes
- New JS module: `src/js/ui.js` — shared render functions
- New JS module: `src/js/catches.js` — catch banner rendering + caught state
- New JS module: `src/js/typechart.js` — type chart panel logic
- New JS module: `src/js/settings.js` — settings panel + persistence

---

## 5. Data Changes

### `unova.json` — Catch Entry Schema

Each catch entry gains new fields:

```json
{
  "name": "Sandile",
  "dex": 551,
  "types": ["Ground", "Dark"],
  "method": "Desert",
  "level": "Lv.19-22",
  "percent": 15,
  "rate": "Uncommon",
  "top25": true,
  "why": "Ground/Dark — Moxie ability, amazing sweeper"
}
```

New fields: `dex`, `types`, `method` (cleaned), `level`, `percent` (integer).

### New File: `src/data/types.json`

Full 18x18 type effectiveness matrix:

```json
{
  "types": ["Normal", "Fire", "Water", ...],
  "chart": {
    "Normal": { "Rock": 0.5, "Ghost": 0, "Steel": 0.5 },
    "Fire": { "Fire": 0.5, "Water": 0.5, "Grass": 2, "Ice": 2, ... },
    ...
  }
}
```

Only non-1x multipliers stored. Absence = 1x (neutral).

### Profile Schema Additions

```json
{
  "name": "Retrogram",
  "region": "unova",
  "starter": "Tepig",
  "completedSteps": { "0-0": true, "0-1": true },
  "currentLocation": 0,
  "currentStep": 2,
  "caughtPokemon": { "lillipup": true, "sandile": true },
  "settings": {
    "opacity": 0.92,
    "fontSize": "default",
    "theme": "dark-purple",
    "autoAdvanceStep": true,
    "autoAdvanceLocation": true,
    "bannerAutoCollapse": "off",
    "hotkeys": {
      "toggle": "Ctrl+Shift+G",
      "complete": "Ctrl+Shift+D",
      "expand": "Ctrl+Shift+E"
    }
  },
  "windowPosition": { "x": 100, "y": 50 },
  "windowSize": { "width": 360, "height": 520 },
  "windowMode": "compact"
}
```

New keys: `caughtPokemon`, `settings`. Existing keys unchanged — full backward compatibility.

---

## 6. Scope

### v2 Includes

- Catch banner system (tiered cards + ice tray + caught toggle + collapsible)
- Type chart quick lookup (single + dual type)
- Settings menu (display, behavior, controls, progress stats)
- UI polish (animations, transitions, visual refinements)
- Code quality (shared components, CSS variables, module extraction)
- Data enrichment (percentages, types, dex numbers for all 86 locations)

### Deferred

- Team builder → v3+
- Multi-region support (Kanto, Johto, Hoenn, Sinnoh) → v3
- Interactive catch map → v3+
- Controller/gamepad input mapping → future
- Import from web checklist → future

---

## 7. Reference Mockups

Interactive mockups from the brainstorming session are saved in `.superpowers/brainstorm/` and document the catch banner design iterations, including:
- Tiered card layout (1-3 Pokemon)
- Ice tray grid layout (4+ Pokemon)
- Pokeball caught toggle with golden glow
- Type badge mini/full variants
- Stat pills with rarity color gradient
- Golden star Top 25 badge
