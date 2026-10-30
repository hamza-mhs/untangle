// `npm run content`: generates and verifies every puzzle/word pack and writes
// src/features/games/games/<gameId>/content.json. Deterministic (fixed seeds): re-running
// gives the same packs, so item ids stay stable. See README.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { generateFlowBoards } from '@/features/games/games/flowLines/generate';
import { generateRacks } from '@/features/games/games/letterForge/generate';
import { generateCrosswords } from '@/features/games/games/miniCrossword/generate';
import { generateNonograms, PICTURES } from '@/features/games/games/miniNonogram/generate';
import { generateDrawings } from '@/features/games/games/oneLineArt/generate';
import { generatePaintBoards } from '@/features/games/games/pathPainter/generate';
import { generateSlideBoards } from '@/features/games/games/slideEscape/generate';
import { generateLadders } from '@/features/games/games/wordBridge/generate';
import { generateTrails } from '@/features/games/games/wordTrails/generate';

import { accept, acceptOfLength, common, commonOfLength, commonRejected, isBlocked } from './words';

const ROOT = join(__dirname, '..', '..');
const GAMES = join(ROOT, 'src', 'features', 'games', 'games');
const VERSION = 1;

type Item = { id: string };

function write(gameId: string, items: Item[], extra: Record<string, unknown> = {}) {
  const pack = { version: VERSION, generated: true, ...extra, items };
  writeFileSync(join(GAMES, gameId, 'content.json'), `${JSON.stringify(pack)}\n`);
  console.log(`  ${gameId.padEnd(18)} ${String(items.length).padStart(4)} items`);
}

/** Stable ids after merging several generator runs. */
function renumber<T extends Item>(prefix: string, items: T[]): T[] {
  return items.map((it, i) => ({ ...it, id: `${prefix}-${String(i + 1).padStart(4, '0')}` }));
}

function readPack(gameId: string): { reviewed?: boolean; items: Record<string, unknown>[] } {
  return JSON.parse(readFileSync(join(GAMES, gameId, 'content.json'), 'utf8'));
}

const problems: string[] = [];
const check = (ok: boolean, msg: string) => {
  if (!ok) problems.push(msg);
};

console.log(
  `Words: ${accept.size} accepted (ENABLE 3–8, blocklist applied), ${common.length} common.`,
);
if (commonRejected.length) console.log(`  common.txt words not used: ${commonRejected.join(' ')}`);

console.log('Generated packs:');
write(
  'flowLines',
  renumber('fl', [
    ...generateFlowBoards(5, [4, 5], 200, 101, 'f5'),
    ...generateFlowBoards(6, [5, 6], 100, 102, 'f6'),
  ]),
);
write(
  'slideEscape',
  renumber('se', [...generateSlideBoards(120, 201, 4, 5), ...generateSlideBoards(100, 202, 6, 14)]),
);
write('pathPainter', generatePaintBoards(220, 301));
write('oneLineArt', generateDrawings(200, 401));
const nonos = generateNonograms(160, 501);
const droppedPictures = PICTURES.filter((p) => !nonos.some((b) => b.name === p.name));
check(
  !droppedPictures.length,
  `nonogram pictures not line-solvable: ${droppedPictures.map((p) => p.name)}`,
);
write('miniNonogram', nonos);
const dict4 = acceptOfLength(4);
write('wordBridge', generateLadders(commonOfLength(4), new Set(dict4), 220, 601), { dict: dict4 });
write('wordTrails', generateTrails(common, 220, 701));
write('letterForge', generateRacks(common, accept, 220, 801));
const clues3 = JSON.parse(readFileSync(join(__dirname, 'clues', 'clues3.json'), 'utf8')) as Record<
  string,
  string
>;
const cluedOk = Object.fromEntries(
  Object.entries(clues3).filter(([w]) => accept.has(w) && !isBlocked(w)),
);
const crosswords = generateCrosswords(cluedOk, 400, 901);
write('miniCrossword', crosswords, { reviewed: false });

console.log('Hand-written packs (checked, not rewritten):');
for (const [gameId, words] of [
  ['letterGuess', (it: Record<string, unknown>) => [it.word as string]],
  [
    'categoryClusters',
    (it: Record<string, unknown>) =>
      (it.groups as { words: string[] }[] | undefined)?.flatMap((g) => g.words) ?? [],
  ],
] as const) {
  let pack: ReturnType<typeof readPack>;
  try {
    pack = readPack(gameId);
  } catch {
    problems.push(`${gameId}: content.json missing`);
    continue;
  }
  check(pack.reviewed === false || pack.reviewed === true, `${gameId}: needs a reviewed flag`);
  const blocked = pack.items.flatMap(words).filter((w) => isBlocked(w));
  check(!blocked.length, `${gameId}: blocked words ${blocked.join(', ')}`);
  console.log(
    `  ${gameId.padEnd(18)} ${String(pack.items.length).padStart(4)} items (reviewed: ${pack.reviewed})`,
  );
}

if (problems.length) {
  console.error(`\nProblems:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('\nAll packs written and checked. Run `npm test` to re-solve every item.');
