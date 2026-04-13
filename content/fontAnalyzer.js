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
    }

    function stop() {
      isActive = false;
      onInspect = null;
      hoveredElement = null;

      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);

      destroyOverlay();
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
      overlayLabel.style.top = `${Math.max(rect.top - 30, 8)}px`;
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
        border: '2px solid rgba(24, 33, 43, 0.88)',
        background: 'rgba(54, 83, 111, 0.08)',
        borderRadius: '8px',
        boxSizing: 'border-box',
        transition: 'all 80ms ease-out',
        opacity: '0',
      });

      Object.assign(overlayLabel.style, {
        position: 'fixed',
        zIndex: '2147483646',
        pointerEvents: 'none',
        padding: '4px 8px',
        borderRadius: '999px',
        background: 'rgba(17, 24, 39, 0.92)',
        color: '#ffffff',
        font: '600 11px/1.3 system-ui, -apple-system, sans-serif',
        maxWidth: 'min(420px, calc(100vw - 16px))',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.2)',
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
