/**
 * Scoped override engine with preview, undo/redo, presets, and site-session restore.
 */

if (typeof window.__fccFontChanger === 'undefined') {
  window.__fccFontChanger = (() => {
    const core = window.__fccCore;

    const STYLE_ID = 'fcc-override-styles';
    const PREVIEW_STYLE_ID = 'fcc-preview-styles';
    const SPAN_CLASS = 'fcc-override-span';
    const FONT_LINK_ID = 'fcc-google-font-link';
    const REMOVE_ELEMENT_DEBUG_ACTION = 'remove-element';
    const TEXT_EDIT_DEBUG_ACTION = 'text-edit';

    let savedRange = null;
    let rules = [];
    let previewRule = null;
    let history = [];
    let hasRestoredSession = false;
    let activeTextEdit = null;
    let rulesPaused = false;
    const googleFontLoadJobs = new Map();
    const appliedTextEdits = new Map();

    const siteKey = core.getSiteKey(location.href);

    const GOOGLE_FONTS = [
      'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
      'Raleway', 'Nunito', 'Playfair Display', 'Merriweather',
      'Source Sans Pro', 'Ubuntu', 'Oswald', 'Outfit', 'Space Grotesk',
      'DM Sans', 'Figtree', 'Geist', 'Plus Jakarta Sans', 'Sora',
      'Work Sans', 'Fira Sans', 'Barlow', 'Rubik', 'Karla',
      'Crimson Text', 'Libre Baskerville', 'EB Garamond', 'Lora', 'Bitter'
    ];

    const WEB_SAFE_FONTS = [
      'Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Trebuchet MS',
      'Georgia', 'Times New Roman', 'Courier New', 'Lucida Console',
      'system-ui', 'sans-serif', 'serif', 'monospace'
    ];

    document.addEventListener('mouseup', () => {
      const host = document.getElementById('fcc-extension-host');
      const activeElement = document.activeElement;
      if (host && host.contains(activeElement)) return;
      setTimeout(saveSelection, 10);
    });

    document.addEventListener('keyup', (event) => {
      if (event.shiftKey || event.key === 'Shift') {
        setTimeout(saveSelection, 10);
      }
    });

    function saveSelection() {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        savedRange = selection.getRangeAt(0).cloneRange();
      }
    }

    function getActiveRange() {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        return selection.getRangeAt(0).cloneRange();
      }

      return savedRange ? savedRange.cloneRange() : null;
    }

    function emitTextEditState(detail = {}) {
      window.dispatchEvent(new CustomEvent('fcc:text-edit-state', {
        detail,
      }));
    }

    function focusEditableElement(element) {
      if (!element) return;

      element.focus();

      const selection = window.getSelection();
      if (!selection) return;

      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);

      selection.removeAllRanges();
      selection.addRange(range);
    }

    function restoreEditableState(element, previous = {}) {
      if (!element) return;

      if (previous.contentEditable === null) {
        element.removeAttribute('contenteditable');
      } else {
        element.setAttribute('contenteditable', previous.contentEditable);
      }

      if (previous.spellcheck === null) {
        element.removeAttribute('spellcheck');
      } else {
        element.setAttribute('spellcheck', previous.spellcheck);
      }

      element.style.outline = previous.outline || '';
      element.style.outlineOffset = previous.outlineOffset || '';
      element.style.cursor = previous.cursor || '';
    }

    function getTextEditState() {
      if (!activeTextEdit) {
        return {
          active: false,
          selector: null,
          text: '',
        };
      }

      return {
        active: true,
        selector: activeTextEdit.selector,
        text: activeTextEdit.element.innerText || activeTextEdit.element.textContent || '',
      };
    }

    function finishTextEdit(options = {}) {
      if (!activeTextEdit) {
        return {
          active: false,
          changed: false,
          canceled: false,
          selector: null,
        };
      }

      const { save = true } = options;
      const {
        element,
        selector,
        originalHTML,
        persistedOriginalHTML,
        previous,
        onBlur,
        onKeyDown,
        sourceInspectionId,
      } = activeTextEdit;

      element.removeEventListener('blur', onBlur, true);
      element.removeEventListener('keydown', onKeyDown, true);

      if (!save) {
        element.innerHTML = originalHTML;
      }

      const changed = element.innerHTML !== originalHTML;
      const contentHTML = element.innerHTML;
      const contentText = element.innerText || element.textContent || '';
      restoreEditableState(element, previous);
      activeTextEdit = null;

      if (save && changed) {
        upsertTextEditRule({
          selector,
          sourceInspectionId,
          originalHTML: persistedOriginalHTML || originalHTML,
          contentHTML,
          contentText,
        });
      }

      const detail = {
        active: false,
        changed,
        canceled: !save,
        saved: save,
        selector,
        text: contentText,
      };

      emitTextEditState(detail);
      return detail;
    }

    function cancelTextEdit() {
      return finishTextEdit({ save: false });
    }

    function startTextEdit(config = {}) {
      const selector = config.selector || config.value || config.elementSelector || '';
      const element = getTargetElement(selector);
      const existingTextEditRule = getTextEditRule(selector);

      if (!element) {
        return {
          success: false,
          reason: 'missing-target',
        };
      }

      const tagName = element.tagName ? element.tagName.toLowerCase() : '';
      if (['input', 'textarea'].includes(tagName)) {
        element.focus();
        if (typeof element.select === 'function') {
          element.select();
        }
        return {
          success: true,
          native: true,
          selector,
        };
      }

      const textValue = element.innerText || element.textContent || '';
      if (!textValue.trim()) {
        return {
          success: false,
          reason: 'no-text',
        };
      }

      if (activeTextEdit && activeTextEdit.element === element) {
        focusEditableElement(element);
        return {
          success: true,
          editing: true,
          selector,
          text: textValue,
        };
      }

      if (activeTextEdit) {
        finishTextEdit();
      }

      const previous = {
        contentEditable: element.getAttribute('contenteditable'),
        spellcheck: element.getAttribute('spellcheck'),
        outline: element.style.outline,
        outlineOffset: element.style.outlineOffset,
        cursor: element.style.cursor,
      };

      const onBlur = () => {
        window.setTimeout(() => {
          if (!activeTextEdit || activeTextEdit.element !== element) return;

          const activeElement = document.activeElement;
          if (activeElement && (activeElement === element || element.contains(activeElement))) {
            return;
          }

          finishTextEdit();
        }, 0);
      };

      const onKeyDown = (event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          cancelTextEdit();
          return;
        }

        if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
          event.preventDefault();
          finishTextEdit();
        }
      };

      activeTextEdit = {
        element,
        selector,
        originalHTML: element.innerHTML,
        persistedOriginalHTML: existingTextEditRule?.originalHTML || element.innerHTML,
        sourceInspectionId: config.sourceInspectionId || existingTextEditRule?.sourceInspectionId || null,
        previous,
        onBlur,
        onKeyDown,
      };

      element.setAttribute('contenteditable', 'plaintext-only');
      element.setAttribute('spellcheck', 'true');
      element.style.outline = '2px solid rgba(38, 79, 115, 0.95)';
      element.style.outlineOffset = '3px';
      element.style.cursor = 'text';

      element.addEventListener('blur', onBlur, true);
      element.addEventListener('keydown', onKeyDown, true);

      focusEditableElement(element);

      const detail = {
        active: true,
        selector,
        text: textValue,
      };

      emitTextEditState(detail);
      return {
        success: true,
        editing: true,
        ...detail,
      };
    }

    function cloneRules(value) {
      return JSON.parse(JSON.stringify(value || []));
    }

    function getTargetElement(selector) {
      if (!selector) return null;

      try {
        return document.querySelector(selector);
      } catch (error) {
        return null;
      }
    }

    function pushHistory() {
      history.push(cloneRules(rules));
      history = history.slice(-25);
      future = [];
    }

    function normalizeDeclarations(input) {
      const declarations = {};

      if (input.fontFamily) {
        const isGoogleFont = GOOGLE_FONTS.includes(input.fontFamily);
        declarations.fontFamily = isGoogleFont
          ? `'${input.fontFamily}', sans-serif`
          : input.fontFamily;
      }

      if (input.fontSize) declarations.fontSize = input.fontSize;
      if (input.fontWeight) declarations.fontWeight = input.fontWeight;
      if (input.lineHeight) declarations.lineHeight = input.lineHeight;
      if (input.letterSpacing) declarations.letterSpacing = input.letterSpacing;
      if (input.color) declarations.color = input.color;
      if (input.backgroundColor) declarations.backgroundColor = input.backgroundColor;
      if (input.display) declarations.display = input.display;

      return declarations;
    }

    function resolveScopeLabel(scope) {
      if (!scope) return 'Rule';
      if (scope.kind === 'page') return 'Whole page';
      if (scope.kind === 'tag') return `Tag ${scope.value}`;
      if (scope.kind === 'selector') return `Selector ${scope.value}`;
      if (scope.kind === 'element') return `Element ${scope.selector || scope.value}`;
      if (scope.kind === 'selection') return 'Selected text';
      return scope.kind;
    }

    function resolveScopeSelector(scope) {
      if (!scope) return '';

      switch (scope.kind) {
        case 'page':
          return 'body';
        case 'tag':
          return scope.value || '';
        case 'selector':
          return scope.value || '';
        case 'element':
          return scope.selector || scope.value || '';
        case 'selection':
          return `[data-fcc-rule-id="${scope.ruleId}"]`;
        default:
          return '';
      }
    }

    function createRule(config) {
      const declarations = normalizeDeclarations(config.declarations || config);
      const scope = config.scope || { kind: 'page' };
      const selector = resolveScopeSelector(scope);
      const rawFontFamily =
        config.rawFontFamily ||
        config.fontFamilyName ||
        config.fontFamily ||
        config.declarations?.fontFamily ||
        null;
      const fontFamilyName = GOOGLE_FONTS.includes(rawFontFamily) ? rawFontFamily : null;

      if (fontFamilyName && GOOGLE_FONTS.includes(fontFamilyName)) {
        loadGoogleFont(fontFamilyName);
      }

      return {
        id: config.id || core.createId('rule'),
        siteKey,
        selector,
        label: config.label || resolveScopeLabel(scope),
        scope,
        declarations,
        createdAt: config.createdAt || new Date().toISOString(),
        fontFamilyName,
        sourceInspectionId: config.sourceInspectionId || null,
        persistent: config.persistent !== false,
        debugAction: config.debugAction || null,
      };
    }

    function isTextEditRule(rule) {
      return rule?.debugAction === TEXT_EDIT_DEBUG_ACTION;
    }

    function getTextEditRules() {
      return rules.filter((rule) => {
        return isTextEditRule(rule) && rule.scope?.kind === 'element' && rule.selector;
      });
    }

    function getTextEditRule(selector) {
      if (!selector) return null;
      return getTextEditRules().find((rule) => rule.selector === selector) || null;
    }

    function createTextEditRule(config = {}) {
      const selector =
        config.selector ||
        config.value ||
        config.elementSelector ||
        (config.scope?.kind === 'element' ? (config.scope.selector || config.scope.value || '') : '');

      const rule = createRule({
        ...config,
        scope: {
          kind: 'element',
          selector,
          value: selector,
        },
        declarations: {},
        label: config.label || 'Edited text',
        debugAction: TEXT_EDIT_DEBUG_ACTION,
      });

      return {
        ...rule,
        contentHTML: config.contentHTML || '',
        contentText: config.contentText || '',
        originalHTML: config.originalHTML || '',
      };
    }

    function syncTextEditRules() {
      const nextRules = rulesPaused ? [] : getTextEditRules();
      const nextBySelector = new Map(nextRules.map((rule) => [rule.selector, rule]));

      appliedTextEdits.forEach((appliedRule, selector) => {
        const nextRule = nextBySelector.get(selector);
        if (
          !nextRule ||
          nextRule.id !== appliedRule.ruleId ||
          nextRule.contentHTML !== appliedRule.contentHTML
        ) {
          const element = getTargetElement(selector);
          if (element && typeof appliedRule.originalHTML === 'string') {
            element.innerHTML = appliedRule.originalHTML;
          }
          appliedTextEdits.delete(selector);
        }
      });

      nextRules.forEach((rule) => {
        const element = getTargetElement(rule.selector);
        if (!element) return;

        const appliedRule = appliedTextEdits.get(rule.selector);
        const originalHTML = appliedRule?.originalHTML ?? rule.originalHTML ?? element.innerHTML;

        if (element.innerHTML !== rule.contentHTML) {
          element.innerHTML = rule.contentHTML;
        }

        appliedTextEdits.set(rule.selector, {
          ruleId: rule.id,
          originalHTML,
          contentHTML: rule.contentHTML,
        });
      });
    }

    function upsertTextEditRule(config = {}) {
      const selector =
        config.selector ||
        config.value ||
        config.elementSelector ||
        (config.scope?.kind === 'element' ? (config.scope.selector || config.scope.value || '') : '');

      if (!selector) {
        return null;
      }

      const existingRule = getTextEditRule(selector);
      const originalHTML = existingRule?.originalHTML ?? config.originalHTML ?? '';
      const contentHTML = config.contentHTML || '';

      if (contentHTML === originalHTML) {
        if (existingRule) {
          removeRule(existingRule.id);
        }
        return null;
      }

      const nextRule = createTextEditRule({
        ...config,
        id: existingRule?.id || config.id || core.createId('rule'),
        createdAt: existingRule?.createdAt || config.createdAt,
        selector,
        originalHTML,
        contentHTML,
        contentText: config.contentText || core.collapseWhitespace(contentHTML),
        sourceInspectionId: config.sourceInspectionId || existingRule?.sourceInspectionId || null,
      });

      pushHistory();
      rules = [
        nextRule,
        ...rules.filter((rule) => !(isTextEditRule(rule) && rule.selector === selector)),
      ];

      renderRules();
      syncTextEditRules();
      clearPreview();
      persistSession();

      return nextRule;
    }

    function renderRules() {
      const styleElement = ensureStyleElement(STYLE_ID);
      if (rulesPaused) {
        styleElement.textContent = `
          .fcc-inline-edit { 
             all: unset !important; 
             display: contents !important; 
          }
        `;
        return;
      }
      styleElement.textContent = rules
        .filter((rule) => rule.scope.kind !== 'selection')
        .map((rule) => core.serializeOverrideRule(rule))
        .filter(Boolean)
        .join('\n\n');
    }

    function togglePauseRules(forceState) {
      rulesPaused = typeof forceState === 'boolean' ? forceState : !rulesPaused;
      renderRules();
      renderPreview();
      syncTextEditRules();
      return rulesPaused;
    }

    function isPaused() {
      return rulesPaused;
    }

    function renderPreview() {
      const previewElement = ensureStyleElement(PREVIEW_STYLE_ID);
      previewElement.textContent = (previewRule && !rulesPaused) ? core.serializeOverrideRule(previewRule) : '';
    }

    function ensureStyleElement(id) {
      let styleElement = document.getElementById(id);
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = id;
        document.head.appendChild(styleElement);
      }
      return styleElement;
    }

    function applyInlineDeclarations(element, declarations) {
      Object.entries(declarations || {}).forEach(([property, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          element.style[property] = value;
        }
      });
    }

    function wrapSelection(rule) {
      const range = getActiveRange();
      if (!range) return false;

      const wrapper = document.createElement('span');
      wrapper.className = SPAN_CLASS;
      wrapper.dataset.fccRuleId = rule.id;
      applyInlineDeclarations(wrapper, rule.declarations);

      try {
        range.surroundContents(wrapper);
      } catch (error) {
        const fragment = range.extractContents();
        wrapper.appendChild(fragment);
        range.insertNode(wrapper);
      }

      const selection = window.getSelection();
      if (selection) {
        const nextRange = document.createRange();
        nextRange.selectNodeContents(wrapper);
        selection.removeAllRanges();
        selection.addRange(nextRange);
        savedRange = nextRange.cloneRange();
      }

      return true;
    }

    function maybeConvertElementRuleToSelection(rule) {
      if (rule.scope.kind !== 'element') return rule;

      const range = getActiveRange();
      if (!range || range.collapsed) return rule;

      const targetElement = document.querySelector(rule.selector);
      if (!targetElement) return rule;

      const commonNode =
        range.commonAncestorContainer.nodeType === Node.TEXT_NODE
          ? range.commonAncestorContainer.parentElement
          : range.commonAncestorContainer;

      if (commonNode && targetElement.contains(commonNode)) {
        return {
          ...rule,
          scope: {
            kind: 'selection',
            ruleId: rule.id,
          },
          selector: `[data-fcc-rule-id="${rule.id}"]`,
          label: 'Selected text',
          persistent: false,
        };
      }

      return rule;
    }

    function applyRule(config) {
      let nextRule = createRule(config);
      if (config.allowSelectionConversion !== false) {
        nextRule = maybeConvertElementRuleToSelection(nextRule);
      }

      pushHistory();

      if (nextRule.scope.kind === 'selection') {
        wrapSelection(nextRule);
      }

      rules.unshift(nextRule);
      renderRules();
      syncTextEditRules();
      clearPreview();
      persistSession();

      return nextRule;
    }

    function getElementRemovalRule(selector) {
      if (!selector) return null;

      return rules.find((rule) =>
        rule.scope?.kind === 'element' &&
        rule.selector === selector &&
        rule.debugAction === REMOVE_ELEMENT_DEBUG_ACTION
      ) || null;
    }

    function getElementRemovalState(selector) {
      const rule = getElementRemovalRule(selector);

      return {
        active: Boolean(rule),
        rule: rule ? cloneRules([rule])[0] : null,
      };
    }

    function toggleElementRemoval(config = {}) {
      const selector =
        config.selector ||
        config.value ||
        config.elementSelector ||
        (config.scope?.kind === 'element' ? (config.scope.selector || config.scope.value || '') : '');

      if (!selector) {
        return {
          success: false,
          active: false,
          reason: 'missing-target',
        };
      }

      if (activeTextEdit) {
        finishTextEdit();
      }

      const existingRule = getElementRemovalRule(selector);
      if (existingRule) {
        removeRule(existingRule.id);
        return {
          success: true,
          active: false,
          restored: true,
          rule: null,
        };
      }

      const rule = applyRule({
        scope: {
          kind: 'element',
          selector,
          value: selector,
        },
        declarations: {
          display: 'none',
        },
        label: config.label || 'Removed element',
        sourceInspectionId: config.sourceInspectionId || null,
        persistent: config.persistent === undefined ? true : config.persistent,
        debugAction: REMOVE_ELEMENT_DEBUG_ACTION,
        allowSelectionConversion: false,
      });

      return {
        success: true,
        active: true,
        restored: false,
        rule,
      };
    }

    function preview(config) {
      const originalFontFamily =
        config.rawFontFamily ||
        config.fontFamilyName ||
        config.fontFamily ||
        (config.declarations ? config.declarations.fontFamily : null) ||
        null;
      const declarations = normalizeDeclarations(config.declarations || config);
      if (!Object.keys(declarations).length) {
        clearPreview();
        return null;
      }

      const rule = createRule({
        ...config,
        declarations,
        rawFontFamily: originalFontFamily,
        id: 'preview-rule',
        label: 'Preview',
        persistent: false,
      });

      if (rule.scope.kind === 'selection') {
        return null;
      }

      previewRule = rule;
      renderPreview();
      return rule;
    }

    function clearPreview() {
      previewRule = null;
      renderPreview();
    }

    function removeSelectionWrappers(ruleId) {
      document.querySelectorAll(`[data-fcc-rule-id="${ruleId}"]`).forEach((wrapper) => {
        const parent = wrapper.parentNode;
        while (wrapper.firstChild) {
          parent.insertBefore(wrapper.firstChild, wrapper);
        }
        parent.removeChild(wrapper);
        parent.normalize();
      });
    }

    function removeRule(ruleId) {
      if (!ruleId) return;

      pushHistory();
      const removedRule = rules.find((rule) => rule.id === ruleId);
      rules = rules.filter((rule) => rule.id !== ruleId);

      if (removedRule && removedRule.scope.kind === 'selection') {
        removeSelectionWrappers(ruleId);
      }

      renderRules();
      syncTextEditRules();
      persistSession();
    }

    function undo() {
      if (!history.length) return false;

      future.push(cloneRules(rules));
      rules = history.pop();
      rehydrateSelectionRules();
      renderRules();
      syncTextEditRules();
      persistSession();
      return true;
    }

    function redo() {
      if (!future.length) return false;

      history.push(cloneRules(rules));
      rules = future.pop();
      rehydrateSelectionRules();
      renderRules();
      syncTextEditRules();
      persistSession();
      return true;
    }

    function rehydrateSelectionRules() {
      rules
        .filter((rule) => rule.scope.kind === 'selection')
        .forEach((rule) => {
          const exists = document.querySelector(rule.selector);
          if (!exists) {
            rules = rules.filter((entry) => entry.id !== rule.id);
          }
        });
    }

    function reset() {
      if (activeTextEdit) {
        cancelTextEdit();
      }

      pushHistory();

      rules
        .filter((rule) => rule.scope.kind === 'selection')
        .forEach((rule) => removeSelectionWrappers(rule.id));

      rules = [];
      clearPreview();
      renderRules();
      syncTextEditRules();
      document.querySelectorAll(`[id^="${FONT_LINK_ID}-"]`).forEach((fontLink) => fontLink.remove());
      void clearSiteSession(siteKey);
    }

    function exportCSS() {
      return rules
        .filter((rule) => rule.scope.kind !== 'selection')
        .map((rule) => core.serializeOverrideRule(rule))
        .filter(Boolean)
        .join('\n\n');
    }

    function exportSession() {
      const serializableRules = rules.filter((rule) => rule.persistent !== false);
      return {
        css: exportCSS(),
        json: core.stableStringify({
          siteKey,
          exportedAt: new Date().toISOString(),
          rules: serializableRules,
        }),
      };
    }

    async function persistSession() {
      const persistentRules = rules.filter((rule) => rule.persistent !== false);
      await saveSiteSession(siteKey, {
        siteKey,
        url: location.href,
        rules: persistentRules,
      });
    }

    async function restoreSiteSession() {
      if (hasRestoredSession) {
        return {
          restored: true,
          rules: cloneRules(rules),
        };
      }

      const session = await getSiteSession(siteKey);
      if (session && Array.isArray(session.rules)) {
        rules = cloneRules(session.rules);
        rules.forEach((rule) => {
          if (rule.fontFamilyName && GOOGLE_FONTS.includes(rule.fontFamilyName)) {
            loadGoogleFont(rule.fontFamilyName);
          }
        });
        renderRules();
        syncTextEditRules();
        hasRestoredSession = true;
        return {
          restored: true,
          rules: cloneRules(rules),
        };
      }

      hasRestoredSession = true;
      return {
        restored: false,
        rules: [],
      };
    }

    function getGoogleFontLinkId(fontName) {
      const normalized = String(fontName || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      return `${FONT_LINK_ID}-${normalized || 'font'}`;
    }

    function getGoogleFontStylesheetHref(fontName) {
      return (
        `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}` +
        ':wght@100;200;300;400;500;600;700;800;900&display=swap'
      );
    }

    function ensureGoogleFontStylesheet(fontName) {
      const href = getGoogleFontStylesheetHref(fontName);
      const linkId = getGoogleFontLinkId(fontName);
      let link = document.getElementById(linkId);

      if (!link) {
        link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.crossOrigin = 'anonymous';
        link.onload = () => {
          renderRules();
          renderPreview();
          if (document.fonts && typeof document.fonts.load === 'function') {
            void document.fonts.load(`400 1em "${fontName}"`).catch(() => {});
            void document.fonts.load(`600 1em "${fontName}"`).catch(() => {});
          }
        };
        document.head.appendChild(link);
      }

      link.href = href;
      return link;
    }

    function parseGoogleFontFaces(cssText, fontName) {
      const familyPattern = new RegExp(`font-family:\\s*['"]${fontName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'i');
      const faceBlocks = cssText.match(/@font-face\s*{[\s\S]*?}/g) || [];

      return faceBlocks
        .map((block) => {
          if (!familyPattern.test(block)) {
            return null;
          }

          const styleMatch = block.match(/font-style:\s*([^;]+);/i);
          const weightMatch = block.match(/font-weight:\s*([^;]+);/i);
          const srcMatch = block.match(/src:\s*url\(([^)]+)\)/i);

          if (!styleMatch || !weightMatch || !srcMatch) {
            return null;
          }

          return {
            style: styleMatch[1].trim(),
            weight: weightMatch[1].trim(),
            source: srcMatch[1].trim().replace(/^['"]|['"]$/g, ''),
          };
        })
        .filter(Boolean);
    }

    async function loadGoogleFontViaFontFace(fontName) {
      if (!document.fonts || typeof FontFace === 'undefined' || typeof fetch !== 'function') {
        ensureGoogleFontStylesheet(fontName);
        return false;
      }

      const response = await fetch(getGoogleFontStylesheetHref(fontName));
      if (!response.ok) {
        throw new Error(`font-css-${response.status}`);
      }

      const cssText = await response.text();
      const faces = parseGoogleFontFaces(cssText, fontName);

      if (!faces.length) {
        throw new Error('font-face-missing');
      }

      await Promise.all(
        faces.map(async ({ style, weight, source }) => {
          const fontResponse = await fetch(source, { mode: 'cors' });
          if (!fontResponse.ok) {
            throw new Error(`font-binary-${fontResponse.status}`);
          }

          const fontData = await fontResponse.arrayBuffer();
          const fontFace = new FontFace(fontName, fontData, {
            style,
            weight,
            display: 'swap',
          });

          await fontFace.load();
          document.fonts.add(fontFace);
        })
      );

      await Promise.all([
        document.fonts.load(`400 1em "${fontName}"`).catch(() => {}),
        document.fonts.load(`600 1em "${fontName}"`).catch(() => {}),
      ]);

      return true;
    }

    function loadGoogleFont(fontName) {
      if (!fontName || !GOOGLE_FONTS.includes(fontName)) {
        return Promise.resolve(false);
      }

      if (googleFontLoadJobs.has(fontName)) {
        return googleFontLoadJobs.get(fontName);
      }

      const loadJob = loadGoogleFontViaFontFace(fontName)
        .catch(() => {
          ensureGoogleFontStylesheet(fontName);
          return false;
        })
        .then((loaded) => {
          if (document.fonts && typeof document.fonts.load === 'function') {
            void document.fonts.load(`400 1em "${fontName}"`).catch(() => {});
            void document.fonts.load(`600 1em "${fontName}"`).catch(() => {});
          }

          renderRules();
          renderPreview();

          if (!loaded) {
            googleFontLoadJobs.delete(fontName);
          }

          return loaded;
        });

      googleFontLoadJobs.set(fontName, loadJob);
      return loadJob;
    }

    function getFonts() {
      return {
        google: GOOGLE_FONTS,
        webSafe: WEB_SAFE_FONTS,
      };
    }

    function getState() {
      return {
        siteKey,
        rules: cloneRules(rules),
        canUndo: history.length > 0,
        canRedo: future.length > 0,
        textEdit: getTextEditState(),
      };
    }

    return {
      applyRule,
      cancelTextEdit,
      clearPreview,
      exportCSS,
      exportSession,
      getFonts,
      getElementRemovalState,
      getState,
      getTextEditState,
      isPaused,
      preview,
      redo,
      removeRule,
      reset,
      restoreSiteSession,
      saveSelection,
      finishTextEdit,
      startTextEdit,
      toggleElementRemoval,
      togglePauseRules,
      undo,
    };
  })();
}
