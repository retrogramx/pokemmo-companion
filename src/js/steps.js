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

  // Clear container using textContent (safe, no innerHTML on container)
  container.textContent = '';

  // Show current location + a couple upcoming
  const startLoc = current ? current.location : 0;
  const endLoc = Math.min(startLoc + 3, regionData.locations.length);

  for (let locIdx = startLoc; locIdx < endLoc; locIdx++) {
    const location = regionData.locations[locIdx];
    const states = buildStepState(location.steps.length, completed, locIdx);

    // Catch banner for the current location
    if (locIdx === startLoc && location.catches && location.catches.length > 0 && window.__catches) {
      var caughtPokemon = (currentProfile && currentProfile.caughtPokemon) ? currentProfile.caughtPokemon : {};
      var banner = renderCatchBanner(location, caughtPokemon);
      if (banner) container.appendChild(banner);
    }

    if (locIdx > startLoc) {
      var divider = document.createElement('div');
      divider.className = 'location-divider';
      var dividerSpan = document.createElement('span');
      dividerSpan.textContent = location.name;
      divider.appendChild(dividerSpan);
      container.appendChild(divider);
    }

    for (let stepIdx = 0; stepIdx < location.steps.length; stepIdx++) {
      const step = location.steps[stepIdx];
      const state = states[stepIdx];
      const isCurrent = current && current.location === locIdx && current.step === stepIdx;

      var stepEl = document.createElement('div');
      stepEl.className = 'step' + (isCurrent ? ' current' : '') + (state.done ? ' done' : '');
      (function(li, si) {
        stepEl.addEventListener('click', function() { window.__steps.completeStep(li, si); });
      })(locIdx, stepIdx);

      var numEl = document.createElement('span');
      numEl.className = isCurrent ? 'step-num current-num' : 'step-num';
      numEl.textContent = String(stepIdx + 1).padStart(2, '0');
      stepEl.appendChild(numEl);

      var circleEl = document.createElement('div');
      circleEl.className = 'step-circle';
      stepEl.appendChild(circleEl);

      var textEl = document.createElement('div');
      textEl.className = 'step-text';
      // highlightText processes only our own trusted JSON data (step text + tags)
      // This is safe — no user-generated content flows through this path
      var textSpan = document.createElement('span');
      textSpan.innerHTML = highlightText(step.text, step.tags); // trusted data from unova.json
      textEl.appendChild(textSpan);
      stepEl.appendChild(textEl);

      container.appendChild(stepEl);

      // Scroll current step into view
      if (isCurrent) {
        (function(el) {
          setTimeout(function() {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }, 50);
        })(stepEl);
      }
    }
  }

  // Update header
  if (current) {
    const loc = regionData.locations[current.location];
    const locDone = loc.steps.filter((_, i) => completed[`${current.location}-${i}`]).length;
    document.getElementById('headerLocation').textContent = loc.name;
    document.getElementById('headerProgress').textContent = `${locDone}/${loc.steps.length}`;
  }
}

/**
 * Render the catch banner for a location.
 */
function renderCatchBanner(location, caughtPokemon) {
  if (!location.catches || location.catches.length === 0) return null;
  if (!window.__catches) return null;

  var sorted = window.__catches.sortCatches(location.catches);
  var layout = window.__catches.chooseBannerLayout(sorted.length);
  if (layout === 'none') return null;

  var banner = document.createElement('div');
  banner.className = 'catch-banner';

  // Collapsible header
  var header = document.createElement('div');
  header.className = 'catch-banner-header';
  var headerTitle = document.createElement('span');
  headerTitle.textContent = 'Pokemon to catch here (' + sorted.length + ')';
  header.appendChild(headerTitle);

  var collapseIcon = document.createElement('span');
  collapseIcon.className = 'catch-banner-toggle';
  var collapsed = window.__catches.isBannerCollapsed();
  collapseIcon.textContent = collapsed ? '\u25B6' : '\u25BC';
  header.appendChild(collapseIcon);

  var body = document.createElement('div');
  body.className = 'catch-banner-body';
  if (collapsed) body.style.display = 'none';

  header.addEventListener('click', function() {
    var isCollapsed = window.__catches.isBannerCollapsed();
    window.__catches.setBannerCollapsed(!isCollapsed);
    collapseIcon.textContent = !isCollapsed ? '\u25B6' : '\u25BC';
    body.style.display = !isCollapsed ? 'none' : '';
  });

  banner.appendChild(header);

  if (layout === 'cards') {
    renderCardLayout(body, sorted, caughtPokemon);
  } else {
    renderIceTrayLayout(body, sorted, caughtPokemon);
  }

  banner.appendChild(body);
  return banner;
}

