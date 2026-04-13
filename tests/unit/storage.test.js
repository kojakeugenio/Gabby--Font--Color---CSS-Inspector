const test = require('node:test');
const assert = require('node:assert/strict');

function createChromeMock() {
  const state = {};

  return {
    __state: state,
    storage: {
      local: {
        async get(key) {
          if (Array.isArray(key)) {
            return key.reduce((accumulator, entry) => {
              accumulator[entry] = state[entry];
              return accumulator;
            }, {});
          }

          return { [key]: state[key] };
        },
        async set(payload) {
          Object.assign(state, payload);
        },
      },
    },
  };
}

function loadStorageModule() {
  const modulePath = require.resolve('../../lib/storage.js');
  delete require.cache[modulePath];
  return require(modulePath);
}

test('addColorToHistory deduplicates and keeps newest first', async () => {
  global.chrome = createChromeMock();
  const storage = loadStorageModule();

  await storage.addColorToHistory('#111111');
  await storage.addColorToHistory('#222222');
  const result = await storage.addColorToHistory('#111111');

  assert.deepEqual(result, ['#111111', '#222222']);
  delete global.chrome;
});

test('savePreset prepends the latest preset and persists it', async () => {
  global.chrome = createChromeMock();
  const storage = loadStorageModule();

  await storage.savePreset({ id: 'preset-1', name: 'Body', declarations: { fontSize: '18px' } });
  const presets = await storage.savePreset({ id: 'preset-2', name: 'Hero', declarations: { fontSize: '48px' } });

  assert.equal(presets[0].id, 'preset-2');
  assert.equal(presets[1].id, 'preset-1');
  delete global.chrome;
});

test('saveSiteSession stores rules under a site key', async () => {
  global.chrome = createChromeMock();
  const storage = loadStorageModule();

  await storage.saveSiteSession('https://example.com', {
    rules: [{ id: 'rule-1', selector: 'body', declarations: { color: '#111111' } }],
  });

  const session = await storage.getSiteSession('https://example.com');
  assert.equal(session.rules.length, 1);
  assert.equal(session.rules[0].selector, 'body');
  delete global.chrome;
});

test('getUiPrefs merges new defaults into existing stored prefs', async () => {
  const chrome = createChromeMock();
  chrome.__state.uiPrefs = { onboardingDismissed: true };
  global.chrome = chrome;

  const storage = loadStorageModule();
  const prefs = await storage.getUiPrefs();

  assert.deepEqual(prefs, {
    onboardingDismissed: true,
    compactFlow: true,
    themeMode: 'auto',
    showFloatingIcon: true,
  });

  delete global.chrome;
});
