// Main app controller — view switching, hotkey listeners, window management

const appEl = document.getElementById('app');
const pillEl = document.getElementById('pill');

let currentMode = 'compact';

// Tauri 2.x window helpers
async function resizeWindow(width, height) {
  if (!window.__TAURI__) return;
  try {
    const win = window.__TAURI__.window.getCurrentWindow();
    await win.setSize(new window.__TAURI__.window.LogicalSize(width, height));
  } catch (e) {
    console.warn('Window resize failed:', e);
  }
}

async function setWindowVisible(visible) {
  if (!window.__TAURI__) return;
  try {
    const win = window.__TAURI__.window.getCurrentWindow();
    if (visible) await win.show();
    else await win.hide();
  } catch (e) {
    console.warn('Window visibility toggle failed:', e);
  }
}

function toggleMode() {
  currentMode = currentMode === 'compact' ? 'full' : 'compact';
  appEl.className = `app ${currentMode}`;

  const size = currentMode === 'compact'
    ? { w: 360, h: 200 }
    : { w: 360, h: 520 };
  resizeWindow(size.w, size.h);

  window.__steps.render();
}

function hide() {
  appEl.classList.add('hidden');
  pillEl.classList.add('visible');
  // Shrink window to pill size
  resizeWindow(120, 44);
}

function show() {
  appEl.classList.remove('hidden');
  pillEl.classList.remove('visible');
  const size = currentMode === 'compact'
    ? { w: 360, h: 200 }
    : { w: 360, h: 520 };
  resizeWindow(size.w, size.h);
}

function showMap() {
  console.log('Map view — coming in v2');
}

function showCatches() {
  console.log('Catches view — coming in v2');
}

// Enable window dragging from the header
document.getElementById('dragHeader').addEventListener('mousedown', (e) => {
  if (e.target.closest('button, .profile-trigger, .profile-dropdown, .no-drag')) return;
  if (window.__TAURI__) {
    window.__TAURI__.window.getCurrentWindow().startDragging();
  }
});

// Listen for Tauri hotkey events
if (window.__TAURI__) {
  window.__TAURI__.event.listen('hotkey-toggle', () => {
    if (appEl.classList.contains('hidden')) show();
    else hide();
  });
  window.__TAURI__.event.listen('hotkey-complete', () => {
    window.__steps.completeCurrent();
  });
  window.__TAURI__.event.listen('hotkey-expand', () => {
    toggleMode();
  });
}

async function init() {
  await window.__steps.loadRegionData();
  await window.__profiles.init();
}

window.__app = { toggleMode, hide, show, showMap, showCatches, init };

init();
