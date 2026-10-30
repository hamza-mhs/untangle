import fs from 'fs';
import path from 'path';

import { en } from '../index';

const SRC = path.join(__dirname, '..', '..');

function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return d.name === '__tests__' ? [] : files(p);
    return /\.tsx?$/.test(d.name) ? [p] : [];
  });
}

function has(key: string): boolean {
  const parts = key.split('.');
  let node: unknown = en;
  for (let i = 0; i < parts.length; i++) {
    if (!node || typeof node !== 'object') return false;
    const obj = node as Record<string, unknown>;
    const last = i === parts.length - 1;
    // Plurals: `key` may only exist as key_one / key_other.
    if (last && !(parts[i]! in obj)) return `${parts[i]}_other` in obj || `${parts[i]}_one` in obj;
    node = obj[parts[i]!];
  }
  return node !== undefined;
}

describe('i18n', () => {
  it('every literal key used in the code exists in en/*.json', () => {
    const missing: string[] = [];
    for (const f of files(SRC)) {
      const text = fs.readFileSync(f, 'utf8');
      for (const m of text.matchAll(/\bt\(\s*'([a-zA-Z][\w.-]*)'/g)) {
        const key = m[1]!;
        if (!key.includes('.')) continue;
        if (!has(key)) missing.push(`${path.relative(SRC, f)}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
