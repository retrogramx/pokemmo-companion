#!/usr/bin/env node
/**
 * enrich-catches.js
 * One-time script to add dex, types, method (cleaned), level, and percent
 * fields to all catch entries in src/data/unova.json.
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.resolve(__dirname, '../src/data/unova.json');

// Pokemon name → { dex, types }
const POKEMON_DATA = {
  // Gen 1 non-Unova found in Unova
  Clefairy:    { dex: 35,  types: ['Normal', 'Fairy'] },
  Vulpix:      { dex: 37,  types: ['Fire'] },
  Ninetales:   { dex: 38,  types: ['Fire'] },
  Shellder:    { dex: 90,  types: ['Water'] },
  Cloyster:    { dex: 91,  types: ['Water', 'Ice'] },
  Golduck:     { dex: 55,  types: ['Water'] },
  Magikarp:    { dex: 129, types: ['Water'] },
  Tangela:     { dex: 114, types: ['Grass'] },
  Lapras:      { dex: 131, types: ['Water', 'Ice'] },
  Ditto:       { dex: 132, types: ['Normal'] },
  Murkrow:     { dex: 198, types: ['Dark', 'Flying'] },
  Heracross:   { dex: 214, types: ['Bug', 'Fighting'] },
  Sneasel:     { dex: 215, types: ['Dark', 'Ice'] },
  Stantler:    { dex: 234, types: ['Normal'] },
  Remoraid:    { dex: 223, types: ['Water'] },
  Piloswine:   { dex: 221, types: ['Ice', 'Ground'] },
  Spheal:      { dex: 363, types: ['Ice', 'Water'] },
  Luvdisc:     { dex: 370, types: ['Water'] },
  Pinsir:      { dex: 127, types: ['Bug'] },
  Larvitar:    { dex: 246, types: ['Rock', 'Ground'] },
  Riolu:       { dex: 447, types: ['Fighting'] },
  Sandshrew:   { dex: 27,  types: ['Ground'] },

  // Unova Pokemon
  Patrat:      { dex: 504, types: ['Normal'] },
  Watchog:     { dex: 505, types: ['Normal'] },
  Lillipup:    { dex: 506, types: ['Normal'] },
  Herdier:     { dex: 507, types: ['Normal'] },
  Purrloin:    { dex: 509, types: ['Dark'] },
  Liepard:     { dex: 510, types: ['Dark'] },
  Pidove:      { dex: 519, types: ['Normal', 'Flying'] },
  Tranquill:   { dex: 520, types: ['Normal', 'Flying'] },
  Blitzle:     { dex: 522, types: ['Electric'] },
  Zebstrika:   { dex: 523, types: ['Electric'] },
  Roggenrola:  { dex: 524, types: ['Rock'] },
  Boldore:     { dex: 525, types: ['Rock'] },
  Woobat:      { dex: 527, types: ['Psychic', 'Flying'] },
  Drilbur:     { dex: 529, types: ['Ground'] },
  Excadrill:   { dex: 530, types: ['Ground', 'Steel'] },
  Audino:      { dex: 531, types: ['Normal'] },
  Timburr:     { dex: 532, types: ['Fighting'] },
  Tympole:     { dex: 535, types: ['Water'] },
  Palpitoad:   { dex: 536, types: ['Water', 'Ground'] },
  Throh:       { dex: 538, types: ['Fighting'] },
  Sawk:        { dex: 539, types: ['Fighting'] },
  Sewaddle:    { dex: 540, types: ['Bug', 'Grass'] },
  Venipede:    { dex: 543, types: ['Bug', 'Poison'] },
  Whirlipede:  { dex: 544, types: ['Bug', 'Poison'] },
  Cottonee:    { dex: 546, types: ['Grass', 'Fairy'] },
  Petilil:     { dex: 548, types: ['Grass'] },
  Basculin:    { dex: 550, types: ['Water'] },
  Sandile:     { dex: 551, types: ['Ground', 'Dark'] },
  Krokorok:    { dex: 552, types: ['Ground', 'Dark'] },
  Darumaka:    { dex: 554, types: ['Fire'] },
  Maractus:    { dex: 556, types: ['Grass'] },
  Dwebble:     { dex: 557, types: ['Bug', 'Rock'] },
  Scraggy:     { dex: 559, types: ['Dark', 'Fighting'] },
  Sigilyph:    { dex: 561, types: ['Psychic', 'Flying'] },
  Yamask:      { dex: 562, types: ['Ghost'] },
  Trubbish:    { dex: 568, types: ['Poison'] },
  Zorua:       { dex: 570, types: ['Dark'] },
  Minccino:    { dex: 572, types: ['Normal'] },
  Gothita:     { dex: 574, types: ['Psychic'] },
  Gothorita:   { dex: 575, types: ['Psychic'] },
  Solosis:     { dex: 577, types: ['Psychic'] },
  Duosion:     { dex: 578, types: ['Psychic'] },
  Ducklett:    { dex: 580, types: ['Water', 'Flying'] },
  Vanillite:   { dex: 582, types: ['Ice'] },
  Deerling:    { dex: 585, types: ['Normal', 'Grass'] },
  Emolga:      { dex: 587, types: ['Electric', 'Flying'] },
  Karrablast:  { dex: 588, types: ['Bug'] },
  Foongus:     { dex: 590, types: ['Grass', 'Poison'] },
  Frillish:    { dex: 592, types: ['Water', 'Ghost'] },
  Joltik:      { dex: 595, types: ['Bug', 'Electric'] },
  Ferroseed:   { dex: 597, types: ['Grass', 'Steel'] },
  Klink:       { dex: 599, types: ['Steel'] },
  Tynamo:      { dex: 602, types: ['Electric'] },
  Elgyem:      { dex: 605, types: ['Psychic'] },
  Litwick:     { dex: 607, types: ['Ghost', 'Fire'] },
  Axew:        { dex: 610, types: ['Dragon'] },
  Fraxure:     { dex: 611, types: ['Dragon'] },
  Cubchoo:     { dex: 613, types: ['Ice'] },
  Shelmet:     { dex: 616, types: ['Bug'] },
  Stunfisk:    { dex: 618, types: ['Ground', 'Electric'] },
  Mienfoo:     { dex: 619, types: ['Fighting'] },
  Druddigon:   { dex: 621, types: ['Dragon'] },
  Golett:      { dex: 622, types: ['Ground', 'Ghost'] },
  Pawniard:    { dex: 624, types: ['Dark', 'Steel'] },
  Bouffalant:  { dex: 626, types: ['Normal'] },
  Rufflet:     { dex: 627, types: ['Normal', 'Flying'] },
  Vullaby:     { dex: 629, types: ['Dark', 'Flying'] },
  Heatmor:     { dex: 631, types: ['Fire'] },
  Durant:      { dex: 632, types: ['Bug', 'Steel'] },
  Deino:       { dex: 633, types: ['Dark', 'Dragon'] },
  Larvesta:    { dex: 636, types: ['Bug', 'Fire'] },
  Volcarona:   { dex: 637, types: ['Bug', 'Fire'] },
  Hydreigon:   { dex: 635, types: ['Dark', 'Dragon'] },
  Metang:      { dex: 375, types: ['Steel', 'Psychic'] },
  Musharna:    { dex: 518, types: ['Psychic'] },
  Munna:       { dex: 517, types: ['Psychic'] },
  Drifloon:    { dex: 425, types: ['Ghost', 'Flying'] },
  Drifblim:    { dex: 426, types: ['Ghost', 'Flying'] },
  Cryogonal:   { dex: 615, types: ['Ice'] },
  Snivy:       { dex: 495, types: ['Grass'] },
  Tepig:       { dex: 498, types: ['Fire'] },

  // Special entries
  'Larvesta Egg': { dex: 636, types: ['Bug', 'Fire'] },
};

const RATE_TO_PERCENT = {
  'Very Common': 35,
  'Common':      25,
  'Uncommon':    15,
  'Rare':         5,
  'Very Rare':    1,
};

/**
 * Splits "Grass Lv.2-4" → { method: "Grass", level: "Lv.2-4" }
 * If no " Lv." found → { method: <whole string>, level: null }
 */
