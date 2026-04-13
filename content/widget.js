/**
 * Unified widget UI for inspect, color, and tweak workflows.
 */

if (!document.getElementById('fcc-extension-host')) {
  (() => {
    const core = window.__fccCore;

    const host = document.createElement('div');
    host.id = 'fcc-extension-host';
    Object.assign(host.style, {
      position: 'fixed',
      top: '0',
      right: '0',
      width: '0',
      height: '0',
      zIndex: '2147483647',
      pointerEvents: 'none',
      overflow: 'visible',
    });

    const shadow = host.attachShadow({ mode: 'closed' });
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = chrome.runtime.getURL('content/widget.css');
    shadow.appendChild(styleLink);
    const logoUrl = chrome.runtime.getURL('logo.png');

    const widget = document.createElement('div');
    widget.className = 'fcc-widget';
    widget.innerHTML = `
      <button class="fcc-pill" id="fcc-pill" title="Gabby: Font, Color & CSS Inspector">
        <img class="fcc-pill-logo" src="${logoUrl}" alt="" />
      </button>

      <div class="fcc-drawer" id="fcc-drawer">
        <div class="fcc-header">
          <div class="fcc-brand">
            <img class="fcc-brand-logo" src="${logoUrl}" alt="" />
            <div class="fcc-title">Gabby</div>
          </div>
          <div class="fcc-header-actions">
            <button class="fcc-icon-btn fcc-theme-btn" id="fcc-theme-toggle" title="Theme: Auto">Auto</button>
            <button class="fcc-icon-btn" id="fcc-pin" title="Pin">Pin</button>
            <button class="fcc-icon-btn" id="fcc-minimize" title="Minimize">Hide</button>
          </div>
        </div>

        <div class="fcc-onboarding" id="fcc-onboarding">
          <div class="fcc-onboarding-main">
            <div class="fcc-onboarding-title">Quick start</div>
            <div class="fcc-onboarding-copy">
              Start by freezing one heading or paragraph. After that, Change will target only that element by default.
            </div>
            <div class="fcc-step-row">
              <span class="fcc-step-chip">1 Inspect</span>
              <span class="fcc-step-chip">2 Preview</span>
              <span class="fcc-step-chip">3 Apply</span>
            </div>
            <div class="fcc-stack-row">
              <button class="fcc-btn fcc-btn-primary" id="fcc-quick-inspect">Inspect text</button>
              <button class="fcc-btn fcc-btn-secondary" id="fcc-quick-palette">Scan page colors</button>
            </div>
          </div>
          <button class="fcc-btn fcc-btn-ghost fcc-btn-sm" id="fcc-dismiss-onboarding">Hide tips</button>
        </div>

        <div class="fcc-status" id="fcc-status-card">
          <div class="fcc-status-copy">
            <div class="fcc-status-label" id="fcc-status-label">Start here</div>
            <div class="fcc-status-text" id="fcc-status-text">
              Inspect one text element. After that, Change will target it automatically.
            </div>
          </div>
          <button class="fcc-btn fcc-btn-secondary fcc-btn-sm" id="fcc-status-action">Inspect text</button>
        </div>

        <div class="fcc-tabs" id="fcc-tabs">
          <button class="fcc-tab active" data-tab="0">Inspect</button>
          <button class="fcc-tab" data-tab="1">Colors</button>
          <button class="fcc-tab" data-tab="2">Change</button>
          <div class="fcc-tab-indicator" id="fcc-tab-indicator"></div>
        </div>

        <div class="fcc-content">
          <div class="fcc-panel active" data-panel="0">
            <div class="fcc-panel-content">
              <div class="fcc-stack-row">
                <button class="fcc-btn fcc-btn-primary" id="fcc-start-inspect">Inspect Text</button>
                <button class="fcc-btn fcc-btn-secondary" id="fcc-use-inspection" disabled>Edit This Element</button>
              </div>

              <div class="fcc-note">Hover text, click once to freeze it, then move to Change. Press Esc to cancel.</div>

              <div class="fcc-empty" id="fcc-inspect-empty">
                Start with one text element. You will see its selector, typography, colors, and contrast score here.
              </div>

              <div class="fcc-card" id="fcc-inspect-card" hidden>
                <div class="fcc-card-head">
                  <div>
                    <div class="fcc-kicker">Frozen Selector</div>
                    <div class="fcc-code" id="fcc-inspect-selector">—</div>
                  </div>
                  <button class="fcc-btn fcc-btn-ghost fcc-btn-sm" id="fcc-copy-selector">Copy</button>
                </div>

                <div class="fcc-breadcrumb" id="fcc-inspect-breadcrumb">—</div>
                <div class="fcc-preview-text" id="fcc-inspect-text">—</div>

                <div class="fcc-data-grid">
                  <div class="fcc-data-row"><span>Family</span><strong id="fcc-inspect-family">—</strong></div>
                  <div class="fcc-data-row"><span>Size</span><strong id="fcc-inspect-size">—</strong></div>
                  <div class="fcc-data-row"><span>Weight</span><strong id="fcc-inspect-weight">—</strong></div>
                  <div class="fcc-data-row"><span>Style</span><strong id="fcc-inspect-style">—</strong></div>
                  <div class="fcc-data-row"><span>Line height</span><strong id="fcc-inspect-line-height">—</strong></div>
                  <div class="fcc-data-row"><span>Letter spacing</span><strong id="fcc-inspect-letter-spacing">—</strong></div>
                </div>

                <div class="fcc-color-pair">
                  <div class="fcc-color-block">
                    <span class="fcc-swatch" id="fcc-inspect-text-swatch"></span>
                    <div>
                      <div class="fcc-kicker">Text Color</div>
                      <div class="fcc-code" id="fcc-inspect-text-color">—</div>
                    </div>
                  </div>
                  <div class="fcc-color-block">
                    <span class="fcc-swatch" id="fcc-inspect-background-swatch"></span>
                    <div>
                      <div class="fcc-kicker">Background</div>
                      <div class="fcc-code" id="fcc-inspect-background-color">—</div>
                    </div>
                  </div>
                </div>

                <div class="fcc-contrast-row">
                  <div class="fcc-badge" id="fcc-wcag-badge">WCAG —</div>
                  <div class="fcc-badge" id="fcc-apca-badge">APCA —</div>
                  <div class="fcc-badge" id="fcc-ratio-badge">Ratio —</div>
                </div>

                <div class="fcc-stack-row">
                  <button class="fcc-btn fcc-btn-secondary fcc-btn-sm" id="fcc-edit-text" disabled>Edit text</button>
                  <button class="fcc-btn fcc-btn-ghost fcc-btn-sm" id="fcc-toggle-remove-element" disabled>Remove element</button>
                </div>

                <div class="fcc-stack-row">
                  <button class="fcc-btn fcc-btn-secondary fcc-btn-sm" id="fcc-copy-inspect-css">Copy CSS</button>
                  <button class="fcc-btn fcc-btn-ghost fcc-btn-sm" id="fcc-copy-inspect-summary">Copy Summary</button>
                </div>
              </div>

              <div class="fcc-subhead">Recent inspections</div>
              <div class="fcc-list" id="fcc-recent-inspections"></div>
            </div>
          </div>

          <div class="fcc-panel" data-panel="1">
            <div class="fcc-panel-content">
              <div class="fcc-stack-row">
                <button class="fcc-btn fcc-btn-primary" id="fcc-pick-color">Pick Exact Color</button>
                <button class="fcc-btn fcc-btn-secondary" id="fcc-scan-palette">Scan Page Colors</button>
                <button class="fcc-btn fcc-btn-ghost" id="fcc-save-palette" disabled>Save Palette</button>
              </div>

              <div class="fcc-note">Pick one exact pixel color, or scan recurring text, background, and border colors across the page.</div>

              <div class="fcc-empty" id="fcc-picked-empty">
                Pick a pixel to sample one exact on-screen color.
              </div>

              <div class="fcc-card" id="fcc-picked-card" hidden>
                <div class="fcc-card-head">
                  <div>
                    <div class="fcc-kicker">Latest Sample</div>
                    <div class="fcc-code" id="fcc-picked-hex">—</div>
                  </div>
                  <span class="fcc-swatch fcc-swatch-lg" id="fcc-picked-swatch"></span>
                </div>
                <div class="fcc-data-grid">
                  <div class="fcc-data-row"><span>RGB</span><strong id="fcc-picked-rgb">—</strong></div>
                  <div class="fcc-data-row"><span>HSL</span><strong id="fcc-picked-hsl">—</strong></div>
                  <div class="fcc-data-row"><span>Contrast vs inspected background</span><strong id="fcc-picked-contrast">—</strong></div>
                </div>
              </div>

              <div class="fcc-empty" id="fcc-palette-empty">
                Scan the page to build a reusable palette from text, background, and border colors.
              </div>

              <div class="fcc-card" id="fcc-palette-card" hidden>
                <div class="fcc-card-head">
                  <div>
                    <div class="fcc-kicker">Current Palette</div>
                    <div class="fcc-code" id="fcc-palette-name">—</div>
                  </div>
                </div>

                <div class="fcc-palette-group">
                  <div class="fcc-subhead">Text</div>
                  <div class="fcc-swatch-grid" id="fcc-palette-text"></div>
                </div>
                <div class="fcc-palette-group">
                  <div class="fcc-subhead">Background</div>
                  <div class="fcc-swatch-grid" id="fcc-palette-background"></div>
                </div>
                <div class="fcc-palette-group">
                  <div class="fcc-subhead">Border</div>
                  <div class="fcc-swatch-grid" id="fcc-palette-border"></div>
                </div>
              </div>

              <div class="fcc-subhead">Saved palettes</div>
              <div class="fcc-list" id="fcc-saved-palettes"></div>
            </div>
          </div>

          <div class="fcc-panel" data-panel="2">
            <div class="fcc-panel-content">
              <div class="fcc-note">Change only the controls you want. Preview updates live, and nothing is committed until you click Apply Change.</div>

              <div class="fcc-card fcc-card-compact" id="fcc-target-card">
                <div class="fcc-card-head">
                  <div>
                    <div class="fcc-kicker" id="fcc-target-label">Recommended target</div>
                    <div class="fcc-code" id="fcc-target-text">Inspect an element first to edit only that element.</div>
                  </div>
                  <button class="fcc-btn fcc-btn-secondary fcc-btn-sm" id="fcc-target-inspect">Inspect text</button>
                </div>
              </div>

              <div class="fcc-card fcc-card-compact" id="fcc-preview-card">
                <div class="fcc-kicker" id="fcc-preview-label">Live preview</div>
                <div class="fcc-status-text" id="fcc-preview-text">
                  Change one or more controls below to preview styles before applying them.
                </div>
              </div>

              <div class="fcc-field-group">
                <label class="fcc-field-label">Change target</label>
                <div class="fcc-segmented fcc-segmented-two" id="fcc-basic-scope-selector">
                  <button class="fcc-segment" data-basic-scope="element">This element</button>
                  <button class="fcc-segment active" data-basic-scope="page">Whole page</button>
                </div>
                <div class="fcc-note" id="fcc-target-help">Inspect one element for the safest first edit, or switch to Whole page.</div>
                <button class="fcc-text-btn" id="fcc-toggle-advanced">Show advanced targets and saved styles</button>
              </div>

              <div class="fcc-advanced" id="fcc-advanced-panel" hidden>
                <div class="fcc-field-group">
                  <label class="fcc-field-label">Advanced targets</label>
                  <div class="fcc-segmented fcc-segmented-two" id="fcc-advanced-scope-selector">
                    <button class="fcc-segment" data-advanced-scope="tag">By tag</button>
                    <button class="fcc-segment" data-advanced-scope="selector">Custom CSS</button>
                  </div>
                </div>

                <div class="fcc-field-group" id="fcc-tag-group" hidden>
                  <label class="fcc-field-label" for="fcc-tag-select">HTML tag</label>
                  <select class="fcc-select" id="fcc-tag-select">
                    <option value="h1">h1</option>
                    <option value="h2">h2</option>
                    <option value="h3">h3</option>
                    <option value="h4">h4</option>
                    <option value="h5">h5</option>
                    <option value="h6">h6</option>
                    <option value="p">p</option>
                    <option value="a">a</option>
                    <option value="button">button</option>
                    <option value="label">label</option>
                    <option value="li">li</option>
                    <option value="span">span</option>
                  </select>
                </div>

                <div class="fcc-field-group" id="fcc-selector-group" hidden>
                  <label class="fcc-field-label" for="fcc-selector-input">Custom selector</label>
                  <input class="fcc-text-input" id="fcc-selector-input" placeholder=".hero-title, .card p" />
                </div>

                <div class="fcc-field-group">
                  <label class="fcc-field-label" for="fcc-preset-name">Save current controls as a preset</label>
                  <div class="fcc-inline">
                    <input class="fcc-text-input" id="fcc-preset-name" placeholder="Editorial serif / Dense body copy" />
                    <button class="fcc-btn fcc-btn-secondary fcc-btn-sm" id="fcc-save-preset">Save</button>
                  </div>
                </div>

                <div class="fcc-field-group">
                  <label class="fcc-field-label" for="fcc-presets-select">Saved presets</label>
                  <div class="fcc-inline">
                    <select class="fcc-select" id="fcc-presets-select">
                      <option value="">Select a preset</option>
                    </select>
                    <button class="fcc-btn fcc-btn-secondary fcc-btn-sm" id="fcc-apply-preset">Load</button>
                    <button class="fcc-btn fcc-btn-ghost fcc-btn-sm" id="fcc-export-preset">Export</button>
                  </div>
                </div>
              </div>

              <div class="fcc-field-group">
                <label class="fcc-field-label" for="fcc-font-family">Font family</label>
                <select class="fcc-select" id="fcc-font-family">
                  <option value="">No change</option>
                  <optgroup label="Web Safe" id="fcc-fonts-websafe"></optgroup>
                  <optgroup label="Google Fonts" id="fcc-fonts-google"></optgroup>
                </select>
              </div>

              <div class="fcc-field-group">
                <label class="fcc-field-label">Font size <span id="fcc-size-display">—</span></label>
                <input type="range" class="fcc-slider" id="fcc-font-size" min="10" max="72" value="16" step="1" />
              </div>

              <div class="fcc-field-group">
                <label class="fcc-field-label">Font weight <span id="fcc-weight-display">—</span></label>
                <input type="range" class="fcc-slider" id="fcc-font-weight" min="100" max="900" value="400" step="100" />
              </div>

              <div class="fcc-field-group">
                <label class="fcc-field-label">Line height <span id="fcc-line-height-display">—</span></label>
                <input type="range" class="fcc-slider" id="fcc-line-height" min="0.8" max="3" value="1.5" step="0.1" />
              </div>

              <div class="fcc-field-group">
                <label class="fcc-field-label">Letter spacing <span id="fcc-letter-spacing-display">—</span></label>
                <input type="range" class="fcc-slider" id="fcc-letter-spacing" min="-2" max="12" value="0" step="0.1" />
              </div>

              <div class="fcc-field-group">
                <label class="fcc-field-label">Text color <span id="fcc-font-color-label">—</span></label>
                <input type="color" class="fcc-color-input" id="fcc-font-color" value="#111827" />
              </div>

              <div class="fcc-field-group">
                <label class="fcc-field-label">Background color <span id="fcc-background-color-label">—</span></label>
                <input type="color" class="fcc-color-input" id="fcc-background-color" value="#ffffff" />
              </div>

              <div class="fcc-stack-row">
                <button class="fcc-btn fcc-btn-primary" id="fcc-apply-rule">Apply Change</button>
                <button class="fcc-btn fcc-btn-secondary" id="fcc-undo-rule">Undo</button>
                <button class="fcc-btn fcc-btn-secondary" id="fcc-redo-rule">Redo</button>
              </div>

              <div class="fcc-override-indicator" id="fcc-override-indicator" hidden>Session rules active on this site</div>

              <div class="fcc-advanced" id="fcc-rule-tools" hidden>
                <div class="fcc-stack-row">
                  <button class="fcc-btn fcc-btn-ghost" id="fcc-reset-rules">Reset Site</button>
                  <button class="fcc-btn fcc-btn-ghost" id="fcc-export-css">Copy CSS</button>
                  <button class="fcc-btn fcc-btn-ghost" id="fcc-export-session">Copy Session</button>
                </div>

                <div class="fcc-subhead">Active rules</div>
                <div class="fcc-list" id="fcc-active-rules"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="fcc-toast" id="fcc-toast">Copied</div>
    `;

    shadow.appendChild(widget);
    document.documentElement.appendChild(host);

    let isPinned = false;
    let isExpanded = false;
    let isDragging = false;
    let isAdvancedOpen = false;
    let activeTabIndex = 0;
    let selectedScopeKind = 'page';
    let statusActionMode = 'inspect';
    let themeMode = 'auto';
    let effectiveTheme = 'light';
    let themeRefreshTimer = null;
    let themeMutationObserver = null;

    let currentInspection = null;
    let currentPalette = null;
    let currentPickedColor = null;
    let recentInspections = [];
    let savedPresets = [];
    let savedPalettes = [];

    const touched = {
      fontSize: false,
      fontWeight: false,
      lineHeight: false,
      letterSpacing: false,
      color: false,
      backgroundColor: false,
    };

    const pill = shadow.getElementById('fcc-pill');
    const themeToggleBtn = shadow.getElementById('fcc-theme-toggle');
    const pinBtn = shadow.getElementById('fcc-pin');
    const minimizeBtn = shadow.getElementById('fcc-minimize');
    const tabIndicator = shadow.getElementById('fcc-tab-indicator');
    const tabs = shadow.getElementById('fcc-tabs');
    const toast = shadow.getElementById('fcc-toast');
    const onboarding = shadow.getElementById('fcc-onboarding');
    const overrideIndicator = shadow.getElementById('fcc-override-indicator');
    const statusLabelEl = shadow.getElementById('fcc-status-label');
    const statusTextEl = shadow.getElementById('fcc-status-text');
    const statusActionBtn = shadow.getElementById('fcc-status-action');
    const quickInspectBtn = shadow.getElementById('fcc-quick-inspect');
    const quickPaletteBtn = shadow.getElementById('fcc-quick-palette');

    const startInspectBtn = shadow.getElementById('fcc-start-inspect');
    const useInspectionBtn = shadow.getElementById('fcc-use-inspection');
    const inspectEmpty = shadow.getElementById('fcc-inspect-empty');
    const inspectCard = shadow.getElementById('fcc-inspect-card');
    const recentInspectionsEl = shadow.getElementById('fcc-recent-inspections');
    const editTextBtn = shadow.getElementById('fcc-edit-text');
    const toggleRemoveElementBtn = shadow.getElementById('fcc-toggle-remove-element');

    const pickColorBtn = shadow.getElementById('fcc-pick-color');
    const scanPaletteBtn = shadow.getElementById('fcc-scan-palette');
    const savePaletteBtn = shadow.getElementById('fcc-save-palette');
    const pickedEmpty = shadow.getElementById('fcc-picked-empty');
    const pickedCard = shadow.getElementById('fcc-picked-card');
    const paletteEmpty = shadow.getElementById('fcc-palette-empty');
    const paletteCard = shadow.getElementById('fcc-palette-card');
    const savedPalettesEl = shadow.getElementById('fcc-saved-palettes');

    const basicScopeSelector = shadow.getElementById('fcc-basic-scope-selector');
    const advancedScopeSelector = shadow.getElementById('fcc-advanced-scope-selector');
    const advancedPanel = shadow.getElementById('fcc-advanced-panel');
    const toggleAdvancedBtn = shadow.getElementById('fcc-toggle-advanced');
    const targetHelpEl = shadow.getElementById('fcc-target-help');
    const targetCard = shadow.getElementById('fcc-target-card');
    const targetLabelEl = shadow.getElementById('fcc-target-label');
    const targetTextEl = shadow.getElementById('fcc-target-text');
    const targetInspectBtn = shadow.getElementById('fcc-target-inspect');
    const previewLabelEl = shadow.getElementById('fcc-preview-label');
    const previewTextEl = shadow.getElementById('fcc-preview-text');
    const ruleTools = shadow.getElementById('fcc-rule-tools');
    const tagGroup = shadow.getElementById('fcc-tag-group');
    const selectorGroup = shadow.getElementById('fcc-selector-group');
    const tagSelect = shadow.getElementById('fcc-tag-select');
    const selectorInput = shadow.getElementById('fcc-selector-input');

    const presetNameInput = shadow.getElementById('fcc-preset-name');
    const presetsSelect = shadow.getElementById('fcc-presets-select');
    const savePresetBtn = shadow.getElementById('fcc-save-preset');
    const applyPresetBtn = shadow.getElementById('fcc-apply-preset');
    const exportPresetBtn = shadow.getElementById('fcc-export-preset');
    const fontFamilySelect = shadow.getElementById('fcc-font-family');
    const fontSizeSlider = shadow.getElementById('fcc-font-size');
    const fontWeightSlider = shadow.getElementById('fcc-font-weight');
    const lineHeightSlider = shadow.getElementById('fcc-line-height');
    const letterSpacingSlider = shadow.getElementById('fcc-letter-spacing');
    const fontColorInput = shadow.getElementById('fcc-font-color');
    const backgroundColorInput = shadow.getElementById('fcc-background-color');
    const applyRuleBtn = shadow.getElementById('fcc-apply-rule');
    const THEME_MODES = ['auto', 'dark', 'light'];
    const THEME_HINT_ATTRIBUTES = [
      'data-theme',
      'data-color-mode',
      'data-bs-theme',
      'theme',
      'color-mode',
    ];

    function normalizeThemeMode(value) {
      return THEME_MODES.includes(value) ? value : 'auto';
    }

    function capitalize(value) {
      const input = String(value || '');
      return input ? `${input.charAt(0).toUpperCase()}${input.slice(1)}` : '';
    }

    function getThemeHintFromValue(value) {
      const normalized = String(value || '').trim().toLowerCase();
      if (!normalized) {
        return null;
      }

      if (
        normalized === 'dark' ||
        normalized === 'darkmode' ||
        normalized === 'dark-mode' ||
        normalized.includes('theme-dark')
      ) {
        return 'dark';
      }

      if (
        normalized === 'light' ||
        normalized === 'lightmode' ||
        normalized === 'light-mode' ||
        normalized.includes('theme-light')
      ) {
        return 'light';
      }

      const tokens = normalized.split(/[\s:_-]+/).filter(Boolean);
      if (tokens.includes('dark') || tokens.includes('night')) {
        return 'dark';
      }

      if (tokens.includes('light') || tokens.includes('day')) {
        return 'light';
      }

      return null;
    }

    function getThemeFromDocumentHints() {
      const elements = [document.documentElement, document.body].filter(Boolean);

      for (const element of elements) {
        const classHint = getThemeHintFromValue(element.className);
        if (classHint) {
          return classHint;
        }

        for (const attributeName of THEME_HINT_ATTRIBUTES) {
          const attributeHint = getThemeHintFromValue(element.getAttribute(attributeName));
          if (attributeHint) {
            return attributeHint;
          }
        }
      }

      return null;
    }

    function getThemeFromSamples(samples) {
      if (!samples.length) {
        return 'light';
      }

      const averageLuminance = samples.reduce((sum, sample) => {
        return sum + core.relativeLuminance(sample);
      }, 0) / samples.length;

      return averageLuminance < 0.42 ? 'dark' : 'light';
    }

    function getThemeFromColor(color) {
      return color && core.relativeLuminance(color) < 0.42 ? 'dark' : 'light';
    }

    function getRootThemeSamples() {
      return [document.body, document.documentElement]
        .filter(Boolean)
        .map((element) => core.parseCssColor(window.getComputedStyle(element).backgroundColor))
        .filter((color) => color && color.a > 0);
    }

    function getViewportThemeSamples() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const points = [
        { x: width * 0.25, y: height * 0.2 },
        { x: width * 0.5, y: height * 0.2 },
        { x: width * 0.75, y: height * 0.2 },
        { x: width * 0.5, y: height * 0.5 },
        { x: width * 0.5, y: height * 0.8 },
      ];

      return points
        .map(({ x, y }) => document.elementFromPoint(Math.round(x), Math.round(y)))
        .filter((element) => element && element !== host && !host.contains(element))
        .map((element) => core.getResolvedBackgroundColor(element))
        .filter((color) => color && color.a > 0);
    }

    function getViewportThemeVotes() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const points = [
        { x: width * 0.25, y: height * 0.2 },
        { x: width * 0.5, y: height * 0.2 },
        { x: width * 0.75, y: height * 0.2 },
        { x: width * 0.5, y: height * 0.5 },
        { x: width * 0.5, y: height * 0.8 },
      ];

      return points
        .map(({ x, y }) => document.elementFromPoint(Math.round(x), Math.round(y)))
        .filter((element) => element && element !== host && !host.contains(element))
        .map((element) => inferThemeFromElement(element))
        .filter(Boolean);
    }

    function getMetaThemeColorTheme() {
      const metaTag = document.querySelector('meta[name="theme-color"], meta[name="msapplication-navbutton-color"]');
      if (!metaTag) {
        return null;
      }

      const color = core.parseCssColor(metaTag.getAttribute('content'));
      return color ? getThemeFromColor(color) : null;
    }

    function inferThemeFromElement(element) {
      let current = element;

      while (current && current !== document.documentElement) {
        const styles = window.getComputedStyle(current);
        const backgroundColor = core.parseCssColor(styles.backgroundColor);

        if (backgroundColor && backgroundColor.a > 0) {
          return getThemeFromColor(backgroundColor);
        }

        if (styles.backgroundImage && styles.backgroundImage !== 'none') {
          const textColor = core.parseCssColor(styles.color);
          if (textColor) {
            return core.relativeLuminance(textColor) > 0.58 ? 'dark' : 'light';
          }
        }

        current = current.parentElement;
      }

      return null;
    }

    function getDocumentColorSchemeTheme() {
      const colorSchemeValue = [document.documentElement, document.body]
        .filter(Boolean)
        .map((element) => window.getComputedStyle(element).colorScheme || '')
        .join(' ')
        .trim()
        .toLowerCase();

      if (!colorSchemeValue) {
        return null;
      }

      if (colorSchemeValue.includes('dark') && !colorSchemeValue.includes('light')) {
        return 'dark';
      }

      if (colorSchemeValue.includes('light') && !colorSchemeValue.includes('dark')) {
        return 'light';
      }

      return null;
    }

    function detectAutoTheme() {
      const documentHintTheme = getThemeFromDocumentHints();
      if (documentHintTheme) {
        return documentHintTheme;
      }

      const rootSamples = getRootThemeSamples();
      if (rootSamples.length) {
        return getThemeFromSamples(rootSamples);
      }

      const documentColorScheme = getDocumentColorSchemeTheme();
      if (documentColorScheme) {
        return documentColorScheme;
      }

      const viewportVotes = getViewportThemeVotes();
      if (viewportVotes.length) {
        const darkVotes = viewportVotes.filter((vote) => vote === 'dark').length;
        return darkVotes >= Math.ceil(viewportVotes.length / 2) ? 'dark' : 'light';
      }

      const viewportSamples = getViewportThemeSamples();
      if (viewportSamples.length) {
        return getThemeFromSamples(viewportSamples);
      }

      const metaTheme = getMetaThemeColorTheme();
      if (metaTheme) {
        return metaTheme;
      }

      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    function updateThemeToggle() {
      themeToggleBtn.textContent = capitalize(themeMode);
      themeToggleBtn.dataset.mode = themeMode;
      themeToggleBtn.classList.toggle('active', themeMode !== 'auto');

      const title = themeMode === 'auto'
        ? `Theme: Auto (currently ${capitalize(effectiveTheme)})`
        : `Theme: ${capitalize(themeMode)}`;
      themeToggleBtn.title = `${title}. Click to cycle Auto, Dark, Light.`;
      themeToggleBtn.setAttribute('aria-label', themeToggleBtn.title);
    }

    function applyResolvedTheme() {
      effectiveTheme = themeMode === 'auto' ? detectAutoTheme() : themeMode;
      host.dataset.theme = effectiveTheme;
      host.dataset.themeMode = themeMode;
      updateThemeToggle();
    }

    async function setThemeMode(nextMode, { persist = true } = {}) {
      themeMode = normalizeThemeMode(nextMode);
      applyResolvedTheme();

      if (persist) {
        await setUiPrefs({ themeMode });
      }
    }

    function scheduleThemeRefresh() {
      if (themeMode !== 'auto') {
        return;
      }

      clearTimeout(themeRefreshTimer);
      themeRefreshTimer = setTimeout(() => {
        applyResolvedTheme();
      }, 120);
    }

    function observePageTheme() {
      if (themeMutationObserver) {
        return;
      }

      themeMutationObserver = new MutationObserver(() => {
        scheduleThemeRefresh();
      });

      const observerOptions = {
        attributes: true,
        attributeFilter: ['class', 'style'],
      };

      if (document.documentElement) {
        themeMutationObserver.observe(document.documentElement, observerOptions);
      }

      if (document.body) {
        themeMutationObserver.observe(document.body, observerOptions);
      }

      window.addEventListener('resize', scheduleThemeRefresh);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          scheduleThemeRefresh();
        }
      });
    }

    async function cycleThemeMode() {
      const currentIndex = THEME_MODES.indexOf(themeMode);
      const nextMode = THEME_MODES[(currentIndex + 1) % THEME_MODES.length];
      await setThemeMode(nextMode);

      const label = nextMode === 'auto'
        ? `Auto (${capitalize(effectiveTheme)})`
        : capitalize(nextMode);
      showToast(`Theme set to ${label}`);
    }

    async function init() {
      const savedPosition = await getWidgetPosition();
      widget.style.top = `${savedPosition !== null ? savedPosition : window.innerHeight / 2 - 40}px`;

      isPinned = await isWidgetPinned();
      pinBtn.classList.toggle('active', isPinned);

      activeTabIndex = await getActiveTab();
      switchTab(activeTabIndex);

      const uiPrefs = await getUiPrefs();
      onboarding.hidden = Boolean(uiPrefs.onboardingDismissed);
      themeMode = normalizeThemeMode(uiPrefs.themeMode);
      observePageTheme();
      await setThemeMode(themeMode, { persist: false });

      populateFontLists();
      restoreLatestInspection();
      await hydrateSavedState();
      await restoreSiteSession();
      updateScopeVisibility();
      updateControlDisplays();
      updateRuleState();
      updateTargetCard();
      updatePreviewCard();
      updateTextEditButton();
      updateActionButtons();
      updateStatusCard();

      chrome.runtime.sendMessage({ type: MSG.WIDGET_READY });
    }

    async function hydrateSavedState() {
      recentInspections = await getRecentInspections();
      savedPresets = await getSavedPresets();
      savedPalettes = await getSavedPalettes();

      renderRecentInspections();
      renderPresets();
      renderSavedPalettes();

      if (!currentInspection) {
        const latestForSite = recentInspections.find((inspection) => inspection.siteKey === core.getSiteKey(location.href));
        if (latestForSite) {
          setInspection(latestForSite, false);
        }
      }
    }

    async function restoreSiteSession() {
      const restored = await window.__fccFontChanger.restoreSiteSession();
      if (restored.restored && restored.rules.length) {
        showToast('Restored local session');
      }
      updateRuleState();
    }

    function restoreLatestInspection() {
      setPickedColor(null);
      renderPalette(null);
    }

    async function dismissOnboarding() {
      onboarding.hidden = true;
      await setUiPrefs({ onboardingDismissed: true });
    }

    function completeOnboarding() {
      if (!onboarding.hidden) {
        void dismissOnboarding();
      }
    }

    function openChangeTab({ focusElement = false, revealRules = false } = {}) {
      expandDrawer();
      switchTab(2);

      if (focusElement) {
        setScope('element');
      } else {
        updatePreviewCard();
        updateActionButtons();
      }

      if (revealRules) {
        isAdvancedOpen = true;
        updateScopeVisibility();
      }
    }

    function openChangeForCurrentElement() {
      openChangeTab({ focusElement: true });
    }

    function handleStatusAction() {
      if (statusActionMode === 'finish-text-edit') {
        window.__fccFontChanger.finishTextEdit();
        return;
      }

      if (statusActionMode === 'review') {
        openChangeTab({ revealRules: true });
        return;
      }

      if (statusActionMode === 'change-element') {
        openChangeForCurrentElement();
        return;
      }

      if (statusActionMode === 'colors') {
        expandDrawer();
        switchTab(1);
        return;
      }

      startInspectMode();
    }

    function truncateText(value, maxLength = 56) {
      if (!value) return '';
      return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
    }

    function getInspectionName() {
      if (!currentInspection) return 'an inspected element';

      const label = currentInspection.textPreview || currentInspection.selector || currentInspection.tagName;
      return truncateText(label, 56);
    }

    function updateStatusCard() {
      const state = window.__fccFontChanger.getState();

      if (state.textEdit?.active) {
        statusLabelEl.textContent = 'Editing text';
        statusTextEl.textContent = 'Type directly on the page. Click outside to save, or press Esc to cancel.';
        statusActionBtn.textContent = 'Finish editing';
        statusActionMode = 'finish-text-edit';
        return;
      }

      if (state.rules.length > 0) {
        statusLabelEl.textContent = 'Local session';
        statusTextEl.textContent = `${state.rules.length} active change${state.rules.length === 1 ? '' : 's'} are saved only for this site.`;
        statusActionBtn.textContent = 'Review changes';
        statusActionMode = 'review';
        return;
      }

      if (currentInspection) {
        statusLabelEl.textContent = 'Next step';
        statusTextEl.textContent = `${getInspectionName()} is ready. Open Change to preview edits on just this element.`;
        statusActionBtn.textContent = 'Open Change';
        statusActionMode = 'change-element';
        return;
      }

      if (currentPalette) {
        statusLabelEl.textContent = 'Colors ready';
        statusTextEl.textContent = 'Your page palette is ready in Colors. You can save it or copy any swatch.';
        statusActionBtn.textContent = 'Open Colors';
        statusActionMode = 'colors';
        return;
      }

      statusLabelEl.textContent = 'Start here';
      statusTextEl.textContent = 'Inspect one text element first. That unlocks a simpler, element-focused editing flow.';
      statusActionBtn.textContent = 'Inspect text';
      statusActionMode = 'inspect';
    }

    function updateTargetCard() {
      if (selectedScopeKind === 'page') {
        targetLabelEl.textContent = 'Current target';
        targetTextEl.textContent = 'Whole page';
        targetInspectBtn.textContent = currentInspection ? 'Inspect text instead' : 'Inspect text';
      } else if (selectedScopeKind === 'tag') {
        targetLabelEl.textContent = 'Current target';
        targetTextEl.textContent = `Every <${tagSelect.value}> element`;
        targetInspectBtn.textContent = currentInspection ? 'Inspect text instead' : 'Inspect text';
      } else if (selectedScopeKind === 'selector') {
        targetLabelEl.textContent = 'Current target';
        targetTextEl.textContent = selectorInput.value.trim() || 'Enter a custom selector';
        targetInspectBtn.textContent = currentInspection ? 'Inspect text instead' : 'Inspect text';
      } else if (currentInspection) {
        targetLabelEl.textContent = 'Current target';
        targetTextEl.textContent = currentInspection.selector;
        targetInspectBtn.textContent = 'Pick another element';
      } else {
        targetLabelEl.textContent = 'Recommended target';
        targetTextEl.textContent = 'Inspect an element first to edit only that element.';
        targetInspectBtn.textContent = 'Inspect text';
      }
    }

    function getScopeDescription(scope = collectScope()) {
      if (!scope) {
        return 'a valid target';
      }

      if (scope.kind === 'page') {
        return 'the whole page';
      }

      if (scope.kind === 'tag') {
        return `every <${scope.value}> element`;
      }

      if (scope.kind === 'selector') {
        return truncateText(scope.value, 44);
      }

      if (scope.kind === 'element') {
        return currentInspection ? currentInspection.selector : 'the inspected element';
      }

      return 'the current target';
    }

    function updatePreviewCard() {
      const scope = collectScope();
      const declarationCount = Object.keys(collectDeclarations()).length;

      if (!scope) {
        previewLabelEl.textContent = 'Needs target';
        previewTextEl.textContent = selectedScopeKind === 'element'
          ? 'Inspect one element first, or switch to Whole page.'
          : 'Choose a valid target before previewing changes.';
        return;
      }

      if (!declarationCount) {
        previewLabelEl.textContent = 'Live preview';
        previewTextEl.textContent = `Change one or more controls below to preview styles on ${getScopeDescription(scope)}.`;
        return;
      }

      previewLabelEl.textContent = 'Preview ready';
      previewTextEl.textContent = `${declarationCount} style change${declarationCount === 1 ? '' : 's'} will preview on ${getScopeDescription(scope)} until you click Apply Change.`;
    }

    function updateTextEditButton() {
      const textEditState = window.__fccFontChanger.getTextEditState();
      const removalState = currentInspection
        ? window.__fccFontChanger.getElementRemovalState(currentInspection.selector)
        : { active: false };

      editTextBtn.disabled =
        (!currentInspection && !textEditState.active) ||
        (!textEditState.active && removalState.active);
      editTextBtn.textContent = textEditState.active ? 'Finish editing' : 'Edit text';
    }

    function updateRemoveElementButton() {
      const removalState = currentInspection
        ? window.__fccFontChanger.getElementRemovalState(currentInspection.selector)
        : { active: false };

      toggleRemoveElementBtn.disabled = !currentInspection;
      toggleRemoveElementBtn.textContent = removalState.active ? 'Undo remove' : 'Remove element';
      toggleRemoveElementBtn.classList.toggle('fcc-btn-secondary', removalState.active);
      toggleRemoveElementBtn.classList.toggle('fcc-btn-ghost', !removalState.active);
    }

    function setScope(kind) {
      selectedScopeKind = kind;

      if (kind === 'tag' || kind === 'selector') {
        isAdvancedOpen = true;
      }

      updateScopeVisibility();
      syncPreview();
    }

    function toggleDrawer() {
      isExpanded = !isExpanded;
      widget.classList.toggle('expanded', isExpanded);
      if (isExpanded) {
        scheduleThemeRefresh();
      }
    }

    function expandDrawer() {
      isExpanded = true;
      widget.classList.add('expanded');
      scheduleThemeRefresh();
    }

    function collapseDrawer() {
      isExpanded = false;
      widget.classList.remove('expanded');
    }

    pill.addEventListener('click', () => {
      toggleDrawer();
    });

    pill.addEventListener('mousedown', (event) => {
      event.stopPropagation();
      isDragging = false;
      const startY = event.clientY;
      const initialTop = parseInt(widget.style.top || '0', 10);

      const onMove = (moveEvent) => {
        const delta = moveEvent.clientY - startY;
        if (Math.abs(delta) > 5) {
          isDragging = true;
          const nextTop = core.clamp(initialTop + delta, 12, window.innerHeight - 64);
          widget.style.top = `${nextTop}px`;
        }
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);

        if (isDragging) {
          saveWidgetPosition(parseInt(widget.style.top || '0', 10));
        }
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });

    themeToggleBtn.addEventListener('click', () => {
      void cycleThemeMode();
    });

    pinBtn.addEventListener('click', async () => {
      isPinned = !isPinned;
      pinBtn.classList.toggle('active', isPinned);
      await setWidgetPinned(isPinned);
    });

    minimizeBtn.addEventListener('click', collapseDrawer);

    shadow.getElementById('fcc-dismiss-onboarding').addEventListener('click', dismissOnboarding);
    quickInspectBtn.addEventListener('click', startInspectMode);
    quickPaletteBtn.addEventListener('click', () => {
      expandDrawer();
      switchTab(1);
      scanPalette();
    });
    statusActionBtn.addEventListener('click', handleStatusAction);
    targetInspectBtn.addEventListener('click', startInspectMode);

    tabs.addEventListener('click', (event) => {
      const tab = event.target.closest('.fcc-tab');
      if (!tab) return;
      switchTab(parseInt(tab.dataset.tab, 10));
    });

    function switchTab(index) {
      activeTabIndex = index;
      saveActiveTab(index);

      shadow.querySelectorAll('.fcc-tab').forEach((tab, tabIndex) => {
        tab.classList.toggle('active', tabIndex === index);
      });

      shadow.querySelectorAll('.fcc-panel').forEach((panel, panelIndex) => {
        panel.classList.toggle('active', panelIndex === index);
      });

      tabIndicator.style.transform = `translateX(${index * 100}%)`;
    }

    startInspectBtn.addEventListener('click', startInspectMode);

    useInspectionBtn.addEventListener('click', () => {
      openChangeForCurrentElement();
    });

    editTextBtn.addEventListener('click', () => {
      const textEditState = window.__fccFontChanger.getTextEditState();
      if (textEditState.active) {
        window.__fccFontChanger.finishTextEdit();
        return;
      }

      if (!currentInspection) {
        showToast('Inspect text first');
        return;
      }

      const result = window.__fccFontChanger.startTextEdit({
        selector: currentInspection.selector,
      });

      if (!result.success) {
        const message = result.reason === 'no-text'
          ? 'That element has no editable text'
          : 'Unable to edit that element';
        showToast(message);
        return;
      }

      if (result.native) {
        showToast('That field is already editable');
      }
    });

    toggleRemoveElementBtn.addEventListener('click', () => {
      if (!currentInspection) {
        showToast('Inspect text first');
        return;
      }

      const result = window.__fccFontChanger.toggleElementRemoval({
        selector: currentInspection.selector,
        sourceInspectionId: currentInspection.id,
      });

      if (!result.success) {
        showToast('Unable to change element visibility');
        return;
      }

      updateRuleState();
      updateRemoveElementButton();
      showToast(result.active ? 'Element removed from layout' : 'Element restored');
    });

    async function startInspectMode() {
      if (window.__fccFontChanger.getTextEditState().active) {
        window.__fccFontChanger.finishTextEdit();
      }

      expandDrawer();
      switchTab(0);
      window.__fccFontChanger.saveSelection();
      window.__fccFontAnalyzer.start(async (inspection) => {
        await setInspection(inspection, true);
        showToast('Element frozen');
      });
      showToast('Inspect mode active');
    }

    async function setInspection(inspection, persist = true) {
      const hadInspection = Boolean(currentInspection);
      currentInspection = inspection;
      useInspectionBtn.disabled = !inspection;
      useInspectionBtn.textContent = inspection ? 'Edit This Element' : 'Edit This Element';

      if (inspection && !hadInspection && selectedScopeKind === 'page') {
        selectedScopeKind = 'element';
      }

      if (inspection && !touched.color) {
        fontColorInput.value = inspection.colors.text.hex;
      }

      if (inspection && !touched.backgroundColor) {
        backgroundColorInput.value = inspection.colors.background.hex;
      }

      renderInspection();
      updatePickedContrast();
      updateTargetCard();
      updateScopeVisibility();
      updateStatusCard();
      updateTextEditButton();
      updateRemoveElementButton();
      updateControlDisplays();
      updatePreviewCard();
      updateActionButtons();

      if (persist && inspection) {
        recentInspections = await addRecentInspection(inspection);
        renderRecentInspections();
        completeOnboarding();
      }

      syncPreview();
    }

    function renderInspection() {
      if (!currentInspection) {
        inspectEmpty.hidden = false;
        inspectCard.hidden = true;
        return;
      }

      inspectEmpty.hidden = true;
      inspectCard.hidden = false;

      shadow.getElementById('fcc-inspect-selector').textContent = currentInspection.selector;
      shadow.getElementById('fcc-inspect-breadcrumb').textContent = currentInspection.breadcrumb || currentInspection.tagName;
      shadow.getElementById('fcc-inspect-text').textContent = currentInspection.textPreview || 'No visible text sample';
      shadow.getElementById('fcc-inspect-family').textContent = currentInspection.typography.fontFamily;
      shadow.getElementById('fcc-inspect-size').textContent = currentInspection.typography.fontSize;
      shadow.getElementById('fcc-inspect-weight').textContent = currentInspection.typography.fontWeight;
      shadow.getElementById('fcc-inspect-style').textContent = currentInspection.typography.fontStyle;
      shadow.getElementById('fcc-inspect-line-height').textContent = currentInspection.typography.lineHeight;
      shadow.getElementById('fcc-inspect-letter-spacing').textContent = currentInspection.typography.letterSpacing;

      shadow.getElementById('fcc-inspect-text-color').textContent = currentInspection.colors.text.hex.toUpperCase();
      shadow.getElementById('fcc-inspect-background-color').textContent = currentInspection.colors.background.hex.toUpperCase();
      shadow.getElementById('fcc-inspect-text-swatch').style.background = currentInspection.colors.text.hex;
      shadow.getElementById('fcc-inspect-background-swatch').style.background = currentInspection.colors.background.hex;

      const wcagBadge = shadow.getElementById('fcc-wcag-badge');
      const apcaBadge = shadow.getElementById('fcc-apca-badge');
      const ratioBadge = shadow.getElementById('fcc-ratio-badge');

      wcagBadge.textContent = `WCAG ${currentInspection.contrast.wcag.rating}`;
      wcagBadge.dataset.state = currentInspection.contrast.wcag.rating === 'Fail' ? 'warning' : 'success';

      apcaBadge.textContent = `APCA ${currentInspection.contrast.apcaLabel}`;
      apcaBadge.dataset.state = Math.abs(currentInspection.contrast.apca) >= 60 ? 'success' : 'warning';

      ratioBadge.textContent = `Ratio ${currentInspection.contrast.wcag.label}`;
      ratioBadge.dataset.state = currentInspection.contrast.wcag.aa ? 'success' : 'warning';
    }

    function renderRecentInspections() {
      const scopedItems = recentInspections.filter((inspection) => inspection.siteKey === core.getSiteKey(location.href));

      if (!scopedItems.length) {
        recentInspectionsEl.innerHTML = `<div class="fcc-list-empty">No saved inspections for this site yet.</div>`;
        return;
      }

      recentInspectionsEl.innerHTML = scopedItems
        .map((inspection) => {
          return `
            <button class="fcc-list-item" data-inspection-id="${inspection.id}">
              <span class="fcc-list-title">${inspection.selector}</span>
              <span class="fcc-list-meta">${inspection.textPreview || inspection.breadcrumb || inspection.tagName}</span>
            </button>
          `;
        })
        .join('');

      recentInspectionsEl.querySelectorAll('[data-inspection-id]').forEach((button) => {
        button.addEventListener('click', () => {
          const inspection = scopedItems.find((item) => item.id === button.dataset.inspectionId);
          if (inspection) {
            setInspection(inspection, false);
          }
        });
      });
    }

    shadow.getElementById('fcc-copy-selector').addEventListener('click', () => {
      if (!currentInspection) return;
      copyToClipboard(currentInspection.selector);
    });

    shadow.getElementById('fcc-copy-inspect-css').addEventListener('click', () => {
      if (!currentInspection) return;

      const css = [
        `font-family: ${currentInspection.typography.fontFamily};`,
        `font-size: ${currentInspection.typography.fontSize};`,
        `font-weight: ${currentInspection.typography.fontWeight};`,
        `font-style: ${currentInspection.typography.fontStyle};`,
        `line-height: ${currentInspection.typography.lineHeight};`,
        `letter-spacing: ${currentInspection.typography.letterSpacing};`,
        `color: ${currentInspection.colors.text.hex};`,
        `background-color: ${currentInspection.colors.background.hex};`,
      ].join('\n');

      copyToClipboard(css);
    });

    shadow.getElementById('fcc-copy-inspect-summary').addEventListener('click', () => {
      if (!currentInspection) return;
      copyToClipboard(core.stableStringify(currentInspection));
    });

    window.addEventListener('fcc:text-edit-state', async (event) => {
      const detail = event.detail || {};

      if (!detail.active && detail.selector && currentInspection && currentInspection.selector === detail.selector) {
        const element = document.querySelector(detail.selector);
        if (element) {
          await setInspection(window.__fccFontAnalyzer.inspectElement(element), false);
        }
      }

      updateTextEditButton();
      updateStatusCard();

      if (detail.active) {
        showToast('Editing text on the page');
        return;
      }

      if (detail.canceled) {
        showToast('Text edit canceled');
        return;
      }

      if (detail.changed) {
        showToast('Text updated');
      }
    });

    pickColorBtn.addEventListener('click', startColorPick);
    scanPaletteBtn.addEventListener('click', scanPalette);
    savePaletteBtn.addEventListener('click', saveCurrentPalette);

    function startColorPick() {
      expandDrawer();
      switchTab(1);
      window.__fccColorPicker.start(async (sample) => {
        setPickedColor(sample);
        await addColorToHistory(sample.hex.toUpperCase());
        showToast('Color sampled');
      });
    }

    function setPickedColor(sample) {
      currentPickedColor = sample;
      pickedEmpty.hidden = Boolean(sample);
      pickedCard.hidden = !sample;
      shadow.getElementById('fcc-picked-hex').textContent = sample ? sample.hex.toUpperCase() : '—';
      shadow.getElementById('fcc-picked-rgb').textContent = sample ? sample.rgb : '—';
      shadow.getElementById('fcc-picked-hsl').textContent = sample ? sample.hsl : '—';
      shadow.getElementById('fcc-picked-swatch').style.background = sample ? sample.hex : '#dbe3ef';
      updatePickedContrast();
      updateStatusCard();
    }

    function updatePickedContrast() {
      const target = shadow.getElementById('fcc-picked-contrast');
      if (!currentPickedColor || !currentInspection) {
        target.textContent = '—';
        return;
      }

      const summary = core.getContrastSummary(
        core.parseCssColor(currentPickedColor.hex),
        currentInspection.colors.background,
        parseFloat(currentInspection.typography.fontSize) || 16,
        parseInt(currentInspection.typography.fontWeight, 10) || 400
      );

      target.textContent = `${summary.wcag.label} / ${summary.wcag.rating} / ${summary.apcaLabel}`;
    }

    function scanPalette() {
      currentPalette = window.__fccFontAnalyzer.samplePagePalette();
      renderPalette(currentPalette);
      completeOnboarding();
      updateStatusCard();
      showToast('Palette captured');
    }

    async function saveCurrentPalette() {
      if (!currentPalette) return;

      const paletteToSave = {
        ...currentPalette,
        id: currentPalette.id || core.createId('palette'),
        name: currentPalette.name || `${document.title || 'Page'} palette`,
      };

      savedPalettes = await savePalette(paletteToSave);
      renderSavedPalettes();
      savePaletteBtn.disabled = false;
      showToast('Palette saved');
    }

    function renderPalette(palette) {
      if (!palette) {
        paletteEmpty.hidden = false;
        paletteCard.hidden = true;
        savePaletteBtn.disabled = true;
        return;
      }

      paletteEmpty.hidden = true;
      paletteCard.hidden = false;
      savePaletteBtn.disabled = false;
      shadow.getElementById('fcc-palette-name').textContent = palette.name;

      renderSwatchGroup(shadow.getElementById('fcc-palette-text'), palette.groups.text);
      renderSwatchGroup(shadow.getElementById('fcc-palette-background'), palette.groups.background);
      renderSwatchGroup(shadow.getElementById('fcc-palette-border'), palette.groups.border);
    }

    function renderSwatchGroup(container, entries) {
      if (!entries || !entries.length) {
        container.innerHTML = `<div class="fcc-list-empty">No colors detected.</div>`;
        return;
      }

      container.innerHTML = entries
        .map((entry) => {
          const textColor = core.getReadableTextColor(entry.hex);
          return `
            <button class="fcc-swatch-card" data-copy-color="${entry.hex}" style="background:${entry.hex}; color:${textColor}">
              <span>${entry.hex}</span>
              <small>${entry.count} uses</small>
            </button>
          `;
        })
        .join('');

      container.querySelectorAll('[data-copy-color]').forEach((button) => {
        button.addEventListener('click', () => copyToClipboard(button.dataset.copyColor));
      });
    }

    function renderSavedPalettes() {
      if (!savedPalettes.length) {
        savedPalettesEl.innerHTML = `<div class="fcc-list-empty">No saved palettes yet.</div>`;
        return;
      }

      savedPalettesEl.innerHTML = savedPalettes
        .map((palette) => {
          const swatches = [
            ...(palette.groups?.text || []),
            ...(palette.groups?.background || []),
            ...(palette.groups?.border || []),
          ].slice(0, 5);

          return `
            <div class="fcc-list-item fcc-list-item-static" data-palette-id="${palette.id}">
              <div class="fcc-list-title-row">
                <span class="fcc-list-title">${palette.name}</span>
                <button class="fcc-text-btn" data-load-palette="${palette.id}">Load</button>
              </div>
              <div class="fcc-mini-swatches">
                ${swatches.map((entry) => `<span class="fcc-mini-dot" style="background:${entry.hex}"></span>`).join('')}
              </div>
            </div>
          `;
        })
        .join('');

      savedPalettesEl.querySelectorAll('[data-load-palette]').forEach((button) => {
        button.addEventListener('click', () => {
          const palette = savedPalettes.find((entry) => entry.id === button.dataset.loadPalette);
          if (palette) {
            currentPalette = palette;
            renderPalette(palette);
            switchTab(1);
          }
        });
      });
    }

    basicScopeSelector.addEventListener('click', (event) => {
      const segment = event.target.closest('.fcc-segment');
      if (!segment) return;
      setScope(segment.dataset.basicScope);
    });

    advancedScopeSelector.addEventListener('click', (event) => {
      const segment = event.target.closest('.fcc-segment');
      if (!segment) return;
      setScope(segment.dataset.advancedScope);
    });

    toggleAdvancedBtn.addEventListener('click', () => {
      isAdvancedOpen = !isAdvancedOpen;
      updateScopeVisibility();
    });

    function updateScopeVisibility() {
      basicScopeSelector.querySelectorAll('.fcc-segment').forEach((segment) => {
        segment.classList.toggle('active', segment.dataset.basicScope === selectedScopeKind);
      });

      advancedScopeSelector.querySelectorAll('.fcc-segment').forEach((segment) => {
        segment.classList.toggle('active', segment.dataset.advancedScope === selectedScopeKind);
      });

      const needsAdvanced = selectedScopeKind === 'tag' || selectedScopeKind === 'selector';
      advancedPanel.hidden = !(isAdvancedOpen || needsAdvanced);
      ruleTools.hidden = advancedPanel.hidden;
      toggleAdvancedBtn.textContent = advancedPanel.hidden
        ? 'Show advanced targets and saved styles'
        : 'Hide advanced targets and saved styles';

      tagGroup.hidden = selectedScopeKind !== 'tag';
      selectorGroup.hidden = selectedScopeKind !== 'selector';

      if (selectedScopeKind === 'element') {
        targetHelpEl.textContent = currentInspection
          ? `Changes will target only ${currentInspection.selector}.`
          : 'Inspect one element first, or switch to Whole page.';
      } else if (selectedScopeKind === 'page') {
        targetHelpEl.textContent = 'Whole page changes affect visible text across the page.';
      } else if (selectedScopeKind === 'tag') {
        targetHelpEl.textContent = `Changes apply to every <${tagSelect.value}> element on this page.`;
      } else if (selectedScopeKind === 'selector') {
        targetHelpEl.textContent = selectorInput.value.trim()
          ? `Changes apply to elements matching ${selectorInput.value.trim()}.`
          : 'Enter a CSS selector to target specific elements.';
      }

      updateTargetCard();
      updatePreviewCard();
      updateActionButtons();
    }

    function populateFontLists() {
      const fonts = window.__fccFontChanger.getFonts();
      const webSafeGroup = shadow.getElementById('fcc-fonts-websafe');
      const googleGroup = shadow.getElementById('fcc-fonts-google');

      fonts.webSafe.forEach((font) => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        webSafeGroup.appendChild(option);
      });

      fonts.google.forEach((font) => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        googleGroup.appendChild(option);
      });
    }

    function markTouched(key, value) {
      touched[key] = value;
      updateControlDisplays();
      updatePreviewCard();
      updateActionButtons();
      syncPreview();
    }

    fontSizeSlider.addEventListener('input', () => markTouched('fontSize', true));
    fontWeightSlider.addEventListener('input', () => markTouched('fontWeight', true));
    lineHeightSlider.addEventListener('input', () => markTouched('lineHeight', true));
    letterSpacingSlider.addEventListener('input', () => markTouched('letterSpacing', true));
    fontColorInput.addEventListener('input', () => markTouched('color', true));
    backgroundColorInput.addEventListener('input', () => markTouched('backgroundColor', true));
    fontFamilySelect.addEventListener('change', () => {
      updatePreviewCard();
      updateActionButtons();
      syncPreview();
    });
    tagSelect.addEventListener('change', () => {
      updateScopeVisibility();
      syncPreview();
    });
    selectorInput.addEventListener('input', () => {
      updateScopeVisibility();
      syncPreview();
    });
    presetNameInput.addEventListener('input', updateActionButtons);
    presetsSelect.addEventListener('change', updateActionButtons);

    function updateControlDisplays() {
      const typography = currentInspection ? currentInspection.typography : null;
      shadow.getElementById('fcc-size-display').textContent = touched.fontSize
        ? `${fontSizeSlider.value}px`
        : typography ? `Current ${typography.fontSize}` : '—';
      shadow.getElementById('fcc-weight-display').textContent = touched.fontWeight
        ? fontWeightSlider.value
        : typography ? `Current ${typography.fontWeight}` : '—';
      shadow.getElementById('fcc-line-height-display').textContent = touched.lineHeight
        ? lineHeightSlider.value
        : typography ? `Current ${typography.lineHeight}` : '—';
      shadow.getElementById('fcc-letter-spacing-display').textContent = touched.letterSpacing
        ? `${letterSpacingSlider.value}px`
        : typography ? `Current ${typography.letterSpacing}` : '—';
      shadow.getElementById('fcc-font-color-label').textContent = touched.color
        ? fontColorInput.value.toUpperCase()
        : currentInspection ? `Current ${currentInspection.colors.text.hex.toUpperCase()}` : '—';
      shadow.getElementById('fcc-background-color-label').textContent = touched.backgroundColor
        ? backgroundColorInput.value.toUpperCase()
        : currentInspection ? `Current ${currentInspection.colors.background.hex.toUpperCase()}` : '—';
    }

    function collectDeclarations() {
      const declarations = {};

      if (fontFamilySelect.value) declarations.fontFamily = fontFamilySelect.value;
      if (touched.fontSize) declarations.fontSize = `${fontSizeSlider.value}px`;
      if (touched.fontWeight) declarations.fontWeight = fontWeightSlider.value;
      if (touched.lineHeight) declarations.lineHeight = lineHeightSlider.value;
      if (touched.letterSpacing) declarations.letterSpacing = `${letterSpacingSlider.value}px`;
      if (touched.color) declarations.color = fontColorInput.value;
      if (touched.backgroundColor) declarations.backgroundColor = backgroundColorInput.value;

      return declarations;
    }

    function updateActionButtons() {
      const scope = collectScope();
      const hasDeclarations = Object.keys(collectDeclarations()).length > 0;
      const hasPresetSelection = Boolean(presetsSelect.value);

      applyRuleBtn.disabled = !scope || !hasDeclarations;
      savePresetBtn.disabled = !hasDeclarations || !presetNameInput.value.trim();
      applyPresetBtn.disabled = !hasPresetSelection;
      exportPresetBtn.disabled = !hasPresetSelection;
    }

    function collectScope() {
      switch (selectedScopeKind) {
        case 'page':
          return { kind: 'page' };
        case 'tag':
          return { kind: 'tag', value: tagSelect.value };
        case 'selector':
          return selectorInput.value.trim() ? { kind: 'selector', value: selectorInput.value.trim() } : null;
        case 'element':
          return currentInspection
            ? {
                kind: 'element',
                selector: currentInspection.selector,
                value: currentInspection.selector,
              }
            : null;
        default:
          return null;
      }
    }

    function syncPreview() {
      const scope = collectScope();
      const declarations = collectDeclarations();

      if (!scope || !Object.keys(declarations).length) {
        window.__fccFontChanger.clearPreview();
        return;
      }

      window.__fccFontChanger.preview({
        scope,
        declarations,
        sourceInspectionId: currentInspection ? currentInspection.id : null,
      });
    }

    applyRuleBtn.addEventListener('click', () => {
      const scope = collectScope();
      const declarations = collectDeclarations();

      if (!scope) {
        showToast('Choose a valid scope first');
        return;
      }

      if (!Object.keys(declarations).length) {
        showToast('Change at least one control first');
        return;
      }

      const rule = window.__fccFontChanger.applyRule({
        scope,
        declarations,
        sourceInspectionId: currentInspection ? currentInspection.id : null,
      });

      completeOnboarding();
      updateRuleState();
      showToast(`${rule.label} updated`);
    });

    shadow.getElementById('fcc-undo-rule').addEventListener('click', () => {
      if (window.__fccFontChanger.undo()) {
        updateRuleState();
        showToast('Undid last change');
      }
    });

    shadow.getElementById('fcc-redo-rule').addEventListener('click', () => {
      if (window.__fccFontChanger.redo()) {
        updateRuleState();
        showToast('Reapplied change');
      }
    });

    shadow.getElementById('fcc-reset-rules').addEventListener('click', () => {
      window.__fccFontChanger.reset();
      updateRuleState();
      showToast('Site rules cleared');
    });

    shadow.getElementById('fcc-export-css').addEventListener('click', () => {
      copyToClipboard(window.__fccFontChanger.exportCSS() || '/* No active CSS rules */');
    });

    shadow.getElementById('fcc-export-session').addEventListener('click', () => {
      copyToClipboard(window.__fccFontChanger.exportSession().json);
    });

    savePresetBtn.addEventListener('click', saveCurrentPreset);
    applyPresetBtn.addEventListener('click', applySelectedPreset);
    exportPresetBtn.addEventListener('click', exportSelectedPreset);

    async function saveCurrentPreset() {
      const declarations = collectDeclarations();
      const name = presetNameInput.value.trim();

      if (!name) {
        showToast('Name the preset first');
        return;
      }

      if (!Object.keys(declarations).length) {
        showToast('Adjust at least one style before saving');
        return;
      }

      const preset = {
        id: core.createId('preset'),
        name,
        declarations,
        createdAt: new Date().toISOString(),
      };

      savedPresets = await savePreset(preset);
      renderPresets();
      presetsSelect.value = preset.id;
      updateActionButtons();
      showToast('Preset saved');
    }

    function renderPresets() {
      presetsSelect.innerHTML = '<option value="">Select a preset</option>' +
        savedPresets
          .map((preset) => `<option value="${preset.id}">${preset.name}</option>`)
          .join('');
      updateActionButtons();
    }

    function applyPresetToControls(preset) {
      fontFamilySelect.value = preset.declarations.fontFamily || '';
      fontSizeSlider.value = parseFloat(preset.declarations.fontSize || '16');
      fontWeightSlider.value = parseInt(preset.declarations.fontWeight || '400', 10);
      lineHeightSlider.value = parseFloat(preset.declarations.lineHeight || '1.5');
      letterSpacingSlider.value = parseFloat(preset.declarations.letterSpacing || '0');
      fontColorInput.value = preset.declarations.color || '#111827';
      backgroundColorInput.value = preset.declarations.backgroundColor || '#ffffff';

      touched.fontSize = Boolean(preset.declarations.fontSize);
      touched.fontWeight = Boolean(preset.declarations.fontWeight);
      touched.lineHeight = Boolean(preset.declarations.lineHeight);
      touched.letterSpacing = Boolean(preset.declarations.letterSpacing);
      touched.color = Boolean(preset.declarations.color);
      touched.backgroundColor = Boolean(preset.declarations.backgroundColor);

      updateControlDisplays();
      updatePreviewCard();
      updateActionButtons();
      syncPreview();
    }

    function applySelectedPreset() {
      const preset = savedPresets.find((item) => item.id === presetsSelect.value);
      if (!preset) {
        showToast('Choose a preset first');
        return;
      }

      applyPresetToControls(preset);
      showToast('Preset loaded');
    }

    function exportSelectedPreset() {
      const preset = savedPresets.find((item) => item.id === presetsSelect.value);
      if (!preset) {
        showToast('Choose a preset first');
        return;
      }

      copyToClipboard(core.stableStringify(preset));
    }

    function updateRuleState() {
      const state = window.__fccFontChanger.getState();
      overrideIndicator.hidden = state.rules.length === 0;
      ruleTools.hidden = advancedPanel.hidden;

      const activeRulesEl = shadow.getElementById('fcc-active-rules');
      if (!state.rules.length) {
        activeRulesEl.innerHTML = `<div class="fcc-list-empty">No active rules yet.</div>`;
      } else {
        activeRulesEl.innerHTML = state.rules
          .map((rule) => {
            const declarationSummary = Object.entries(rule.declarations || {})
              .map(([key, value]) => `${core.toKebabCase(key)}: ${value}`)
              .join(' · ');

            return `
              <div class="fcc-list-item fcc-list-item-static">
                <div class="fcc-list-title-row">
                  <span class="fcc-list-title">${rule.label}</span>
                  <button class="fcc-text-btn" data-remove-rule="${rule.id}">Remove</button>
                </div>
                <span class="fcc-list-meta">${rule.selector}</span>
                <span class="fcc-list-meta">${declarationSummary}</span>
              </div>
            `;
          })
          .join('');

        activeRulesEl.querySelectorAll('[data-remove-rule]').forEach((button) => {
          button.addEventListener('click', () => {
            window.__fccFontChanger.removeRule(button.dataset.removeRule);
            updateRuleState();
            showToast('Rule removed');
          });
        });
      }

      shadow.getElementById('fcc-undo-rule').disabled = !state.canUndo;
      shadow.getElementById('fcc-redo-rule').disabled = !state.canRedo;
      updateRemoveElementButton();
      updateTextEditButton();
      updateStatusCard();
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Copied');
      }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Copied');
      });
    }

    function showToast(message) {
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(showToast._timer);
      showToast._timer = setTimeout(() => {
        toast.classList.remove('show');
      }, 1800);
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === MSG.TOGGLE_WIDGET) {
        if (!message.silent) {
          if (widget.style.display === 'none') {
            widget.style.display = '';
            expandDrawer();
          } else if (!isExpanded) {
            expandDrawer();
          } else {
            collapseDrawer();
          }
        }
        sendResponse({ success: true });
        return;
      }

      if (message.type === MSG.SHOW_WIDGET) {
        widget.style.display = '';
        if (message.expand === false) {
          collapseDrawer();
        } else {
          expandDrawer();
        }
        sendResponse({ success: true });
        return;
      }

      if (message.type === MSG.HIDE_WIDGET) {
        widget.style.display = 'none';
        collapseDrawer();
        sendResponse({ success: true });
        return;
      }

      if (message.type === MSG.START_INSPECT) {
        widget.style.display = '';
        startInspectMode();
        sendResponse({ success: true });
        return;
      }

      if (message.type === MSG.START_COLOR_PICK) {
        widget.style.display = '';
        startColorPick();
        sendResponse({ success: true });
      }
    });

    applyResolvedTheme();
    init();
  })();
}
