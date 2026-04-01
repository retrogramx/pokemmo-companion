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

async function hideWindow() {
  if (!window.__TAURI__) return;
  const win = window.__TAURI__.window.getCurrentWindow();
  try { await win.hide(); } catch(e1) {
    try { await win.minimize(); } catch(e2) {
      // Last resort: just close
      await win.close();
    }
  }
}

async function showWindow() {
  if (!window.__TAURI__) return;
  const win = window.__TAURI__.window.getCurrentWindow();
  try { await win.show(); } catch(e1) {
    try { await win.unminimize(); } catch(e2) {}
  }
  try { await win.setFocus(); } catch(e) {}
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
  hideWindow();
}

function show() {
  showWindow();
}

function showMap() {
  console.log('Map view — coming in v2');
}

function showCatches() {
  console.log('Catches view — coming in v2');
}

// Drag lock/unlock — uses native CSS drag region for zero-latency dragging
// Default: unlocked (draggable from anywhere)
let dragUnlocked = true;
appEl.classList.add('drag-unlocked');

function toggleDragLock() {
  dragUnlocked = !dragUnlocked;
  document.getElementById('btnLock').textContent = dragUnlocked ? '🔓' : '🔒';
  document.getElementById('btnLock').title = dragUnlocked ? 'Lock position' : 'Unlock to drag';
  appEl.classList.toggle('drag-unlocked', dragUnlocked);
}

// Listen for Tauri hotkey events
if (window.__TAURI__) {
  let isHidden = false;
  window.__TAURI__.event.listen('hotkey-toggle', async () => {
    isHidden = !isHidden;
    if (isHidden) await hideWindow();
    else await showWindow();
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

window.__app = { toggleMode, hide, show, showMap, showCatches, toggleDragLock, init };

init();
