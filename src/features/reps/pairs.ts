import type { Rng } from './rng';

/** Card pairs (memory): a shuffled grid where every symbol appears exactly twice. */

export type PairsCard = { id: number; symbol: number };
export type PairsBoard = { cards: PairsCard[]; pairCount: number };

export function generatePairs(rng: Rng, pairCount = 6): PairsBoard {
  const symbols = rng.shuffle([...Array(24).keys()]).slice(0, pairCount);
  const deck = rng.shuffle([...symbols, ...symbols]);
  return { cards: deck.map((symbol, id) => ({ id, symbol })), pairCount };
}

export function isMatch(board: PairsBoard, a: number, b: number): boolean {
  return a !== b && board.cards[a]?.symbol === board.cards[b]?.symbol;
}
