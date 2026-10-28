import type { ChallengeCheck, ChallengeDifficulty, ChallengeItem } from '@/design/components';
import { t } from '@/i18n';

import { challengeReward } from '../scoring/points';
import { challengeById, type ChallengeDef, type Difficulty, type Verification } from './library';
import type { DailyDraw } from './rules';

export const CHECK_OF: Record<Verification, ChallengeCheck> = {
  timed: 'timed',
  word: 'yourWord',
  verified: 'verified',
};

export const DIFFICULTY_OF: Record<Difficulty, ChallengeDifficulty> = {
  easy: 'easy',
  medium: 'med',
  hard: 'hard',
};

export function challengeTitle(def: ChallengeDef): string {
  return t(`challenges.items.${def.id}.title`, { defaultValue: def.title });
}

/** The card's own line, e.g. "5 min, phone face down". */
export function challengeDetail(def: ChallengeDef): string {
  return t(`challenges.items.${def.id}.meta`, { defaultValue: '' });
}

/** List meta: "5 min · Timed", "10 pages · Your word". */
export function challengeMeta(def: ChallengeDef): string {
  const detail = challengeDetail(def);
  const check = t(`challenges.check.${CHECK_OF[def.verification]}Short`);
  return detail ? `${detail} · ${check}` : check;
}

/** Today's draw as Home list rows: the first undone card is "next". */
export function toChallengeItems(draw: DailyDraw): ChallengeItem[] {
  let hasNext = false;
  return draw.cards.flatMap((id) => {
    const def = challengeById(id);
    if (!def) return [];
    const isDone = draw.done.includes(id);
    const status = isDone ? 'done' : hasNext ? 'todo' : 'next';
    if (!isDone) hasNext = true;
    return [
      {
        id,
        title: challengeTitle(def),
        meta: challengeMeta(def),
        status,
        points: challengeReward(def, 0).points,
      } satisfies ChallengeItem,
    ];
  });
}
