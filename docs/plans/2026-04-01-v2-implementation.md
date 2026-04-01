# PokeMMO Companion v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add catch banner system, type chart lookup, settings menu, and UI polish to the PokeMMO companion overlay.

**Architecture:** Vanilla JS modules loaded via script tags (no bundler). Each feature gets its own JS module (catches.js, typechart.js, settings.js) plus a shared ui.js for reusable render functions. Data files are static JSON fetched at startup. All state persists to the profile JSON via the existing Tauri command wrappers. DOM rendering uses safe methods (createElement, textContent) except for the existing highlightText function which uses sanitized internal data.

**Tech Stack:** Vanilla HTML/CSS/JS frontend, Tauri 2.x Rust backend, Vitest for JS tests, PokeAPI sprites via CDN.

**Design spec:** `docs/specs/2026-04-01-v2-companion-design.md`

---

## File Map

### New Files

| File | Responsibility |
|---|---|
| `src/js/ui.js` | Shared render functions: type badges, stat pills, star badge, pokeball toggle, sprite containers |
| `src/js/catches.js` | Catch banner logic: sorting, layout decisions, caught state |
| `src/js/typechart.js` | Type chart: effectiveness calculations, panel rendering |
| `src/js/settings.js` | Settings: defaults, merging, theme presets, panel rendering |
| `src/data/types.json` | 18x18 type effectiveness matrix |
| `tests/js/ui.test.js` | Tests for shared render functions |
| `tests/js/catches.test.js` | Tests for catch banner logic |
| `tests/js/typechart.test.js` | Tests for type effectiveness calculations |
| `tests/js/settings.test.js` | Tests for settings defaults and merging |
| `scripts/enrich-catches.js` | One-time script to add dex/types/percent to unova.json catch entries |

### Modified Files

| File | Changes |
|---|---|
| `src/data/unova.json` | Catch entries gain `dex`, `types`, `method` (cleaned), `level`, `percent` fields |
| `src/index.html` | New script tags, settings/type-chart panel markup, gear button, footer buttons |
| `src/js/steps.js` | Catch banner rendering in step list, location-change hooks, completion animation |
| `src/js/profiles.js` | Handle `caughtPokemon` and `settings` in profile schema, backward compat |
| `src/js/app.js` | View switching for settings/type-chart panels, theme application |
| `src/styles/theme.css` | CSS custom properties for themes, type badge colors, rarity gradient |
| `src/styles/app.css` | Catch banner styles, ice tray grid, type chart panel, settings panel, animations |

---

## Task 1: Shared UI Render Functions (ui.js)

**Files:**
- Create: `src/js/ui.js`
- Create: `tests/js/ui.test.js`

All reusable render functions. Pure functions that return DOM elements or data objects. No side effects, no global state.

- [ ] **Step 1: Write tests for type badge rendering**

Create `tests/js/ui.test.js` with tests for `makeTypeBadge`, `makeTypeBadgeMini`, `TYPE_COLORS`, and `TYPE_ABBR`. Test that known types return correct colors and abbreviations. Test unknown types fall back to defaults.

- [ ] **Step 2: Write tests for rarity color and stat pills**

Append tests for `rarityHue`, `rarityColor`, and `buildStatPillsData`. Verify hue ranges (120 for 100%, 0 for 0%), HSL string format, clamping, and stat pill data structure.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- tests/js/ui.test.js`
Expected: FAIL (module not found)

- [ ] **Step 4: Implement ui.js**

Create `src/js/ui.js` with:
- `TYPE_COLORS` — all 18 types with bg/text colors
- `TYPE_ABBR` — 3-letter abbreviations (NRM, FIR, WTR, etc.)
- `spriteUrl(dex)`, `itemSpriteUrl(name)` — PokeAPI CDN URLs
- `makeTypeBadge(typeName)` — returns `{text, bg, textColor}` data
- `makeTypeBadgeMini(typeName)` — returns `{text (3-letter), bg, textColor}` data
- `rarityHue(pct)`, `rarityColor(pct)`, `rarityBorder(pct)`, `rarityBg(pct)` — HSL gradient functions
- `buildStatPillsData(encounter, level, percent)` — returns structured pill data
- DOM builders: `renderTypeBadgeEl`, `renderTypeBadgeMiniEl`, `renderStarBadge`, `renderStatPillsEl`, `renderSpriteEl`, `renderPokeballToggle`
- CommonJS exports for testing, `window.__ui` for browser

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- tests/js/ui.test.js`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add src/js/ui.js tests/js/ui.test.js
git commit -m "feat: add shared UI render functions (type badges, stat pills, rarity colors)"
```

---

## Task 2: Type Effectiveness Data + Logic (types.json, typechart.js)

**Files:**
- Create: `src/data/types.json`
- Create: `src/js/typechart.js`
- Create: `tests/js/typechart.test.js`

- [ ] **Step 1: Create types.json**

Full 18x18 chart. Only non-1x multipliers stored. Absence = neutral (1x). Structure: `{ types: [...], chart: { AttackType: { DefenseType: multiplier } } }`

- [ ] **Step 2: Write tests for type effectiveness calculations**

Test `getEffectiveness(chart, atkType, defType)` — super effective (2), not very effective (0.5), immune (0), neutral (1 for missing entry), unknown attacker (1).

Test `getDefensiveMatchups(chart, allTypes, defenderTypes)` — single-type weaknesses/resistances/immunities, dual-type combined multipliers (e.g., Water/Ground: Grass=4x, Electric=0x).

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- tests/js/typechart.test.js`
Expected: FAIL

