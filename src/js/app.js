// Main app controller — view switching, hotkey listeners, window management

const appEl = document.getElementById('app');
const pillEl = document.getElementById('pill');

let currentMode = 'compact';

function toggleMode() {
  currentMode = currentMode === 'compact' ? 'full' : 'compact';
  appEl.className = `app ${currentMode}`;

  if (window.__TAURI__) {
    const size = currentMode === 'compact'
      ? { width: 360, height: 200 }
      : { width: 360, height: 520 };
    window.__TAURI__.window.getCurrentWindow().setSize(
      new window.__TAURI__.window.LogicalSize(size.width, size.height)
    );
  }

  window.__steps.render();
}

function hide() {
  appEl.classList.add('hidden');
  pillEl.classList.add('visible');
  if (window.__TAURI__) {
    window.__TAURI__.window.getCurrentWindow().setSize(
      new window.__TAURI__.window.LogicalSize(80, 32)
    );
  }
}

function show() {
  appEl.classList.remove('hidden');
  pillEl.classList.remove('visible');
  const size = currentMode === 'compact'
    ? { width: 360, height: 200 }
    : { width: 360, height: 520 };
  if (window.__TAURI__) {
    window.__TAURI__.window.getCurrentWindow().setSize(
      new window.__TAURI__.window.LogicalSize(size.width, size.height)
    );
  }
}

function showMap() {
  console.log('Map view — coming in v2');
}

function showCatches() {
  console.log('Catches view — coming in v2');
}

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
