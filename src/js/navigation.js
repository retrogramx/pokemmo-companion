// Navigation panel — location overview with jump-to functionality.

var navData = null;

function renderNavPanel(panelEl) {
  if (typeof document === 'undefined') return;
  var regionData = window.__steps && window.__steps.getRegionData ? window.__steps.getRegionData() : null;
  if (!regionData) return;

  var profile = window.__profiles && window.__profiles.getActiveProfile();
  var completed = (profile && profile.completedSteps) ? profile.completedSteps : {};
  var current = window.__steps.findCurrentStep ? window.__steps.findCurrentStep() : null;
  var currentLocIdx = current ? current.location : 0;

  panelEl.textContent = '';

  // Title
  var title = document.createElement('div');
  title.style.cssText = 'font-family:var(--font-pixel);font-size:0.5rem;color:var(--text-primary);margin-bottom:12px;';
  title.textContent = 'NAVIGATION';
  panelEl.appendChild(title);

  // Progress summary
  var totalSteps = 0;
  var totalDone = 0;
  regionData.locations.forEach(function(loc, idx) {
    totalSteps += loc.steps.length;
    loc.steps.forEach(function(_, si) {
      if (completed[idx + '-' + si]) totalDone++;
    });
  });
  var summary = document.createElement('div');
  summary.style.cssText = 'font-size:11px;color:var(--text-muted);margin-bottom:10px;';
  summary.textContent = totalDone + ' / ' + totalSteps + ' steps (' + Math.round((totalDone / totalSteps) * 100) + '%)';
  panelEl.appendChild(summary);

  // Location list
  var list = document.createElement('div');
  list.className = 'nav-location-list';

  regionData.locations.forEach(function(loc, idx) {
    var locDone = 0;
    loc.steps.forEach(function(_, si) {
      if (completed[idx + '-' + si]) locDone++;
    });
    var locTotal = loc.steps.length;
    var isComplete = locDone === locTotal;
    var isCurrent = idx === currentLocIdx;
    var isFuture = idx > currentLocIdx;

    var item = document.createElement('div');
    item.className = 'nav-location-item' + (isCurrent ? ' current' : '') + (isComplete ? ' complete' : '') + (isFuture ? ' future' : '');

    item.addEventListener('click', function() {
      jumpToLocation(idx);
      if (window.__app && window.__app.closePanel) window.__app.closePanel();
    });

    // Left: status indicator
    var indicator = document.createElement('div');
    indicator.className = 'nav-indicator';
    if (isComplete) {
      indicator.textContent = '\u2713';
      indicator.style.color = 'var(--green)';
    } else if (isCurrent) {
      indicator.style.background = 'var(--blue)';
      indicator.style.borderRadius = '50%';
      indicator.style.width = '8px';
      indicator.style.height = '8px';
      indicator.style.margin = '0 3px';
    }
    item.appendChild(indicator);

    // Center: name + progress
    var info = document.createElement('div');
    info.className = 'nav-location-info';
    var name = document.createElement('span');
    name.className = 'nav-location-name';
    name.textContent = loc.name;
    info.appendChild(name);

    if (!isFuture || locDone > 0) {
      var progress = document.createElement('span');
      progress.className = 'nav-location-progress';
      progress.textContent = locDone + '/' + locTotal;
      info.appendChild(progress);
    }
    item.appendChild(info);

    // Right: catch count if location has catches
    if (loc.catches && loc.catches.length > 0) {
      var catchBadge = document.createElement('span');
      catchBadge.className = 'nav-catch-badge';
      var caughtPokemon = (profile && profile.caughtPokemon) ? profile.caughtPokemon : {};
      var caughtHere = loc.catches.filter(function(c) { return caughtPokemon[c.name.toLowerCase()]; }).length;
      catchBadge.textContent = caughtHere + '/' + loc.catches.length;
      catchBadge.title = 'Pokemon caught here';
      item.appendChild(catchBadge);
    }

    list.appendChild(item);
  });

  panelEl.appendChild(list);
}

function jumpToLocation(locIdx) {
  var profile = window.__profiles && window.__profiles.getActiveProfile();
  var regionData = window.__steps && window.__steps.getRegionData ? window.__steps.getRegionData() : null;
  if (!profile || !regionData) return;
  if (!profile.completedSteps) profile.completedSteps = {};

  // Complete all steps before this location (so we jump forward cleanly)
  var current = window.__steps.findCurrentStep ? window.__steps.findCurrentStep() : null;
  if (current && locIdx > current.location) {
    // Jumping forward — mark everything before as done
    for (var li = current.location; li < locIdx; li++) {
      var loc = regionData.locations[li];
      for (var si = 0; si < loc.steps.length; si++) {
        profile.completedSteps[li + '-' + si] = true;
      }
    }
  } else if (current && locIdx < current.location) {
    // Jumping backward — undo everything after this location
    for (var li2 = locIdx; li2 <= current.location; li2++) {
      var loc2 = regionData.locations[li2];
      for (var si2 = 0; si2 < loc2.steps.length; si2++) {
        delete profile.completedSteps[li2 + '-' + si2];
      }
    }
  }

  window.__profiles.saveActiveProfile();
  window.__steps.render();
}

if (typeof window !== 'undefined') {
  window.__navigation = { renderNavPanel: renderNavPanel };
}
