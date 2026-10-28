import { parseBackup, backupFileName, BACKUP_VERSION } from '@/features/backup/backup';
import { CHALLENGES } from '@/features/challenges/library';
import {
  ALL_THREE_BONUS,
  bonusFor,
  drawForDay,
  isDrawTime,
  markDone,
  pointsFor,
  verifiedPercent,
  WORD_DAILY_CAP,
} from '@/features/challenges/rules';
import {
  alignHeard,
  emptyProgress,
  heardWords,
  keyIdeasHit,
  pageDone,
  pagePassed,
  pageWords,
  saidCount,
  similarity,
} from '@/features/reading/match';
import { TEXTS } from '@/features/reading/texts';
import { barcode, receiptDuration, workdays } from '@/features/receipt/model';
import { CALM_WORDS, wordLengthFor } from '@/features/reps/calmWords';
import { evaluateTokens, type ExprToken, hitsTarget } from '@/features/reps/expression';
import { createRng } from '@/features/reps/rng';
import { nextLevel, retriesLeft, roundAccess, roundPoints } from '@/features/reps/rules';
import { generateTarget, solveTarget } from '@/features/reps/target24';
import { nextGoal } from '@/features/rewards/vault';

describe('daily draw', () => {
  test('the same three all day, a different set across midnight', () => {
    expect(drawForDay('2026-10-24')).toEqual(drawForDay('2026-10-24'));
    const days = ['2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27'].map((d) =>
      drawForDay(d).cards.join(),
    );
    expect(new Set(days).size).toBeGreaterThan(1);
  });

  test('the draw unlocks at the morning time', () => {
    expect(isDrawTime(new Date(2026, 9, 25, 7, 29), '07:30')).toBe(false);
    expect(isDrawTime(new Date(2026, 9, 25, 7, 30), '07:30')).toBe(true);
  });

  test('your-word points stop at the daily cap; checked ones do not', () => {
    expect(pointsFor({ difficulty: 'hard', verification: 'word' }, 0)).toBe(WORD_DAILY_CAP);
    expect(pointsFor({ difficulty: 'easy', verification: 'word' }, 10)).toBe(5);
    expect(pointsFor({ difficulty: 'easy', verification: 'word' }, WORD_DAILY_CAP)).toBe(0);
    expect(pointsFor({ difficulty: 'hard', verification: 'timed' }, WORD_DAILY_CAP)).toBe(25);
  });

  test('the all-three bonus only once every card is done', () => {
    let d = drawForDay('2026-10-25');
    d = markDone(markDone(d, d.cards[0]), d.cards[1]);
    expect(bonusFor(d)).toBe(0);
    expect(bonusFor(markDone(d, d.cards[2]))).toBe(ALL_THREE_BONUS);
  });

  test('% verified ignores spends and counts timed as verified', () => {
    expect(
      verifiedPercent([
        { points: 25, verification: 'timed' },
        { points: 15, verification: 'word' },
        { points: -300, verification: null },
      ]),
    ).toBe(63);
  });

  test('every library challenge has a known check type', () => {
    for (const c of CHALLENGES) expect(['verified', 'timed', 'word']).toContain(c.verification);
  });
});

describe('reps rules', () => {
  test('one round a day, one retry after a loss', () => {
    expect(roundAccess(null)).toEqual({ kind: 'fresh' });
    expect(roundAccess({ attempts: 1, won: false, elapsedMs: 90_000 })).toEqual({ kind: 'retry' });
    expect(roundAccess({ attempts: 2, won: false, elapsedMs: 90_000 })).toEqual({
      kind: 'doneToday',
      won: false,
    });
    expect(roundAccess({ attempts: 1, won: true, elapsedMs: 40_000 })).toEqual({
      kind: 'doneToday',
      won: true,
    });
    expect(retriesLeft({ attempts: 1, won: false, elapsedMs: null })).toBe(1);
  });

  test('ladder: up after a win, down after two losses, within 1–3', () => {
    expect(nextLevel(1, true, 0)).toBe(2);
    expect(nextLevel(3, true, 0)).toBe(3);
    expect(nextLevel(2, false, 1)).toBe(2);
    expect(nextLevel(2, false, 2)).toBe(1);
    expect(nextLevel(1, false, 2)).toBe(1);
  });

  test('points only inside the time', () => {
    expect(roundPoints(20, true)).toBe(20);
    expect(roundPoints(20, false)).toBe(0);
  });
});

describe('make the target', () => {
  const n = [6, 4, 2, 3];
  const num = (index: number): ExprToken => ({ kind: 'num', index });
  const op = (o: '+' | '−' | '×' | '÷'): ExprToken => ({ kind: 'op', op: o });
  const paren = (open: boolean): ExprToken => ({ kind: 'paren', open });

  test('respects precedence and brackets', () => {
    expect(evaluateTokens([num(0), op('+'), num(1), op('×'), num(2)], n)).toBe(14);
    expect(
      evaluateTokens([paren(true), num(0), op('+'), num(1), paren(false), op('×'), num(2)], n),
    ).toBe(20);
  });

  test('incomplete or broken expressions do not evaluate', () => {
    expect(evaluateTokens([num(0), op('×')], n)).toBeNull();
    expect(evaluateTokens([paren(true), num(0)], n)).toBeNull();
    expect(
      evaluateTokens(
        [num(0), op('÷'), paren(true), num(2), op('−'), num(2), paren(false)],
        [6, 4, 2, 2],
      ),
    ).toBeNull();
  });

  test('a hit needs all four numbers and the exact target', () => {
    const six4x3m2 = [
      num(0),
      op('×'),
      num(1),
      op('×'),
      paren(true),
      num(3),
      op('−'),
      num(2),
      paren(false),
    ];
    expect(hitsTarget(six4x3m2, n, 24)).toBe(true);
    expect(hitsTarget([num(0), op('×'), num(1)], n, 24)).toBe(false);
  });

  test('generated puzzles are always solvable, at every level target', () => {
    const rng = createRng(42);
    for (const target of [24, 36, 48]) {
      for (let i = 0; i < 10; i++)
        expect(solveTarget(generateTarget(rng, target).numbers, target)).not.toBeNull();
    }
  });
});

