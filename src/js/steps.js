/**
 * Steps module — rendering, highlighting, and completion logic
 * for the PokeMMO Companion guide.
 */

// Tag key to CSS class mapping
const TAG_CLASS_MAP = {
  items: 'hl-item',
  battles: 'hl-battle',
  pokemon: 'hl-pokemon',
  npcs: 'hl-npc',
  tips: 'hl-tip',
  gym: 'hl-gym',
  hiddenItems: 'hl-hidden-item',
};

/**
 * Highlight tagged words in step text with styled spans.
 * @param {string} text - The step text to highlight.
 * @param {object|undefined} tags - Object with keys like items, battles, pokemon, etc.
 * @returns {string} HTML string with highlighted words.
 */
function highlightText(text, tags) {
  if (!tags) return text;

  let result = text;

  for (const [tagKey, className] of Object.entries(TAG_CLASS_MAP)) {
    const words = tags[tagKey];
    if (!words || !Array.isArray(words)) continue;

    for (const word of words) {
      // Escape special regex characters in the word
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(
        new RegExp(escaped, 'g'),
        `<span class="${className}">${word}</span>`
      );
    }
  }

  return result;
}

/**
 * Get the next step position after the given one.
 * @param {Array} locations - Array of location objects with steps arrays.
 * @param {number} locIdx - Current location index.
 * @param {number} stepIdx - Current step index.
 * @returns {{ location: number, step: number } | null}
 */
function getNextStep(locations, locIdx, stepIdx) {
  const currentLocation = locations[locIdx];
  if (stepIdx + 1 < currentLocation.steps.length) {
    return { location: locIdx, step: stepIdx + 1 };
  }
  if (locIdx + 1 < locations.length) {
    return { location: locIdx + 1, step: 0 };
  }
  return null;
}

/**
 * Build an array of { done, current } states for each step in a location.
 * The first non-done step is marked as current.
 * @param {number} totalSteps - Total number of steps.
 * @param {object} completedSteps - Map of "locIdx-stepIdx" to true for completed steps.
 * @param {number} locationIdx - The location index (used for key lookup).
 * @returns {Array<{ done: boolean, current: boolean }>}
 */
function buildStepState(totalSteps, completedSteps, locationIdx) {
  const states = [];
  let foundCurrent = false;

  for (let i = 0; i < totalSteps; i++) {
    const key = `${locationIdx}-${i}`;
    const done = !!completedSteps[key];

    let current = false;
    if (!done && !foundCurrent) {
      current = true;
      foundCurrent = true;
    }

    states.push({ done, current });
  }

  return states;
}

// --- DOM-dependent functions (browser only) ---

let regionData = null;
let currentProfile = null;

/**
 * Fetch and cache region data from unova.json.
 */
async function loadRegionData() {
  const response = await fetch('data/unova.json');
  regionData = await response.json();
  return regionData;
}

/**
 * Get the completed steps map from the current profile.
 */
function getCompletedSteps() {
  if (!currentProfile || !currentProfile.completedSteps) return {};
  return currentProfile.completedSteps;
}

/**
 * Find the current (first incomplete) step across all locations.
 */
function findCurrentStep() {
  if (!regionData || !regionData.locations) return null;
  const completed = getCompletedSteps();

  for (let locIdx = 0; locIdx < regionData.locations.length; locIdx++) {
    const location = regionData.locations[locIdx];
    for (let stepIdx = 0; stepIdx < location.steps.length; stepIdx++) {
      const key = `${locIdx}-${stepIdx}`;
      if (!completed[key]) {
        return { location: locIdx, step: stepIdx };
      }
    }
  }
  return null;
}

/**
 * Render the compact view — current step and next step preview.
 * Note: Uses innerHTML with internally-generated highlight markup only.
 */
function renderCompact() {
  if (!regionData) return;

  const compactStep = document.getElementById('compactStep');
  const compactNext = document.getElementById('compactNext');
  if (!compactStep || !compactNext) return;

  const current = findCurrentStep();
  if (!current) {
    compactStep.textContent = 'All steps complete!';
    compactNext.textContent = '';
    return;
  }

  const loc = regionData.locations[current.location];
  const step = loc.steps[current.step];
  compactStep.innerHTML = highlightText(step.text, step.tags); // safe: data is from local JSON only

  const next = getNextStep(regionData.locations, current.location, current.step);
  if (next) {
    const nextLoc = regionData.locations[next.location];
    const nextStep = nextLoc.steps[next.step];
    compactNext.innerHTML = highlightText(nextStep.text, nextStep.tags); // safe: data is from local JSON only
  } else {
    compactNext.textContent = 'Last step!';
  }

  // Update header with current location name
  const header = document.getElementById('locationHeader');
  if (header) {
    header.textContent = loc.name;
  }
}

/**
 * Render the full step list view with numbered steps,
 * current highlighting, and location dividers.
 * Note: Uses innerHTML with internally-generated highlight markup only.
 */
function renderFull() {
  if (!regionData) return;

  const container = document.getElementById('guideSteps');
  if (!container) return;

  const completed = getCompletedSteps();
  let html = '';
  let globalStepNum = 1;

  for (let locIdx = 0; locIdx < regionData.locations.length; locIdx++) {
    const location = regionData.locations[locIdx];
    const states = buildStepState(location.steps.length, completed, locIdx);

    html += `<div class="location-divider">${location.name}</div>`;

    for (let stepIdx = 0; stepIdx < location.steps.length; stepIdx++) {
      const step = location.steps[stepIdx];
      const state = states[stepIdx];
      const classes = [];
      if (state.done) classes.push('step-done');
      if (state.current) classes.push('step-current');

      html += `<div class="step ${classes.join(' ')}" data-loc="${locIdx}" data-step="${stepIdx}">`;
      html += `<span class="step-num">${globalStepNum}.</span> `;
      html += highlightText(step.text, step.tags);
      html += '</div>';
      globalStepNum++;
    }
  }

  container.innerHTML = html; // safe: all data sourced from local JSON file
}

/**
 * Mark a step as completed, auto-advance, re-render, and save via Tauri if available.
 */
async function completeStep(locIdx, stepIdx) {
  if (!currentProfile) return;
  if (!currentProfile.completedSteps) currentProfile.completedSteps = {};

  const key = `${locIdx}-${stepIdx}`;
  currentProfile.completedSteps[key] = true;

  render();

  // Save via Tauri if available
  if (typeof window !== 'undefined' && window.__TAURI__) {
    try {
      const { invoke } = window.__TAURI__.core;
      await invoke('save_profile', { profile: currentProfile });
    } catch (e) {
      console.error('Failed to save profile via Tauri:', e);
    }
  }
}

/**
 * Find and complete the current (first incomplete) step.
 */
function completeCurrent() {
  const current = findCurrentStep();
  if (current) {
    completeStep(current.location, current.step);
  }
}

/**
 * Render both compact and full views.
 */
function render() {
  renderCompact();
  renderFull();
}

/**
 * Set the active profile and re-render.
 */
function setProfile(profile) {
  currentProfile = profile;
  render();
}

// Export pure functions for testing (Node/Vitest)
export { highlightText, getNextStep, buildStepState };

// Attach DOM functions to window for browser use
if (typeof window !== 'undefined') {
  window.__steps = { loadRegionData, render, setProfile, completeCurrent, completeStep };
}