/**
 * Render card layout for 1-3 catches.
 */
function renderCardLayout(container, catches, caughtPokemon) {
  var ui = window.__ui;
  if (!ui) return;

  for (var i = 0; i < catches.length; i++) {
    var c = catches[i];
    var caught = window.__catches.isCaught(caughtPokemon, c.name);

    if (c.top25) {
      // Full card for top25
      var card = document.createElement('div');
      card.className = 'catch-card';

      // Sprite box
      var spriteBox = document.createElement('div');
      spriteBox.className = 'sprite-box-lg';
      if (c.dex) spriteBox.appendChild(ui.renderSpriteEl(c.dex, c.name));
      // Type overlay
      if (c.types) {
        var typeOverlay = document.createElement('div');
        typeOverlay.className = 'type-overlay';
        for (var t = 0; t < c.types.length; t++) {
          typeOverlay.appendChild(ui.renderTypeBadgeMiniEl(c.types[t]));
        }
        spriteBox.appendChild(typeOverlay);
      }
      card.appendChild(spriteBox);

      // Name row
      var nameRow = document.createElement('div');
      nameRow.className = 'catch-name-row';
      var nameSpan = document.createElement('span');
      nameSpan.className = 'catch-name';
      nameSpan.textContent = c.name;
      nameRow.appendChild(nameSpan);
      if (c.stars) nameRow.appendChild(ui.renderStarBadge(c.stars));
      if (c.types) {
        for (var t2 = 0; t2 < c.types.length; t2++) {
          nameRow.appendChild(ui.renderTypeBadgeEl(c.types[t2]));
        }
      }
      card.appendChild(nameRow);

      // Stat pills
      if (c.encounter && c.level && c.percent) {
        card.appendChild(ui.renderStatPillsEl(c.encounter, c.level, c.percent));
      }

      // Why text
      if (c.why) {
        var whyEl = document.createElement('div');
        whyEl.className = 'catch-why';
        whyEl.textContent = c.why;
        card.appendChild(whyEl);
      }

      // Pokeball toggle
      (function(catchData) {
        var pokeball = ui.renderPokeballToggle(caught, function(e) {
          e.stopPropagation();
          var profile = window.__profiles.getActiveProfile();
          if (!profile) return;
          profile.caughtPokemon = window.__catches.toggleCaught(profile.caughtPokemon || {}, catchData.name);
          window.__profiles.saveActiveProfile();
          window.__steps.render();
        });
        card.appendChild(pokeball);
      })(c);

      container.appendChild(card);
    } else {
      // Compact row for non-top25
      var row = document.createElement('div');
      row.className = 'catch-row';

      var spriteBoxSm = document.createElement('div');
      spriteBoxSm.className = 'sprite-box-sm';
      if (c.dex) spriteBoxSm.appendChild(ui.renderSpriteEl(c.dex, c.name));
      row.appendChild(spriteBoxSm);

      var rowInfo = document.createElement('div');
      rowInfo.className = 'catch-row-info';
      var rowName = document.createElement('span');
      rowName.className = 'catch-name';
      rowName.textContent = c.name;
      rowInfo.appendChild(rowName);
      if (c.encounter && c.level && c.percent) {
        var compactPills = ui.renderStatPillsEl(c.encounter, c.level, c.percent);
        compactPills.className += ' compact';
        rowInfo.appendChild(compactPills);
      }
      row.appendChild(rowInfo);

      // Pokeball toggle
      (function(catchData) {
        var pokeball = ui.renderPokeballToggle(caught, function(e) {
          e.stopPropagation();
          var profile = window.__profiles.getActiveProfile();
          if (!profile) return;
          profile.caughtPokemon = window.__catches.toggleCaught(profile.caughtPokemon || {}, catchData.name);
          window.__profiles.saveActiveProfile();
          window.__steps.render();
        });
        row.appendChild(pokeball);
      })(c);

      container.appendChild(row);
    }
  }
}