- [ ] **Step 4: Implement typechart.js (pure logic)**

- `getEffectiveness(chart, atkType, defType)` — single lookup with fallback to 1
- `getDefensiveMatchups(chart, allTypes, defenderTypes)` — multiply across defender types, sort into weak/resist/immune/neutral
- `getOffensiveMatchups(chart, allTypes, attackType)` — super effective/not very/no effect
- `loadTypeData()` — fetch types.json (browser only)
- CommonJS exports for testing, `window.__typechart` for browser

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- tests/js/typechart.test.js`
Expected: All PASS

- [ ] **Step 6: Commit**

```bash
git add src/data/types.json src/js/typechart.js tests/js/typechart.test.js
git commit -m "feat: add type effectiveness data and calculation logic"
```

---

## Task 3: Catch Banner Logic (catches.js)

**Files:**
- Create: `src/js/catches.js`
- Create: `tests/js/catches.test.js`

Pure logic only. DOM rendering comes in Task 7.

- [ ] **Step 1: Write tests**

Test `sortCatches` — top25 sorted before non-top25, order preserved within tier, empty array.
Test `chooseBannerLayout` — "cards" for 1-3, "icetray" for 4+, "none" for 0.
Test `isCaught`/`toggleCaught` — state lookups, immutable toggle (returns new object).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/js/catches.test.js`
Expected: FAIL

- [ ] **Step 3: Implement catches.js**

- `sortCatches(catches)` — stable sort, top25 first
- `chooseBannerLayout(count)` — returns "none", "cards", or "icetray"
- `isCaught(caughtPokemon, name)` — lowercase key lookup
- `toggleCaught(caughtPokemon, name)` — returns new object (immutable)
- `setBannerCollapsed`/`isBannerCollapsed` — collapse state
- CommonJS exports for testing, `window.__catches` for browser

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/js/catches.test.js`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/js/catches.js tests/js/catches.test.js
git commit -m "feat: add catch banner logic (sorting, layout choice, caught state)"
```

---

## Task 4: Settings Defaults + Logic (settings.js)

**Files:**
- Create: `src/js/settings.js`
- Create: `tests/js/settings.test.js`

- [ ] **Step 1: Write tests**

