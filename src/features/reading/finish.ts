import { router } from 'expo-router';

import { useChallengesStore } from '@/features/challenges/store';
import { REPS } from '@/features/reps/catalog';
import { useRepsStore } from '@/features/reps/repsStore';
import { useScoringStore } from '@/features/scoring/store';

/** Where the read-aloud flow came from: a drawn challenge (`challenge` id) or the reps grid. */
export type ReadingParams = { text?: string; challenge?: string; mode?: 'aloud' | 'silent' };

export const READING_LANG = 'en-US';
/** The challenge used for OxDone's copy when reading ran as a rep. */
const READ_CHALLENGE = 'read-10';

/**
 * Credits the reading and shows OxDone. Read aloud is checked by the app (timed · verified);
 * reading silently is "Your word", so the challenge path applies the daily word cap and the rep
 * path earns no app time.
 */
export function finishReading(
  { challenge, mode }: ReadingParams,
  startedAt: number,
  now = Date.now(),
) {
  const spoken = mode !== 'silent';
  let points = 0;
  if (challenge) {
    points = useChallengesStore.getState().complete(challenge, now, spoken ? 'timed' : 'word') ?? 0;
  } else {
    useRepsStore.getState().finish('read', { won: true, elapsedMs: now - startedAt }, now);
    const def = REPS.read;
    points = useScoringStore
      .getState()
      .recordEarn(
        'rep',
        def.points,
        spoken ? def.minutes : 0,
        'read',
        spoken ? 'timed' : 'word',
        now,
      ).points;
  }
  router.replace({
    pathname: '/challenge/done',
    params: { id: challenge ?? READ_CHALLENGE, points: String(points) },
  });
}

export function readingParams(p: ReadingParams): Record<string, string> {
  const out: Record<string, string> = {};
  if (p.text) out.text = p.text;
  if (p.challenge) out.challenge = p.challenge;
  if (p.mode) out.mode = p.mode;
  return out;
}
