#!/usr/bin/env node

/**
 * convert-data.js
 *
 * Extracts walkthrough, catchData, and locationMaps from the legacy
 * PokeMMO Unova Checklist HTML file and writes structured JSON.
 *
 * Uses regex-based parsing only -- NO eval(), NO Function(), NO code
 * string interpretation of any kind.
 */

const fs = require('fs');
const path = require('path');

const SOURCE = path.resolve(__dirname, '../../pokemmo-unova-checklist/index.html');
const OUTPUT = path.resolve(__dirname, '../src/data/unova.json');

const html = fs.readFileSync(SOURCE, 'utf-8');

// ---------------------------------------------------------------------------
// 1. Parse walkthrough array
// ---------------------------------------------------------------------------

// Extract the walkthrough block: from "const walkthrough = [" to the matching "];"
const wtStart = html.indexOf('const walkthrough = [');
if (wtStart === -1) throw new Error('Could not find walkthrough array');
// Find the closing "];" by tracking bracket depth
let wtEnd = -1;
{
  let depth = 0;
  let i = html.indexOf('[', wtStart);
  for (; i < html.length; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') {
      depth--;
      if (depth === 0) { wtEnd = i + 1; break; }
    }
  }
}
if (wtEnd === -1) throw new Error('Could not find end of walkthrough array');
const wtBlock = html.slice(wtStart, wtEnd);

// Parse each location entry via regex
const locationRegex = /\{\s*location:\s*"([^"]+)"\s*,\s*steps:\s*\[([\s\S]*?)\]\s*\}/g;
const locations = [];
let m;
while ((m = locationRegex.exec(wtBlock)) !== null) {
  const name = m[1];
  const stepsRaw = m[2];
  // Extract individual step strings (they're quoted with double quotes)
  const stepStrings = [];
  const stepRegex = /"((?:[^"\\]|\\.)*)"/g;
  let sm;
  while ((sm = stepRegex.exec(stepsRaw)) !== null) {
    stepStrings.push(sm[1]);
  }
  locations.push({ name, rawSteps: stepStrings });
}

// ---------------------------------------------------------------------------
// 2. Parse catchData object
// ---------------------------------------------------------------------------

const cdStart = html.indexOf('const catchData = {');
if (cdStart === -1) throw new Error('Could not find catchData');
let cdEnd = -1;
{
  let depth = 0;
  let i = html.indexOf('{', cdStart);
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
      depth--;
      if (depth === 0) { cdEnd = i + 1; break; }
    }
  }
}
if (cdEnd === -1) throw new Error('Could not find end of catchData');
const cdBlock = html.slice(cdStart, cdEnd);

// Parse each location key and its array of catch entries
const catchData = {};
const catchLocRegex = /"([^"]+)"\s*:\s*\[([\s\S]*?)\]/g;
while ((m = catchLocRegex.exec(cdBlock)) !== null) {
  const locName = m[1];
  const entriesRaw = m[2].trim();
  const entries = [];
  if (entriesRaw.length > 0) {
    // Parse each {name:..., method:..., ...} object
    const objRegex = /\{([^}]+)\}/g;
    let om;
    while ((om = objRegex.exec(entriesRaw)) !== null) {
      const objStr = om[1];
      const entry = {};
      // Parse key:value pairs
      // Values can be: "string", true, false, or unquoted identifiers
      const kvRegex = /(\w+)\s*:\s*(?:"((?:[^"\\]|\\.)*)"|(\w+))/g;
      let kv;
      while ((kv = kvRegex.exec(objStr)) !== null) {
        const key = kv[1];
        let val = kv[2] !== undefined ? kv[2] : kv[3];
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        entry[key] = val;
      }
      if (entry.name) entries.push(entry);
    }
  }
  catchData[locName] = entries;
}

// ---------------------------------------------------------------------------
// 3. Parse locationMaps object
// ---------------------------------------------------------------------------

const lmStart = html.indexOf('const locationMaps = {');
if (lmStart === -1) throw new Error('Could not find locationMaps');
let lmEnd = -1;
{
  let depth = 0;
  let i = html.indexOf('{', lmStart);
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
      depth--;
      if (depth === 0) { lmEnd = i + 1; break; }
    }
  }
}
if (lmEnd === -1) throw new Error('Could not find end of locationMaps');
const lmBlock = html.slice(lmStart, lmEnd);

