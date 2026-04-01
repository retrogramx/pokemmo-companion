// Main app controller — view switching, hotkey listeners, window management

const appEl = document.getElementById('app');
let currentMode = 'compact';
let dragUnlocked = true;

// Apply classes without clobbering each other
function updateAppClasses() {
  appEl.className = 'app ' + currentMode + (dragUnlocked ? ' drag-unlocked' : '');
}
updateAppClasses();

// --- Tauri window helpers ---

function getTauriWindow() {
  if (!window.__TAURI__) { console.error('__TAURI__ not available'); return null; }
  if (!window.__TAURI__.window) { console.error('__TAURI__.window not available'); return null; }
  const win = window.__TAURI__.window.getCurrentWindow();
  console.log('Got Tauri window:', win);
  return win;
}

// --- View switching ---

function toggleMode() {
  currentMode = currentMode === 'compact' ? 'full' : 'compact';
  updateAppClasses();
  window.__steps.render();

  // Update the toggle button icon
  var btn = document.getElementById('btnToggleMode');
  if (btn) btn.textContent = currentMode === 'compact' ? '\u25BC' : '\u25B2';

  const win = getTauriWindow();
  if (win) {
    const h = currentMode === 'compact' ? 200 : 520;
    win.setSize(new window.__TAURI__.window.LogicalSize(360, h)).catch(() => {});
  }
}

// --- Drag lock/unlock ---

function toggleDragLock() {
  dragUnlocked = !dragUnlocked;
  var btn = document.getElementById('btnLock');
  if (btn) {
    btn.title = dragUnlocked ? 'Lock position' : 'Unlock to drag';
    btn.style.color = dragUnlocked ? 'var(--blue)' : 'var(--text-secondary)';
  }
  updateAppClasses();
}

// --- Window state save/restore ---

async function saveWindowState() {
  const win = getTauriWindow();
  const profile = window.__profiles && window.__profiles.getActiveProfile();
  if (!win || !profile) return;
  try {
    const pos = await win.outerPosition();
    const size = await win.innerSize();
    profile.windowPosition = { x: pos.x, y: pos.y };
    profile.windowSize = { width: size.width, height: size.height };
    profile.windowMode = currentMode;
    await window.__profiles.saveActiveProfile();
  } catch (e) {
    console.warn('Save window state failed:', e);
  }
}

async function restoreWindowState() {
  const win = getTauriWindow();
  const profile = window.__profiles && window.__profiles.getActiveProfile();
  if (!win || !profile) return;
  try {
    if (profile.windowPosition) {
      await win.setPosition(new window.__TAURI__.window.LogicalPosition(
        profile.windowPosition.x, profile.windowPosition.y
      ));
    }
    if (profile.windowSize) {
      await win.setSize(new window.__TAURI__.window.LogicalSize(
        profile.windowSize.width, profile.windowSize.height
      ));
    }
    if (profile.windowMode) {
      currentMode = profile.windowMode;
      updateAppClasses();
    }
  } catch (e) {
    console.warn('Restore window state failed:', e);
  }
}

// --- Close app ---

async function closeApp() {
  // Save window state + profile FIRST, then destroy
  try {
    const win = getTauriWindow();
    const profile = window.__profiles && window.__profiles.getActiveProfile();
    if (win && profile) {
      const pos = await win.outerPosition();
      const size = await win.outerSize();
      const scale = await win.scaleFactor();
      // Convert physical pixels to logical pixels for restore
      profile.windowPosition = { x: Math.round(pos.x / scale), y: Math.round(pos.y / scale) };
      profile.windowSize = { width: Math.round(size.width / scale), height: Math.round(size.height / scale) };
      profile.windowMode = currentMode;
      await window.__profiles.saveActiveProfile();
    }
  } catch (e) {
    console.warn('Save before close failed:', e);
  }
  // Now destroy
  try {
    await getTauriWindow().destroy();
  } catch (e) {
    window.close();
  }
}

// --- Hotkey toggle (hide/show without destroying) ---

