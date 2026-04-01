/**
 * Type effectiveness module — Gen 5 type chart lookups.
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

// CommonJS exports for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getEffectiveness, getDefensiveMatchups, getOffensiveMatchups };
}

// Attach to window for browser
if (typeof window !== 'undefined') {
  window.__typechart = { loadTypeData, getTypeData, getEffectiveness, getDefensiveMatchups, getOffensiveMatchups };
}
