/**
 * UI module — shared render functions for type badges, rarity colors, stat pills.
 * Pure functions only. No side effects, no global state.
 */

const TYPE_COLORS = {
  Normal:   { bg: '#A8A878', text: '#fff' },
  Fire:     { bg: '#F08030', text: '#fff' },
  Water:    { bg: '#6890F0', text: '#fff' },
  Grass:    { bg: '#78C850', text: '#fff' },
  Electric: { bg: '#F8D030', text: '#333' },
  Ice:      { bg: '#98D8D8', text: '#333' },
  Fighting: { bg: '#C03028', text: '#fff' },
  Poison:   { bg: '#A040A0', text: '#fff' },
  Ground:   { bg: '#E0C068', text: '#333' },
  Flying:   { bg: '#A890F0', text: '#fff' },
  Psychic:  { bg: '#F85888', text: '#fff' },
  Bug:      { bg: '#A8B820', text: '#fff' },
  Rock:     { bg: '#B8A038', text: '#fff' },
  Ghost:    { bg: '#705898', text: '#fff' },
  Dark:     { bg: '#705848', text: '#fff' },
  Dragon:   { bg: '#7038F8', text: '#fff' },
  Steel:    { bg: '#B8B8D0', text: '#333' },
  Fairy:    { bg: '#EE99AC', text: '#333' },
};

const TYPE_ABBR = {
  Normal:   'NRM',
  Fire:     'FIR',
  Water:    'WTR',
  Grass:    'GRS',
  Electric: 'ELC',
  Ice:      'ICE',
  Fighting: 'FGT',
  Poison:   'PSN',
  Ground:   'GND',
  Flying:   'FLY',
  Psychic:  'PSY',
  Bug:      'BUG',
  Rock:     'RCK',
  Ghost:    'GHO',
  Dark:     'DRK',
  Dragon:   'DRG',
  Steel:    'STL',
  Fairy:    'FRY',
};

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const ITEM_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items';

function spriteUrl(dex) {
  return SPRITE_BASE + '/' + dex + '.png';
}

function itemSpriteUrl(name) {
  return ITEM_SPRITE_BASE + '/' + name + '.png';
}

function makeTypeBadge(typeName) {
  const entry = TYPE_COLORS[typeName];
  if (!entry) return { bg: '#888', text: '#fff' };
  return { text: typeName, bg: entry.bg, textColor: entry.text };
}

function makeTypeBadgeMini(typeName) {
  const entry = TYPE_COLORS[typeName];
  if (!entry) {
    return {
      text: typeName.slice(0, 3).toUpperCase(),
      bg: '#888',
      textColor: '#fff',
    };
  }
  return { text: TYPE_ABBR[typeName], bg: entry.bg, textColor: entry.text };
}

function _clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function rarityHue(pct) {
  return (_clamp(pct, 0, 100) / 100) * 120;
}

function rarityColor(pct) {
  var hue = rarityHue(pct);
  return 'hsl(' + hue + ', 75%, 55%)';
}

function rarityBorder(pct) {
  var hue = rarityHue(pct);
  return 'hsla(' + hue + ', 75%, 55%, 0.3)';
}

function rarityBg(pct) {
  var hue = rarityHue(pct);
  return 'hsla(' + hue + ', 75%, 55%, 0.1)';
}

function buildStatPillsData(encounter, level, percent) {
  return {
    encounter: encounter,
    level: level,
    percent: percent,
    percentColor: rarityColor(percent),
  };
}

function renderTypeBadgeEl(typeName) {
  var badge = makeTypeBadge(typeName);
  var el = document.createElement('span');
  el.className = 'type-badge';
  el.textContent = badge.text;
  el.style.background = badge.bg;
  el.style.color = badge.textColor;
  return el;
}

function renderTypeBadgeMiniEl(typeName) {
  var badge = makeTypeBadgeMini(typeName);
  var el = document.createElement('span');
  el.className = 'type-badge type-badge--mini';
  el.textContent = badge.text;
  el.style.background = badge.bg;
  el.style.color = badge.textColor;
  return el;
}

function renderStarBadge(stars) {
  var el = document.createElement('span');
  el.className = 'star-badge';
  var filled = Math.min(3, Math.max(0, stars));
  el.textContent = '\u2605'.repeat(filled) + '\u2606'.repeat(3 - filled);
  return el;
}

function renderStatPillsEl(encounter, level, percent) {
  var data = buildStatPillsData(encounter, level, percent);
  var el = document.createElement('div');
  el.className = 'stat-pills';

  var pillEnc = document.createElement('span');
  pillEnc.className = 'stat-pill';
  pillEnc.textContent = 'x' + data.encounter;

  var pillLv = document.createElement('span');
  pillLv.className = 'stat-pill';
  pillLv.textContent = 'Lv ' + data.level;

  var pillPct = document.createElement('span');
  pillPct.className = 'stat-pill';
  pillPct.style.color = data.percentColor;
  pillPct.textContent = data.percent + '%';

  el.appendChild(pillEnc);
  el.appendChild(pillLv);
  el.appendChild(pillPct);
  return el;
}

function renderSpriteEl(dex, alt) {
  var img = document.createElement('img');
  img.src = spriteUrl(dex);
  img.alt = alt || ('Pokemon #' + dex);
  img.className = 'pokemon-sprite';
  return img;
}

function renderPokeballToggle(caught, onClick) {
  var btn = document.createElement('button');
  btn.className = 'pokeball-toggle' + (caught ? ' caught' : '');
  btn.title = caught ? 'Caught' : 'Not caught';
  btn.textContent = caught ? '\u25CF' : '\u25CB';
  if (onClick) btn.addEventListener('click', onClick);
  return btn;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TYPE_COLORS,
    TYPE_ABBR,
    SPRITE_BASE,
    ITEM_SPRITE_BASE,
    spriteUrl,
    itemSpriteUrl,
    makeTypeBadge,
    makeTypeBadgeMini,
    rarityHue,
    rarityColor,
    rarityBorder,
    rarityBg,
    buildStatPillsData,
  };
}

if (typeof window !== 'undefined') {
  window.__ui = {
    TYPE_COLORS,
    TYPE_ABBR,
    SPRITE_BASE,
    ITEM_SPRITE_BASE,
    spriteUrl,
    itemSpriteUrl,
    makeTypeBadge,
    makeTypeBadgeMini,
    rarityHue,
    rarityColor,
    rarityBorder,
    rarityBg,
    buildStatPillsData,
    renderTypeBadgeEl,
    renderTypeBadgeMiniEl,
    renderStarBadge,
    renderStatPillsEl,
    renderSpriteEl,
    renderPokeballToggle,
  };
}
