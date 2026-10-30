import pack from '../content.json';
import { spellable, TRAIL_WORDS, type TrailBoard } from '../logic';

const boards = pack.items as TrailBoard[];

describe('Word trails pack', () => {
  it('has unique ids, six beads and five different tray words', () => {
    expect(boards.length).toBeGreaterThanOrEqual(200);
    expect(new Set(boards.map((b) => b.id)).size).toBe(boards.length);
    for (const b of boards) {
      expect(b.letters).toMatch(/^[a-z]{6}$/);
      expect(b.words).toHaveLength(TRAIL_WORDS);
      expect(new Set(b.words).size).toBe(TRAIL_WORDS);
    }
  });

  it('every tray word can be spelled from the beads', () => {
    for (const b of boards) for (const w of b.words) expect(spellable(w, b.letters)).toBe(true);
  });
});
