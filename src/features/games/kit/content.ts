import { rng, shuffle } from '@/lib/rng';

/**
 * Bundled content packs (BATCH-3.3 §3.3.0): `content.json` per game, written by
 * `npm run content` (tools/content/). Items have stable ids; rounds report the ids they used
 * (`RoundResult.items`) so the same board isn't served again within 30 days.
 */
export type ContentItem = { id: string; reviewed?: boolean };

export type ContentPack<T extends ContentItem> = {
  version: number;
  /** Hand-written packs stay `false` until the owner has reviewed them. */
  reviewed?: boolean;
  items: T[];
};

/** Items a build may serve: unreviewed packs or items only in dev builds. */
export function servableItems<T extends ContentItem>(
  pack: ContentPack<T>,
  dev: boolean = __DEV__,
): T[] {
  if (dev) return pack.items;
  if (pack.reviewed === false) return [];
  return pack.items.filter((it) => it.reviewed !== false);
}

/**
 * `n` items for a round, seeded: never-recent items first; if the pack runs short, the ones
 * played longest ago (`recentIds` is newest first). Never returns the same item twice.
 */
export function pickUnplayed<T extends ContentItem>(
  items: readonly T[],
  recentIds: readonly string[],
  seed: number,
  n = 1,
): T[] {
  const rand = rng(seed);
  const recent = new Map<string, number>();
  recentIds.forEach((id, i) => {
    if (!recent.has(id)) recent.set(id, i);
  });
  const fresh = shuffle(
    items.filter((it) => !recent.has(it.id)),
    rand,
  );
  // Played ones: oldest (highest index in recentIds) first.
  const stale = items
    .filter((it) => recent.has(it.id))
    .sort((a, b) => recent.get(b.id)! - recent.get(a.id)!);
  return [...fresh, ...stale].slice(0, Math.min(n, items.length));
}
