#!/usr/bin/env node
/**
 * Generates src/features/onboarding/components/splash/sceneData.ts from the design exports:
 *   design/onboarding-01-05/splash/ghost-tangled.svg    (progress = 0)
 *   design/onboarding-01-05/splash/ghost-untangled.svg  (progress = 1)
 *   design/onboarding-01-05/source/OB01.dc.html         (star field)
 *
 * The two SVGs have the same elements in the same order; only numbers differ. This script
 * pairs them up, checks every path pair has an identical command structure (required for
 * Skia path interpolation) and fails loudly if not.
 *
 * Usage: node scripts/build-ghost-scene.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const design = resolve(root, 'design/onboarding-01-05');
const out = resolve(root, 'src/features/onboarding/components/splash/sceneData.ts');

const tangled = readFileSync(resolve(design, 'splash/ghost-tangled.svg'), 'utf8');
const untangled = readFileSync(resolve(design, 'splash/ghost-untangled.svg'), 'utf8');
const ob01 = readFileSync(resolve(design, 'source/OB01.dc.html'), 'utf8');

const attrsOf = (s) =>
  Object.fromEntries([...s.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
const num = (v, d = 0) => (v === undefined ? d : Number(v));

// ---------- gradients (both <defs> and stray gradients outside it) ----------
function gradients(svg) {
  const map = {};
  for (const m of svg.matchAll(/<(linearGradient|radialGradient)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const a = attrsOf(m[2]);
    const stops = [...m[3].matchAll(/<stop\b([^>]*)>/g)].map((s) => {
      const sa = attrsOf(s[1]);
      return {
        offset: num(sa.offset),
        color: sa['stop-color'],
        opacity: num(sa['stop-opacity'], 1),
      };
    });
    map[a.id] =
      m[1] === 'linearGradient'
        ? { type: 'linear', x1: num(a.x1), y1: num(a.y1), x2: num(a.x2, 1), y2: num(a.y2), stops }
        : { type: 'radial', cx: num(a.cx, 0.5), cy: num(a.cy, 0.5), r: num(a.r, 0.5), stops };
  }
  return map;
}

// ---------- drawable elements, in paint order ----------
function elements(svg) {
  const body = svg
    .replace(/<defs>[\s\S]*?<\/defs>/, '')
    .replace(/<(linear|radial)Gradient\b[\s\S]*?<\/\1Gradient>/g, '');
  return [...body.matchAll(/<(path|circle|ellipse|text|g|\/g)\b([^>]*)>([^<]*)/g)].map((m) => ({
    tag: m[1],
    a: attrsOf(m[2]),
    text: m[3],
  }));
}

const commands = (d) => (d.match(/[a-zA-Z]/g) ?? []).join('');
const numbers = (d) => (d.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).length;

const A = elements(tangled);
const B = elements(untangled);
if (A.length !== B.length) throw new Error(`Element count differs: ${A.length} vs ${B.length}`);

const fillOf = (v) =>
  v?.startsWith('url(#') ? { gradient: v.slice(5, -1) } : v && v !== 'none' ? { color: v } : null;
const translateOf = (t) => {
  const m = t?.match(/translate\(\s*(-?[\d.]+)[ ,]+(-?[\d.]+)\s*\)/);
  return m ? [Number(m[1]), Number(m[2])] : undefined;
};

const nodes = [];
const stack = [nodes];
A.forEach((e, i) => {
  const f = B[i];
  if (e.tag !== f.tag) throw new Error(`Element ${i}: <${e.tag}> vs <${f.tag}>`);
  const top = stack[stack.length - 1];
  if (e.tag === 'g') {
    const g = { kind: 'group', opacity: [num(e.a.opacity, 1), num(f.a.opacity, 1)], children: [] };
    top.push(g);
    stack.push(g.children);
    return;
  }
  if (e.tag === '/g') {
    stack.pop();
    return;
  }
  const paint = {
    fill: fillOf(
      e.a.fill ?? (e.tag === 'text' ? '#000' : e.tag === 'path' && !e.a.stroke ? '#000' : e.a.fill),
    ),
    stroke: fillOf(e.a.stroke),
    strokeWidth: num(e.a['stroke-width'], 1),
    strokeCap: e.a['stroke-linecap'] ?? 'butt',
    dash: e.a['stroke-dasharray']?.split(/[ ,]+/).map(Number),
    fillOpacity: num(e.a['fill-opacity'], 1),
    strokeOpacity: num(e.a['stroke-opacity'], 1),
    opacity: [num(e.a.opacity, 1), num(f.a.opacity, 1)],
    translate: translateOf(e.a.transform),
  };
  if (e.a.fill === 'none') paint.fill = null;
  if (e.tag === 'path') {
    if (commands(e.a.d) !== commands(f.a.d) || numbers(e.a.d) !== numbers(f.a.d)) {
      throw new Error(`Path ${i} can't be interpolated: command structure differs`);
    }
    top.push({ kind: 'path', d: [e.a.d, f.a.d], ...paint });
  } else if (e.tag === 'circle') {
    top.push({
      kind: 'oval',
      cx: [num(e.a.cx), num(f.a.cx)],
      cy: [num(e.a.cy), num(f.a.cy)],
      rx: [num(e.a.r), num(f.a.r)],
      ry: [num(e.a.r), num(f.a.r)],
      ...paint,
    });
  } else if (e.tag === 'ellipse') {
    top.push({
      kind: 'oval',
      cx: [num(e.a.cx), num(f.a.cx)],
      cy: [num(e.a.cy), num(f.a.cy)],
      rx: [num(e.a.rx), num(f.a.rx)],
      ry: [num(e.a.ry), num(f.a.ry)],
      ...paint,
    });
  } else if (e.tag === 'text') {
    top.push({
      kind: 'text',
      text: e.text,
      x: num(e.a.x),
      y: num(e.a.y),
      size: num(e.a['font-size'], 16),
      ...paint,
    });
  }
});

// Drop paint fields that are defaults to keep the output readable.
const clean = (n) => {
  const o = { ...n };
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null) delete o[k];
    if (k === 'fillOpacity' || k === 'strokeOpacity') if (v === 1) delete o[k];
    if (k === 'strokeWidth' && !n.stroke) delete o[k];
    if (k === 'strokeCap' && (!n.stroke || v === 'butt')) delete o[k];
    if (k === 'opacity' && v[0] === 1 && v[1] === 1) delete o[k];
  }
  if (o.children) o.children = o.children.map(clean);
  return o;
};

const allGradients = { ...gradients(tangled) };
const used = new Set(
  JSON.stringify(nodes)
    .match(/"gradient":"(\w+)"/g)
    ?.map((s) => s.slice(12, -1)),
);
const gradientsUsed = Object.fromEntries(
  Object.entries(allGradients).filter(([id]) => used.has(id)),
);
for (const id of used) if (!gradientsUsed[id]) throw new Error(`Missing gradient #${id}`);

// ---------- stars (OB01 star layer) ----------
const starSvgStart = ob01.indexOf('<svg aria-hidden="true" width="390" height="330"');
const starSvg = ob01.slice(starSvgStart, ob01.indexOf('</svg>', starSvgStart));
const stars = [
  ...starSvg.matchAll(
    /<circle class="star" cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"[^>]*--a:([\d.]+);--d:([\d.]+)s/g,
  ),
].map((m) => ({
  x: Number(m[1]),
  y: Number(m[2]),
  r: Number(m[3]),
  a: Number(m[4]),
  d: Number(m[5]),
}));
const lines = [...starSvg.matchAll(/<path d="M([\d.]+) ([\d.]+) L([\d.]+) ([\d.]+)"/g)].map((m) =>
  m.slice(1, 5).map(Number),
);
if (stars.length === 0) throw new Error('No stars found in OB01.dc.html');

const banner = `/* eslint-disable */\n// GENERATED by scripts/build-ghost-scene.mjs from design/onboarding-01-05 — do not edit.\n// Index 0 of every [a, b] pair = tangled (progress 0), index 1 = untangled (progress 1).\n\n`;
const ts =
  banner +
  `import type { SceneGradient, SceneNode, StarLine, StarSpec } from './sceneTypes';\n\n` +
  `export const SCENE_WIDTH = 390;\nexport const SCENE_HEIGHT = 560;\n\n` +
  `export const gradients: Record<string, SceneGradient> = ${JSON.stringify(gradientsUsed, null, 2)};\n\n` +
  `export const scene: SceneNode[] = ${JSON.stringify(nodes.map(clean), null, 2)};\n\n` +
  `/** Star layer, 390×330 tile repeated once to the right (x ≥ 390) for seamless drift. */\n` +
  `export const stars: StarSpec[] = ${JSON.stringify(stars)};\n\n` +
  `export const starLines: StarLine[] = ${JSON.stringify(lines)};\n`;

writeFileSync(out, ts);
console.log(
  `Wrote ${out}: ${nodes.length} top-level nodes, ${Object.keys(gradientsUsed).length} gradients, ${stars.length} stars, ${lines.length} lines`,
);
