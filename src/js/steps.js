/**
 * Steps module — rendering, highlighting, and completion logic.
 */

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
 */
function highlightText(text, tags) {
  if (!tags) return text;
  let result = text;
  for (const [tagKey, cssClass] of Object.entries(TAG_CLASS_MAP)) {
    const values = tags[tagKey];
    if (!values) continue;
    for (const value of values) {
      result = result.replace(value, `<span class="${cssClass}">${value}</span>`);
    }
  }
  return result;
}

/**
 * Get the next step position, advancing to the next location if needed.
 */
function getNextStep(locations, locIdx, stepIdx) {
  if (stepIdx + 1 < locations[locIdx].steps.length) {
    return { location: locIdx, step: stepIdx + 1 };
  }
  if (locIdx + 1 < locations.length) {
    return { location: locIdx + 1, step: 0 };
  }
  return null;
}

/**
 * Build state array for a location's steps.
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

async function loadRegionData() {
  const response = await fetch('data/unova.json');
  regionData = await response.json();
  return regionData;
}

function getCompletedSteps() {
  if (!currentProfile || !currentProfile.completedSteps) return {};
  return currentProfile.completedSteps;
}

function findCurrentStep() {
  if (!regionData || !regionData.locations) return null;
  const completed = getCompletedSteps();
  for (let locIdx = 0; locIdx < regionData.locations.length; locIdx++) {
    const location = regionData.locations[locIdx];
    for (let stepIdx = 0; stepIdx < location.steps.length; stepIdx++) {
      if (!completed[`${locIdx}-${stepIdx}`]) {
        return { location: locIdx, step: stepIdx };
      }
    }
  }
  return null;
}

function renderCompact() {
  if (!regionData || !currentProfile) return;

  const compactStep = document.getElementById('compactStep');
  const compactNext = document.getElementById('compactNext');
  if (!compactStep || !compactNext) return;

  const current = findCurrentStep();
  if (!current) {
    compactStep.innerHTML = '<div style="padding:4px;color:var(--green);">All steps complete!</div>';
    compactNext.innerHTML = '';
    return;
  }

  const loc = regionData.locations[current.location];
  const step = loc.steps[current.step];
  const completed = getCompletedSteps();
  const locDone = loc.steps.filter((_, i) => completed[`${current.location}-${i}`]).length;

  // Render compact step with circle + text + done button
  compactStep.innerHTML = `
    <div class="step-circle" style="border-color:var(--blue);position:relative;width:16px;height:16px;min-width:16px;margin-top:2px;">
      <span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:6px;height:6px;border-radius:50%;background:var(--blue);box-shadow:0 0 6px rgba(91,141,239,0.5);"></span>
    </div>
    <div class="step-text">${highlightText(step.text, step.tags)}</div>
    <button class="done-btn" onclick="window.__steps.completeCurrent()" title="Complete (Ctrl+Shift+D)">✓</button>
  `;

  // Next step preview
  const next = getNextStep(regionData.locations, current.location, current.step);
  if (next) {
    const nextLoc = regionData.locations[next.location];
    const nextStep = nextLoc.steps[next.step];
    compactNext.innerHTML = `
      <div style="width:12px;height:12px;min-width:12px;border-radius:50%;border:1.5px solid #3d3560;"></div>
      <span>${nextStep.text}</span>
    `;
  } else {
    compactNext.innerHTML = '<span>Last step!</span>';
  }

  // Update header
  document.getElementById('headerLocation').textContent = loc.name;
  document.getElementById('headerProgress').textContent = `${locDone}/${loc.steps.length}`;
}

function renderFull() {
  if (!regionData || !currentProfile) return;

  const container = document.getElementById('guideSteps');
  if (!container) return;

  const completed = getCompletedSteps();
  const current = findCurrentStep();
  let html = '';

  // Show current location + a couple upcoming
  const startLoc = current ? current.location : 0;
  const endLoc = Math.min(startLoc + 3, regionData.locations.length);

  for (let locIdx = startLoc; locIdx < endLoc; locIdx++) {
    const location = regionData.locations[locIdx];
    const states = buildStepState(location.steps.length, completed, locIdx);

    if (locIdx > startLoc) {
      html += `<div class="location-divider"><span>${location.name}</span></div>`;
    }

    for (let stepIdx = 0; stepIdx < location.steps.length; stepIdx++) {
      const step = location.steps[stepIdx];
      const state = states[stepIdx];
      const isCurrent = current && current.location === locIdx && current.step === stepIdx;

      const cls = `step${isCurrent ? ' current' : ''}${state.done ? ' done' : ''}`;
      const numCls = isCurrent ? 'step-num current-num' : 'step-num';

      // Catch tip for current step
      let catchTip = '';
      if (isCurrent && location.catches) {
        const top = location.catches.filter(c => c.top25);
        if (top.length > 0) {
          catchTip = `<div class="catch-tip">🌿 <strong>${top[0].name}</strong> — ${top[0].why}</div>`;
        }
      }

      html += `
        <div class="${cls}" onclick="window.__steps.completeStep(${locIdx},${stepIdx})">
          <span class="${numCls}">${String(stepIdx + 1).padStart(2, '0')}</span>
          <div class="step-circle"></div>
          <div class="step-text">
            ${highlightText(step.text, step.tags)}
            ${catchTip}
          </div>
        </div>`;
    }
  }

  container.innerHTML = html;

  // Update header
  if (current) {
    const loc = regionData.locations[current.location];
    const locDone = loc.steps.filter((_, i) => completed[`${current.location}-${i}`]).length;
    document.getElementById('headerLocation').textContent = loc.name;
    document.getElementById('headerProgress').textContent = `${locDone}/${loc.steps.length}`;
  }
}

async function completeStep(locIdx, stepIdx) {
  if (!currentProfile) return;
  if (!currentProfile.completedSteps) currentProfile.completedSteps = {};

  currentProfile.completedSteps[`${locIdx}-${stepIdx}`] = true;
  render();
  saveProfile();
}

function completeCurrent() {
  const current = findCurrentStep();
  if (current) {
    completeStep(current.location, current.step);
  }
}

/**
 * Undo the last completed step (most recently checked off).
 */