let windowHidden = false;

async function toggleVisibility() {
  const win = getTauriWindow();
  if (!win) return;
  windowHidden = !windowHidden;
  if (windowHidden) {
    await win.hide().catch(() => {});
  } else {
    await win.show().catch(() => {});
    await win.setFocus().catch(() => {});
  }
}

// --- Placeholders ---

function showMap() { console.log('Map — coming in v2'); }
function showCatches() { console.log('Catches — coming in v2'); }

// --- Panel management ---

var currentPanel = null; // null, 'typechart', 'settings'

function toggleTypeChart() {
  if (currentPanel === 'typechart') {
    closePanel();
  } else {
    openPanel('typechart');
  }
}

function toggleSettings() {
  if (currentPanel === 'settings') {
    closePanel();
  } else {
    openPanel('settings');
  }
}

function toggleNav() {
  if (currentPanel === 'nav') {
    closePanel();
  } else {
    openPanel('nav');
  }
}

function openPanel(name) {
  closePanel();
  currentPanel = name;
  var panelIds = { typechart: 'typeChartPanel', settings: 'settingsPanel', nav: 'navPanel' };
  var panelEl = document.getElementById(panelIds[name]);
  if (panelEl) {
    if (name === 'typechart' && window.__typechart && window.__typechart.renderPanel) {
      window.__typechart.renderPanel(panelEl);
    }
    if (name === 'settings' && window.__settings && window.__settings.renderPanel) {
      window.__settings.renderPanel(panelEl);
    }
    if (name === 'nav' && window.__navigation && window.__navigation.renderNavPanel) {
      window.__navigation.renderNavPanel(panelEl);
    }
    panelEl.classList.add('open');
  }
  updatePanelButtons();
}

function closePanel() {
  currentPanel = null;
  document.querySelectorAll('.panel-overlay').forEach(function(p) { p.classList.remove('open'); });
  updatePanelButtons();
}

function updatePanelButtons() {
  var tcBtn = document.getElementById('btnTypeChart');
  var setBtn = document.getElementById('btnSettings');
  var navBtn = document.getElementById('btnNav');
  if (tcBtn) tcBtn.classList.toggle('active', currentPanel === 'typechart');
  if (setBtn) setBtn.classList.toggle('active', currentPanel === 'settings');
  if (navBtn) navBtn.classList.toggle('active', currentPanel === 'nav');
}

// --- Hotkey event listeners ---

if (window.__TAURI__) {
  window.__TAURI__.event.listen('hotkey-toggle', toggleVisibility);
  window.__TAURI__.event.listen('hotkey-complete', () => window.__steps.completeCurrent());
  window.__TAURI__.event.listen('hotkey-expand', toggleMode);
}

// --- Init ---

async function init() {
  await window.__steps.loadRegionData();
  if (window.__typechart && window.__typechart.loadTypeData) await window.__typechart.loadTypeData();
  await window.__profiles.init();
  await restoreWindowState();
}

// --- JS-based window dragging (CSS -webkit-app-region breaks with transparent windows on macOS) ---

function initDragging() {
  var header = document.getElementById('dragHeader');
  if (!header) return;

  header.addEventListener('mousedown', function(e) {
    // Don't drag if clicking on a button or interactive element
    var target = e.target;
    while (target && target !== header) {
      if (target.tagName === 'BUTTON' || target.tagName === 'SELECT' || target.tagName === 'INPUT' ||
          target.classList.contains('profile-trigger') || target.classList.contains('profile-dropdown') ||
          target.classList.contains('header-btn')) {
        return;
      }
      target = target.parentElement;
    }

    var win = getTauriWindow();
    if (win && win.startDragging) {
      win.startDragging().catch(function() {});
    }
  });
}

window.__app = { toggleMode, closeApp, toggleVisibility, showMap, showCatches, toggleDragLock, toggleTypeChart, toggleSettings, toggleNav, closePanel, init };

init().then(function() {
  initDragging();
});
