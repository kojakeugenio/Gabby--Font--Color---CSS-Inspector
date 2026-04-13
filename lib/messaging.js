/**
 * Shared runtime message names.
 */

const MSG = {
  TOGGLE_WIDGET: 'TOGGLE_WIDGET',
  SHOW_WIDGET: 'SHOW_WIDGET',
  HIDE_WIDGET: 'HIDE_WIDGET',
  WIDGET_READY: 'WIDGET_READY',
  CAPTURE_SCREENSHOT: 'CAPTURE_SCREENSHOT',
  START_INSPECT: 'START_INSPECT',
  STOP_INSPECT: 'STOP_INSPECT',
  FREEZE_TARGET: 'FREEZE_TARGET',
  START_COLOR_PICK: 'START_COLOR_PICK',
  COLOR_SAMPLE_CAPTURED: 'COLOR_SAMPLE_CAPTURED',
  APPLY_RULESET: 'APPLY_RULESET',
  EXPORT_SESSION: 'EXPORT_SESSION',
};

function sendToBackground(type, data = {}) {
  return chrome.runtime.sendMessage({ type, ...data });
}

function sendToTab(tabId, type, data = {}) {
  return chrome.tabs.sendMessage(tabId, { type, ...data });
}
