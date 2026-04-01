/**
 * Type effectiveness module — Gen 5 type chart lookups + panel rendering.
 */

/**
 * Return the attack multiplier for atkType vs defType.
 * Falls back to 1 if either type is unknown or the matchup is not in the chart.
 * @param {Object} chart - The chart object from types.json
 * @param {string} atkType
 * @param {string} defType
 * @returns {number}
 */
function getEffectiveness(chart, atkType, defType) {
  if (!chart || !chart[atkType]) return 1;
  const row = chart[atkType];
  if (!(defType in row)) return 1;
  return row[defType];
}

/**
 * Compute all defensive matchups for a defender with one or two types.
 * @param {Object} chart - The chart object from types.json
 * @param {string[]} allTypes - Array of all 18 type names
 * @param {string[]} defenderTypes - Array of 1 or 2 type strings for the defender
 * @returns {{ weak: Array<{type,multiplier}>, resist: Array<{type,multiplier}>, immune: Array<{type,multiplier}>, neutral: Array<{type,multiplier}> }}
 */
function getDefensiveMatchups(chart, allTypes, defenderTypes) {
  const weak = [];
  const resist = [];
  const immune = [];
  const neutral = [];

  for (const atkType of allTypes) {
    let multiplier = 1;
    for (const defType of defenderTypes) {
      multiplier *= getEffectiveness(chart, atkType, defType);
    }

    const entry = { type: atkType, multiplier };
    if (multiplier === 0) {
      immune.push(entry);
    } else if (multiplier > 1) {
      weak.push(entry);
    } else if (multiplier < 1) {
      resist.push(entry);
    } else {
      neutral.push(entry);
    }
  }

  weak.sort((a, b) => b.multiplier - a.multiplier);
  resist.sort((a, b) => a.multiplier - b.multiplier);

  return { weak, resist, immune, neutral };
}

/**
 * Compute offensive matchups for a given attack type against all defender types.
 * @param {Object} chart - The chart object from types.json
 * @param {string[]} allTypes - Array of all 18 type names
 * @param {string} attackType - The attacking type
 * @returns {{ superEffective: string[], notVeryEffective: string[], noEffect: string[] }}
 */
function getOffensiveMatchups(chart, allTypes, attackType) {
  const superEffective = [];
  const notVeryEffective = [];
  const noEffect = [];

  for (const defType of allTypes) {
    const mult = getEffectiveness(chart, attackType, defType);
    if (mult === 0) {
      noEffect.push(defType);
    } else if (mult > 1) {
      superEffective.push(defType);
    } else if (mult < 1) {
      notVeryEffective.push(defType);
    }
  }

  return { superEffective, notVeryEffective, noEffect };
}

// --- Browser-only: load and cache types.json ---

let _typeData = null;

async function loadTypeData() {
  const response = await fetch('data/types.json');
  _typeData = await response.json();
  return _typeData;
}

function getTypeData() {
  return _typeData;
}

// --- Panel rendering ---

let selectedTypes = [];

/**
 * Format a multiplier value as a display string (e.g. 2, 0.5 → "2x", "0.5x").
 */
function formatMultiplier(mult) {
  if (mult === 4) return '4x';
  if (mult === 2) return '2x';
  if (mult === 0.5) return '0.5x';
  if (mult === 0.25) return '0.25x';
  return mult + 'x';
}

/**
 * Build the results section DOM for the current selectedTypes.
 * @param {HTMLElement} resultsEl - Container to populate
 */
