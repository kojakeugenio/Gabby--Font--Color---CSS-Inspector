const test = require('node:test');
const assert = require('node:assert/strict');

const core = require('../../lib/core.js');

function createElement(tagName, options = {}, children = []) {
  const element = {
    tagName: tagName.toUpperCase(),
    id: options.id || '',
    classList: options.classList || [],
    children: [],
    parentElement: null,
  };

  children.forEach((child) => {
    child.parentElement = element;
    element.children.push(child);
  });

  return element;
}

test('rgbToHex and parseCssColor keep normalized values aligned', () => {
  assert.equal(core.rgbToHex(38, 79, 115), '#264f73');

  const parsed = core.parseCssColor('rgb(38, 79, 115)');
  assert.deepEqual(
    { hex: parsed.hex, rgb: parsed.rgb, hsl: parsed.hsl },
    { hex: '#264f73', rgb: 'rgb(38, 79, 115)', hsl: 'hsl(208, 50%, 30%)' }
  );
});

test('contrast summary reports strong contrast for black on white', () => {
  const summary = core.getContrastSummary(
    core.parseCssColor('#000000'),
    core.parseCssColor('#ffffff'),
    16,
    400
  );

  assert.equal(summary.wcag.rating, 'AAA');
  assert.equal(summary.wcag.aa, true);
  assert.ok(summary.ratio > 20);
  assert.ok(summary.apca > 0);
});

test('dedupePalette aggregates repeated colors and sorts by use count', () => {
  const palette = core.dedupePalette([
    { hex: '#111111', label: 'Headline' },
    { hex: '#111111', label: 'Body' },
    { hex: '#eeeeee', label: 'Background' },
  ]);

  assert.equal(palette.length, 2);
  assert.equal(palette[0].hex, '#111111');
  assert.equal(palette[0].count, 2);
  assert.equal(palette[1].hex, '#EEEEEE');
});

test('buildUniqueSelector prefers ids and adds nth-of-type when needed', () => {
  const lead = createElement('p', { classList: ['lead'] });
  const body = createElement('p');
  const section = createElement('section', { id: 'article' }, [lead, body]);

  const leadSelector = core.buildUniqueSelector(lead);
  const sectionSelector = core.buildUniqueSelector(section);

  assert.equal(sectionSelector, '#article');
  assert.equal(leadSelector, '#article > p.lead:nth-of-type(1)');
});

test('serializeOverrideRule creates stylesheet-ready CSS', () => {
  const css = core.serializeOverrideRule({
    selector: '.hero h1',
    declarations: {
      fontFamily: "'Inter', sans-serif",
      fontSize: '48px',
      color: '#123456',
      display: 'none',
    },
  });

  assert.match(css, /\.hero h1 \{/);
  assert.match(css, /font-family: 'Inter', sans-serif !important;/);
  assert.match(css, /font-size: 48px !important;/);
  assert.match(css, /color: #123456 !important;/);
  assert.match(css, /display: none !important;/);
});
