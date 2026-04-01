# PokeMMO Companion

A lightweight desktop overlay app for PokeMMO that guides you through the Unova region walkthrough step-by-step. Inspired by RestedXP (WoW leveling addon). Built with Tauri 2.x.

## Features

**Walkthrough Guide**
- Always-on-top transparent overlay that sits on your game window
- Compact mode (current step only) and Full mode (scrollable guide)
- Color-coded step text: items (gold), battles (red), Pokemon (green), NPCs (pink), directions (cyan uppercase), tips (purple), hidden items (orange)
- Auto-highlighting of compass directions (NORTH, SW, etc.)
- Step completion with green flash animation
- Skip Section / Undo Section for fast navigation

**Catch Banner**
- Shows available Pokemon at each location with sprites, types, encounter rates
- Tiered layout: full cards for 1-3 Pokemon, compact ice tray grid for 4+
- Top 25 recommended Pokemon highlighted with golden star badge
- Pokeball caught toggle with golden glow effect
- Rarity % colored green (common) to red (rare)
- Type badges (mini 3-letter on sprites, full on cards)

**Battle Cards**
- Trainer battles shown with opponent team sprites, levels, types
- Weakness hints for each opponent Pokemon
- Starter-dependent teams auto-filtered to your chosen starter
- 33 trainers across 27 locations from the Unova walkthrough

**Hidden Item Screenshots**
- 102 Gyazo screenshots showing hidden item locations
- Hover for tooltip preview, click for zoomable full-size popout
- Click-to-zoom with drag-to-pan support

**Type Chart**
- Quick lookup: select 1-2 types to see defensive/offensive matchups
- Shows weaknesses, resistances, immunities with multipliers
- Click any result type to pivot the lookup

**Navigation Panel**
- Overview of all 86 locations with completion status
- Click to jump to any location (auto-completes/undoes sections)
- Shows catch count per location

**Settings**
- 16 regional themes: Kanto (Red/Blue/Yellow), Johto (Gold/Silver/Crystal), Hoenn (Ruby/Sapphire/Emerald), Sinnoh (Diamond/Pearl/Platinum), Unova (Black/White) + Classic and OLED Black
- Window opacity slider (true transparency — see your game through the overlay)
- Font size (Small/Default/Large)
- Starter picker
- Auto-advance step/location toggles
- Banner auto-collapse options
- Progress stats with visual progress bar
- Lock/unlock window position and resize

**Global Hotkeys**
- `Ctrl+Shift+G` — Toggle window visibility
- `Ctrl+Shift+D` — Complete current step
- `Ctrl+Shift+E` — Toggle compact/full mode

## Install

### macOS
Download the `.dmg` from the latest release, or build from source:
```bash
npm install
npx tauri build --bundles app,dmg
```

### Windows
```bash
npm install
npx tauri build --bundles msi,nsis
```
Requires Rust, Node.js 18+, and Visual Studio Build Tools with "Desktop development with C++" workload.

## Development

```bash
npm install
npx tauri dev
```

## Testing

```bash
npm test              # Frontend (Vitest, 131 tests)
cd src-tauri && cargo test  # Rust (6 profile tests)
```

## Tech Stack

- **Frontend:** Vanilla HTML/CSS/JS (no framework, no bundler)
- **Backend:** Tauri 2.x (Rust) — window management, global hotkeys, profile I/O
- **Tests:** Vitest (JS), cargo test (Rust)
- **Sprites:** PokeAPI CDN
- **Data:** 86 locations, 422 steps, 146 catch entries, 33 trainer battles, 102 hidden item screenshots

## License

MIT
