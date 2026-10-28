import type { IconName } from '@/design/components';
import type { GoalId } from '@/features/onboarding/types';

/**
 * Challenge content (pack 2 SPEC §3). Titles and meta lines live in i18n under
 * `challenges.items.<id>`; this file holds only the rules each card plays by.
 *
 * Check types:
 * - timed:    the app ran the session (silence, focus, a rep), so it's verified
 * - verified: confirmed by Health Connect / HealthKit (steps) or Screen Time / usage stats
 * - word:     "Your word", self-reported; its points are capped per day
 */

export type Difficulty = 'easy' | 'medium' | 'hard';
export type Verification = 'verified' | 'timed' | 'word';
export type VerificationSource = 'screen-time' | 'health-steps';

/** How the challenge is done in the app. */
export type ChallengeKind = 'silence' | 'focus' | 'reading' | 'steps' | 'screenTime' | 'word';

export type ChallengeDef = {
  id: string;
  /** Developer fallback; the UI always shows `challenges.items.<id>.title`. */
  title: string;
  difficulty: Difficulty;
  verification: Verification;
  kind: ChallengeKind;
  icon: IconName;
  /** OB05 goals this card serves; the morning draw prefers these. */
  goals: readonly GoalId[];
  source?: VerificationSource;
  /** Minutes (timed), steps (health) or minutes on blocked apps (screen time). */
  target?: number;
};

export const CHALLENGES: readonly ChallengeDef[] = [
  // easy
  {
    id: 'silence-5',
    title: 'Sit in silence',
    difficulty: 'easy',
    verification: 'timed',
    kind: 'silence',
    icon: 'silence',
    goals: ['calm', 'focus', 'sleep'],
    target: 5,
  },
  {
    id: 'walk-2k',
    title: 'Walk 2,000 steps',
    difficulty: 'easy',
    verification: 'verified',
    kind: 'steps',
    icon: 'outside',
    goals: ['calm', 'hobbies'],
    source: 'health-steps',
    target: 2000,
  },
  {
    id: 'focus-10',
    title: 'Lock in, 10 min',
    difficulty: 'easy',
    verification: 'timed',
    kind: 'focus',
    icon: 'lock',
    goals: ['focus'],
    target: 10,
  },
  {
    id: 'no-phone-wake',
    title: 'No phone for the first 15 min',
    difficulty: 'easy',
    verification: 'word',
    kind: 'word',
    icon: 'moon',
    goals: ['sleep', 'calm'],
  },
  {
    id: 'text-a-friend',
    title: 'Call a friend instead of texting',
    difficulty: 'easy',
    verification: 'word',
    kind: 'word',
    icon: 'phone',
    goals: ['people'],
  },
  // medium
  {
    id: 'read-10',
    title: 'Read before you scroll',
    difficulty: 'medium',
    verification: 'word',
    kind: 'reading',
    icon: 'reading',
    goals: ['hobbies', 'calm', 'focus'],
    target: 10,
  },
  {
    id: 'walk-6k',
    title: 'Walk 6,000 steps',
    difficulty: 'medium',
    verification: 'verified',
    kind: 'steps',
    icon: 'outside',
    goals: ['calm', 'hobbies', 'people'],
    source: 'health-steps',
    target: 6000,
  },
  {
    id: 'focus-25',
    title: 'Lock in, 25 min',
    difficulty: 'medium',
    verification: 'timed',
    kind: 'focus',
    icon: 'lock',
    goals: ['focus'],
    target: 25,
  },
  {
    id: 'under-60',
    title: 'Under 60 min on blocked apps',
    difficulty: 'medium',
    verification: 'verified',
    kind: 'screenTime',
    icon: 'shieldOff',
    goals: ['focus', 'sleep', 'calm'],
    source: 'screen-time',
    target: 60,
  },
  {
    id: 'phone-free-meal',
    title: 'Phone-free meal',
    difficulty: 'medium',
    verification: 'word',
    kind: 'word',
    icon: 'sparkles',
    goals: ['people'],
  },
  // hard
  {
    id: 'focus-50',
    title: 'Lock in',
    difficulty: 'hard',
    verification: 'timed',
    kind: 'focus',
    icon: 'lock',
    goals: ['focus', 'hobbies'],
    target: 50,
  },
  {
    id: 'walk-10k',
    title: 'Walk 10,000 steps',
    difficulty: 'hard',
    verification: 'verified',
    kind: 'steps',
    icon: 'outside',
    goals: ['calm', 'hobbies'],
    source: 'health-steps',
    target: 10000,
  },
  {
    id: 'under-30',
    title: 'Under 30 min on blocked apps',
    difficulty: 'hard',
    verification: 'verified',
    kind: 'screenTime',
    icon: 'shieldOff',
    goals: ['focus', 'sleep'],
    source: 'screen-time',
    target: 30,
  },
  {
    id: 'phone-off-evening',
    title: 'Phone off after 21:00',
    difficulty: 'hard',
    verification: 'word',
    kind: 'word',
    icon: 'moon',
    goals: ['sleep', 'people'],
  },
];

/** Longer challenges shown as Library chips; done-this-week is tracked, not drawn. */
export const LIBRARY: readonly ChallengeDef[] = [
  {
    id: 'touch-grass',
    title: 'Touch grass',
    difficulty: 'medium',
    verification: 'verified',
    kind: 'steps',
    icon: 'outside',
    goals: ['calm'],
    source: 'health-steps',
    target: 3000,
  },
  {
    id: 'raw-mode',
    title: 'Raw mode',
    difficulty: 'hard',
    verification: 'word',
    kind: 'word',
    icon: 'sparkles',
    goals: ['calm'],
  },
  {
    id: 'no-bed-rotting',
    title: 'No bed rotting',
    difficulty: 'medium',
    verification: 'word',
    kind: 'word',
    icon: 'moon',
    goals: ['sleep'],
  },
  {
    id: 'brick-saturday',
    title: 'Brick Saturday',
    difficulty: 'hard',
    verification: 'word',
    kind: 'word',
    icon: 'lock',
    goals: ['people', 'hobbies'],
  },
  {
    id: 'phone-free-meal-lib',
    title: 'Phone-free meal',
    difficulty: 'medium',
    verification: 'word',
    kind: 'word',
    icon: 'sparkles',
    goals: ['people'],
  },
  {
    id: 'first-hour-clean',
    title: 'First hour clean',
    difficulty: 'medium',
    verification: 'word',
    kind: 'word',
    icon: 'moon',
    goals: ['sleep', 'focus'],
  },
];

/** One boss a week (FDrawReveal). Points and the freeze come from rules.ts. */
export type WeeklyBoss = { id: string; weekday: number };
export const BOSSES: readonly WeeklyBoss[] = [
  { id: 'monk-mode', weekday: 6 },
  { id: 'offline-morning', weekday: 0 },
  { id: 'deep-work-day', weekday: 6 },
];

export function challengeById(id: string): ChallengeDef | undefined {
  return CHALLENGES.find((c) => c.id === id) ?? LIBRARY.find((c) => c.id === id);
}
