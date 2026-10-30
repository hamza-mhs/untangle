import pack from '../content.json';
import { isTrace, isTraceable, oddNodes, type Drawing } from '../logic';

const drawings = pack.items as Drawing[];

describe('One-line art pack', () => {
  it('has unique ids and the named icons', () => {
    expect(drawings.length).toBeGreaterThanOrEqual(150);
    expect(new Set(drawings.map((d) => d.id)).size).toBe(drawings.length);
    expect(drawings.filter((d) => d.name).length).toBeGreaterThanOrEqual(10);
  });

  it('every drawing has 0 or 2 odd points and a stored one-stroke trace', () => {
    for (const d of drawings) {
      expect(oddNodes(d.nodes.length, d.edges).length).toBeLessThanOrEqual(2);
      expect(isTraceable(d.nodes.length, d.edges)).toBe(true);
      expect(isTrace(d)).toBe(true);
    }
  });
});
