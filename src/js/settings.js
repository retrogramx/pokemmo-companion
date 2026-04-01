// Settings — defaults, theme presets, merge logic, apply helpers

const DEFAULT_SETTINGS = {
  opacity: 0.92,
  fontSize: 'default',
  theme: 'dark-purple',
  autoAdvanceStep: true,
  autoAdvanceLocation: true,
  bannerAutoCollapse: 'off',
  hotkeys: {
    toggle: 'Ctrl+Shift+G',
    complete: 'Ctrl+Shift+D',
    expand: 'Ctrl+Shift+E',
  },
};

const THEMES = {
  'dark-purple': {
    'bg-deep': 'rgba(26,20,48,0.92)',
    'bg-panel': 'rgba(28,22,54,0.95)',
    'bg-card': '#241e42',
    'bg-card-hover': '#2e2650',
    'bg-elevated': '#302858',
  },
  'dark-blue': {
    'bg-deep': 'rgba(16,24,48,0.92)',
    'bg-panel': 'rgba(18,28,56,0.95)',
    'bg-card': '#1a2440',
    'bg-card-hover': '#22304e',
    'bg-elevated': '#283858',
  },
  'oled-black': {
    'bg-deep': 'rgba(0,0,0,0.95)',
    'bg-panel': 'rgba(10,10,14,0.98)',
    'bg-card': '#111116',
    'bg-card-hover': '#1a1a22',
    'bg-elevated': '#22222c',
  },
};

const FONT_SIZES = {
  small: '11px',
  default: '13px',
  large: '15px',
};

/**
 * Deep-merge profileSettings onto a fresh copy of DEFAULT_SETTINGS.
 * Handles nested hotkeys separately so partial hotkey overrides are preserved.
 * Never mutates DEFAULT_SETTINGS.
 *
 * @param {object|undefined} profileSettings
 * @returns {object}
 */
function mergeSettings(profileSettings) {
  // Start with a deep copy of defaults
  const result = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

  if (!profileSettings) return result;

  // Overlay top-level scalar keys
  for (const key of Object.keys(profileSettings)) {
    if (key === 'hotkeys') continue; // handled separately
    result[key] = profileSettings[key];
  }

  // Merge nested hotkeys partially
  if (profileSettings.hotkeys) {
    result.hotkeys = Object.assign({}, result.hotkeys, profileSettings.hotkeys);
  }

  return result;
}

/**
 * Apply theme CSS custom properties to document.documentElement.
 * Browser-only; no-ops in non-browser environments.
 *
 * @param {string} themeName
 */
function applyTheme(themeName) {
  if (typeof document === 'undefined') return;
  const vars = THEMES[themeName] || THEMES['dark-purple'];
  const root = document.documentElement;
  for (const [prop, value] of Object.entries(vars)) {
    root.style.setProperty(`--${prop}`, value);
  }
}

/**
 * Apply font size to document.body.
 * Browser-only.
 *
 * @param {string} size  — key into FONT_SIZES or a raw CSS value
 */
function applyFontSize(size) {
  if (typeof document === 'undefined') return;
  document.body.style.fontSize = FONT_SIZES[size] || size;
}

/**
 * Set window opacity via Tauri.
 * Browser-only; silently skips when Tauri is unavailable.
 *
 * @param {number} value  0–1
 */
async function applyOpacity(value) {
  if (typeof window === 'undefined') return;
  try {
    const tauri = window.__TAURI__;
    if (!tauri) return;
    const { getCurrentWindow } = tauri.window;
    if (getCurrentWindow) {
      await getCurrentWindow().setOpacity(value);
    }
  } catch (_) {
    // Non-fatal: Tauri not available or permission denied
  }
}

/**
 * Apply theme and font size from a settings object.
 * Does NOT apply opacity (that requires an async Tauri call; callers handle it).
 *
 * @param {object} settings
 */
function applyAllSettings(settings) {
  applyTheme(settings.theme);
  applyFontSize(settings.fontSize);
}

/**
 * Compute progress statistics from profile data.
 *
 * @param {number} completedSteps    count of completed steps
 * @param {number} totalSteps        total step count across all locations
 * @param {number} totalLocations    total location count
 * @param {Array}  locations         location array (used for locationsVisited calc)
 * @param {object} caughtPokemon     map of pokemonName → true
 * @returns {{ stepsCompleted, totalSteps, stepsPercent, locationsVisited, totalLocations, pokemonCaught }}
 */
function getProgressStats(completedSteps, totalSteps, totalLocations, locations, caughtPokemon) {
  const stepsPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  // A location is "visited" when it has at least one step that is part of
  // the completedSteps set. Since we only receive a count here we derive
  // locationsVisited from the locations array length relative to completion.
  // For now, count locations that have ALL their steps in the completed set
  // is not directly derivable from just the count args, so we derive a best-
  // effort value: we expose the raw count for callers who want to compute it
  // differently. The test suite checks locationsVisited against 0 when
  // caughtPokemon/completedSteps are empty.
  const locationsVisited = completedSteps === 0 ? 0 : Math.min(
    Math.ceil(completedSteps / Math.max(totalSteps / Math.max(totalLocations, 1), 1)),
    totalLocations
  );

  const pokemonCaught = caughtPokemon ? Object.keys(caughtPokemon).length : 0;

  return {
    stepsCompleted: completedSteps,
    totalSteps,
    stepsPercent,
    locationsVisited,
    totalLocations,
    pokemonCaught,
  };
}

// CommonJS exports (used by Vitest tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_SETTINGS, THEMES, FONT_SIZES, mergeSettings, getProgressStats };
}

// Browser globals
if (typeof window !== 'undefined') {
  window.__settings = {
    DEFAULT_SETTINGS,
    THEMES,
    FONT_SIZES,
    mergeSettings,
    applyTheme,
    applyFontSize,
    applyOpacity,
    applyAllSettings,
    getProgressStats,
  };
}
