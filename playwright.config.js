const { defineConfig } = require('@playwright/test');
const path = require('node:path');

module.exports = defineConfig({
  testDir: path.join(__dirname, 'tests', 'e2e'),
  testMatch: '**/*.spec.js',
  timeout: 60000,
  use: {
    headless: false,
  },
});
