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

// Direction patterns for auto-highlighting — match compass words not inside HTML tags
// Full words: north, south, east, west. Abbreviations only when uppercase: NE, NW, SE, SW
var DIRECTION_FULL_REGEX = /\b(north|south|east|west)\b/gi;
var DIRECTION_ABBR_REGEX = /\b(NE|NW|SE|SW)\b/g;

/**
 * Highlight tagged words in step text with styled spans.
 * Also auto-detects directions (compass words → cyan uppercase).
 */
function highlightText(text, tags) {
  var result = text;

  // 1. Apply explicit tags first
  if (tags) {
    for (var tagKey in TAG_CLASS_MAP) {
      var cssClass = TAG_CLASS_MAP[tagKey];
      var values = tags[tagKey];
      if (!values) continue;
      for (var vi = 0; vi < values.length; vi++) {
        result = result.replace(values[vi], '<span class="' + cssClass + '">' + values[vi] + '</span>');
      }
    }
  }

  // 2. Auto-highlight directions (full compass words + uppercase abbreviations)
  result = result.replace(DIRECTION_FULL_REGEX, function(match) {
    return '<span class="hl-direction">' + match.toUpperCase() + '</span>';
  });
  result = result.replace(DIRECTION_ABBR_REGEX, function(match) {
    return '<span class="hl-direction">' + match + '</span>';
  });

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
let battleData = null;
let hiddenItemData = null;
let currentProfile = null;

async function loadRegionData() {
  const [regionResp, battleResp, hiddenResp] = await Promise.all([
    fetch('data/unova.json'),
    fetch('data/battles.json').catch(function() { return null; }),
    fetch('data/hidden-items.json').catch(function() { return null; }),
  ]);
  regionData = await regionResp.json();
  if (battleResp && battleResp.ok) {
    battleData = await battleResp.json();
  }
  if (hiddenResp && hiddenResp.ok) {
    hiddenItemData = await hiddenResp.json();
  }
  return regionData;
}

function updateHeader(locName, locDone, locTotal) {
  var locEl = document.getElementById('headerLocation');
  var wrapEl = document.getElementById('headerLocationWrap');
  if (locEl) locEl.textContent = locName;

  // Check if text overflows and enable continuous marquee scroll
  if (wrapEl && locEl) {
    wrapEl.classList.remove('marquee');
    // Remove any duplicate span from previous render
    var dupeSpan = wrapEl.querySelector('.header-location-dupe');
    if (dupeSpan) dupeSpan.parentNode.removeChild(dupeSpan);
    locEl.style.animation = 'none';
    locEl.style.display = 'inline-block';
    void locEl.offsetWidth;
    locEl.style.animation = '';
    setTimeout(function() {
      if (locEl.scrollWidth > wrapEl.clientWidth) {
        // Add a duplicate with gap for seamless loop
        var dupe = document.createElement('span');
        dupe.className = 'header-location header-location-dupe';
        dupe.textContent = '\u00a0\u00a0\u00a0\u2022\u00a0\u00a0\u00a0' + locName;
        dupe.style.cssText = locEl.style.cssText;
        locEl.appendChild(dupe);
        // Total scroll distance = original text + gap + dupe
        var totalWidth = locEl.scrollWidth;
        var halfWidth = Math.ceil(totalWidth / 2);
        locEl.style.setProperty('--marquee-distance', '-' + halfWidth + 'px');
        // Speed: ~40px per second
        var duration = Math.max(5, halfWidth / 40);
        locEl.style.setProperty('--marquee-duration', duration + 's');
        wrapEl.classList.add('marquee');
      }
    }, 50);
  }

  var countEl = document.getElementById('headerProgress');
  if (countEl) countEl.textContent = locDone + '/' + locTotal;

  var fillEl = document.getElementById('headerProgressFill');
  if (fillEl) {
    var pct = locTotal > 0 ? Math.round((locDone / locTotal) * 100) : 0;
    fillEl.style.width = pct + '%';
  }

  // Overall progress
  var totalEl = document.getElementById('headerProgressTotal');
  if (totalEl && regionData) {
    var totalSteps = 0;
    var totalDone = 0;
    var completed = getCompletedSteps();
    regionData.locations.forEach(function(loc, idx) {
      totalSteps += loc.steps.length;
      loc.steps.forEach(function(_, si) {
        if (completed[idx + '-' + si]) totalDone++;
      });
    });
    var overallPct = totalSteps > 0 ? Math.round((totalDone / totalSteps) * 100) : 0;
    totalEl.textContent = overallPct + '%';
  }
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
  updateHeader(loc.name, locDone, loc.steps.length);

  // Update expand bar count
  var expandCount = document.getElementById('expandBarCount');
  if (expandCount && current) {
    expandCount.textContent = locDone + '/' + loc.steps.length + ' steps';
  }
}

function renderFull() {
  if (!regionData || !currentProfile) return;

  const container = document.getElementById('guideSteps');
  if (!container) return;

  const completed = getCompletedSteps();
  const current = findCurrentStep();

  // Clear container using textContent (safe, no innerHTML on container)
  container.textContent = '';
  container.scrollTop = 0;

  // Show current location + a couple upcoming
  const startLoc = current ? current.location : 0;
  const endLoc = Math.min(startLoc + 3, regionData.locations.length);

  for (let locIdx = startLoc; locIdx < endLoc; locIdx++) {
    const location = regionData.locations[locIdx];
    const states = buildStepState(location.steps.length, completed, locIdx);

    // Location banner (catches + battles) for current location
    if (locIdx === startLoc) {
      var caughtPokemon = (currentProfile && currentProfile.caughtPokemon) ? currentProfile.caughtPokemon : {};
      var banner = renderCatchBanner(location, caughtPokemon);
      if (banner) container.appendChild(banner);
    }

    if (locIdx > startLoc) {
      var divider = document.createElement('div');
      divider.className = 'location-divider';
      var dividerLabel = document.createElement('span');
      dividerLabel.className = 'label';
      dividerLabel.textContent = location.name;
      divider.appendChild(dividerLabel);
      var dividerLine = document.createElement('div');
      dividerLine.className = 'line';
      divider.appendChild(dividerLine);
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

      // Attach hidden item tooltips/click-to-view
      if (hiddenItemData) {
        attachHiddenItemPopouts(textSpan, location.name);
      }

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
  var hasCatches = location.catches && location.catches.length > 0 && window.__catches;
  var locationBattles = getLocationBattles(location.name);
  var hasBattles = locationBattles && locationBattles.length > 0;

  if (!hasCatches && !hasBattles) return null;

  var banner = document.createElement('div');
  banner.className = 'catch-banner';

  var collapsed = window.__catches && window.__catches.isBannerCollapsed();
  if (collapsed) banner.classList.add('collapsed');

  // Header
  var header = document.createElement('div');
  header.className = 'catch-banner-header';

  var title = document.createElement('div');
  title.className = 'catch-banner-title';
  var icon = document.createElement('div');
  icon.style.cssText = 'width:14px;height:14px;min-width:14px;background:rgba(91,141,239,0.2);border-radius:3px;border:1px solid rgba(91,141,239,0.3);';
  title.appendChild(icon);

  var parts = [];
  var sorted = hasCatches ? window.__catches.sortCatches(location.catches) : [];
  if (hasCatches) parts.push(sorted.length + ' Pok\u00e9mon');
  if (hasBattles) parts.push(locationBattles.length + ' Battle' + (locationBattles.length > 1 ? 's' : ''));
  var titleText = document.createElement('span');
  titleText.textContent = parts.join(' \u00b7 ');
  title.appendChild(titleText);
  header.appendChild(title);

  var layout = hasCatches ? window.__catches.chooseBannerLayout(sorted.length) : 'none';

  if (layout === 'icetray') {
    var hint = document.createElement('span');
    hint.className = 'catch-banner-hint';
    hint.textContent = 'tap to inspect';
    header.appendChild(hint);
  }

  header.addEventListener('click', function() {
    var isCollapsed = banner.classList.contains('collapsed');
    banner.classList.toggle('collapsed');
    if (window.__catches) window.__catches.setBannerCollapsed(!isCollapsed);
  });

  banner.appendChild(header);

  var body = document.createElement('div');
  body.className = 'catch-banner-body';

  // Catches section
  if (hasCatches && layout !== 'none') {
    if (layout === 'cards') {
      renderCardLayout(body, sorted, caughtPokemon);
    } else {
      renderIceTrayLayout(body, sorted, caughtPokemon);
    }
  }

  // Battles section (inside same banner, below catches)
  if (hasBattles) {
    if (hasCatches) {
      var divider = document.createElement('div');
      divider.style.cssText = 'height:1px;background:var(--border-subtle);margin:8px 0;';
      body.appendChild(divider);
    }
    renderBattleSection(body, locationBattles);
  }

  banner.appendChild(body);
  return banner;
}

/**
 * Get all battles for a location from battleData.
 * Returns array of {name, trainer} objects.
 */
function getLocationBattles(locationName) {
  if (!battleData) return [];
  var results = [];
  // Check exact location name and variants
  var keysToCheck = [locationName];
  // Also check keys that start with the location name (e.g., "STRIATON CITY|GYM")
  Object.keys(battleData).forEach(function(key) {
    if (key === locationName || key.indexOf(locationName + '|') === 0) {
      var trainers = battleData[key];
      Object.keys(trainers).forEach(function(tName) {
        results.push({ name: tName, trainer: trainers[tName], locationKey: key });
      });
    }
  });
  return results;
}

/**
 * Render battle section inside the banner.
 */
function renderBattleSection(container, battles) {
  var ui = window.__ui;
  if (!ui) return;

  var profile = window.__profiles && window.__profiles.getActiveProfile();
  var starter = profile ? profile.starter : null;

  battles.forEach(function(b) {
    var card = document.createElement('div');
    card.className = 'battle-card';
    card.style.margin = '0';
    card.style.marginBottom = '6px';

    // Header: VS name + note
    var header = document.createElement('div');
    header.className = 'battle-card-header';
    var titleEl = document.createElement('span');
    titleEl.className = 'battle-card-title';
    titleEl.textContent = 'VS ' + b.name;
    header.appendChild(titleEl);
    if (b.trainer.note) {
      var noteEl = document.createElement('span');
      noteEl.className = 'battle-card-note';
      noteEl.textContent = b.trainer.note;
      header.appendChild(noteEl);
    }
    card.appendChild(header);

    // Pick the right team for starter-dependent battles
    var teamsToShow = b.trainer.teams;
    if (b.trainer.pick1 && starter && b.trainer.teams.length >= 3) {
      var starterMap = { 'Snivy': 0, 'Tepig': 1, 'Oshawott': 2 };
      var idx = starterMap[starter];
      if (idx !== undefined && b.trainer.teams[idx]) {
        teamsToShow = [b.trainer.teams[idx]];
      }
    }

    // Render Pokemon team(s)
    teamsToShow.forEach(function(team) {
      // Extract variant note if present (usually last item with just a note field)
      var variantNote = null;
      var actualPokemon = [];
      team.forEach(function(mon) {
        if (mon.note && !mon.name) {
          variantNote = mon.note;
        } else {
          actualPokemon.push(mon);
        }
      });

      // Show variant note above the team
      if (variantNote) {
        var noteDiv = document.createElement('div');
        noteDiv.className = 'battle-variant-note';
        noteDiv.textContent = variantNote;
        card.appendChild(noteDiv);
      }

      var teamEl = document.createElement('div');
      teamEl.className = 'battle-team';

      actualPokemon.forEach(function(mon) {
        var monEl = document.createElement('div');
        monEl.className = 'battle-pokemon';
        var dex = getDexForName(mon.name);
        if (dex) {
          var sprite = document.createElement('img');
          sprite.src = ui.spriteUrl(dex);
          sprite.width = 36;
          sprite.height = 36;
          sprite.style.imageRendering = 'pixelated';
          monEl.appendChild(sprite);
        }
        var monInfo = document.createElement('div');
        var nameSpan = document.createElement('span');
        nameSpan.className = 'battle-pokemon-name';
        nameSpan.textContent = mon.name;
        monInfo.appendChild(nameSpan);
        var lvSpan = document.createElement('span');
        lvSpan.className = 'battle-pokemon-lv';
        lvSpan.textContent = 'Lv.' + mon.lv;
        monInfo.appendChild(lvSpan);
        if (mon.types) {
          var typesWrap = document.createElement('div');
          typesWrap.style.cssText = 'display:flex;gap:2px;margin-top:2px;';
          mon.types.forEach(function(t) { typesWrap.appendChild(ui.renderTypeBadgeEl(t)); });
          monInfo.appendChild(typesWrap);

          // Weakness hints — show what types are super effective
          var tc = window.__typechart;
          if (tc && tc.getTypeData && tc.getTypeData()) {
            var data = tc.getTypeData();
            var matchups = tc.getDefensiveMatchups(data.chart, data.types, mon.types);
            if (matchups.weak.length > 0) {
              var weakWrap = document.createElement('div');
              weakWrap.style.cssText = 'display:flex;align-items:center;gap:2px;margin-top:2px;flex-wrap:wrap;';
              var weakLabel = document.createElement('span');
              weakLabel.style.cssText = 'font-size:9px;color:var(--text-muted);';
              weakLabel.textContent = 'weak:';
              weakWrap.appendChild(weakLabel);
              matchups.weak.forEach(function(w) {
                var badge = ui.renderTypeBadgeEl(w.type);
                badge.style.fontSize = '7px';
                badge.style.padding = '0 4px';
                badge.style.lineHeight = '12px';
                if (w.multiplier >= 4) {
                  badge.style.outline = '1px solid var(--red)';
                }
                weakWrap.appendChild(badge);
              });
              monInfo.appendChild(weakWrap);
            }
          }
        }
        monEl.appendChild(monInfo);
        teamEl.appendChild(monEl);
      });
      card.appendChild(teamEl);
    });

    container.appendChild(card);
  });
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
      // Full card for top25: sprite | info | pokeball
      var card = document.createElement('div');
      card.className = 'catch-card' + (caught ? ' caught' : '');

      // Sprite
      card.appendChild(ui.renderSpriteEl(c.dex, 'lg'));

      // Info column
      var info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0;';

      // Name + star + type badges
      var nameRow = document.createElement('div');
      nameRow.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;';
      var nameSpan = document.createElement('span');
      nameSpan.className = 'catch-name';
      nameSpan.textContent = c.name;
      nameRow.appendChild(nameSpan);
      nameRow.appendChild(ui.renderStarBadge(10));
      if (c.types) {
        for (var t2 = 0; t2 < c.types.length; t2++) {
          nameRow.appendChild(ui.renderTypeBadgeEl(c.types[t2]));
        }
      }
      info.appendChild(nameRow);

      // Stat pills
      info.appendChild(ui.renderStatPillsEl(c.method, c.level || '', c.percent || 0));

      // Why text
      if (c.why) {
        var whyEl = document.createElement('div');
        whyEl.className = 'catch-why';
        whyEl.textContent = c.why;
        info.appendChild(whyEl);
      }
      card.appendChild(info);

      // Pokeball toggle (right side)
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
      // Compact row for non-top25: sprite | info | pokeball
      var row = document.createElement('div');
      row.className = 'catch-row' + (caught ? ' caught' : '');

      // Medium sprite
      row.appendChild(ui.renderSpriteEl(c.dex, 'md'));

      // Name + type badges + stat pills
      var rowInfo = document.createElement('div');
      rowInfo.style.cssText = 'flex:1;min-width:0;';
      var rowNameLine = document.createElement('div');
      rowNameLine.style.cssText = 'display:flex;align-items:center;gap:4px;margin-bottom:2px;';
      var rowName = document.createElement('span');
      rowName.style.cssText = 'font-size:12px;color:var(--text-primary);font-weight:500;';
      rowName.textContent = c.name;
      rowNameLine.appendChild(rowName);
      if (c.types) {
        for (var t4 = 0; t4 < c.types.length; t4++) {
          rowNameLine.appendChild(ui.renderTypeBadgeEl(c.types[t4]));
        }
      }
      rowInfo.appendChild(rowNameLine);
      rowInfo.appendChild(ui.renderStatPillsEl(c.method, c.level || '', c.percent || 0));
      row.appendChild(rowInfo);

      // Pokeball toggle (right side)
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
  grid.className = 'ice-tray';
  // For 4-8, fit in one row. For 9+, use 2 balanced rows.
  var cols = catches.length <= 8 ? catches.length : Math.ceil(catches.length / 2);
  grid.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';

  var expandPanel = document.createElement('div');
  expandPanel.className = 'ice-tray-expand';

  for (var i = 0; i < catches.length; i++) {
    (function(c, index) {
      var caught = window.__catches.isCaught(caughtPokemon, c.name);

      var cell = document.createElement('div');
      cell.className = 'ice-tray-cell' + (c.top25 ? ' top25' : '') + (caught ? ' caught' : '');

      // Sprite image directly in cell (not wrapped in sprite-box)
      var img = document.createElement('img');
      img.src = ui.spriteUrl(c.dex);
      img.style.imageRendering = 'pixelated';
      cell.appendChild(img);

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
      if (c.top25) {
        var starOverlay = document.createElement('div');
        starOverlay.className = 'star-overlay';
        starOverlay.appendChild(ui.renderStarBadge(10));
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

  var row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;gap:10px;';

  // Sprite
  row.appendChild(ui.renderSpriteEl(catchData.dex, 'lg'));

  // Info
  var info = document.createElement('div');
  info.style.cssText = 'flex:1;min-width:0;';

  var nameRow = document.createElement('div');
  nameRow.style.cssText = 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;';
  var nameSpan = document.createElement('span');
  nameSpan.style.cssText = 'font-size:12px;font-weight:600;color:' + (catchData.top25 ? 'var(--green)' : 'var(--text-primary)') + ';';
  nameSpan.textContent = catchData.name;
  nameRow.appendChild(nameSpan);
  if (catchData.top25) nameRow.appendChild(ui.renderStarBadge(12));
  if (catchData.types) {
    for (var t = 0; t < catchData.types.length; t++) {
      nameRow.appendChild(ui.renderTypeBadgeEl(catchData.types[t]));
    }
  }
  info.appendChild(nameRow);

  // Stat pills
  info.appendChild(ui.renderStatPillsEl(catchData.method, catchData.level || '', catchData.percent || 0));

  // Why
  if (catchData.why) {
    var whyEl = document.createElement('div');
    whyEl.style.cssText = 'font-size:10px;color:var(--text-muted);margin-top:3px;font-style:italic;';
    whyEl.textContent = catchData.why;
    info.appendChild(whyEl);
  }
  row.appendChild(info);

  // Pokeball toggle
  var pokeball = ui.renderPokeballToggle(caught, function(e) {
    e.stopPropagation();
    var profile = window.__profiles.getActiveProfile();
    if (!profile) return;
    profile.caughtPokemon = window.__catches.toggleCaught(profile.caughtPokemon || {}, catchData.name);
    window.__profiles.saveActiveProfile();
    window.__steps.render();
  });
  row.appendChild(pokeball);

  panel.appendChild(row);
}

/**
 * Render battle card for a step that has a battle tag.
 * Looks up trainer data from battles.json by matching location name and battle tag text.
 */
function renderBattleCard(locationName, step) {
  if (!battleData || !step.tags || !step.tags.battles) return null;
  if (!step.tags.battles.length) return null;

  var ui = window.__ui;
  if (!ui) return null;

  // Find matching battle data — try location name and variants (e.g., "LOCATION|GYM")
  var battleText = step.tags.battles[0]; // e.g., "Battle Cheren" or "Beat Gym Leader"
  var trainerName = battleText.replace(/^(Battle|Beat|Fight|Defeat)\s+/i, '').replace(/\s*[-–].*/,'').trim();

  // Search in multiple location key variants
  var locationKeys = [locationName];
  // Also try with suffixes like |GYM, |CHEREN, etc.
  if (trainerName) {
    locationKeys.push(locationName + '|' + trainerName.toUpperCase());
    locationKeys.push(locationName + '|GYM');
  }

  var trainer = null;
  var foundName = trainerName;
  for (var ki = 0; ki < locationKeys.length; ki++) {
    var locBattles = battleData[locationKeys[ki]];
    if (!locBattles) continue;
    // Try exact match first
    if (locBattles[trainerName]) {
      trainer = locBattles[trainerName];
      break;
    }
    // Try partial match
    var trainerNames = Object.keys(locBattles);
    for (var ti = 0; ti < trainerNames.length; ti++) {
      if (trainerName.toLowerCase().indexOf(trainerNames[ti].toLowerCase()) >= 0 ||
          trainerNames[ti].toLowerCase().indexOf(trainerName.toLowerCase()) >= 0) {
        trainer = locBattles[trainerNames[ti]];
        foundName = trainerNames[ti];
        break;
      }
    }
    if (trainer) break;
  }

  if (!trainer || !trainer.teams || !trainer.teams.length) return null;

  var card = document.createElement('div');
  card.className = 'battle-card';

  // Header
  var header = document.createElement('div');
  header.className = 'battle-card-header';
  var titleEl = document.createElement('span');
  titleEl.className = 'battle-card-title';
  titleEl.textContent = 'VS ' + foundName;
  header.appendChild(titleEl);
  if (trainer.note) {
    var noteEl = document.createElement('span');
    noteEl.className = 'battle-card-note';
    noteEl.textContent = trainer.note;
    header.appendChild(noteEl);
  }
  card.appendChild(header);

  // Get the right team based on starter (for pick1 trainers)
  var profile = window.__profiles && window.__profiles.getActiveProfile();
  var starter = profile ? profile.starter : null;
  var teamsToShow = trainer.teams;

  if (trainer.pick1 && starter && trainer.teams.length >= 3) {
    // Find the team that matches the player's starter
    var starterMap = { 'Snivy': 0, 'Tepig': 1, 'Oshawott': 2 };
    var teamIdx = starterMap[starter];
    if (teamIdx !== undefined && trainer.teams[teamIdx]) {
      teamsToShow = [trainer.teams[teamIdx]];
    }
  }

  // Render teams
  teamsToShow.forEach(function(team, tidx) {
    var teamEl = document.createElement('div');
    teamEl.className = 'battle-team';

    team.forEach(function(mon) {
      if (mon.note) {
        // Variant note (e.g., "If you picked Snivy")
        var noteDiv = document.createElement('div');
        noteDiv.className = 'battle-variant-note';
        noteDiv.textContent = mon.note;
        teamEl.appendChild(noteDiv);
        return;
      }

      var monEl = document.createElement('div');
      monEl.className = 'battle-pokemon';

      // Small sprite
      if (mon.name) {
        // Look up dex number from the Pokemon name
        var dex = getDexForName(mon.name);
        if (dex) {
          var sprite = document.createElement('img');
          sprite.src = ui.spriteUrl(dex);
          sprite.width = 28;
          sprite.height = 28;
          sprite.style.imageRendering = 'pixelated';
          monEl.appendChild(sprite);
        }
      }

      var monInfo = document.createElement('div');
      var nameSpan = document.createElement('span');
      nameSpan.className = 'battle-pokemon-name';
      nameSpan.textContent = mon.name;
      monInfo.appendChild(nameSpan);

      var lvSpan = document.createElement('span');
      lvSpan.className = 'battle-pokemon-lv';
      lvSpan.textContent = ' Lv.' + mon.lv;
      monInfo.appendChild(lvSpan);

      // Type badges
      if (mon.types) {
        var typesWrap = document.createElement('div');
        typesWrap.style.cssText = 'display:flex;gap:2px;margin-top:1px;';
        mon.types.forEach(function(t) {
          typesWrap.appendChild(ui.renderTypeBadgeEl(t));
        });
        monInfo.appendChild(typesWrap);
      }

      monEl.appendChild(monInfo);
      teamEl.appendChild(monEl);
    });

    card.appendChild(teamEl);

    // Separator between teams (if showing multiple)
    if (tidx < teamsToShow.length - 1) {
      var sep = document.createElement('div');
      sep.style.cssText = 'height:1px;background:var(--border-subtle);margin:4px 0;';
      card.appendChild(sep);
    }
  });

  return card;
}

/**
 * Look up a Pokemon's dex number by name from the catch data.
 * Falls back to a built-in map for common battle Pokemon not in catches.
 */
var _dexCache = null;
function getDexForName(name) {
  // Rebuild cache if regionData changed (e.g., first load)
  if (!_dexCache || (!_dexCache._hasRegionData && regionData)) {
    _dexCache = {};
    // Build from catch data
    if (regionData && regionData.locations) {
      regionData.locations.forEach(function(loc) {
        if (loc.catches) {
          loc.catches.forEach(function(c) {
            if (c.dex) _dexCache[c.name.toLowerCase()] = c.dex;
          });
        }
      });
    }
    // Add common battle Pokemon not in wild encounters
    var extras = {
      snivy:495, servine:496, serperior:497,
      tepig:498, pignite:499, emboar:500,
      oshawott:501, dewott:502, samurott:503,
      watchog:505, herdier:507, stoutland:508, liepard:510,
      simisage:512, simisear:514, simipour:516,
      musharna:518, unfezant:521, zebstrika:523,
      gigalith:526, excadrill:530, conkeldurr:534,
      seismitoad:537, leavanny:542, scolipede:545,
      whimsicott:547, lilligant:549, krookodile:553,
      darmanitan:555, scrafty:560, cofagrigus:563,
      carracosta:565, archeops:567, garbodor:569,
      cinccino:573, gothorita:575, gothitelle:576,
      reuniclus:579, vanilluxe:584, sawsbuck:586,
      galvantula:596, ferrothorn:598, klinklang:601,
      eelektross:604, chandelure:609, haxorus:612,
      beartic:614, mienshao:620, bisharp:625, bouffalant:626,
      braviary:628, mandibuzz:630, hydreigon:635, volcarona:637,
      reshiram:643, zekrom:644,
      pansage:511, pansear:513, panpour:515,
      purrloin:509, pidove:519, timburr:532, tympole:535,
      sandile:551, scraggy:559, zorua:570, zoroark:571,
      deerling:585, fraxure:611, mienfoo:619, pawniard:624,
      deino:633, zweilous:634, larvesta:636,
      lucario:448, riolu:447, arcanine:59, crobat:169,
      spiritomb:442, garchomp:445, milotic:350, eelektrik:603,
      boldore:525, swoobat:528, druddigon:621,
      flygon:330, sigilyph:561, reuniclus:579,
      golurk:623, lapras:131, weavile:461, absol:359,
      metagross:376, salamence:373, glaceon:471,
    };
    Object.keys(extras).forEach(function(k) { _dexCache[k] = extras[k]; });
    _dexCache._hasRegionData = !!regionData;
  }
  return _dexCache[name.toLowerCase()] || null;
}

/**
 * Track which hidden item images have been used per location (consumed in order).
 */
var _hiddenItemQueues = {};

function attachHiddenItemPopouts(textSpan, locationName) {
  var items = hiddenItemData[locationName];
  if (!items || items.length === 0) return;

  // Initialize queue for this location
  if (!_hiddenItemQueues[locationName]) {
    _hiddenItemQueues[locationName] = items.slice();
  }
  var queue = _hiddenItemQueues[locationName];

  var hiddenSpans = textSpan.querySelectorAll('.hl-hidden-item');
  hiddenSpans.forEach(function(span) {
    // Normalize item text for matching
    var itemText = span.textContent.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Remove "hidden" prefix
    itemText = itemText.replace(/^hidden/, '');

    // Find matching image in queue
    var matchIdx = -1;
    for (var i = 0; i < queue.length; i++) {
      if (itemText.indexOf(queue[i].item) >= 0 || queue[i].item.indexOf(itemText) >= 0) {
        matchIdx = i;
        break;
      }
    }

    if (matchIdx >= 0) {
      var imageUrl = queue[matchIdx].url;
      queue.splice(matchIdx, 1); // consume from queue

      // Make the span interactive
      span.classList.add('hl-hidden-item-linked');
      span.title = 'Click to see location screenshot';

      // Add a small map icon after the text
      var mapIcon = document.createElement('span');
      mapIcon.className = 'hidden-item-icon';
      mapIcon.textContent = '\u{1F4CD}'; // pin emoji — we'll replace with something better in CSS
      span.appendChild(mapIcon);

      // Click handler — show popout
      span.addEventListener('click', function(e) {
        e.stopPropagation();
        showHiddenItemPopout(span.textContent.replace('\u{1F4CD}', '').trim(), imageUrl);
      });

      // Hover tooltip with small preview
      span.addEventListener('mouseenter', function() {
        showHiddenItemTooltip(span, imageUrl);
      });
      span.addEventListener('mouseleave', function() {
        hideHiddenItemTooltip();
      });
    }
  });
}

var _tooltipEl = null;
function showHiddenItemTooltip(anchorEl, imageUrl) {
  hideHiddenItemTooltip();
  var tooltip = document.createElement('div');
  tooltip.className = 'hidden-item-tooltip';

  var img = document.createElement('img');
  img.src = imageUrl;
  img.style.cssText = 'width:180px;height:auto;border-radius:4px;display:block;';
  tooltip.appendChild(img);

  var hint = document.createElement('div');
  hint.style.cssText = 'font-size:9px;color:var(--text-muted);text-align:center;margin-top:4px;';
  hint.textContent = 'click to enlarge';
  tooltip.appendChild(hint);

  document.body.appendChild(tooltip);
  _tooltipEl = tooltip;

  // Position near the anchor
  var rect = anchorEl.getBoundingClientRect();
  tooltip.style.left = Math.max(4, rect.left) + 'px';
  tooltip.style.top = (rect.bottom + 6) + 'px';

  // Adjust if off-screen right
  setTimeout(function() {
    var tRect = tooltip.getBoundingClientRect();
    if (tRect.right > window.innerWidth - 4) {
      tooltip.style.left = (window.innerWidth - tRect.width - 4) + 'px';
    }
  }, 0);
}

function hideHiddenItemTooltip() {
  if (_tooltipEl && _tooltipEl.parentNode) {
    _tooltipEl.parentNode.removeChild(_tooltipEl);
  }
  _tooltipEl = null;
}

var _popoutEl = null;
function showHiddenItemPopout(itemName, imageUrl) {
  hideHiddenItemTooltip();
  closeHiddenItemPopout();

  var overlay = document.createElement('div');
  overlay.className = 'hidden-item-popout-overlay';
  overlay.addEventListener('click', closeHiddenItemPopout);

  var popout = document.createElement('div');
  popout.className = 'hidden-item-popout';
  popout.addEventListener('click', function(e) { e.stopPropagation(); });

  var header = document.createElement('div');
  header.className = 'hidden-item-popout-header';
  var titleEl = document.createElement('span');
  titleEl.style.cssText = 'font-family:var(--font-pixel);font-size:0.42rem;color:var(--orange);';
  titleEl.textContent = itemName;
  header.appendChild(titleEl);
  var closeBtn = document.createElement('span');
  closeBtn.style.cssText = 'cursor:pointer;color:var(--text-muted);font-size:16px;';
  closeBtn.textContent = '\u2715';
  closeBtn.addEventListener('click', closeHiddenItemPopout);
  header.appendChild(closeBtn);
  popout.appendChild(header);

  // Zoomable image container
  var imgWrap = document.createElement('div');
  imgWrap.className = 'hidden-item-img-wrap';

  var img = document.createElement('img');
  img.src = imageUrl;
  img.className = 'hidden-item-img';
  img.draggable = false;
  imgWrap.appendChild(img);
  popout.appendChild(imgWrap);

  // Zoom hint
  var zoomHint = document.createElement('div');
  zoomHint.style.cssText = 'font-size:9px;color:var(--text-muted);text-align:center;margin-top:4px;';
  zoomHint.textContent = 'click to zoom \u00b7 double-click to reset';
  popout.appendChild(zoomHint);

  // Zoom + pan state
  var scale = 1;
  var panX = 0, panY = 0;
  var isDragging = false;
  var didDrag = false;
  var dragStartX = 0, dragStartY = 0;
  var panStartX = 0, panStartY = 0;

  function updateTransform() {
    img.style.transform = 'scale(' + scale + ') translate(' + (panX / scale) + 'px,' + (panY / scale) + 'px)';
  }

  imgWrap.addEventListener('wheel', function(e) {
    e.preventDefault();
    var delta = e.deltaY > 0 ? -0.15 : 0.15;
    scale = Math.max(0.5, Math.min(5, scale + delta));
    if (scale <= 1) { panX = 0; panY = 0; }
    updateTransform();
    zoomHint.textContent = Math.round(scale * 100) + '%';
  });

  // Click to zoom in, double-click to reset
  imgWrap.addEventListener('click', function(e) {
    if (didDrag) { didDrag = false; return; }
    if (scale >= 3) {
      // Reset zoom
      scale = 1;
      panX = 0;
      panY = 0;
    } else {
      // Zoom into click position
      scale = Math.min(5, scale + 0.5);
    }
    updateTransform();
    imgWrap.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
    zoomHint.textContent = Math.round(scale * 100) + '%' + (scale > 1 ? ' \u00b7 click to zoom more \u00b7 drag to pan' : '');
  });

  imgWrap.addEventListener('dblclick', function(e) {
    e.preventDefault();
    scale = 1;
    panX = 0;
    panY = 0;
    updateTransform();
    imgWrap.style.cursor = 'zoom-in';
    zoomHint.textContent = 'click to zoom \u00b7 double-click to reset';
  });

  // Drag to pan when zoomed
  imgWrap.addEventListener('mousedown', function(e) {
    if (scale <= 1) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    panStartX = panX;
    panStartY = panY;
    imgWrap.style.cursor = 'grabbing';
    e.preventDefault();
  });

  document.addEventListener('mousemove', function onMove(e) {
    if (!isDragging) return;
    var dx = e.clientX - dragStartX;
    var dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
    panX = panStartX + dx;
    panY = panStartY + dy;
    updateTransform();
  });

  document.addEventListener('mouseup', function onUp() {
    if (!isDragging) return;
    isDragging = false;
    imgWrap.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
  });

  overlay.appendChild(popout);
  document.body.appendChild(overlay);
  _popoutEl = overlay;
}

function closeHiddenItemPopout() {
  if (_popoutEl && _popoutEl.parentNode) {
    _popoutEl.parentNode.removeChild(_popoutEl);
  }
  _popoutEl = null;
}

async function completeStep(locIdx, stepIdx) {
  if (!currentProfile) return;
  if (!currentProfile.completedSteps) currentProfile.completedSteps = {};

  // Animate the step circle
  var stepEl = document.querySelector('.step.current');
  if (stepEl) {
    stepEl.classList.add('completing');
    await new Promise(function(resolve) { setTimeout(resolve, 200); });
  }

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

function completeSection() {
  if (!currentProfile || !regionData) return;
  var current = findCurrentStep();
  if (!current) return;
  if (!currentProfile.completedSteps) currentProfile.completedSteps = {};

  var location = regionData.locations[current.location];
  for (var i = 0; i < location.steps.length; i++) {
    currentProfile.completedSteps[current.location + '-' + i] = true;
  }
  render();
  saveProfile();
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
 * Undo all completed steps in the current (or most recent) location.
 */
function undoSection() {
  if (!currentProfile || !currentProfile.completedSteps || !regionData) return;

  // Find the current location (or the most recently completed one)
  var current = findCurrentStep();
  var locIdx;
  if (current) {
    locIdx = current.location;
  } else {
    // All done — find the last location with completed steps
    var keys = Object.keys(currentProfile.completedSteps).filter(function(k) { return currentProfile.completedSteps[k]; });
    if (keys.length === 0) return;
    locIdx = Math.max.apply(null, keys.map(function(k) { return parseInt(k.split('-')[0]); }));
  }

  // If current location has no completed steps, go to previous location
  var location = regionData.locations[locIdx];
  var hasCompleted = location.steps.some(function(_, i) { return currentProfile.completedSteps[locIdx + '-' + i]; });
  if (!hasCompleted && locIdx > 0) {
    locIdx--;
    location = regionData.locations[locIdx];
  }

  // Remove all completed steps for this location
  for (var i = 0; i < location.steps.length; i++) {
    delete currentProfile.completedSteps[locIdx + '-' + i];
  }

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

function updatePill() {
  var pill = document.getElementById('pill');
  if (!pill || !regionData) return;
  var current = findCurrentStep();
  if (current) {
    var loc = regionData.locations[current.location];
    var completed = getCompletedSteps();
    var locDone = loc.steps.filter(function(_, i) { return completed[current.location + '-' + i]; }).length;
    pill.textContent = loc.name + ' \u00B7 ' + locDone + '/' + loc.steps.length;
  } else {
    pill.textContent = 'Complete!';
  }
}

function render() {
  _hiddenItemQueues = {}; // reset queues on re-render
  renderCompact();
  renderFull();
  updatePill();
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
    loadRegionData, render, setProfile, completeCurrent, completeStep, completeSection, undoLast, undoSection, clearAll,
    getRegionData: function() { return regionData; },
    findCurrentStep: findCurrentStep,
  };
}
