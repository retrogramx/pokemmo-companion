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
  Fighting: 'FTG',
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
  el.className = 'type-badge-mini';
  el.textContent = badge.text;
  el.style.background = badge.bg;
  el.style.color = badge.textColor;
  return el;
}

function renderStarBadge(size) {
  var ns = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', size || 10);
  svg.setAttribute('height', size || 10);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', '#ffc048');
  svg.setAttribute('class', 'star-badge');
  var poly = document.createElementNS(ns, 'polygon');
  poly.setAttribute('points', '12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26');
  svg.appendChild(poly);
  return svg;
}

function renderStatPillsEl(encounter, level, percent) {
  var wrap = document.createElement('div');
  wrap.className = 'stat-pills';

  var s1 = document.createElement('span');
  s1.className = 'stat-pill stat-pill-encounter';
  s1.textContent = encounter;
  wrap.appendChild(s1);

  if (level) {
    var s2 = document.createElement('span');
    s2.className = 'stat-pill stat-pill-level';
    s2.textContent = level;
    wrap.appendChild(s2);
  }

  var s3 = document.createElement('span');
  s3.className = 'stat-pill stat-pill-percent';
  s3.textContent = (percent || 0) + '%';
  s3.style.color = rarityColor(percent || 0);
  s3.style.borderColor = rarityBorder(percent || 0);
  s3.style.background = rarityBg(percent || 0);
  wrap.appendChild(s3);

  return wrap;
}

function renderSpriteEl(dex, size) {
  var s = size || 'lg';
  var px = s === 'sm' ? 24 : s === 'md' ? 36 : 48;
  var wrap = document.createElement('div');
  wrap.className = 'sprite-box sprite-box-' + s;
  var img = document.createElement('img');
  img.src = spriteUrl(dex);
  img.width = px;
  img.height = px;
  img.style.imageRendering = 'pixelated';
  img.className = 'sprite-img';
  wrap.appendChild(img);
  return wrap;
}

function renderPokeballToggle(caught, onClick) {
  var wrap = document.createElement('div');
  wrap.className = 'pokeball-toggle' + (caught ? ' caught' : '');
  wrap.title = caught ? 'Mark as uncaught' : 'Mark as caught';
  var img = document.createElement('img');
  img.src = itemSpriteUrl('poke-ball');
  img.style.imageRendering = 'pixelated';
  img.className = 'pokeball-img';
  img.width = 24;
  img.height = 24;
  wrap.appendChild(img);
  if (onClick) wrap.addEventListener('click', onClick);
  return wrap;
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