function renderResults(resultsEl) {
  resultsEl.textContent = '';

  if (selectedTypes.length === 0) return;

  const data = getTypeData();
  if (!data) return;

  // Header
  const header = document.createElement('div');
  header.style.fontSize = '10px';
  header.style.color = 'var(--text-secondary)';
  header.style.marginBottom = '8px';
  header.style.fontWeight = '600';
  header.textContent = 'Defending as ' + selectedTypes.join('/') + ':';
  resultsEl.appendChild(header);

  // Defensive matchups
  const matchups = getDefensiveMatchups(data.chart, data.types, selectedTypes);

  if (matchups.weak.length > 0) {
    const section = document.createElement('div');
    section.className = 'matchup-section';

    const label = document.createElement('div');
    label.className = 'matchup-label';
    label.textContent = 'Weak to (takes extra damage)';
    section.appendChild(label);

    const list = document.createElement('div');
    list.className = 'matchup-list';
    for (const entry of matchups.weak) {
      const badgeWrap = document.createElement('span');
      badgeWrap.style.display = 'inline-flex';
      badgeWrap.style.alignItems = 'center';
      badgeWrap.style.gap = '2px';

      const badge = window.__ui.renderTypeBadgeEl(entry.type);
      badge.style.cursor = 'pointer';
      badge.addEventListener('click', function () {
        selectedTypes = [entry.type];
        renderResults(resultsEl);
        updateGridSelection(resultsEl.parentElement);
      });
      badgeWrap.appendChild(badge);

      const mult = document.createElement('span');
      mult.style.fontSize = '9px';
      mult.style.color = 'var(--red)';
      mult.style.fontWeight = '600';
      mult.textContent = formatMultiplier(entry.multiplier);
      badgeWrap.appendChild(mult);

      list.appendChild(badgeWrap);
    }
    section.appendChild(list);
    resultsEl.appendChild(section);
  }

  if (matchups.resist.length > 0) {
    const section = document.createElement('div');
    section.className = 'matchup-section';

    const label = document.createElement('div');
    label.className = 'matchup-label';
    label.textContent = 'Resistant to (takes less damage)';
    section.appendChild(label);

    const list = document.createElement('div');
    list.className = 'matchup-list';
    for (const entry of matchups.resist) {
      const badgeWrap = document.createElement('span');
      badgeWrap.style.display = 'inline-flex';
      badgeWrap.style.alignItems = 'center';
      badgeWrap.style.gap = '2px';

      const badge = window.__ui.renderTypeBadgeEl(entry.type);
      badge.style.cursor = 'pointer';
      badge.addEventListener('click', function () {
        selectedTypes = [entry.type];
        renderResults(resultsEl);
        updateGridSelection(resultsEl.parentElement);
      });
      badgeWrap.appendChild(badge);

      const mult = document.createElement('span');
      mult.style.fontSize = '9px';
      mult.style.color = 'var(--green)';
      mult.style.fontWeight = '600';
      mult.textContent = formatMultiplier(entry.multiplier);
      badgeWrap.appendChild(mult);

      list.appendChild(badgeWrap);
    }
    section.appendChild(list);
    resultsEl.appendChild(section);
  }

  if (matchups.immune.length > 0) {
    const section = document.createElement('div');
    section.className = 'matchup-section';

    const label = document.createElement('div');
    label.className = 'matchup-label';
    label.textContent = 'Immune to (takes no damage)';
    section.appendChild(label);

    const list = document.createElement('div');
    list.className = 'matchup-list';
    for (const entry of matchups.immune) {
      const badge = window.__ui.renderTypeBadgeEl(entry.type);
      badge.style.cursor = 'pointer';
      badge.addEventListener('click', function () {
        selectedTypes = [entry.type];
        renderResults(resultsEl);
        updateGridSelection(resultsEl.parentElement);
      });
      list.appendChild(badge);
    }
    section.appendChild(list);
    resultsEl.appendChild(section);
  }

  // Offense section — only for single type selection
  if (selectedTypes.length === 1) {
    const attackType = selectedTypes[0];
    const offense = getOffensiveMatchups(data.chart, data.types, attackType);

    if (offense.superEffective.length > 0) {
      const section = document.createElement('div');
      section.className = 'matchup-section';

      const label = document.createElement('div');
      label.className = 'matchup-label';
      label.textContent = attackType + ' is super effective against';
      section.appendChild(label);

      const list = document.createElement('div');
      list.className = 'matchup-list';
      for (const typeName of offense.superEffective) {
        const badge = window.__ui.renderTypeBadgeEl(typeName);
        badge.style.cursor = 'pointer';
        badge.addEventListener('click', function () {
          selectedTypes = [typeName];
          renderResults(resultsEl);
          updateGridSelection(resultsEl.parentElement);
        });
        list.appendChild(badge);
      }
      section.appendChild(list);
      resultsEl.appendChild(section);
    }
  }
}

/**
 * Sync the 'selected' CSS class on grid badges to match selectedTypes.
 * @param {HTMLElement} panelEl
 */
function updateGridSelection(panelEl) {
  const grid = panelEl && panelEl.querySelector('.type-grid');
  if (!grid) return;
  grid.querySelectorAll('.type-badge').forEach(function (badge) {
    const typeName = badge.dataset.typeName;
    if (typeName) {
      badge.classList.toggle('selected', selectedTypes.includes(typeName));
    }
  });
}

/**
 * Build the full type chart panel UI inside panelEl.
 * Called by app.js when the user opens the Types panel.
 * @param {HTMLElement} panelEl
 */
function renderPanel(panelEl) {
  panelEl.textContent = '';

  // Reset selection when panel is re-opened
  selectedTypes = [];

  // Title
  const title = document.createElement('div');
  title.style.fontFamily = 'var(--font-pixel)';
  title.style.fontSize = '0.5rem';
  title.style.color = 'var(--text-primary)';
  title.style.marginBottom = '6px';
  title.textContent = 'TYPE CHART';
  panelEl.appendChild(title);

  // Subtitle
  const subtitle = document.createElement('div');
  subtitle.style.fontSize = '10px';
  subtitle.style.color = 'var(--text-muted)';
  subtitle.style.marginBottom = '10px';
  subtitle.textContent = 'Select 1-2 types to see matchups';
  panelEl.appendChild(subtitle);

  const data = getTypeData();
  if (!data) {
    const err = document.createElement('div');
    err.style.fontSize = '11px';
    err.style.color = 'var(--red)';
    err.textContent = 'Type data not loaded.';
    panelEl.appendChild(err);
    return;
  }

  // Results container (placed after grid but created first for closure reference)
  const resultsEl = document.createElement('div');

  // Type selection grid
  const grid = document.createElement('div');
  grid.className = 'type-grid';

  for (const typeName of data.types) {
    const badge = window.__ui.renderTypeBadgeEl(typeName);
    badge.dataset.typeName = typeName;
    badge.style.cursor = 'pointer';

    badge.addEventListener('click', function () {
      const idx = selectedTypes.indexOf(typeName);
      if (idx !== -1) {
        // Deselect
        selectedTypes.splice(idx, 1);
      } else if (selectedTypes.length < 2) {
        // Add to selection
        selectedTypes.push(typeName);
      } else {
        // Replace second selection
        selectedTypes[1] = typeName;
      }
      updateGridSelection(panelEl);
      renderResults(resultsEl);
    });

    grid.appendChild(badge);
  }

  panelEl.appendChild(grid);
  panelEl.appendChild(resultsEl);
}

// CommonJS exports for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getEffectiveness, getDefensiveMatchups, getOffensiveMatchups };
}

// Attach to window for browser
if (typeof window !== 'undefined') {
  window.__typechart = {
    loadTypeData, getTypeData,
    getEffectiveness, getDefensiveMatchups, getOffensiveMatchups,
    renderPanel,
  };
}