function undoLast() {
  if (!currentProfile || !currentProfile.completedSteps) return;

  // Find the highest step key that's completed
  const keys = Object.keys(currentProfile.completedSteps).filter(k => currentProfile.completedSteps[k]);
  if (keys.length === 0) return;

  // Sort by location then step index to find the last one
  keys.sort((a, b) => {
    const [aLoc, aStep] = a.split('-').map(Number);
    const [bLoc, bStep] = b.split('-').map(Number);
    return aLoc !== bLoc ? aLoc - bLoc : aStep - bStep;
  });

  const lastKey = keys[keys.length - 1];
  delete currentProfile.completedSteps[lastKey];

  // Update current position to the undone step
  const [locIdx] = lastKey.split('-').map(Number);
  currentProfile.currentLocation = locIdx;

  render();
  saveProfile();
}

/**
 * Clear all progress with confirmation.
 */
function clearAll() {
  if (!currentProfile) return;
  if (!confirm('Clear ALL progress for ' + currentProfile.name + '? This cannot be undone.')) return;

  currentProfile.completedSteps = {};
  currentProfile.currentLocation = 0;
  currentProfile.currentStep = 0;

  render();
  saveProfile();
}

/**
 * Save current profile via the profiles module.
 */
function saveProfile() {
  if (!currentProfile) return;
  if (typeof window !== 'undefined' && window.__profiles) {
    window.__profiles.saveActiveProfile();
  }
}

function render() {
  renderCompact();
  renderFull();
}

function setProfile(profile) {
  currentProfile = profile;
  render();
}

// Export for testing (ESM)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { highlightText, getNextStep, buildStepState };
}

// Attach to window for browser
if (typeof window !== 'undefined') {
  window.__steps = { loadRegionData, render, setProfile, completeCurrent, completeStep, undoLast, clearAll, getRegionData: function() { return regionData; } };
}
