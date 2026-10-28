#!/usr/bin/env node
/**
 * Generates src/design/components/Ghost/ghostData.ts from the standing ghost in
 * design/screens-06-to-block-focus/source/OB12.dc.html (the animated version: its 8 s SMIL
 * loop runs anxious → neutral → happy, keyframes 0/.1 · .3/.45 · .6/.88).
 *
 * Supported subset (all this asset uses): <g> <path> <ellipse> <circle> <rect>, linear/radial
 * gradients in objectBoundingBox units, <animate> (d, opacity, rx, stroke-dashoffset) and
 * <animateTransform type="translate">, calcMode="spline", plus the two CSS loops `.blink`
 * and `.star`. Path keyframes must share one command structure (Skia interpolation) — the
 * script fails loudly otherwise.
 *
 * Usage: node scripts/build-standing-ghost.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'design/screens-06-to-block-focus/source/OB12.dc.html'), 'utf8');
const out = resolve(root, 'src/design/components/Ghost/ghostData.ts');

const svg = [...html.matchAll(/<svg\b[^>]*>[\s\S]*?<\/svg>/g)]
  .map((m) => m[0])
  .find((s) => s.includes('viewBox="0 -10 200 270"'));
if (!svg) throw new Error('Standing ghost SVG not found in OB12.dc.html');

const viewBox = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);

// ---------- CSS loops ----------
const blink = html.match(/@keyframes blink\{0%,92%,100%\{transform:scaleY\(1\)\}95%\{transform:scaleY\(([\d.]+)\)\}/);
const blinkDur = html.match(/\.blink\{animation:blink ([\d.]+)s/);
const twinkle = html.match(/@keyframes twinkle\{from\{opacity:([\d.]+)\}/);
if (!blink || !blinkDur || !twinkle) throw new Error('blink / twinkle CSS not found');

// ---------- tiny XML tree ----------
const attrsOf = (s) => Object.fromEntries([...s.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
const tokens = [...svg.matchAll(/<(\/?)([a-zA-Z]+)\b([^>]*?)(\/?)>/g)];
const rootNode = { tag: 'svg', attrs: {}, children: [] };
const stack = [rootNode];
for (const [, close, tag, attrs, self] of tokens) {
  if (close) {
    stack.pop();
    continue;
  }
  const node = { tag, attrs: attrsOf(attrs), children: [] };
  stack[stack.length - 1].children.push(node);
  if (!self) stack.push(node);
}
const svgNode = rootNode.children[0];

const num = (v, d = 0) => (v === undefined ? d : Number(v));
const splineList = (s) => s?.split(';').map((p) => p.trim().split(/[\s,]+/).map(Number));
const commands = (d) => (d.match(/[a-zA-Z]/g) ?? []).join('');
const numbers = (d) => (d.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).length;

// ---------- gradients ----------
const gradients = {};
const defs = svgNode.children.find((c) => c.tag === 'defs');
for (const g of defs?.children ?? []) {
  const stops = g.children
    .filter((c) => c.tag === 'stop')
    .map((s) => ({ offset: num(s.attrs.offset), color: s.attrs['stop-color'], opacity: num(s.attrs['stop-opacity'], 1) }));
  const a = g.attrs;
  gradients[a.id] =
    g.tag === 'linearGradient'
      ? { type: 'linear', x1: num(a.x1), y1: num(a.y1), x2: num(a.x2, 1), y2: num(a.y2), stops }
      : { type: 'radial', cx: num(a.cx, 0.5), cy: num(a.cy, 0.5), r: num(a.r, 0.5), stops };
}

// ---------- nodes ----------
const ATTR = { d: 'd', opacity: 'opacity', rx: 'rx', 'stroke-dashoffset': 'dashOffset' };
const MOOD_DUR = 8;

function animOf(a, tag) {
  const values = a.values.split(';').map((v) => v.trim());
  const dur = parseFloat(a.dur);
  const keyTimes = a.keyTimes ? a.keyTimes.split(';').map(Number) : values.map((_, i) => i / (values.length - 1));
  const splines = a.calcMode === 'spline' ? splineList(a.keySplines) : undefined;
  const attr = tag === 'animateTransform' ? 'translate' : ATTR[a.attributeName];
  if (!attr) throw new Error(`Unsupported animated attribute ${a.attributeName}`);
  if (tag === 'animateTransform' && a.type !== 'translate') throw new Error(`Unsupported transform ${a.type}`);
  let parsed;
  if (attr === 'd') {
    const c0 = commands(values[0]);
    const n0 = numbers(values[0]);
    values.forEach((v, i) => {
      if (commands(v) !== c0 || numbers(v) !== n0) throw new Error(`Keyframe ${i} of a path changes structure`);
    });
    parsed = values;
  } else if (attr === 'translate') {
    parsed = values.map((v) => {
      const [x, y = 0] = v.split(/[\s,]+/).map(Number);
      return [x, y];
    });
  } else {
    parsed = values.map(Number);
  }
  return { attr, values: parsed, keyTimes, splines, dur, clock: dur === MOOD_DUR ? 'mood' : 'free' };
}

const paintOf = (v) => (v === undefined || v === 'none' ? undefined : v.startsWith('url(#') ? { gradient: v.slice(5, -1) } : { color: v });
const translateOf = (t) => {
  const m = t?.match(/translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/);
  return m ? [Number(m[1]), Number(m[2])] : undefined;
};

function convert(n) {
  const a = n.attrs;
  const anims = n.children.filter((c) => c.tag === 'animate' || c.tag === 'animateTransform').map((c) => animOf(c.attrs, c.tag));
  const kids = n.children.filter((c) => ['g', 'path', 'ellipse', 'circle', 'rect'].includes(c.tag)).map(convert);
  const base = {
    kind: n.tag,
    opacity: a.opacity !== undefined ? Number(a.opacity) : undefined,
    translate: translateOf(a.transform),
    anims: anims.length ? anims : undefined,
  };
  if (a.class === 'blink') base.css = { kind: 'blink', dur: Number(blinkDur[1]), minScale: Number(blink[1]) };
  if (a.class === 'star') {
    const s = a.style ?? '';
    base.css = {
      kind: 'twinkle',
      peak: Number(s.match(/--a:([\d.]+)/)?.[1] ?? 0.5),
      halfPeriod: parseFloat(s.match(/--d:([\d.]+)s/)?.[1] ?? '5'),
      delay: parseFloat(s.match(/--o:(-?[\d.]+)s/)?.[1] ?? '0'),
      min: Number(twinkle[1]),
    };
  }
  if (n.tag === 'g') return { ...base, children: kids };
  const paint = {
    fill: a.fill === undefined ? { color: '#000000' } : paintOf(a.fill),
    stroke: paintOf(a.stroke),
    strokeWidth: a['stroke-width'] !== undefined ? Number(a['stroke-width']) : undefined,
    strokeCap: a['stroke-linecap'],
    dash: a['stroke-dasharray']?.split(/[\s,]+/).map(Number),
    fillOpacity: a['fill-opacity'] !== undefined ? Number(a['fill-opacity']) : undefined,
    strokeOpacity: a['stroke-opacity'] !== undefined ? Number(a['stroke-opacity']) : undefined,
  };
  if (n.tag === 'path') return { ...base, ...paint, d: a.d };
  if (n.tag === 'ellipse') return { ...base, ...paint, cx: num(a.cx), cy: num(a.cy), rx: num(a.rx), ry: num(a.ry) };
  if (n.tag === 'circle') return { ...base, ...paint, cx: num(a.cx), cy: num(a.cy), rx: num(a.r), ry: num(a.r), kind: 'ellipse' };
  if (n.tag === 'rect') return { ...base, ...paint, x: num(a.x), y: num(a.y), width: num(a.width), height: num(a.height), r: num(a.rx) };
  throw new Error(`Unsupported <${n.tag}>`);
}

const strip = (o) => {
  if (Array.isArray(o)) return o.map(strip);
  if (o && typeof o === 'object') {
    return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [k, strip(v)]));
  }
  return o;
};

const nodes = svgNode.children.filter((c) => c.tag !== 'defs').map(convert).map(strip);
const used = new Set(JSON.stringify(nodes).match(/"gradient":"(\w+)"/g)?.map((s) => s.slice(12, -1)));
for (const id of used) if (!gradients[id]) throw new Error(`Missing gradient #${id}`);
const gradientsUsed = Object.fromEntries(Object.entries(gradients).filter(([id]) => used.has(id)));

const moodKeyTimes = JSON.stringify(nodes).match(/"keyTimes":\[0,0\.1,0\.3,0\.45,0\.6,0\.88,1\]/);
if (!moodKeyTimes) throw new Error('Mood loop keyTimes changed — update GHOST_MOOD_TIMES in Ghost.tsx');

const ts =
  `// GENERATED by scripts/build-standing-ghost.mjs from design/screens-06-to-block-focus — do not edit.\n` +
  `import type { GhostGradient, GhostNode } from './ghostTypes';\n\n` +
  `/** SVG viewBox [x, y, width, height] of the standing ghost. */\n` +
  `export const GHOST_VIEWBOX = ${JSON.stringify(viewBox)} as const;\n\n` +
  `export const ghostGradients: Record<string, GhostGradient> = ${JSON.stringify(gradientsUsed, null, 2)};\n\n` +
  `export const ghostNodes: GhostNode[] = ${JSON.stringify(nodes, null, 2)};\n`;

writeFileSync(out, ts);
const count = (list) => list.reduce((n, x) => n + 1 + (x.children ? count(x.children) : 0), 0);
console.log(`Wrote ${out}: ${count(nodes)} nodes, ${Object.keys(gradientsUsed).length} gradients`);
