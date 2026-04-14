/**
 * Unified inspect mode.
 * Hover previews an element, click freezes it and returns a normalized inspection result.
 */

if (typeof window.__fccFontAnalyzer === 'undefined') {
  window.__fccFontAnalyzer = (() => {
    const core = window.__fccCore;

    let isActive = false;
    let onInspect = null;
    let hoveredElement = null;
    let overlayBox = null;
    let overlayLabel = null;

    function start(callback) {
      if (isActive) return;

      isActive = true;
      onInspect = callback;

      document.addEventListener('mousemove', handleMouseMove, true);
      document.addEventListener('click', handleClick, true);
      document.addEventListener('keydown', handleKeyDown, true);
      document.dispatchEvent(new CustomEvent('fcc-inspect-state-change', { detail: { active: true } }));
    }

    function stop() {
      isActive = false;
      onInspect = null;
      hoveredElement = null;

      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);

      destroyOverlay();
      document.dispatchEvent(new CustomEvent('fcc-inspect-state-change', { detail: { active: false } }));
    }

    function handleMouseMove(event) {
      if (!isActive) return;

      const target = getInspectableTarget(event.target);
      if (!target || target === hoveredElement) return;

      hoveredElement = target;
      renderOverlay(target);
    }

    function handleClick(event) {
      if (!isActive) return;

      const target = getInspectableTarget(event.target);
      if (!target) return;

      event.preventDefault();
      event.stopPropagation();

      freezeTarget(target);
      stop();
    }

    function handleKeyDown(event) {
      if (!isActive) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        stop();
      }
    }

    function getInspectableTarget(target) {
      if (!target) return null;

      let element = target.nodeType === Node.TEXT_NODE ? target.parentElement : target;
      const host = document.getElementById('fcc-extension-host');

      while (element && element !== document.body) {
        if (host && element === host) return null;

        const tagName = element.tagName ? element.tagName.toLowerCase() : '';
        if (!tagName || ['script', 'style', 'link', 'meta', 'noscript'].includes(tagName)) {
          return null;
        }

        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          return element;
        }

        element = element.parentElement;
      }

      return null;
    }

    function renderOverlay(element) {
      ensureOverlay();

      const rect = element.getBoundingClientRect();
      overlayBox.style.top = `${Math.max(rect.top, 0)}px`;
      overlayBox.style.left = `${Math.max(rect.left, 0)}px`;
      overlayBox.style.width = `${rect.width}px`;
      overlayBox.style.height = `${rect.height}px`;
      overlayBox.style.opacity = '1';

      overlayLabel.textContent = core.buildBreadcrumb(element) || core.describeElement(element);
      overlayLabel.style.top = `${Math.max(rect.top - 34, 8)}px`;
      overlayLabel.style.left = `${Math.max(rect.left, 8)}px`;
      overlayLabel.style.opacity = '1';
    }

    function ensureOverlay() {
      if (overlayBox && overlayLabel) return;

      overlayBox = document.createElement('div');
      overlayLabel = document.createElement('div');

      Object.assign(overlayBox.style, {
        position: 'fixed',
        zIndex: '2147483645',
        pointerEvents: 'none',
        border: '2px solid #6366f1',
        background: 'rgba(99, 102, 241, 0.12)',
        borderRadius: '8px',
        boxSizing: 'border-box',
        boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
        transition: 'all 140ms cubic-bezier(0.22, 1, 0.36, 1)',
        backdropFilter: 'contrast(1.05) saturate(1.2)',
        opacity: '0',
      });

      Object.assign(overlayLabel.style, {
        position: 'fixed',
        zIndex: '2147483646',
        pointerEvents: 'none',
        padding: '5px 10px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
        color: '#ffffff',
        font: '700 11.5px/1.2 system-ui, -apple-system, sans-serif',
        letterSpacing: '0.04em',
        maxWidth: 'min(420px, calc(100vw - 16px))',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        boxShadow: '0 6px 16px rgba(79, 70, 229, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 140ms cubic-bezier(0.22, 1, 0.36, 1)',
        opacity: '0',
      });

      document.documentElement.appendChild(overlayBox);
      document.documentElement.appendChild(overlayLabel);
    }

    function destroyOverlay() {
      if (overlayBox) {
        overlayBox.remove();
        overlayBox = null;
      }

      if (overlayLabel) {
        overlayLabel.remove();
        overlayLabel = null;
      }
    }

    function freezeTarget(element) {
      const result = inspectElement(element);
      if (onInspect) {
        onInspect(result);
      }
      return result;
    }

    function inspectElement(element) {
      const styles = window.getComputedStyle(element);
      const textColor = core.parseCssColor(styles.color) || core.parseCssColor('#111827');
      const backgroundColor = core.getResolvedBackgroundColor(element);
      const borderColor = core.parseCssColor(styles.borderColor);
      const fontSizePx = parseFloat(styles.fontSize) || 16;
      const fontWeight = parseInt(styles.fontWeight, 10) || 400;
      const rect = element.getBoundingClientRect();
      const contrast = core.getContrastSummary(textColor, backgroundColor, fontSizePx, fontWeight);

      return {
        id: core.createId('inspection'),
        siteKey: core.getSiteKey(location.href),
        url: location.href,
        selector: core.buildUniqueSelector(element),
        breadcrumb: core.buildBreadcrumb(element),
        tagName: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className : '',
        textPreview: core.getTextPreview(element),
        rect: {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        },
        typography: core.buildTypographySnapshot(styles),
        colors: {
          text: textColor,
          background: backgroundColor,
          border: borderColor,
        },
        contrast,
        inspectedAt: new Date().toISOString(),
      };
    }

    function samplePagePalette(options = {}) {
      const maxElements = options.maxElements || 400;
      const paletteLimit = options.paletteLimit || 12;

      const textSamples = [];
      const backgroundSamples = [];
      const borderSamples = [];

      const elements = Array.from(document.body.querySelectorAll('*')).slice(0, maxElements);

      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const styles = window.getComputedStyle(element);
        const selector = core.buildUniqueSelector(element);
        const label = core.describeElement(element);
        const textPreview = core.getTextPreview(element, 48);

        if (textPreview) {
          const textColor = core.parseCssColor(styles.color);
          if (textColor) {
            textSamples.push({
              selector,
              label: `${label} ${textPreview}`.trim(),
              ...textColor,
            });
          }
        }

        const backgroundColor = core.parseCssColor(styles.backgroundColor);
        if (backgroundColor && backgroundColor.a > 0) {
          backgroundSamples.push({
            selector,
            label,
            ...backgroundColor,
          });
        }

        const borderWidth = parseFloat(styles.borderTopWidth || '0');
        const borderColor = core.parseCssColor(styles.borderTopColor || styles.borderColor);
        if (borderWidth > 0 && borderColor && borderColor.a > 0) {
          borderSamples.push({
            selector,
            label,
            ...borderColor,
          });
        }
      });

      return {
        id: core.createId('palette'),
        name: `${document.title || 'Page'} palette`,
        siteKey: core.getSiteKey(location.href),
        url: location.href,
        createdAt: new Date().toISOString(),
        groups: {
          text: core.dedupePalette(textSamples, paletteLimit),
          background: core.dedupePalette(backgroundSamples, paletteLimit),
          border: core.dedupePalette(borderSamples, paletteLimit),
        },
      };
    }

    return {
      freezeTarget,
      inspectElement,
      samplePagePalette,
      start,
      stop,
    };
  })();
}
