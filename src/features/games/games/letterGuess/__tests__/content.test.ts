import pack from '../content.json';

type Item = { id: string; word: string; clue: string };
const items = pack.items as Item[];

describe('Letter guess pack', () => {
  it('is marked unreviewed until the owner checks it', () => {
    expect(pack.reviewed).toBe(false);
  });

  it('has at least 300 different words with sequential ids', () => {
    expect(items.length).toBeGreaterThanOrEqual(300);
    items.forEach((it, i) => expect(it.id).toBe(`lg-${String(i + 1).padStart(4, '0')}`));
    expect(new Set(items.map((i) => i.word)).size).toBe(items.length);
  });

  it('keeps words 4–7 letters and clues short, without the answer', () => {
    for (const it of items) {
      expect(it.word).toMatch(/^[a-z]{4,7}$/);
      expect(it.clue.length).toBeLessThanOrEqual(40);
      expect(it.clue.toLowerCase()).not.toContain(it.word);
    }
  });
});
