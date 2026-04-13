(async () => {
  const openWidgetBtn = document.getElementById('popup-open-widget');
  const startInspectBtn = document.getElementById('popup-start-inspect');
  const startColorBtn = document.getElementById('popup-start-color');
  const autoShowInput = document.getElementById('popup-auto-show');
  const statusEl = document.getElementById('popup-status');

  function isInjectableUrl(url) {
    if (!url) return false;

    return !(
      url.startsWith('chrome://') ||
      url.startsWith('edge://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('about:')
    );
  }

  async function getActiveBrowserTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0] || null;
  }

  function setBusy(isBusy) {
    [openWidgetBtn, startInspectBtn, startColorBtn, autoShowInput].forEach((element) => {
      element.disabled = isBusy;
    });
  }

  function setStatus(message) {
    statusEl.textContent = message;
  }

  async function getSupportedActiveTab() {
    const tab = await getActiveBrowserTab();
    if (!tab?.id || !isInjectableUrl(tab.url)) {
      return null;
    }

    return tab;
  }

  async function runPopupAction(type, successMessage) {
    setBusy(true);

    try {
      const tab = await getSupportedActiveTab();
      if (!tab) {
        setStatus('This page does not support the floating panel.');
        return;
      }

      const response = await chrome.runtime.sendMessage({
        type,
        tabId: tab.id,
      });

      if (!response?.success) {
        setStatus('Unable to open Gabby on this page.');
        return;
      }

      setStatus(successMessage);
    } catch (error) {
      setStatus(error.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  openWidgetBtn.addEventListener('click', () => {
    void runPopupAction(MSG.SHOW_WIDGET, 'Floating panel opened on this page.');
  });

  startInspectBtn.addEventListener('click', () => {
    void runPopupAction(MSG.START_INSPECT, 'Inspect mode started on this page.');
  });

  startColorBtn.addEventListener('click', () => {
    void runPopupAction(MSG.START_COLOR_PICK, 'Color picker started on this page.');
  });

  autoShowInput.addEventListener('change', async () => {
    setBusy(true);

    try {
      await setUiPrefs({ showFloatingIcon: autoShowInput.checked });
      setStatus(
        autoShowInput.checked
          ? 'Floating icon will appear automatically on supported pages.'
          : 'Floating icon auto-show is off. Open it manually from this popup when needed.'
      );
    } catch (error) {
      autoShowInput.checked = !autoShowInput.checked;
      setStatus(error.message || 'Unable to save setting.');
    } finally {
      setBusy(false);
    }
  });

  const prefs = await getUiPrefs();
  autoShowInput.checked = prefs.showFloatingIcon !== false;

  const activeTab = await getActiveBrowserTab();
  setStatus(
    activeTab && isInjectableUrl(activeTab.url)
      ? 'Ready.'
      : 'Open a regular webpage to use the floating panel.'
  );
})();
