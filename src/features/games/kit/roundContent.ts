import type { GameId } from '../catalog';
import { recentItemIds } from '../results';
import { pickUnplayed, servableItems, type ContentItem, type ContentPack } from './content';

/**
 * Items for this round: servable in this build, not played in the last 30 days where possible.
 * Report the ids back in `RoundResult.items`.
 */
export function pickRoundItems<T extends ContentItem>(
  gameId: GameId,
  pack: ContentPack<T>,
  seed: number,
  n = 1,
): T[] {
  let recent: string[] = [];
  try {
    recent = recentItemIds(gameId);
  } catch {
    // Database not ready: any items will do.
  }
  return pickUnplayed(servableItems(pack), recent, seed, n);
}
