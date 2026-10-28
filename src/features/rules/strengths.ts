import type { Strength } from './model';

/**
 * Behaviour of each rule strength (copy lives in i18n `strength.*`). The shield screens read
 * these. Locked is Pro (P07); Pause and Earn are free, always.
 */
export const STRENGTH_RULES: Record<Strength, { isProOnly: boolean; rank: number }> = {
  pause: { isProOnly: false, rank: 0 },
  earn: { isProOnly: false, rank: 1 },
  locked: { isProOnly: true, rank: 2 },
};

export const STRENGTH_ORDER: readonly Strength[] = ['pause', 'earn', 'locked'];

export const PAUSE_BREATH_SECONDS = 10;
export const PAUSE_OPEN_MINUTES = 5;
/** "Spend 10 min" on the shield (FShield, FShieldiOS). */
export const EARN_SPEND_MINUTES = 10;