Test `DEFAULT_SETTINGS` has all required keys with correct defaults.
Test `mergeSettings` — returns defaults for undefined input, merges partial settings, merges nested hotkeys, does not mutate defaults.
Test `THEMES` — has dark-purple/dark-blue/oled-black, each with bg-deep and bg-panel.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/js/settings.test.js`
Expected: FAIL

- [ ] **Step 3: Implement settings.js**

- `DEFAULT_SETTINGS` — full default object
- `THEMES` — three theme presets with CSS variable overrides
- `FONT_SIZES` — small/default/large px values
- `mergeSettings(profileSettings)` — deep merge with defaults (JSON clone for immutability)
- `applyTheme`, `applyFontSize`, `applyOpacity`, `applyAllSettings` — DOM/Tauri side effects
- `getProgressStats(completedSteps, totalSteps, totalLocations, locations, caughtPokemon)` — pure calculation
- CommonJS exports for testing, `window.__settings` for browser

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/js/settings.test.js`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/js/settings.js tests/js/settings.test.js
git commit -m "feat: add settings logic (defaults, theme presets, merge, progress stats)"
```

---

## Task 5: Enrich unova.json Catch Data

**Files:**
- Create: `scripts/enrich-catches.js`
- Modify: `src/data/unova.json`

One-time Node script to add `dex`, `types`, `method` (cleaned), `level`, and `percent` fields to all 146 catch entries.

- [ ] **Step 1: Create enrichment script**

`scripts/enrich-catches.js`:
- Reads unova.json
- Has a hardcoded `POKEMON_DATA` map: Pokemon name to `{ dex, types }` for all Gen 5 Pokemon found in Unova
- `parseMethod("Grass Lv.2-4")` splits into `{ method: "Grass", level: "Lv.2-4" }`
- Maps text rates to approximate percentages: Very Common=35, Common=25, Uncommon=15, Rare=5, Very Rare=1
- Writes enriched data back to unova.json
- Reports unknown Pokemon that need manual lookup

- [ ] **Step 2: Run the enrichment script**

Run: `node scripts/enrich-catches.js`
Expected: "Enriched 146 catch entries." + any unknown Pokemon warnings

- [ ] **Step 3: Verify the output**

Spot-check a few entries in unova.json to confirm dex, types, method, level, percent are populated correctly.

- [ ] **Step 4: Fix any unknown Pokemon**

Add missing Pokemon to the script's data map or manually edit unova.json for any entries the script couldn't resolve.

- [ ] **Step 5: Commit**

```bash
git add scripts/enrich-catches.js src/data/unova.json
git commit -m "feat: enrich unova.json with dex numbers, types, levels, and encounter rates"
```

---

## Task 6: CSS Foundation

**Files:**
- Modify: `src/styles/theme.css`
- Modify: `src/styles/app.css`

All CSS for v2 features. No JS changes.

- [ ] **Step 1: Add to theme.css**

Append classes for: `.type-badge`, `.type-badge-mini`, `.star-badge`, `.stat-pills`/`.stat-pill-*`, `.sprite-box`/`.sprite-box-lg`/`.sprite-box-sm`, `.pokeball-toggle`/`.pokeball-toggle.caught`, keyframe animations (`slideDown`, `fadeIn`, `flashGreen`), font size body classes (`.font-small`, `.font-default`, `.font-large`).

- [ ] **Step 2: Add to app.css**

Append styles for: `.catch-banner`/`.catch-banner.collapsed`, `.catch-card`/`.catch-row`/`.caught` states, `.ice-tray`/`.ice-tray-cell`/`.top25`/`.caught`/`.selected`/`.type-overlay`/`.star-overlay`, `.ice-tray-expand`, `.panel-overlay`/`.panel-overlay.open`, `.type-grid`, `.matchup-section`/`.matchup-label`/`.matchup-list`, `.settings-section`/`.settings-section-title`/`.settings-row`/`.settings-label`/`.settings-value`, range input styling, `.progress-bar`/`.progress-bar-fill`, `.step.completing` animation, `.header-btn.active`/`.footer-btn.active`, `scroll-behavior: smooth` on `.guide-steps`.

- [ ] **Step 3: Verify no CSS errors**

Open app or run `npx tauri dev`. Confirm no console CSS errors and existing layout is unbroken.

- [ ] **Step 4: Commit**

```bash
git add src/styles/theme.css src/styles/app.css
git commit -m "feat: add CSS for type badges, catch banner, ice tray, panels, settings, animations"
```

---

## Task 7: HTML Shell + Wire Up Modules

**Files:**
- Modify: `src/index.html`
- Modify: `src/js/app.js`
- Modify: `src/js/profiles.js`
- Modify: `src/js/steps.js`

Wire everything together.

- [ ] **Step 1: Update index.html**

- Add script tags in order: ui.js, catches.js, typechart.js, settings.js (before steps.js)
- Add gear button SVG icon to header-right (before lock button)
- Add panel overlay divs (typeChartPanel, settingsPanel) before closing #app div
- Update footer: replace Map button with "Types" button, remove Clear button (moved to settings)

- [ ] **Step 2: Update profiles.js**

In `switchProfile`: ensure `caughtPokemon` exists (default `{}`), merge settings with defaults via `window.__settings.mergeSettings`, call `applyAllSettings`.

- [ ] **Step 3: Update steps.js — integrate catch banner**

Replace the string-based `renderFull` with DOM-based rendering that:
- Clears container with `textContent = ''`
- For current location with catches, calls `renderCatchBanner(location, caughtPokemon)` and appends result
- Creates step elements with `createElement` instead of string concatenation
- Adds `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` for current step
- Exposes `getRegionData()` on `window.__steps`

Add `renderCatchBanner`, `renderCardLayout`, `renderIceTrayLayout`, `renderIceTrayExpand` functions to steps.js. These use `window.__ui` and `window.__catches` for shared functions. Full implementation as specified in the design spec.

- [ ] **Step 4: Update app.js — panel switching**

Add `toggleTypeChart()`, `toggleSettings()`, `openPanel(name)`, `closePanel()`, `updatePanelButtons()`. Each panel calls its module's `renderPanel(panelEl)` when opened.

Update init to load type data: `if (window.__typechart) await window.__typechart.loadTypeData();`

Export new functions on `window.__app`.

- [ ] **Step 5: Test manually**

Run: `npx tauri dev`. Verify catch banner renders, pokeball toggles work, panels open/close, existing functionality unbroken.

- [ ] **Step 6: Commit**

```bash
git add src/index.html src/js/app.js src/js/profiles.js src/js/steps.js
git commit -m "feat: wire up catch banner, panel overlays, and module integration"
```

---

## Task 8: Type Chart Panel Rendering

**Files:**
- Modify: `src/js/typechart.js`

- [ ] **Step 1: Add renderPanel to typechart.js**

Builds into the panel element:
- Title "TYPE CHART" in pixel font
- 18-type grid using `renderTypeBadgeEl` (6 columns), click to select (max 2)
- Results: weak to (red-tinted), resistant to (green-tinted), immune to (blue-tinted) sections
- Multiplier shown next to each type badge (e.g., "2x", "4x")
- Click result type to pivot lookup
- Single-type also shows offensive matchups section
- Track `selectedTypes` array for grid selection state

Update `window.__typechart` export to include `renderPanel`.

- [ ] **Step 2: Update app.js init**

Add type data loading to init: `if (window.__typechart) await window.__typechart.loadTypeData();`

- [ ] **Step 3: Test manually**

Verify: type grid renders, selections work, matchups display correctly, pivot works.

- [ ] **Step 4: Commit**

```bash
git add src/js/typechart.js src/js/app.js
git commit -m "feat: add type chart panel with defensive/offensive matchup display"
```

---

## Task 9: Settings Panel Rendering

**Files:**
- Modify: `src/js/settings.js`

- [ ] **Step 1: Add renderPanel to settings.js**

Builds into the panel element with sections:
- **Display:** opacity slider (range input 0.8-1.0), font size select, theme select
- **Behavior:** toggle rows for auto-advance step/location, select for banner auto-collapse
- **Controls:** hotkey rows with "press keys..." capture on click
- **Progress:** stats from `getProgressStats`, progress bar
- **Data:** region info row (read-only "Unova"), reset progress button with confirm

Helper builders: `renderSectionTitle`, `renderSliderRow`, `renderSelectRow`, `renderToggleRow`, `renderHotkeyRow`, `renderInfoRow`. All settings apply immediately via onChange callbacks that call `applyTheme`/`applyFontSize`/`applyOpacity` and save to profile.

Update `window.__settings` export to include `renderPanel`.

- [ ] **Step 2: Expose getRegionData from steps.js**

Add `getRegionData: function() { return regionData; }` to `window.__steps`.

- [ ] **Step 3: Test manually**

Verify all settings controls work and persist on profile reload.

- [ ] **Step 4: Commit**

```bash
git add src/js/settings.js src/js/steps.js
git commit -m "feat: add settings panel with display, behavior, controls, and progress stats"
```

---

## Task 10: UI Polish

**Files:**
- Modify: `src/js/steps.js`
- Modify: `src/js/app.js`
- Modify: `src/index.html`

- [ ] **Step 1: Step completion animation**

In `completeStep`, add `completing` class to current step element, wait 200ms, then re-render. CSS `.step.completing .step-circle` triggers `flashGreen` animation.

- [ ] **Step 2: Redesign expand bar**

Replace "EXPAND GUIDE" text with chevron SVG + "X/Y steps" count. Update count in `renderCompact`.

- [ ] **Step 3: Polish minimize pill**

Show current location + progress in pill text (e.g., "ROUTE 1 . 2/6") instead of "PMC". Expose `findCurrentStep` on `window.__steps`.

- [ ] **Step 4: Test manually**

Verify: green flash on step complete, new expand bar, pill shows location info.

- [ ] **Step 5: Commit**

```bash
git add src/js/steps.js src/js/app.js src/index.html
git commit -m "feat: add UI polish — step animation, expand bar redesign, pill info"
```

---

## Task 11: Final Verification

- [ ] **Step 1: Run all JS tests**

Run: `npm test`
Expected: All pass

- [ ] **Step 2: Run Rust tests**

Run: `cd src-tauri && cargo test`
Expected: All 6 pass

- [ ] **Step 3: Manual integration test**

Run: `npx tauri dev`

Verify: app launches, catch banner (cards + ice tray), type badges, pokeball toggle, rarity colors, golden stars, type chart panel, settings panel, all settings work, hotkeys work, window state persists, step animation, expand bar, profile switching.

- [ ] **Step 4: Update CLAUDE.md**

Add new modules to Architecture section, update test counts.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: v2 complete — catch banner, type chart, settings, UI polish"
```
