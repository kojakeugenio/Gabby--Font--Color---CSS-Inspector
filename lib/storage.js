/**
 * Storage wrapper for chrome.storage.local.
 * Keeps extension state local and privacy-friendly.
 */

const STORAGE_KEYS = {
  WIDGET_POSITION: 'widgetPositionY',
  WIDGET_PINNED: 'widgetPinned',
  ACTIVE_TAB: 'activeTab',
  COLOR_HISTORY: 'colorHistory',
  RECENT_INSPECTIONS: 'recentInspections',
  SAVED_PRESETS: 'savedPresets',
  SAVED_PALETTES: 'savedPalettes',
  SITE_SESSIONS: 'siteSessions',
  UI_PREFS: 'uiPrefs',
};

const DEFAULTS = {
  [STORAGE_KEYS.WIDGET_POSITION]: null,
  [STORAGE_KEYS.WIDGET_PINNED]: false,
  [STORAGE_KEYS.ACTIVE_TAB]: 0,
  [STORAGE_KEYS.COLOR_HISTORY]: [],
  [STORAGE_KEYS.RECENT_INSPECTIONS]: [],
  [STORAGE_KEYS.SAVED_PRESETS]: [],
  [STORAGE_KEYS.SAVED_PALETTES]: [],
  [STORAGE_KEYS.SITE_SESSIONS]: {},
  [STORAGE_KEYS.UI_PREFS]: {
    onboardingDismissed: false,
    compactFlow: true,
    themeMode: 'auto',
    showFloatingIcon: true,
  },
};

async function storageGet(key) {
  const result = await chrome.storage.local.get(key);
  return result[key] !== undefined ? result[key] : DEFAULTS[key];
}

async function storageSet(key, value) {
  return chrome.storage.local.set({ [key]: value });
}

async function upsertArrayItem(key, item, options = {}) {
  const items = await storageGet(key);
  const identifier = options.identifier || 'id';
  const maxItems = options.maxItems || 20;
  const predicate = (entry) => entry && entry[identifier] === item[identifier];
  const filtered = items.filter((entry) => !predicate(entry));
  filtered.unshift(item);
  const trimmed = filtered.slice(0, maxItems);
  await storageSet(key, trimmed);
  return trimmed;
}

async function removeArrayItem(key, id, identifier = 'id') {
  const items = await storageGet(key);
  const filtered = items.filter((entry) => entry && entry[identifier] !== id);
  await storageSet(key, filtered);
  return filtered;
}

/* ── Color History ── */

async function getColorHistory() {
  return storageGet(STORAGE_KEYS.COLOR_HISTORY);
}

async function addColorToHistory(color) {
  const history = await getColorHistory();
  const normalized = String(color || '').toUpperCase();
  const filtered = history.filter((entry) => entry !== normalized);
  filtered.unshift(normalized);
  const trimmed = filtered.slice(0, 12);
  await storageSet(STORAGE_KEYS.COLOR_HISTORY, trimmed);
  return trimmed;
}

/* ── Inspection History ── */

async function getRecentInspections() {
  return storageGet(STORAGE_KEYS.RECENT_INSPECTIONS);
}

async function addRecentInspection(inspection) {
  const items = await getRecentInspections();
  const filtered = items.filter((entry) => {
    return !(
      entry &&
      entry.selector === inspection.selector &&
      entry.siteKey === inspection.siteKey
    );
  });

  filtered.unshift(inspection);
  const trimmed = filtered.slice(0, 12);
  await storageSet(STORAGE_KEYS.RECENT_INSPECTIONS, trimmed);
  return trimmed;
}

/* ── Presets ── */

async function getSavedPresets() {
  return storageGet(STORAGE_KEYS.SAVED_PRESETS);
}

async function savePreset(preset) {
  return upsertArrayItem(STORAGE_KEYS.SAVED_PRESETS, preset, { maxItems: 30 });
}

async function deletePreset(presetId) {
  return removeArrayItem(STORAGE_KEYS.SAVED_PRESETS, presetId);
}

/* ── Palettes ── */

async function getSavedPalettes() {
  return storageGet(STORAGE_KEYS.SAVED_PALETTES);
}

async function savePalette(palette) {
  return upsertArrayItem(STORAGE_KEYS.SAVED_PALETTES, palette, { maxItems: 24 });
}

async function deletePalette(paletteId) {
  return removeArrayItem(STORAGE_KEYS.SAVED_PALETTES, paletteId);
}

/* ── Site Sessions ── */

async function getSiteSessions() {
  return storageGet(STORAGE_KEYS.SITE_SESSIONS);
}

async function getSiteSession(siteKey) {
  const sessions = await getSiteSessions();
  return sessions[siteKey] || null;
}

async function saveSiteSession(siteKey, session) {
  const sessions = await getSiteSessions();
  sessions[siteKey] = {
    ...session,
    updatedAt: new Date().toISOString(),
  };
  await storageSet(STORAGE_KEYS.SITE_SESSIONS, sessions);
  return sessions[siteKey];
}

async function clearSiteSession(siteKey) {
  const sessions = await getSiteSessions();
  delete sessions[siteKey];
  await storageSet(STORAGE_KEYS.SITE_SESSIONS, sessions);
}

/* ── Widget State ── */

async function getWidgetPosition() {
  return storageGet(STORAGE_KEYS.WIDGET_POSITION);
}

async function saveWidgetPosition(y) {
  return storageSet(STORAGE_KEYS.WIDGET_POSITION, y);
}

async function isWidgetPinned() {
  return storageGet(STORAGE_KEYS.WIDGET_PINNED);
}

async function setWidgetPinned(pinned) {
  return storageSet(STORAGE_KEYS.WIDGET_PINNED, pinned);
}

async function getActiveTab() {
  return storageGet(STORAGE_KEYS.ACTIVE_TAB);
}

async function saveActiveTab(tabIndex) {
  return storageSet(STORAGE_KEYS.ACTIVE_TAB, tabIndex);
}

/* ── UI Prefs ── */

async function getUiPrefs() {
  const storedPrefs = await storageGet(STORAGE_KEYS.UI_PREFS);
  return {
    ...DEFAULTS[STORAGE_KEYS.UI_PREFS],
    ...(storedPrefs || {}),
  };
}

async function setUiPrefs(partialPrefs) {
  const current = await getUiPrefs();
  const next = { ...current, ...partialPrefs };
  await storageSet(STORAGE_KEYS.UI_PREFS, next);
  return next;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULTS,
    STORAGE_KEYS,
    addColorToHistory,
    addRecentInspection,
    clearSiteSession,
    deletePalette,
    deletePreset,
    getActiveTab,
    getColorHistory,
    getRecentInspections,
    getSavedPalettes,
    getSavedPresets,
    getSiteSession,
    getSiteSessions,
    getUiPrefs,
    getWidgetPosition,
    isWidgetPinned,
    saveActiveTab,
    savePalette,
    savePreset,
    saveSiteSession,
    saveWidgetPosition,
    setUiPrefs,
    setWidgetPinned,
    storageGet,
    storageSet,
  };
}
