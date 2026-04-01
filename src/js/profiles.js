// Profile management — Tauri command wrappers + UI logic

let profiles = [];
let activeProfile = null;
let selectedStarter = null;

async function invoke(cmd, args) {
  if (window.__TAURI__) {
    return window.__TAURI__.core.invoke(cmd, args);
  }
  // Fallback to localStorage for dev/testing without Tauri
  const store = JSON.parse(localStorage.getItem('pmc-profiles') || '{}');
  if (cmd === 'list_profiles') return Object.keys(store);
  if (cmd === 'load_profile') return store[args.name] || null;
  if (cmd === 'save_profile') { store[args.name] = args.data; localStorage.setItem('pmc-profiles', JSON.stringify(store)); return; }
  if (cmd === 'delete_profile') { delete store[args.name]; localStorage.setItem('pmc-profiles', JSON.stringify(store)); return; }
}

function newProfile(name, starter) {
  return {
    name,
    region: 'unova',
    starter: starter || 'Tepig',
    completedSteps: {},
    currentLocation: 0,
    currentStep: 0,
    windowPosition: { x: 100, y: 50 },
    windowMode: 'compact',
  };
}

async function loadProfiles() {
  profiles = await invoke('list_profiles');
}

async function switchProfile(name) {
  const raw = await invoke('load_profile', { name });
  if (!raw) return;
  activeProfile = typeof raw === 'string' ? JSON.parse(raw) : raw;
  window.__steps.setProfile(activeProfile);
  renderDropdown();
}

async function saveActiveProfile() {
  if (!activeProfile) return;
  await invoke('save_profile', { name: activeProfile.name, data: JSON.stringify(activeProfile) });
}

async function deleteProfileByName(name) {
  await invoke('delete_profile', { name });
  profiles = profiles.filter(p => p !== name);
  if (activeProfile && activeProfile.name === name) {
    activeProfile = null;
    if (profiles.length > 0) {
      await switchProfile(profiles[0]);
    }
  }
  renderDropdown();
}

function toggleDropdown() {
  document.getElementById('profileDropdown').classList.toggle('open');
}

function renderDropdown() {
  const dd = document.getElementById('profileDropdown');
  let html = '';
  for (const name of profiles) {
    const isActive = activeProfile && activeProfile.name === name;
    html += `
      <div class="profile-option${isActive ? ' active' : ''}" onclick="window.__profiles.switchProfile('${name}')">
        <span>${name}</span>
        <span class="delete-btn" onclick="event.stopPropagation();window.__profiles.deleteProfileByName('${name}')">✕</span>
      </div>`;
  }
  html += `<div class="profile-new" onclick="window.__profiles.openModal()">+ New Profile</div>`;
  dd.innerHTML = html;
}

function openModal() {
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('profileDropdown').classList.remove('open');
  selectedStarter = null;
  document.getElementById('newProfileName').value = '';
  document.querySelectorAll('.starter-btn').forEach(b => b.classList.remove('selected'));
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function selectStarter(el) {
  document.querySelectorAll('.starter-btn').forEach(b => b.classList.remove('selected'));
  el.classList.add('selected');
  selectedStarter = el.dataset.starter;
}

async function createProfile() {
  const name = document.getElementById('newProfileName').value.trim();
  if (!name) return;
  const profile = newProfile(name, selectedStarter);
  await invoke('save_profile', { name, data: JSON.stringify(profile) });
  profiles.push(name);
  closeModal();
  await switchProfile(name);
}

async function init() {
  await loadProfiles();
  renderDropdown();
  if (profiles.length > 0) {
    await switchProfile(profiles[0]);
  } else {
    openModal();
  }
}

if (typeof window !== 'undefined') {
  window.__profiles = {
    init, switchProfile, deleteProfileByName, toggleDropdown,
    openModal, closeModal, selectStarter, createProfile, saveActiveProfile,
    getActiveProfile: () => activeProfile,
  };
}
