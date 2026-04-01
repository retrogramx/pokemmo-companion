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
  if (!window.__TAURI__) return null;
  return window.__TAURI__.window.getCurrentWindow();
}

// --- View switching ---

function toggleMode() {
  currentMode = currentMode === 'compact' ? 'full' : 'compact';
  updateAppClasses();
  window.__steps.render();

  const win = getTauriWindow();
  if (win) {
    const h = currentMode === 'compact' ? 200 : 520;
    win.setSize(new window.__TAURI__.window.LogicalSize(360, h)).catch(() => {});
  }
}

// --- Drag lock/unlock ---

function toggleDragLock() {
  dragUnlocked = !dragUnlocked;
  document.getElementById('btnLock').textContent = dragUnlocked ? '🔓' : '🔒';
  document.getElementById('btnLock').title = dragUnlocked ? 'Lock position' : 'Unlock to drag';
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
  await saveWindowState();
  const win = getTauriWindow();
  if (win) {
    win.destroy().catch(() => window.close());
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

// --- Hotkey event listeners ---

if (window.__TAURI__) {
  window.__TAURI__.event.listen('hotkey-toggle', toggleVisibility);
  window.__TAURI__.event.listen('hotkey-complete', () => window.__steps.completeCurrent());
  window.__TAURI__.event.listen('hotkey-expand', toggleMode);
}

// --- Init ---

async function init() {
  await window.__steps.loadRegionData();
  await window.__profiles.init();
  await restoreWindowState();
}

window.__app = { toggleMode, closeApp, toggleVisibility, showMap, showCatches, toggleDragLock, init };

init();
