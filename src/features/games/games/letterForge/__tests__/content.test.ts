import pack from '../content.json';
import { FORGE_RACK, forgeStars, fromRack, type Rack } from '../logic';

const racks = pack.items as Rack[];

describe('Letter forge pack', () => {
  it('has unique ids and seven-letter racks', () => {
    expect(racks.length).toBeGreaterThanOrEqual(200);
    expect(new Set(racks.map((r) => r.id)).size).toBe(racks.length);
    for (const r of racks) expect(r.letters).toHaveLength(FORGE_RACK);
  });

  it('every rack makes a 6+ letter word and only lists words it can make', () => {
    for (const r of racks) {
      expect(r.words.some((w) => w.length >= 6)).toBe(true);
      expect(r.words.length).toBeGreaterThanOrEqual(15);
      for (const w of r.words) expect(fromRack(w, r.letters)).toBe(true);
    }
  });

  it('keeps the prototype top star rule', () => {
    expect(forgeStars(6, 4)).toBe(3);
    expect(forgeStars(5, 4)).toBe(2);
  });
});
