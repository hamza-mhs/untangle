import { conflicts, ruleAt } from '../../../kit/sortRules';
import { streamCards, streamPoints, streamStars, STREAM_CARDS, STREAM_SWITCH } from '../logic';

describe('Sort the stream', () => {
  it('deals 20 cards with a trap right after the switch, over 1,000 seeds', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const cs = streamCards(seed);
      expect(cs).toHaveLength(STREAM_CARDS);
      expect(conflicts(cs[STREAM_SWITCH[0]]!)).toBe(true);
    }
  });

  it('switches from colour to shape once', () => {
    expect(ruleAt(7, STREAM_SWITCH)).toBe('colour');
    expect(ruleAt(8, STREAM_SWITCH)).toBe('shape');
    expect(ruleAt(19, STREAM_SWITCH)).toBe('shape');
  });

  it('scores streaks and keeps the prototype top star rule', () => {
    expect(streamPoints(3)).toBe(11);
    expect(streamStars(19)).toBe(3);
    expect(streamStars(15)).toBe(2);
    expect(streamStars(5)).toBe(1);
  });
});
