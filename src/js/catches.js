/**
 * Catches module — banner layout, sorting, and caught state logic.
 * Pure logic only. No DOM rendering.
 */

/**
 * Sort catches so top25 entries appear first, preserving relative order within each tier.
 */
function sortCatches(catches) {
  return catches.slice().sort((a, b) => {
    const aTop = a.top25 ? 0 : 1;
    const bTop = b.top25 ? 0 : 1;
    return aTop - bTop;
  });
}

/**
 * Choose a banner layout based on the number of catches to display.
 * - 0: "none"
 * - 1-3: "cards"
 * - 4+: "icetray"
 */
function chooseBannerLayout(count) {
  if (count === 0) return 'none';
  if (count <= 3) return 'cards';
  return 'icetray';
}

/**
 * Returns true if the given pokemon name is in the caught map (case-insensitive key).
 */
function isCaught(caughtPokemon, name) {
  return !!caughtPokemon[name.toLowerCase()];
}

/**
 * Toggle the caught state for a pokemon. Returns a NEW object — never mutates the original.
 */
function toggleCaught(caughtPokemon, name) {
  const key = name.toLowerCase();
  const copy = Object.assign({}, caughtPokemon);
  if (copy[key]) {
    delete copy[key];
  } else {
    copy[key] = true;
  }
  return copy;
}

// --- Banner collapse state (browser only, not tested) ---

let _bannerCollapsed = false;

function setBannerCollapsed(collapsed) {
  _bannerCollapsed = !!collapsed;
}

function isBannerCollapsed() {
  return _bannerCollapsed;
}

// CommonJS exports for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sortCatches, chooseBannerLayout, isCaught, toggleCaught };
}

// Browser globals
if (typeof window !== 'undefined') {
  window.__catches = {
    sortCatches,
    chooseBannerLayout,
    isCaught,
    toggleCaught,
    setBannerCollapsed,
    isBannerCollapsed,
  };
}
