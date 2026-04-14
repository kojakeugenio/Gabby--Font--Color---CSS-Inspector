importScripts('lib/messaging.js', 'lib/storage.js');

const injectedTabs = new Set();
const injectionJobs = new Map();

chrome.commands.onCommand.addListener(async (command) => {
  const tab = await getActiveTab();
  if (!tab || !tab.id || !isInjectableUrl(tab.url)) return;

  if (command === 'toggle-widget') {
    await sendMessageToTab(tab.id, MSG.TOGGLE_WIDGET);
    return;
  }

  if (command === 'start-inspect') {
    await sendMessageToTab(tab.id, MSG.START_INSPECT);
    return;
  }

  if (command === 'pick-color') {
    await sendMessageToTab(tab.id, MSG.START_COLOR_PICK);
  }
});

chrome.runtime.onInstalled.addListener(() => {
  void syncAutoShowAcrossTabs();
});

chrome.runtime.onStartup.addListener(() => {
  void syncAutoShowAcrossTabs();
});

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function isInjectableUrl(url) {
  if (!url) return false;

  return !(
    url.startsWith('chrome://') ||
    url.startsWith('edge://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('about:')
  );
}

async function trySendMessage(tabId, payload) {
  try {
    await chrome.tabs.sendMessage(tabId, payload);
    return true;
  } catch (error) {
    return false;
  }
}

async function shouldAutoShowFloatingIcon() {
  const prefs = await getUiPrefs();
  return prefs.showFloatingIcon !== false;
}

async function ensureWidgetInjected(tabId) {
  if (!tabId) return false;

  if (await trySendMessage(tabId, { type: MSG.TOGGLE_WIDGET, silent: true })) {
    injectedTabs.add(tabId);
    return true;
  }

  if (injectionJobs.has(tabId)) {
    return injectionJobs.get(tabId);
  }

  const job = injectWidget(tabId).finally(() => {
    injectionJobs.delete(tabId);
  });

  injectionJobs.set(tabId, job);
  return job;
}

async function injectWidget(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['lib/core.js', 'lib/messaging.js', 'lib/storage.js'],
    });

    await chrome.scripting.executeScript({
      target: { tabId },
      files: [
        'content/colorPicker.js',
        'content/fontAnalyzer.js',
        'content/fontChanger.js',
      ],
    });

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/widget.js'],
    });

    injectedTabs.add(tabId);
    return true;
  } catch (error) {
    console.error('Failed to inject widget:', error);
    return false;
  }
}

async function sendMessageToTab(tabId, type, data = {}) {
  const injected = await ensureWidgetInjected(tabId);
  if (!injected) {
    return false;
  }

  return trySendMessage(tabId, { type, ...data });
}

async function maybeAutoInjectTab(tab) {
  if (!tab?.id || !isInjectableUrl(tab.url)) return;
  if (!(await shouldAutoShowFloatingIcon())) return;
  await sendMessageToTab(tab.id, MSG.SHOW_WIDGET, { expand: false });
}

async function syncAutoShowAcrossTabs() {
  const tabs = await chrome.tabs.query({});
  const shouldShow = await shouldAutoShowFloatingIcon();

  await Promise.all(
    tabs
      .filter((tab) => tab.id && isInjectableUrl(tab.url))
      .map((tab) => {
        return shouldShow
          ? sendMessageToTab(tab.id, MSG.SHOW_WIDGET, { expand: false })
          : trySendMessage(tab.id, { type: MSG.HIDE_WIDGET });
      })
  );
}

chrome.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
  injectionJobs.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    injectedTabs.delete(tabId);
    injectionJobs.delete(tabId);
    return;
  }

  if (changeInfo.status === 'complete') {
    void maybeAutoInjectTab(tab);
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  void chrome.tabs.get(tabId)
    .then((tab) => maybeAutoInjectTab(tab))
    .catch(() => {});
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !changes[STORAGE_KEYS.UI_PREFS]) {
    return;
  }

  const prefsChange = changes[STORAGE_KEYS.UI_PREFS];
  const oldPrefs = prefsChange.oldValue || {};
  const newPrefs = prefsChange.newValue || {};

  if (oldPrefs.showFloatingIcon !== newPrefs.showFloatingIcon) {
    void syncAutoShowAcrossTabs();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MSG.CAPTURE_SCREENSHOT) {
    chrome.tabs
      .captureVisibleTab(null, { format: 'png' })
      .then((dataUrl) => {
        sendResponse({ success: true, dataUrl });
      })
      .catch((error) => {
        console.error('Screenshot capture failed:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }

  if (message.type === MSG.WIDGET_READY) {
    if (sender.tab?.id) {
      injectedTabs.add(sender.tab.id);
    }

    sendResponse({ success: true });
    return false;
  }

  if (
    !sender.tab &&
    [MSG.SHOW_WIDGET, MSG.START_INSPECT, MSG.START_COLOR_PICK].includes(message.type)
  ) {
    (async () => {
      const tab = message.tabId ? await chrome.tabs.get(message.tabId) : await getActiveTab();
      if (!tab?.id || !isInjectableUrl(tab.url)) {
        sendResponse({ success: false, error: 'unsupported-tab' });
        return;
      }

      const success = await sendMessageToTab(tab.id, message.type);
      sendResponse({ success });
    })().catch((error) => {
      console.error('Popup action failed:', error);
      sendResponse({ success: false, error: error.message });
    });

    return true;
  }

  return false;
});