describe('letter guess words', () => {
  test('word length follows the level and lists are upper-case letters only', () => {
    expect([1, 2, 3].map(wordLengthFor)).toEqual([5, 6, 7]);
    for (const len of [5, 6, 7] as const) {
      for (const w of CALM_WORDS[len]) {
        expect(w.word).toMatch(new RegExp(`^[A-Z]{${len}}$`));
        expect(w.clue.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('read aloud matching', () => {
  const words = pageWords(
    'Men seek retreats for themselves, houses in the country, sea-shores, and mountains;',
  );

  test('hyphens split into spoken words and punctuation is ignored', () => {
    expect(words.map((w) => w.norm)).toContain('shores');
    expect(words.find((w) => w.display.startsWith('sea'))?.display).toBe('sea-');
  });

  test('forgiving fuzzy match, strict on short words', () => {
    expect(similarity('retreats', 'retreat')).toBeGreaterThanOrEqual(0.7);
    expect(similarity('mountains', 'mountain')).toBeGreaterThanOrEqual(0.7);
    expect(similarity('houses', 'horses')).toBeGreaterThanOrEqual(0.6);
  });

  test('words jumped over are skipped; interim results re-align from the segment start', () => {
    const start = emptyProgress(words);
    const partial = alignHeard(words, start, heardWords('men seek'));
    expect(saidCount(partial)).toBe(2);
    const revised = alignHeard(words, start, heardWords('men seek retreat for houses'));
    expect(revised.states[4]).toBe('skipped'); // themselves
    expect(revised.states[5]).toBe('said'); // houses
  });

  test('a page passes at 80 %', () => {
    const all = alignHeard(
      words,
      emptyProgress(words),
      heardWords(words.map((w) => w.norm).join(' ')),
    );
    expect(pageDone(all) && pagePassed(all)).toBe(true);
    // Every other word: each skip is inside the look-ahead, so the page ends at ~50 %.
    const everyOther = words
      .filter((_, i) => i % 2 === 0 || i === words.length - 1)
      .map((w) => w.norm);
    const half = alignHeard(words, emptyProgress(words), everyOther);
    expect(pageDone(half)).toBe(true);
    expect(pagePassed(half)).toBe(false);
  });

  test('key ideas by keyword overlap', () => {
    const ideas = TEXTS[0]!.keyIdeas;
    expect(keyIdeasHit("it's about escaping to the country whenever you choose", ideas)).toEqual([
      true,
      true,
      false,
    ]);
    expect(keyIdeasHit('', ideas)).toEqual([false, false, false]);
  });

  test('every bundled text has pages and three key ideas', () => {
    for (const text of TEXTS) {
      expect(text.pages.length).toBeGreaterThan(0);
      expect(text.keyIdeas).toHaveLength(3);
    }
  });
});

describe('rewards and receipt', () => {
  test('next goal is the cheapest item still out of reach', () => {
    const items = [
      { id: 'a', name: 'Coffee', size: 'small' as const, cost: 300, createdAt: 0 },
      { id: 'b', name: 'Dinner out', size: 'medium' as const, cost: 1500, createdAt: 0 },
      { id: 'c', name: 'Weekend', size: 'big' as const, cost: 5000, createdAt: 0 },
    ];
    expect(nextGoal(items, 1240)).toEqual({ item: items[1], toGo: 260 });
    expect(nextGoal(items, 6000)).toBeNull();
  });

  test('receipt formatting', () => {
    expect(receiptDuration(112)).toBe('1H 52M');
    expect(receiptDuration(48)).toBe('48M');
    expect(receiptDuration(-130)).toBe('−2H 10M');
    expect(workdays(545)).toBe('1.1');
    expect(barcode(7)).toEqual(barcode(7));
  });
});

describe('backup files', () => {
  test('rejects other files and newer versions; accepts a well-formed backup', () => {
    expect(parseBackup('not json')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseBackup(JSON.stringify({ app: 'other' }))).toEqual({ ok: false, reason: 'invalid' });
    expect(parseBackup(JSON.stringify({ app: 'untangle', version: BACKUP_VERSION + 1 }))).toEqual({
      ok: false,
      reason: 'newer',
    });
    const tables = Object.fromEntries(
      [
        'days',
        'focusSessions',
        'ledger',
        'repResults',
        'emergencyPasses',
        'vaultItems',
        'redemptions',
      ].map((n) => [n, []]),
    );
    const ok = parseBackup(
      JSON.stringify({ app: 'untangle', version: 1, exportedAt: 1, stores: {}, tables }),
    );
    expect(ok.ok).toBe(true);
  });

  test('file name is dated', () => {
    expect(backupFileName(new Date(2026, 9, 25).getTime())).toBe('untangle-backup-2026-10-25.json');
  });
});
