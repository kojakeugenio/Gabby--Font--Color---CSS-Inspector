(function (root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.FCCCore = api;
    root.__fccCore = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MAX_BREADCRUMB_DEPTH = 4;
  const MAX_SELECTOR_DEPTH = 5;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function createId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
  }

  function collapseWhitespace(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escapeCssIdentifier(value) {
    if (!value) return '';

    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
      return CSS.escape(String(value));
    }

    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function rgbToHex(r, g, b) {
    return (
      '#' +
      [r, g, b]
        .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'))
        .join('')
    );
  }

  function hexToRgb(hex) {
    if (!hex) return null;

    const normalized = normalizeHex(hex);
    if (!normalized) return null;

    return {
      r: parseInt(normalized.slice(1, 3), 16),
      g: parseInt(normalized.slice(3, 5), 16),
      b: parseInt(normalized.slice(5, 7), 16),
    };
  }

  function normalizeHex(value) {
    const input = String(value || '').trim().toLowerCase();
    if (!input) return null;

    const withHash = input.startsWith('#') ? input : `#${input}`;

    if (/^#([a-f0-9]{3})$/.test(withHash)) {
      return `#${withHash[1]}${withHash[1]}${withHash[2]}${withHash[2]}${withHash[3]}${withHash[3]}`;
    }

    if (/^#([a-f0-9]{6})$/.test(withHash)) {
      return withHash;
    }

    return null;
  }

  function rgbToHslObject(r, g, b) {
    let red = r / 255;
    let green = g / 255;
    let blue = b / 255;

    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    let h;
    let s;
    const l = (max + min) / 2;

    if (max === min) {
      h = 0;
      s = 0;
    } else {
      const diff = max - min;
      s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

      switch (max) {
        case red:
          h = (green - blue) / diff + (green < blue ? 6 : 0);
          break;
        case green:
          h = (blue - red) / diff + 2;
          break;
        default:
          h = (red - green) / diff + 4;
          break;
      }

      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  function formatRgb(color) {
    if (!color) return 'rgb(0, 0, 0)';
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  }

  function formatHsl(color) {
    if (!color) return 'hsl(0, 0%, 0%)';
    const hsl = rgbToHslObject(color.r, color.g, color.b);
    return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  }

  function parseCssColor(value) {
    if (!value) return null;

    const input = String(value).trim().toLowerCase();

    if (!input || input === 'inherit' || input === 'initial' || input === 'unset') {
      return null;
    }

    if (input === 'transparent') {
      return {
        r: 255,
        g: 255,
        b: 255,
        a: 0,
        hex: '#ffffff',
        rgb: 'rgba(255, 255, 255, 0)',
        hsl: 'hsl(0, 0%, 100%)',
      };
    }

    const normalizedHex = normalizeHex(input);
    if (normalizedHex) {
      const rgb = hexToRgb(normalizedHex);
      return {
        ...rgb,
        a: 1,
        hex: normalizedHex,
        rgb: formatRgb(rgb),
        hsl: formatHsl(rgb),
      };
    }

    const rgbMatch = input.match(
      /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/
    );

    if (rgbMatch) {
      const color = {
        r: clamp(parseFloat(rgbMatch[1]), 0, 255),
        g: clamp(parseFloat(rgbMatch[2]), 0, 255),
        b: clamp(parseFloat(rgbMatch[3]), 0, 255),
        a: rgbMatch[4] !== undefined ? clamp(parseFloat(rgbMatch[4]), 0, 1) : 1,
      };

      return {
        ...color,
        hex: rgbToHex(color.r, color.g, color.b),
        rgb: color.a < 1
          ? `rgba(${color.r}, ${color.g}, ${color.b}, ${Number(color.a.toFixed(2))})`
          : formatRgb(color),
        hsl: formatHsl(color),
      };
    }

    return null;
  }

  function colorToLinear(channel) {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  }

  function relativeLuminance(color) {
    if (!color) return 0;

    return (
      0.2126729 * colorToLinear(color.r) +
      0.7151522 * colorToLinear(color.g) +
      0.072175 * colorToLinear(color.b)
    );
  }

  function contrastRatio(foreground, background) {
    if (!foreground || !background) return 1;

    const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
    const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
    return (lighter + 0.05) / (darker + 0.05);
  }

  function getWcagResult(ratio, fontSizePx, fontWeight) {
    const isLargeText =
      Number(fontSizePx) >= 24 || (Number(fontSizePx) >= 18.66 && Number(fontWeight) >= 700);

    const aaTarget = isLargeText ? 3 : 4.5;
    const aaaTarget = isLargeText ? 4.5 : 7;

    return {
      ratio,
      label: ratio.toFixed(2),
      size: isLargeText ? 'Large text' : 'Normal text',
      aa: ratio >= aaTarget,
      aaa: ratio >= aaaTarget,
      rating: ratio >= aaaTarget ? 'AAA' : ratio >= aaTarget ? 'AA' : 'Fail',
    };
  }

  function apcaContrastEstimate(textColor, backgroundColor) {
    if (!textColor || !backgroundColor) return 0;

    const textY = relativeLuminance(textColor);
    const bgY = relativeLuminance(backgroundColor);
    const delta = bgY - textY;
    const magnitude = Math.pow(Math.abs(delta), 0.65) * 115;
    return delta >= 0 ? magnitude : -magnitude;
  }

  function getContrastSummary(textColor, backgroundColor, fontSizePx, fontWeight) {
    const ratio = contrastRatio(textColor, backgroundColor);
    const wcag = getWcagResult(ratio, fontSizePx, fontWeight);
    const apca = apcaContrastEstimate(textColor, backgroundColor);

    return {
      ratio,
      wcag,
      apca,
      apcaLabel: `${apca > 0 ? '+' : ''}${Math.round(apca)}`,
    };
  }

  function getReadableTextColor(backgroundColor) {
    const background = parseCssColor(backgroundColor);
    if (!background) return '#111827';
    return contrastRatio(parseCssColor('#111827'), background) >= 4.5 ? '#111827' : '#ffffff';
  }

  function getResolvedBackgroundColor(element) {
    let current = element;

    while (current && current !== document.documentElement) {
      const styles = window.getComputedStyle(current);
      const color = parseCssColor(styles.backgroundColor);

      if (color && color.a > 0) {
        return color;
      }

      current = current.parentElement;
    }

    return parseCssColor('#ffffff');
  }

  function describeElement(element) {
    if (!element || !element.tagName) return '';

    const parts = [element.tagName.toLowerCase()];
    if (element.id) parts.push(`#${element.id}`);

    const className = typeof element.className === 'string' ? element.className : '';
    const classes = collapseWhitespace(className)
      .split(' ')
      .filter(Boolean)
      .slice(0, 2);

    if (classes.length) {
      parts.push(`.${classes.join('.')}`);
    }

    return parts.join('');
  }

  function buildBreadcrumb(element) {
    const parts = [];
    let current = element;

    while (current && current.tagName && parts.length < MAX_BREADCRUMB_DEPTH) {
      parts.unshift(describeElement(current));
      current = current.parentElement;
    }

    return parts.join(' > ');
  }

  function getNthOfType(element) {
    if (!element || !element.parentElement) return 1;

    const siblings = Array.from(element.parentElement.children).filter(
      (node) => node.tagName === element.tagName
    );

    return siblings.indexOf(element) + 1;
  }

  function buildUniqueSelector(element) {
    if (!element || !element.tagName) return '';
    if (element.id) return `#${escapeCssIdentifier(element.id)}`;

    const segments = [];
    let current = element;

    while (current && current.tagName && segments.length < MAX_SELECTOR_DEPTH) {
      let segment = current.tagName.toLowerCase();

      if (current.id) {
        segment = `#${escapeCssIdentifier(current.id)}`;
        segments.unshift(segment);
        break;
      }

      const classList = Array.from(current.classList || []).filter(Boolean).slice(0, 2);
      if (classList.length) {
        segment += `.${classList.map(escapeCssIdentifier).join('.')}`;
      }

      if (current.parentElement) {
        const sameType = Array.from(current.parentElement.children).filter(
          (node) => node.tagName === current.tagName
        );

        if (sameType.length > 1) {
          segment += `:nth-of-type(${getNthOfType(current)})`;
        }
      }

      segments.unshift(segment);
      current = current.parentElement;
    }

    return segments.join(' > ');
  }

  function getTextPreview(element, maxLength = 120) {
    if (!element) return '';

    const source = collapseWhitespace(element.innerText || element.textContent || '');
    if (!source) return '';

    return source.length > maxLength ? `${source.slice(0, maxLength - 1)}…` : source;
  }

  function buildTypographySnapshot(styles) {
    return {
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      fontStyle: styles.fontStyle,
      lineHeight: styles.lineHeight,
      letterSpacing: styles.letterSpacing,
      wordSpacing: styles.wordSpacing,
      textTransform: styles.textTransform,
      textDecoration: styles.textDecoration,
      textAlign: styles.textAlign,
    };
  }

  function dedupePalette(samples, limit = 12) {
    const map = new Map();

    (samples || []).forEach((sample) => {
      if (!sample || !sample.hex) return;

      const key = sample.hex.toUpperCase();
      const existing = map.get(key);

      if (existing) {
        existing.count += 1;
        existing.uses.push(sample.label || sample.selector || 'Element');
      } else {
        map.set(key, {
          hex: key,
          rgb: sample.rgb || '',
          hsl: sample.hsl || '',
          count: 1,
          uses: [sample.label || sample.selector || 'Element'],
          sample,
        });
      }
    });

    return Array.from(map.values())
      .sort((left, right) => right.count - left.count)
      .slice(0, limit)
      .map((entry) => ({
        hex: entry.hex,
        rgb: entry.rgb,
        hsl: entry.hsl,
        count: entry.count,
        label: collapseWhitespace(entry.uses[0] || ''),
      }));
  }

  function serializeDeclarations(declarations) {
    return Object.entries(declarations || {})
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([property, value]) => `${toKebabCase(property)}: ${value} !important;`)
      .join(' ');
  }

  function serializeOverrideRule(rule) {
    if (!rule || !rule.selector) return '';

    const body = serializeDeclarations(rule.declarations);
    if (!body) return '';

    return `${rule.selector} { ${body} }`;
  }

  function toKebabCase(value) {
    return String(value)
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/_/g, '-')
      .toLowerCase();
  }

  function stableStringify(value) {
    return JSON.stringify(sortValue(value), null, 2);
  }

  function sortValue(value) {
    if (Array.isArray(value)) {
      return value.map(sortValue);
    }

    if (value && typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce((accumulator, key) => {
          accumulator[key] = sortValue(value[key]);
          return accumulator;
        }, {});
    }

    return value;
  }

  function slugify(value) {
    return collapseWhitespace(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
  }

  function getSiteKey(url) {
    try {
      return new URL(url || location.href).origin;
    } catch (error) {
      return 'unknown-site';
    }
  }

  return {
    apcaContrastEstimate,
    buildBreadcrumb,
    buildTypographySnapshot,
    buildUniqueSelector,
    clamp,
    collapseWhitespace,
    contrastRatio,
    createId,
    dedupePalette,
    describeElement,
    escapeCssIdentifier,
    formatHsl,
    formatRgb,
    getContrastSummary,
    getReadableTextColor,
    getResolvedBackgroundColor,
    getSiteKey,
    getTextPreview,
    getWcagResult,
    hexToRgb,
    normalizeHex,
    parseCssColor,
    relativeLuminance,
    rgbToHex,
    rgbToHslObject,
    serializeDeclarations,
    serializeOverrideRule,
    slugify,
    stableStringify,
    toKebabCase,
  };
});