const locationMaps = {};
const mapRegex = /"([^"]+)"\s*:\s*"([^"]+)"/g;
while ((m = mapRegex.exec(lmBlock)) !== null) {
  locationMaps[m[1]] = m[2];
}

// ---------------------------------------------------------------------------
// 4. Transform steps: strip HTML spans, extract tags
// ---------------------------------------------------------------------------

const TAG_CLASS_MAP = {
  'item': 'items',
  'battle': 'battles',
  'pokemon': 'pokemon',
  'tip': 'tips',
  'hidden-item': 'hiddenItems',
  'gym': 'gym',
};

function processStep(rawHtml) {
  const tags = {};

  // Extract all <span class='CLASS'>CONTENT</span> occurrences
  const spanRegex = /<span class='([^']+)'>([^<]*)<\/span>/g;
  let sm;
  while ((sm = spanRegex.exec(rawHtml)) !== null) {
    const cls = sm[1];
    const content = sm[2];
    const tagKey = TAG_CLASS_MAP[cls];
    if (tagKey) {
      if (!tags[tagKey]) tags[tagKey] = [];
      tags[tagKey].push(content);
    }
  }

  // Strip all HTML tags to get plain text
  const text = rawHtml.replace(/<[^>]+>/g, '');

  const result = { text };
  if (Object.keys(tags).length > 0) {
    result.tags = tags;
  }
  return result;
}

// ---------------------------------------------------------------------------
// 5. Match catch data and maps to locations, build output
// ---------------------------------------------------------------------------

function getBaseName(locName) {
  // Strip parenthetical suffixes like (REVISIT), (POST), etc.
  let base = locName.replace(/\s*\(.*?\)\s*/g, '').trim();
  // Strip POST-GAME: prefix
  if (base.startsWith('POST-GAME:')) {
    base = base.replace('POST-GAME:', '').trim();
  }
  return base;
}

function findCatches(locName) {
  // Try exact match
  if (catchData[locName] && catchData[locName].length > 0) return catchData[locName];
  // Try base name
  const base = getBaseName(locName);
  if (base !== locName && catchData[base] && catchData[base].length > 0) return catchData[base];
  return null;
}

function findMap(locName) {
  // Try exact match
  if (locationMaps[locName]) return locationMaps[locName];
  // Try base name
  const base = getBaseName(locName);
  if (base !== locName && locationMaps[base]) return locationMaps[base];
  // Try splitting on "/"
  if (locName.includes('/')) {
    for (const part of locName.split('/')) {
      const p = part.replace(/\s*\(.*?\)\s*/g, '').trim();
      if (locationMaps[p]) return locationMaps[p];
    }
  }
  return null;
}

function formatCatch(entry) {
  const result = { name: entry.name };
  if (entry.method) result.method = entry.method;
  if (entry.rate) result.rate = entry.rate;
  if (entry.top25 === true) result.top25 = true;
  if (entry.lure === true) result.lure = true;
  if (entry.why) result.why = entry.why;
  return result;
}

const output = {
  region: 'Unova',
  locations: locations.map(loc => {
    const entry = { name: loc.name };

    // Steps
    entry.steps = loc.rawSteps.map(processStep);

    // Catches
    const catches = findCatches(loc.name);
    if (catches && catches.length > 0) {
      entry.catches = catches.map(formatCatch);
    }

    // Maps
    const mapUrl = findMap(loc.name);
    if (mapUrl) {
      entry.maps = { overview: mapUrl };
    }

    return entry;
  }),
};

// ---------------------------------------------------------------------------
// 6. Write output
// ---------------------------------------------------------------------------

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + '\n', 'utf-8');

// Verification
const totalSteps = output.locations.reduce((sum, loc) => sum + loc.steps.length, 0);
console.log('Wrote ' + OUTPUT);
console.log('  Locations: ' + output.locations.length);
console.log('  Total steps: ' + totalSteps);
console.log('  Locations with catches: ' + output.locations.filter(l => l.catches).length);
console.log('  Locations with maps: ' + output.locations.filter(l => l.maps).length);

if (output.locations.length < 80) {
  console.error('WARNING: Expected 80+ locations, got ' + output.locations.length);
  process.exit(1);
}
if (totalSteps < 400) {
  console.error('WARNING: Expected 400+ steps, got ' + totalSteps);
  process.exit(1);
}

console.log('\nVerification passed!');