function parseMethod(str) {
  const lvIdx = str.lastIndexOf(' Lv.');
  if (lvIdx === -1) {
    return { method: str, level: null };
  }
  return {
    method: str.slice(0, lvIdx),
    level: str.slice(lvIdx + 1), // skip the space, keep "Lv.X"
  };
}

function main() {
  const raw = fs.readFileSync(DATA_PATH, 'utf8');
  const data = JSON.parse(raw);

  // Collect all unique Pokemon names to validate coverage
  const allNames = new Set();
  for (const loc of data.locations) {
    if (loc.catches) {
      for (const c of loc.catches) {
        allNames.add(c.name);
      }
    }
  }

  const missing = [...allNames].filter(n => !POKEMON_DATA[n]).sort();
  if (missing.length > 0) {
    console.warn('WARNING: No data for these Pokemon — they will be skipped:');
    missing.forEach(n => console.warn('  -', n));
  }

  let enriched = 0;
  let skipped = 0;

  for (const loc of data.locations) {
    if (!loc.catches) continue;
    loc.catches = loc.catches.map(entry => {
      const pdata = POKEMON_DATA[entry.name];
      if (!pdata) {
        skipped++;
        return entry; // leave as-is
      }

      const { method, level } = parseMethod(entry.method);
      const percent = RATE_TO_PERCENT[entry.rate] ?? 10;

      // Build enriched entry preserving field order:
      // name, dex, types, method, level, percent, rate, top25 (if present), why
      const enrichedEntry = {
        name:    entry.name,
        dex:     pdata.dex,
        types:   pdata.types,
        method,
        ...(level !== null ? { level } : {}),
        percent,
        rate:    entry.rate,
        ...(entry.top25 !== undefined ? { top25: entry.top25 } : {}),
        ...(entry.why   !== undefined ? { why:   entry.why }   : {}),
      };

      enriched++;
      return enrichedEntry;
    });
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log(`Done. Enriched: ${enriched}, Skipped (unknown): ${skipped}`);
  if (missing.length === 0) {
    console.log('All Pokemon accounted for!');
  }
}

main();