/**
 * Render ice tray grid layout for 4+ catches.
 */
function renderIceTrayLayout(container, catches, caughtPokemon) {
  var ui = window.__ui;
  if (!ui) return;

  var grid = document.createElement('div');
  grid.className = 'ice-tray-grid';

  var expandPanel = document.createElement('div');
  expandPanel.className = 'ice-tray-expand';

  for (var i = 0; i < catches.length; i++) {
    (function(c, index) {
      var caught = window.__catches.isCaught(caughtPokemon, c.name);

      var cell = document.createElement('div');
      cell.className = 'ice-tray-cell' + (c.top25 ? ' top25' : '') + (caught ? ' caught' : '');

      // Sprite
      if (c.dex) cell.appendChild(ui.renderSpriteEl(c.dex, c.name));

      // Type overlay
      if (c.types) {
        var typeOverlay = document.createElement('div');
        typeOverlay.className = 'type-overlay';
        for (var t = 0; t < c.types.length; t++) {
          typeOverlay.appendChild(ui.renderTypeBadgeMiniEl(c.types[t]));
        }
        cell.appendChild(typeOverlay);
      }

      // Star overlay for top25
      if (c.top25 && c.stars) {
        var starOverlay = document.createElement('div');
        starOverlay.className = 'star-overlay';
        starOverlay.appendChild(ui.renderStarBadge(c.stars));
        cell.appendChild(starOverlay);
      }

      cell.addEventListener('click', function() {
        var wasSelected = cell.classList.contains('selected');
        // Deselect all
        grid.querySelectorAll('.ice-tray-cell').forEach(function(c) { c.classList.remove('selected'); });
        if (wasSelected) {
          expandPanel.style.display = 'none';
          expandPanel.textContent = '';
        } else {
          cell.classList.add('selected');
          expandPanel.textContent = '';
          renderIceTrayExpand(expandPanel, c, caughtPokemon);
          expandPanel.style.display = '';
        }
      });

      grid.appendChild(cell);
    })(catches[i], i);
  }

  container.appendChild(grid);
  expandPanel.style.display = 'none';
  container.appendChild(expandPanel);
}

/**
 * Render expanded detail card for ice tray selection.
 */
function renderIceTrayExpand(panel, catchData, caughtPokemon) {
  var ui = window.__ui;
  if (!ui) return;

  var caught = window.__catches.isCaught(caughtPokemon, catchData.name);

  // Sprite
  if (catchData.dex) panel.appendChild(ui.renderSpriteEl(catchData.dex, catchData.name));

  // Name + star + type badges
  var nameRow = document.createElement('div');
  nameRow.className = 'catch-name-row';
  var nameSpan = document.createElement('span');
  nameSpan.className = 'catch-name';
  nameSpan.textContent = catchData.name;
  nameRow.appendChild(nameSpan);
  if (catchData.stars) nameRow.appendChild(ui.renderStarBadge(catchData.stars));
  if (catchData.types) {
    for (var t = 0; t < catchData.types.length; t++) {
      nameRow.appendChild(ui.renderTypeBadgeEl(catchData.types[t]));
    }
  }
  panel.appendChild(nameRow);

  // Stat pills
  if (catchData.encounter && catchData.level && catchData.percent) {
    panel.appendChild(ui.renderStatPillsEl(catchData.encounter, catchData.level, catchData.percent));
  }

  // Why
  if (catchData.why) {
    var whyEl = document.createElement('div');
    whyEl.className = 'catch-why';
    whyEl.textContent = catchData.why;
    panel.appendChild(whyEl);
  }

  // Pokeball toggle
  var pokeball = ui.renderPokeballToggle(caught, function(e) {
    e.stopPropagation();
    var profile = window.__profiles.getActiveProfile();
    if (!profile) return;
    profile.caughtPokemon = window.__catches.toggleCaught(profile.caughtPokemon || {}, catchData.name);
    window.__profiles.saveActiveProfile();
    window.__steps.render();
  });
  panel.appendChild(pokeball);
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
  window.__steps = {
    loadRegionData, render, setProfile, completeCurrent, completeStep, undoLast, clearAll,
    getRegionData: function() { return regionData; },
  };
}
