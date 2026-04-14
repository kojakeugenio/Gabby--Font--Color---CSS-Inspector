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
        <span class="fcc-pill-text">Gabby</span>
        <div class="fcc-pill-hide" id="fcc-pill-hide-btn" title="Hide Gabby on this page" style="display: none;">×</div>
      </button>

      <div class="fcc-drawer" id="fcc-drawer">
        <div class="fcc-header">
          <div class="fcc-brand">
            <img class="fcc-brand-logo" src="${logoUrl}" alt="" />
            <div class="fcc-brand-text">
              <div class="fcc-title">Gabby</div>
              <div class="fcc-tagline">Font, Color & CSS Inspector</div>
            </div>
          </div>
          <div class="fcc-header-actions">
            <button class="fcc-icon-btn fcc-theme-btn" id="fcc-theme-toggle" title="Theme: Auto">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            </button>
            <button class="fcc-icon-btn" id="fcc-pin" title="Pin">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
            </button>
            <button class="fcc-icon-btn" id="fcc-minimize" title="Minimize">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>
            </button>
          </div>
        </div>



        <div class="fcc-popover" id="fcc-status-card" hidden>
          <div class="fcc-status-copy">
            <div class="fcc-status-label" id="fcc-status-label">Getting Started</div>
            <div class="fcc-status-text" id="fcc-status-text">
              Click 'Inspect Text' to select an element. We will analyze the element so you can safely modify its styles.
            </div>
          </div>
          <button class="fcc-btn fcc-btn-secondary fcc-btn-sm" id="fcc-status-action">Inspect Text</button>
        </div>

        <div class="fcc-tabs" id="fcc-tabs" style="margin-top: 12px;">
          <button class="fcc-tab active" data-tab="0">Inspect</button>
          <button class="fcc-tab" data-tab="1">Colors</button>
          <button class="fcc-tab" data-tab="2">Change</button>
          <div class="fcc-tab-indicator" id="fcc-tab-indicator"></div>
        </div>

        <div class="fcc-content">
          <div class="fcc-panel active" data-panel="0">
            <div class="fcc-panel-content">
              <div class="fcc-stack-row">
                <button class="fcc-btn fcc-btn-primary" id="fcc-start-inspect">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>
                  Inspect Text
                </button>
                <button class="fcc-btn fcc-btn-secondary" id="fcc-use-inspection" disabled>Edit This Element</button>
              </div>

              <div class="fcc-note">Hover over any text and click to selectively freeze it to inspect its CSS and test changes safely.</div>

              <div class="fcc-empty" id="fcc-inspect-empty">
                Click 'Inspect Text' to select an element. You'll see its precise selector, typography details, colors, and accessibility contrast score.
              </div>

              <div class="fcc-card" id="fcc-inspect-card" hidden>
                <div class="fcc-card-head">
                  <div>
                    <div class="fcc-kicker">Frozen Selector</div>
                    <div class="fcc-code" id="fcc-inspect-selector">—</div>
                  </div>
                  <button class="fcc-btn fcc-btn-ghost fcc-btn-sm" id="fcc-copy-selector">Copy</button>
                </div>
                <div class="fcc-inspect-grid">
                  <button class="fcc-btn fcc-btn-secondary fcc-btn-sm" id="fcc-edit-text" disabled>Edit Text</button>
                  <button class="fcc-btn fcc-btn-ghost fcc-btn-sm" id="fcc-toggle-remove-element" disabled>Hide Element</button>
                  <button class="fcc-btn fcc-btn-secondary fcc-btn-sm" id="fcc-copy-inspect-css">Copy CSS</button>
                  <button class="fcc-btn fcc-btn-ghost fcc-btn-sm" id="fcc-copy-inspect-summary">Copy Details</button>
                </div>

                <button class="fcc-btn fcc-btn-danger fcc-btn-sm" id="fcc-inspect-reset-all" style="width: 100%; margin-top: 4px;">Reset All Site Changes</button>

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

              </div>

              <div class="fcc-subhead">Recent inspections</div>
              <div class="fcc-list" id="fcc-recent-inspections"></div>
            </div>
          </div>

          <div class="fcc-panel" data-panel="1">
            <div class="fcc-panel-content">
              <div class="fcc-stack-row">
                <button class="fcc-btn fcc-btn-primary" id="fcc-pick-color">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="m2 22 1-1h3l9-9M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3L15 6Z"/></svg>
                  Color Picker
                </button>
                <button class="fcc-btn fcc-btn-secondary" id="fcc-scan-palette">Page Scanner</button>
                <button class="fcc-btn fcc-btn-ghost" id="fcc-save-palette" disabled hidden>Save Palette</button>
              </div>

              <div class="fcc-note">Pick an exact pixel from the screen, or scan the whole page to build a palette of recurring colors.</div>

              <div class="fcc-empty" id="fcc-picked-empty">
                Click 'Color Picker' to sample any exact color from the page.
              </div>

              <div class="fcc-card" id="fcc-picked-card" hidden>
                <div class="fcc-card-head" style="align-items: center;">
                  <div>
                    <div class="fcc-kicker">Latest Sample</div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                      <div class="fcc-code" id="fcc-picked-hex">—</div>
                      <button class="fcc-icon-btn" id="fcc-copy-picked" title="Copy color" style="width: 20px; height: 20px; border-radius: 4px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      </button>
                    </div>
                  </div>
                  <label class="fcc-custom-wheel-wrapper" title="Fine-tune with Color Wheel">
                    <input type="color" class="fcc-hidden-color-input" id="fcc-custom-color-wheel">
                    <span class="fcc-swatch fcc-swatch-lg" id="fcc-picked-swatch">
                      <svg style="width:16px;height:16px;fill:none;stroke:var(--fcc-inverse, white);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.9;mix-blend-mode:difference;" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                        <path d="M2 12h20"></path>
                      </svg>
                    </span>
                  </label>
                </div>
                <div class="fcc-data-grid">
                  <div class="fcc-data-row"><span>RGB</span><strong id="fcc-picked-rgb">—</strong></div>
                  <div class="fcc-data-row"><span>HSL</span><strong id="fcc-picked-hsl">—</strong></div>
                  <div class="fcc-data-row"><span>Contrast vs inspected background</span><strong id="fcc-picked-contrast">—</strong></div>
                </div>
                <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--fcc-outline-soft);">
                  <div style="font-size: 10.5px; font-weight: 700; color: var(--fcc-text-soft); margin-bottom: 6px; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
                    <span>TINTS & SHADES</span>
                    <span style="opacity: 0.6;">Click to select</span>
                  </div>
                  <div class="fcc-shade-strip" id="fcc-picked-shades" style="display: flex; gap: 4px; height: 32px;"></div>
                </div>
              </div>

              <div class="fcc-empty" id="fcc-palette-empty">
                Click 'Page Scanner' to automatically build a palette from the text, backgrounds, and borders used on this site.
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

                <button class="fcc-btn fcc-btn-secondary" id="fcc-export-palette-json" style="width:100%; margin-top: 4px; gap: 6px; justify-content: center;">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy Palette as JSON
                </button>
              </div>

              <div class="fcc-subhead">Saved palettes</div>
              <div class="fcc-list" id="fcc-saved-palettes"></div>
            </div>
          </div>

          <div class="fcc-panel" data-panel="2">
            <div class="fcc-panel-content">
              <div class="fcc-note">Adjust the controls below to preview your changes live. Click 'Apply Change' to save them for this website.</div>

              <div class="fcc-card fcc-card-compact" id="fcc-target-card">
                <div class="fcc-card-head">
                  <div>
                    <div class="fcc-kicker" id="fcc-target-label">Recommended target</div>
                    <div class="fcc-code" id="fcc-target-text">Click 'Inspect Text' to select a specific element to edit safely.</div>
                  </div>
                  <button class="fcc-btn fcc-btn-secondary fcc-btn-sm" id="fcc-target-inspect">Inspect Text</button>
                </div>
              </div>

              <div class="fcc-card fcc-card-compact" id="fcc-preview-card">
                <div class="fcc-kicker" id="fcc-preview-label">Live preview</div>
                <div class="fcc-status-text" id="fcc-preview-text">
                  Modify the settings below to preview changes live.
                </div>
              </div>

              <div class="fcc-field-group">
                <label class="fcc-field-label">Change target</label>
                <div class="fcc-segmented fcc-segmented-two" id="fcc-basic-scope-selector">
                  <button class="fcc-segment" data-basic-scope="element">This element</button>
                  <button class="fcc-segment active" data-basic-scope="page">Whole page</button>
                </div>
                <div class="fcc-note" id="fcc-target-help">Choose 'This element' to limit changes, or 'Whole page' to broadly apply rules.</div>
                <button class="fcc-text-btn" id="fcc-toggle-advanced">Advanced Options & Saved Styles</button>
              </div>

              <div class="fcc-advanced" id="fcc-advanced-panel" hidden>
                <div class="fcc-field-group">
                  <label class="fcc-field-label">Advanced Targets</label>
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

              <div class="fcc-stack-row">
                <button class="fcc-btn fcc-btn-primary" id="fcc-apply-rule" style="flex: 1;">Apply Change</button>
                <button class="fcc-btn fcc-btn-secondary" id="fcc-reset-preview" title="Reset all sliders to default" style="display: none; padding: 0 12px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
                <button class="fcc-btn fcc-btn-secondary" id="fcc-undo-rule" title="Undo applied style" style="padding: 0 12px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
                </button>
                <button class="fcc-btn fcc-btn-secondary" id="fcc-redo-rule" title="Redo" style="padding: 0 12px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"/></svg>
                </button>
              </div>

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

        <div class="fcc-override-indicator" id="fcc-override-indicator">
          <div class="fcc-status-dot"></div>
          <span id="fcc-override-label">Gabby engine active</span>
          <button id="fcc-toggle-rules-btn">PAUSE</button>
        </div>
      </div>

    `;

    const toast = document.createElement('div');
    toast.className = 'fcc-toast';
    toast.id = 'fcc-toast';
    toast.textContent = 'Copied';
    shadow.appendChild(toast);

    shadow.appendChild(widget);
    document.documentElement.appendChild(host);

    let isPinned = false;
    let isExpanded = false;
    let isDragging = false;
    let isActionActive = false;
    let isAdvancedOpen = false;
    let activeTabIndex = 0;
    let selectedScopeKind = 'page';
    let statusActionMode = 'inspect';
    let returnTabAfterInspect = null;
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
    const pillHideBtn = shadow.getElementById('fcc-pill-hide-btn');
    const themeToggleBtn = shadow.getElementById('fcc-theme-toggle');
    const pinBtn = shadow.getElementById('fcc-pin');
    const minimizeBtn = shadow.getElementById('fcc-minimize');
    const tabIndicator = shadow.getElementById('fcc-tab-indicator');
    const tabs = shadow.getElementById('fcc-tabs');
    const overrideIndicator = shadow.getElementById('fcc-override-indicator');
    const overrideLabel = shadow.getElementById('fcc-override-label');
    const toggleRulesBtn = shadow.getElementById('fcc-toggle-rules-btn');
    const statusCard = shadow.getElementById('fcc-status-card');
    const statusLabelEl = shadow.getElementById('fcc-status-label');
    const statusTextEl = shadow.getElementById('fcc-status-text');
    const statusActionBtn = shadow.getElementById('fcc-status-action');

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
    const resetPreviewBtn = shadow.getElementById('fcc-reset-preview');
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
      const icons = {
        auto: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>',
        light: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
        dark: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
      };
      themeToggleBtn.innerHTML = icons[themeMode] || icons.auto;
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
      let savedPosition = await getWidgetPosition();
      
      // Clear out corrupted positions saved by the old dragging bug
      if (savedPosition !== null && (savedPosition < 60 || savedPosition > window.innerHeight)) {
        savedPosition = null;
      }
      
      widget.style.top = `${savedPosition !== null ? savedPosition : Math.round(window.innerHeight / 2)}px`;

      isPinned = await isWidgetPinned();
      pinBtn.classList.toggle('active', isPinned);

      activeTabIndex = await getActiveTab();
      switchTab(activeTabIndex);

      const uiPrefs = await getUiPrefs();
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

    function completeOnboarding() {
      // deprecated
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
        statusActionBtn.textContent = 'Finish Editing';
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

      statusLabelEl.textContent = 'Getting Started';
      statusTextEl.textContent = `Click 'Inspect Text' to select an element. We will analyze the element so you can safely modify its styles.`;
      statusActionBtn.textContent = 'Inspect Text';
      statusActionMode = 'inspect';
    }

    function updateTargetCard() {
      if (selectedScopeKind === 'page') {
        targetLabelEl.textContent = 'Current target';
        targetTextEl.textContent = 'Whole page';
        targetInspectBtn.textContent = currentInspection ? 'Inspect Text instead' : 'Inspect Text';
      } else if (selectedScopeKind === 'tag') {
        targetLabelEl.textContent = 'Current target';
        targetTextEl.textContent = `Every <${tagSelect.value}> element`;
        targetInspectBtn.textContent = currentInspection ? 'Inspect Text instead' : 'Inspect Text';
      } else if (selectedScopeKind === 'selector') {
        targetLabelEl.textContent = 'Current target';
        targetTextEl.textContent = selectorInput.value.trim() || 'Enter a custom selector';
        targetInspectBtn.textContent = currentInspection ? 'Inspect Text instead' : 'Inspect Text';
      } else if (currentInspection) {
        targetLabelEl.textContent = 'Current target';
        targetTextEl.textContent = currentInspection.selector;
        targetInspectBtn.textContent = 'Pick another element';
      } else {
        targetLabelEl.textContent = 'Recommended target';
        targetTextEl.textContent = `Click 'Inspect Text' to select a specific element to edit safely.`;
        targetInspectBtn.textContent = 'Inspect Text';
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
      editTextBtn.textContent = textEditState.active ? 'Finish Editing' : 'Edit Text';
    }

    function updateRemoveElementButton() {
      const removalState = currentInspection
        ? window.__fccFontChanger.getElementRemovalState(currentInspection.selector)
        : { active: false };

      toggleRemoveElementBtn.disabled = !currentInspection;
      toggleRemoveElementBtn.textContent = removalState.active ? 'Undo Remove' : 'Hide Element';
      toggleRemoveElementBtn.classList.toggle('fcc-btn-secondary', removalState.active);
      toggleRemoveElementBtn.classList.toggle('fcc-btn-ghost', !removalState.active);
    }

    function syncInspectionActionButtons() {
      const hasInspection = Boolean(currentInspection);
      useInspectionBtn.disabled = !hasInspection;
      shadow.getElementById('fcc-copy-inspect-css').disabled = !hasInspection;
      shadow.getElementById('fcc-copy-inspect-summary').disabled = !hasInspection;
      updateTextEditButton();
      updateRemoveElementButton();
    }

    function setScope(kind) {
      if (selectedScopeKind !== kind) {
        if (currentPreviewConfig) {
           handleAutoApply();
        }
        selectedScopeKind = kind;
        updateScopeVisibility();
        syncPreview();
      }
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

    function setWidgetActionHidden(hidden) {
      widget.classList.toggle('fcc-action-hidden', hidden);
      if (hidden) {
        statusCard.setAttribute('hidden', '');
      }
    }

    pill.addEventListener('click', () => {
      toggleDrawer();
    });

    pill.addEventListener('mouseenter', () => {
      pillHideBtn.style.display = 'flex';
    });
    pill.addEventListener('mouseleave', () => {
      pillHideBtn.style.display = 'none';
    });
    
    function hideGabby() {
      showToast('Gabby hidden. Click the extension icon in your toolbar and select "Open Floating Panel" to bring her back!', 6000);
      pill.style.opacity = '0';
      pill.style.pointerEvents = 'none';
      collapseDrawer();
      setTimeout(() => {
        if (pill.style.opacity === '0') {
          widget.style.display = 'none';
        }
      }, 400); 
    }

    pillHideBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideGabby();
    });

    pill.addEventListener('mousedown', (event) => {
      event.stopPropagation();
      isDragging = false;
      
      let initialTop = parseInt(widget.style.top, 10);
      if (isNaN(initialTop)) {
         const rect = widget.getBoundingClientRect();
         initialTop = rect.top + rect.height / 2;
      }
      
      const startY = event.clientY;

      const onMove = (moveEvent) => {
        const delta = moveEvent.clientY - startY;
        if (!isDragging && Math.abs(delta) > 3) {
          isDragging = true;
          pill.style.cursor = 'grabbing';
        }
        
        if (isDragging) {
          const nextTop = core.clamp(initialTop + delta, 60, window.innerHeight - 60);
          widget.style.top = `${nextTop}px`;
        }
      };

      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        pill.style.cursor = '';

        if (isDragging) {
          saveWidgetPosition(parseInt(widget.style.top, 10));
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

    let hideTimeout;
    
    widget.addEventListener('mouseleave', () => {
      if (!isPinned && !isDragging && !isActionActive) {
        hideTimeout = setTimeout(() => {
          if (!widget.matches(':hover') && !isPinned && !isActionActive) {
            collapseDrawer();
          }
        }, 350);
      }
    });

    widget.addEventListener('mouseenter', () => {
      clearTimeout(hideTimeout);
      if (!isPinned && !isDragging && !isExpanded && !isActionActive) {
        expandDrawer();
      }
    });

    document.addEventListener('fcc-inspect-state-change', (e) => {
      const active = e.detail?.active;
      isActionActive = Boolean(active);
      setWidgetActionHidden(isActionActive);
      if (active) {
        startInspectBtn.classList.add('inspecting');
        startInspectBtn.textContent = 'Inspecting...';
        targetInspectBtn.classList.add('inspecting');
        targetInspectBtn.textContent = 'Inspecting...';
      } else {
        startInspectBtn.classList.remove('inspecting');
        startInspectBtn.textContent = 'Inspect Text';
        targetInspectBtn.classList.remove('inspecting');
        targetInspectBtn.textContent = currentInspection ? 'Inspect text instead' : 'Inspect text';
        syncInspectionActionButtons();
      }
    });

    document.addEventListener('fcc-color-pick-state-change', (e) => {
      const active = e.detail?.active;
      isActionActive = Boolean(active);
      setWidgetActionHidden(isActionActive);
      if (active) {
        pickColorBtn.classList.add('inspecting');
        pickColorBtn.textContent = 'Picking...';
      } else {
        pickColorBtn.classList.remove('inspecting');
        pickColorBtn.textContent = 'Color Picker';
      }
    });


    document.addEventListener('click', (e) => {
      if (!statusCard || statusCard.hasAttribute('hidden')) return;
      const path = e.composedPath();
      if (!path.includes(statusCard)) {
        statusCard.setAttribute('hidden', '');
      }
    });
    // Deprecated quick start buttons removed
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
        sourceInspectionId: currentInspection.id,
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

      // Remember which tab the user was on so we can return after freezing
      returnTabAfterInspect = activeTabIndex !== 0 ? activeTabIndex : null;

      expandDrawer();
      // Only switch to inspect tab if the user is already on it
      if (returnTabAfterInspect === null) {
        switchTab(0);
      }
      window.__fccFontChanger.saveSelection();
      window.__fccFontAnalyzer.start(async (inspection) => {
        await setInspection(inspection, true);
        showToast('Element frozen');

        // Return to the originating tab (or stay on Inspect if started from there)
        if (returnTabAfterInspect !== null) {
          switchTab(returnTabAfterInspect);
          returnTabAfterInspect = null;
        }
      });
      showToast('Inspect mode active');
    }

    async function setInspection(inspection, persist = true) {
      const hadInspection = Boolean(currentInspection);
      currentInspection = inspection;
      useInspectionBtn.textContent = inspection ? 'Edit This Element' : 'Edit This Element';
      syncInspectionActionButtons();

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

    const exportPaletteBtn = shadow.getElementById('fcc-export-palette-json');
    exportPaletteBtn.addEventListener('click', () => {
      if (!currentPalette) {
        showToast('Scan a page palette first');
        return;
      }

      const formatGroup = (entries) => {
        if (!entries || !entries.length) return [];
        return entries.map(e => e.hex);
      };

      const jsonData = {
        text: formatGroup(currentPalette.groups.text),
        background: formatGroup(currentPalette.groups.background),
        border: formatGroup(currentPalette.groups.border),
      };

      const jsonStr = JSON.stringify(jsonData, null, 2);
      const textCount = jsonData.text.length;
      const bgCount = jsonData.background.length;
      const borderCount = jsonData.border.length;
      const total = textCount + bgCount + borderCount;

      // Copy to clipboard
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(jsonStr).catch(() => {});
        } else {
          const ta = document.createElement('textarea');
          ta.value = jsonStr;
          ta.style.cssText = 'position:fixed;opacity:0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
      } catch(e) {}

      showToast(`Palette JSON copied — ${total} colors (${textCount} text, ${bgCount} bg, ${borderCount} border)`, 3000);
    });

    const customColorWheel = shadow.getElementById('fcc-custom-color-wheel');
    const copyPickedBtn = shadow.getElementById('fcc-copy-picked');
    
    if (copyPickedBtn) {
      copyPickedBtn.addEventListener('click', () => {
        if (currentPickedColor) {
          const hexVal = currentPickedColor.hex.toUpperCase();
          showToast(`${hexVal} copied`);
          try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
              navigator.clipboard.writeText(hexVal).catch(() => {});
            } else {
              const ta = document.createElement('textarea');
              ta.value = hexVal;
              ta.style.cssText = 'position:fixed;opacity:0';
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
            }
          } catch(e) {}
        }
      });
    }

    customColorWheel.addEventListener('input', (e) => {
      const parsed = window.__fccCore.parseCssColor(e.target.value);
      if (parsed) {
        setPickedColor(parsed);
      }
    });

    customColorWheel.addEventListener('change', async (e) => {
      const parsed = window.__fccCore.parseCssColor(e.target.value);
      if (parsed) {
        await addColorToHistory(parsed.hex.toUpperCase());
        showToast('Color picked');
      }
    });

    function startColorPick() {
      expandDrawer();
      switchTab(1);
      window.__fccColorPicker.start(async (sample) => {
        setPickedColor(sample);
        const hexVal = sample.hex.toUpperCase();
        showToast(`${hexVal} copied`);
        try {
          if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(hexVal).catch(() => {});
          } else {
            const ta = document.createElement('textarea');
            ta.value = hexVal;
            ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
          }
        } catch(e) {}
        await addColorToHistory(hexVal);
      });
    }

    function setPickedColor(sample) {
      currentPickedColor = sample;
      pickedEmpty.hidden = Boolean(sample);
      pickedCard.hidden = !sample;
      if (!sample) return;

      shadow.getElementById('fcc-picked-hex').textContent = sample.hex.toUpperCase();
      shadow.getElementById('fcc-picked-rgb').textContent = sample.rgb;
      shadow.getElementById('fcc-picked-hsl').textContent = sample.hsl;
      shadow.getElementById('fcc-picked-swatch').style.background = sample.hex;
      
      const customWheel = shadow.getElementById('fcc-custom-color-wheel');
      if (customWheel && customWheel.value !== sample.hex) {
        customWheel.value = sample.hex;
      }

      const shadesContainer = shadow.getElementById('fcc-picked-shades');
      if (shadesContainer) {
        shadesContainer.innerHTML = '';

        // Create a single shared popover for all shade swatches
        let shadeTip = shadow.getElementById('fcc-shade-tip');
        if (!shadeTip) {
          shadeTip = document.createElement('div');
          shadeTip.className = 'fcc-shade-tip';
          shadeTip.id = 'fcc-shade-tip';
          shadeTip.innerHTML = `
            <span class="fcc-shade-tip-hex"></span>
            <button class="fcc-shade-tip-copy" title="Copy hex">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          `;
          // Keep popover alive when mouse enters it
          shadeTip.addEventListener('mouseenter', () => {
            clearTimeout(shadeTip._hideTimer);
          });
          shadeTip.addEventListener('mouseleave', () => {
            shadeTip._hideTimer = setTimeout(() => {
              shadeTip.classList.remove('visible');
            }, 150);
          });
          // Copy button inside the popover
          shadeTip.querySelector('.fcc-shade-tip-copy').addEventListener('click', (e) => {
            e.stopPropagation();
            const hexVal = shadeTip._currentHex;
            if (hexVal) {
              showToast(`${hexVal} copied`);
              try {
                if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                  navigator.clipboard.writeText(hexVal).catch(() => {});
                } else {
                  const ta = document.createElement('textarea');
                  ta.value = hexVal;
                  ta.style.cssText = 'position:fixed;opacity:0';
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand('copy');
                  document.body.removeChild(ta);
                }
              } catch(e) {}
            }
          });
          shadesContainer.parentElement.style.position = 'relative';
          shadesContainer.parentElement.appendChild(shadeTip);
        }

        generateShades(sample.hex).forEach(hex => {
          const swatch = document.createElement('div');
          swatch.className = 'fcc-shade-swatch';
          swatch.style.background = hex;
          swatch.setAttribute('data-hex', hex.toUpperCase());

          // Show popover on hover
          swatch.addEventListener('mouseenter', () => {
            clearTimeout(shadeTip._hideTimer);
            const hexUpper = hex.toUpperCase();
            shadeTip._currentHex = hexUpper;
            shadeTip.querySelector('.fcc-shade-tip-hex').textContent = hexUpper;

            // Position above the swatch
            const swatchRect = swatch.getBoundingClientRect();
            const parentRect = shadesContainer.parentElement.getBoundingClientRect();
            shadeTip.style.left = (swatchRect.left - parentRect.left + swatchRect.width / 2) + 'px';
            shadeTip.style.bottom = (parentRect.bottom - swatchRect.top + 6) + 'px';
            shadeTip.style.transform = 'translateX(-50%)';
            shadeTip.classList.add('visible');
          });

          swatch.addEventListener('mouseleave', () => {
            shadeTip._hideTimer = setTimeout(() => {
              shadeTip.classList.remove('visible');
            }, 300);
          });

          // Click swatch to set as active color
          swatch.addEventListener('click', () => {
             const hexUpper = hex.toUpperCase();
             showToast(`${hexUpper} copied`);
             const newSample = window.__fccCore.parseCssColor(hex);
             if (newSample) {
               setPickedColor(newSample);
               addColorToHistory(hexUpper).catch(() => {});
             }
             try {
               if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                 navigator.clipboard.writeText(hexUpper).catch(() => {});
               } else {
                 const ta = document.createElement('textarea');
                 ta.value = hexUpper;
                 ta.style.cssText = 'position:fixed;opacity:0';
                 document.body.appendChild(ta);
                 ta.select();
                 document.execCommand('copy');
                 document.body.removeChild(ta);
               }
             } catch(e) {}
          });
          shadesContainer.appendChild(swatch);
        });
      }

      updatePickedContrast();
      updateStatusCard();
    }

    function generateShades(baseHex) {
      const color = window.__fccCore.parseCssColor(baseHex);
      if (!color) return [];
      const hsl = window.__fccCore.rgbToHslObject(color.r, color.g, color.b);
      function hslToRgb(h, s, l) {
        s /= 100; l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return { r: Math.round(255 * f(0)), g: Math.round(255 * f(8)), b: Math.round(255 * f(4)) };
      }
      const result = [];
      for (let i = 4; i >= 1; i--) {
        const l = Math.min(100, hsl.l + (100 - hsl.l) * (i * 0.18));
        const rgb = hslToRgb(hsl.h, hsl.s, l);
        result.push(window.__fccCore.rgbToHex(rgb.r, rgb.g, rgb.b));
      }
      result.push(baseHex);
      for (let i = 1; i <= 4; i++) {
        const l = Math.max(0, hsl.l - (hsl.l) * (i * 0.18));
        const rgb = hslToRgb(hsl.h, hsl.s, l);
        result.push(window.__fccCore.rgbToHex(rgb.r, rgb.g, rgb.b));
      }
      return result;
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
      setSavePaletteButtonActive(true);
      showToast('Palette saved');
    }

    function setSavePaletteButtonActive(isActive) {
      savePaletteBtn.disabled = !isActive;
      savePaletteBtn.hidden = !isActive;
    }

    function renderPalette(palette) {
      if (!palette) {
        paletteEmpty.hidden = false;
        paletteCard.hidden = true;
        setSavePaletteButtonActive(false);
        return;
      }

      paletteEmpty.hidden = true;
      paletteCard.hidden = false;
      setSavePaletteButtonActive(true);
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
              <span class="fcc-swatch-copy-icon" data-copy-hex="${entry.hex}" title="Copy ${entry.hex}">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </span>
            </button>
          `;
        })
        .join('');

      container.querySelectorAll('[data-copy-color]').forEach((button) => {
        button.addEventListener('click', (e) => {
          // If the copy icon was clicked, let its own handler fire
          if (e.target.closest('[data-copy-hex]')) return;
          const hex = button.dataset.copyColor;
          showToast(`${hex} copied`);
          try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
              navigator.clipboard.writeText(hex).catch(() => {});
            } else {
              const ta = document.createElement('textarea');
              ta.value = hex;
              ta.style.cssText = 'position:fixed;opacity:0';
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
            }
          } catch(e) {}
        });
      });

      container.querySelectorAll('[data-copy-hex]').forEach((icon) => {
        icon.addEventListener('click', (e) => {
          e.stopPropagation();
          const hex = icon.dataset.copyHex;
          showToast(`${hex} copied`);
          try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
              navigator.clipboard.writeText(hex).catch(() => {});
            } else {
              const ta = document.createElement('textarea');
              ta.value = hex;
              ta.style.cssText = 'position:fixed;opacity:0';
              document.body.appendChild(ta);
              ta.select();
              document.execCommand('copy');
              document.body.removeChild(ta);
            }
          } catch(e) {}
        });
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
    fontColorInput.addEventListener('change', () => showToast('Color picked'));
    backgroundColorInput.addEventListener('input', () => markTouched('backgroundColor', true));
    backgroundColorInput.addEventListener('change', () => showToast('Color picked'));
    function handleAutoApply() {
      if (currentPreviewConfig && Object.keys(currentPreviewConfig.declarations).length > 0) {
        window.__fccFontChanger.applyRule(currentPreviewConfig);
        updateRuleState();
        showToast(`Auto-applied ${currentPreviewConfig.scope.value || currentPreviewConfig.scope.selector || currentPreviewConfig.scope.kind}`);
      }
    }

    fontFamilySelect.addEventListener('change', () => {
      updatePreviewCard();
      updateActionButtons();
      syncPreview();
    });
    
    // Track previous value for scope elements before they change to allow auto-apply
    let prevTagValue = tagSelect.value;
    tagSelect.addEventListener('focus', () => { prevTagValue = tagSelect.value; });
    tagSelect.addEventListener('change', () => {
      if (currentPreviewConfig && currentPreviewConfig.scope.kind === 'tag' && currentPreviewConfig.scope.value === prevTagValue) {
        handleAutoApply();
      }
      prevTagValue = tagSelect.value;
      updateScopeVisibility();
      syncPreview();
    });
    
    let prevSelectorValue = selectorInput.value;
    selectorInput.addEventListener('focus', () => { prevSelectorValue = selectorInput.value; });
    selectorInput.addEventListener('change', () => {
      if (currentPreviewConfig && currentPreviewConfig.scope.kind === 'selector' && currentPreviewConfig.scope.value === prevSelectorValue) {
        handleAutoApply();
      }
      prevSelectorValue = selectorInput.value;
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
      resetPreviewBtn.style.display = hasDeclarations ? 'inline-flex' : 'none';
      
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

    let currentPreviewConfig = null;

    function syncPreview() {
      if (window.__fccFontChanger.isPaused()) {
        window.__fccFontChanger.togglePauseRules();
        updateRuleState();
      }

      const scope = collectScope();
      const declarations = collectDeclarations();

      if (!scope || !Object.keys(declarations).length) {
        window.__fccFontChanger.clearPreview();
        currentPreviewConfig = null;
        return;
      }

      currentPreviewConfig = {
        scope,
        declarations,
        sourceInspectionId: currentInspection ? currentInspection.id : null,
      };

      window.__fccFontChanger.preview(currentPreviewConfig);
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
      
      // Auto reset the preview controls so they can start fresh
      resetControlsSilently();
      
      showToast(`${rule.label} updated`);
    });
    
    function resetControlsSilently() {
      Object.keys(touched).forEach((key) => touched[key] = false);

      fontFamilySelect.value = '';
      
      const typography = currentInspection ? currentInspection.typography : null;
      fontSizeSlider.value = typography ? parseInt(typography.fontSize) : 16;
      fontWeightSlider.value = typography ? parseInt(typography.fontWeight) : 400;
      lineHeightSlider.value = typography ? parseFloat(typography.lineHeight) : 1.5;
      letterSpacingSlider.value = typography ? parseFloat(typography.letterSpacing) : 0;
      fontColorInput.value = currentInspection ? currentInspection.colors.text.hex : '#111827';
      backgroundColorInput.value = currentInspection ? currentInspection.colors.background.hex : '#ffffff';

      updateControlDisplays();
      updatePreviewCard();
      updateActionButtons();
      syncPreview();
    }

    resetPreviewBtn.addEventListener('click', () => {
      resetControlsSilently();
      showToast('Settings reset');
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

    shadow.getElementById('fcc-inspect-reset-all').addEventListener('click', () => {
      if (confirm('Are you sure you want to clear ALL site changes? This cannot be undone.')) {
        window.__fccFontChanger.reset();
        updateRuleState();
        showToast('Site changes cleared');
      }
    });

    shadow.getElementById('fcc-reset-rules').addEventListener('click', () => {
      window.__fccFontChanger.reset();
      updateRuleState();
      showToast('Saved site changes cleared');
    });

    shadow.getElementById('fcc-export-css').addEventListener('click', () => {
      copyToClipboard(window.__fccFontChanger.exportCSS() || '/* No active CSS rules */');
    });

    toggleRulesBtn.addEventListener('click', () => {
      window.__fccFontChanger.togglePauseRules();
      updateRuleState();
      showToast(window.__fccFontChanger.isPaused() ? 'Rules paused' : 'Rules resumed');
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
      try {
        const changer = window.__fccFontChanger;
        const state = changer.getState();
        const isPaused = changer.isPaused();
        
        let labelText = isPaused ? 'Engine paused' : 'Active';
        if (isPaused) {
          labelText = state.rules.length ? 'Site changes paused' : 'Engine paused';
        } else if (state.rules.length === 0) {
          labelText = 'Engine active';
        } else {
          labelText = 'Site changes active';
        }
        
        overrideLabel.textContent = `STATUS: ${labelText.toUpperCase()}`;
        
        // Explicitly set text and class
        if (isPaused) {
          toggleRulesBtn.textContent = 'RESUME';
          toggleRulesBtn.classList.add('paused');
          overrideIndicator.classList.add('paused');
        } else {
          toggleRulesBtn.textContent = 'PAUSE';
          toggleRulesBtn.classList.remove('paused');
          overrideIndicator.classList.remove('paused');
        }
        
        toggleRulesBtn.setAttribute('aria-pressed', String(isPaused));

        ruleTools.hidden = advancedPanel.hidden;
        const activeRulesEl = shadow.getElementById('fcc-active-rules');
        if (!state.rules.length) {
          activeRulesEl.innerHTML = `<div class="fcc-list-empty">No saved site changes yet.</div>`;
        } else {
          activeRulesEl.innerHTML = state.rules
            .map((rule) => {
              return `
                <div class="fcc-list-item" data-rule-id="${rule.id}">
                  <span class="fcc-list-title">${rule.label}</span>
                  <span class="fcc-list-meta">${rule.selector}</span>
                  <button class="fcc-list-action" data-remove-rule="${rule.id}">×</button>
                </div>
              `;
            })
            .join('');
          
          activeRulesEl.querySelectorAll('[data-remove-rule]').forEach((btn) => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              changer.removeRule(btn.dataset.removeRule);
              updateRuleState();
            });
          });
        }
      } catch (err) {
        console.error('[Gabby] updateRuleState failed:', err);
      }
    }

    function copyToClipboard(text, customMessage) {
      const msg = customMessage || 'Copied';

      function fallbackCopy() {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        } catch (err) {
          console.error('[Gabby] fallback copy error', err);
        }
      }

      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(text).then(() => {
            showToast(msg);
          }).catch(() => {
            fallbackCopy();
            showToast(msg);
          });
        } else {
          fallbackCopy();
          showToast(msg);
        }
      } catch (err) {
        console.error('[Gabby] copy error', err);
        fallbackCopy();
        showToast(msg);
      }
    }

    function showToast(message, duration = 1800) {
      toast.textContent = message;
      toast.classList.add('show');
      clearTimeout(showToast._timer);
      showToast._timer = setTimeout(() => {
        toast.classList.remove('show');
      }, duration);
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
        pill.style.opacity = '1';
        pill.style.pointerEvents = 'auto';
        if (message.expand === false) {
          collapseDrawer();
        } else {
          expandDrawer();
        }
        sendResponse({ success: true });
        return;
      }

      if (message.type === MSG.HIDE_WIDGET) {
        hideGabby();
        sendResponse({ success: true });
        return;
      }

      if (message.type === MSG.START_INSPECT) {
        widget.style.display = '';
        pill.style.opacity = '1';
        pill.style.pointerEvents = 'auto';
        startInspectMode();
        sendResponse({ success: true });
        return;
      }

      if (message.type === MSG.START_COLOR_PICK) {
        widget.style.display = '';
        pill.style.opacity = '1';
        pill.style.pointerEvents = 'auto';
        startColorPick();
        sendResponse({ success: true });
      }
    });

    applyResolvedTheme();
    init();
  })();
}
